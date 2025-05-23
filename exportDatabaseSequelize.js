const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

// Get database credentials from .env file
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

// Create export directory if it doesn't exist
const exportDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// Generate timestamp for filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const exportFilePath = path.join(exportDir, `${DB_NAME}_${timestamp}.json`);

// Create a new Sequelize instance for raw queries
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false
});

async function exportDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Create connection for direct MySQL export
    const mysqlConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });
    
    // Get all tables in the database
    const [tables] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${DB_NAME}'`
    );
    
    console.log(`Found ${tables.length} tables in database ${DB_NAME}`);
    
    // Export data from each table
    const exportData = {};
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME || table.table_name; // Handle different case formats
      console.log(`Exporting data from ${tableName}...`);
      
      // Get table structure
      const [columns] = await sequelize.query(
        `SHOW COLUMNS FROM ${tableName}`
      );
      
      // Get table data
      const [rows] = await sequelize.query(
        `SELECT * FROM ${tableName}`
      );
      
      exportData[tableName] = {
        structure: columns,
        data: rows
      };
      
      console.log(`Exported ${rows.length} rows from ${tableName}`);
    }
    
    // Write data to JSON file
    fs.writeFileSync(exportFilePath, JSON.stringify(exportData, null, 2));
    
    console.log(`\nDatabase ${DB_NAME} successfully exported to ${exportFilePath}`);
    console.log('Export complete!');
    
    // Generate SQL creation script
    const sqlFilePath = path.join(exportDir, `${DB_NAME}_${timestamp}.sql`);
    let sqlContent = `-- Database export for ${DB_NAME} generated on ${new Date().toISOString()}\n`;
    sqlContent += `-- Created by RecycleGo Database Export Tool\n\n`;
    sqlContent += `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;\n`;
    sqlContent += `USE \`${DB_NAME}\`;\n\n`;
    
    // Get CREATE TABLE statements for each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME || table.table_name;
      const [createTable] = await sequelize.query(
        `SHOW CREATE TABLE ${tableName}`
      );
      
      if (createTable && createTable.length > 0) {
        const createStatement = createTable[0]['Create Table'] || createTable[0]['CREATE TABLE'];
        sqlContent += `${createStatement};\n\n`;
      }
    }
    
    fs.writeFileSync(sqlFilePath, sqlContent);
    console.log(`SQL creation script exported to ${sqlFilePath}`);
    
    // Add INSERT statements for each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME || table.table_name;
      const [rows] = await sequelize.query(`SELECT * FROM ${tableName}`);
      
      if (rows && rows.length > 0) {
        sqlContent += `-- Data for table ${tableName}\n`;
        
        for (const row of rows) {
          const columns = Object.keys(row).join('`, `');
          const values = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return value;
          }).join(', ');
          
          sqlContent += `INSERT INTO \`${tableName}\` (\`${columns}\`) VALUES (${values});\n`;
        }
        
        sqlContent += '\n';
      }
    }
    
    // Write updated SQL file with INSERT statements
    fs.writeFileSync(sqlFilePath, sqlContent);
    console.log(`SQL file with data exported to ${sqlFilePath}`);
    
    // Ask if user wants to export directly to MySQL
    console.log('\nDo you want to export directly to MySQL? (Y/N)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toUpperCase();
      
      if (answer === 'Y') {
        try {
          console.log('\nExporting directly to MySQL...');
          
          // Create target database if it doesn't exist
          await mysqlConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
          await mysqlConnection.query(`USE \`${DB_NAME}\``);
          
          // Execute SQL script
          await mysqlConnection.query(sqlContent);
          
          console.log(`Database ${DB_NAME} successfully exported directly to MySQL!`);
        } catch (error) {
          console.error(`Error exporting directly to MySQL: ${error.message}`);
        } finally {
          await mysqlConnection.end();
          process.exit(0);
        }
      } else {
        console.log('Direct export cancelled. SQL file is still available.');
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error(`Error exporting database: ${error.message}`);
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the export function
exportDatabase();

console.log('\nUsage instructions:');
console.log('1. Run: node exportDatabaseSequelize.js');
console.log('2. The export will be saved in the "exports" directory');
console.log('3. Two files will be created:');
console.log('   - A JSON file with all table structures and data');
console.log('   - An SQL file with CREATE TABLE and INSERT statements');
console.log('4. You will be prompted if you want to export directly to MySQL');
console.log('   - If yes, the script will create/update the database in MySQL');
console.log('   - If no, you can manually import the SQL file later');
console.log('\nNote: Make sure to install required dependencies with:');
console.log('npm install mysql2 --save');