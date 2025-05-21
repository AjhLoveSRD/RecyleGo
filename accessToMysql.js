const fs = require('fs');
const path = require('path');
const odbc = require('odbc');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Get MySQL database credentials from .env file
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

// Create export directory if it doesn't exist
const exportDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// Generate timestamp for filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFilePath = path.join(exportDir, `access_to_mysql_${timestamp}.log`);

// Create log file stream
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Function to log messages to console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Map Access data types to MySQL data types
function mapDataType(accessType) {
  const typeMap = {
    'VARCHAR': 'VARCHAR(255)',
    'LONGCHAR': 'TEXT',
    'INTEGER': 'INT',
    'SMALLINT': 'SMALLINT',
    'REAL': 'FLOAT',
    'DOUBLE': 'DOUBLE',
    'DATETIME': 'DATETIME',
    'CURRENCY': 'DECIMAL(19,4)',
    'COUNTER': 'INT AUTO_INCREMENT',
    'BOOLEAN': 'TINYINT(1)',
    'BYTE': 'TINYINT UNSIGNED',
    'LONGBINARY': 'LONGBLOB',
    'BINARY': 'BLOB',
    'GUID': 'CHAR(38)',
    'DECIMAL': 'DECIMAL(18,0)',
    'NUMERIC': 'DECIMAL(18,0)',
    'BIT': 'BIT',
    'TINYINT': 'TINYINT',
    'BIGINT': 'BIGINT',
    'VARBINARY': 'VARBINARY(255)',
    'CHAR': 'CHAR(255)',
    'TIMESTAMP': 'TIMESTAMP',
    'DATE': 'DATE',
    'TIME': 'TIME'
  };

  // Default to TEXT if type is not found in the map
  return typeMap[accessType.toUpperCase()] || 'TEXT';
}

// Function to sanitize column names for MySQL
function sanitizeColumnName(columnName) {
  // Replace spaces and special characters with underscores
  return columnName.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Function to sanitize table names for MySQL
function sanitizeTableName(tableName) {
  // Replace spaces and special characters with underscores
  return tableName.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Function to escape values for MySQL
function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  
  return `'${value.toString().replace(/'/g, "''")}'`;
}

// Main function to migrate data from Access to MySQL
async function migrateAccessToMySQL() {
  let accessConnection = null;
  let mysqlConnection = null;
  
  try {
    // Prompt for Access database file path
    const accessFilePath = await prompt('Enter the path to your Access database file (.accdb): ');
    
    if (!accessFilePath || !accessFilePath.toLowerCase().endsWith('.accdb')) {
      log('Error: Invalid Access database file path. File must have .accdb extension.');
      return;
    }
    
    log(`Starting migration from Access database: ${accessFilePath} to MySQL database: ${DB_NAME}`);
    
    // Connect to Access database using ODBC
    log('Connecting to Access database...');
    const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${accessFilePath};`;
    
    try {
      accessConnection = await odbc.connect(connectionString);
      log('Successfully connected to Access database.');
    } catch (error) {
      log(`Error connecting to Access database: ${error.message}`);
      log('Make sure you have the Microsoft Access ODBC driver installed.');
      log('You may need to install the 32-bit or 64-bit Access Database Engine from Microsoft.');
      return;
    }
    
    // Connect to MySQL database
    log('Connecting to MySQL database...');
    try {
      mysqlConnection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        multipleStatements: true
      });
      
      log('Successfully connected to MySQL database.');
      
      // Create database if it doesn't exist
      await mysqlConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      await mysqlConnection.query(`USE \`${DB_NAME}\`;`);
      log(`Using database: ${DB_NAME}`);
    } catch (error) {
      log(`Error connecting to MySQL database: ${error.message}`);
      return;
    }
    
    // Get all tables from Access database
    log('Retrieving tables from Access database...');
    const tables = await accessConnection.tables(null, null, null, ['TABLE']);
    
    if (!tables || tables.length === 0) {
      log('No tables found in the Access database.');
      return;
    }
    
    log(`Found ${tables.length} tables in the Access database.`);
    
    // Process each table
    for (const table of tables) {
      const accessTableName = table.TABLE_NAME;
      const mysqlTableName = sanitizeTableName(accessTableName);
      
      log(`\nProcessing table: ${accessTableName} -> ${mysqlTableName}`);
      
      // Get table columns
      const columns = await accessConnection.columns(null, null, accessTableName, null);
      
      if (!columns || columns.length === 0) {
        log(`No columns found for table: ${accessTableName}. Skipping...`);
        continue;
      }
      
      log(`Found ${columns.length} columns in table: ${accessTableName}`);
      
      // Create MySQL table
      let createTableSQL = `CREATE TABLE IF NOT EXISTS \`${mysqlTableName}\` (\n`;
      let primaryKeys = [];
      
      // Process columns
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const columnName = sanitizeColumnName(column.COLUMN_NAME);
        const dataType = mapDataType(column.TYPE_NAME);
        const isNullable = column.NULLABLE === 1 ? 'NULL' : 'NOT NULL';
        
        createTableSQL += `  \`${columnName}\` ${dataType} ${isNullable}`;
        
        // Check if column is primary key
        if (column.KEY_SEQ > 0) {
          primaryKeys.push(columnName);
        }
        
        // Add comma if not the last column
        if (i < columns.length - 1 || primaryKeys.length > 0) {
          createTableSQL += ',\n';
        }
      }
      
      // Add primary key constraint if any
      if (primaryKeys.length > 0) {
        createTableSQL += `  PRIMARY KEY (\`${primaryKeys.join('\`, \`')}\`)\n`;
      } else {
        createTableSQL += '\n';
      }
      
      createTableSQL += ');';
      
      // Create the table in MySQL
      try {
        log(`Creating MySQL table: ${mysqlTableName}`);
        await mysqlConnection.query(createTableSQL);
        log(`Table ${mysqlTableName} created successfully.`);
      } catch (error) {
        log(`Error creating table ${mysqlTableName}: ${error.message}`);
        log('Skipping to next table...');
        continue;
      }
      
      // Get data from Access table
      try {
        log(`Retrieving data from Access table: ${accessTableName}`);
        const result = await accessConnection.query(`SELECT * FROM [${accessTableName}]`);
        
        if (!result || result.length === 0) {
          log(`No data found in table: ${accessTableName}`);
          continue;
        }
        
        log(`Found ${result.length} rows in table: ${accessTableName}`);
        
        // Insert data into MySQL table
        log(`Inserting data into MySQL table: ${mysqlTableName}`);
        
        // Get column names
        const columnNames = columns.map(col => sanitizeColumnName(col.COLUMN_NAME));
        
        // Process data in batches to avoid memory issues
        const batchSize = 100;
        let insertedRows = 0;
        
        for (let i = 0; i < result.length; i += batchSize) {
          const batch = result.slice(i, i + batchSize);
          let insertSQL = `INSERT INTO \`${mysqlTableName}\` (\`${columnNames.join('\`, \`')}\`) VALUES \n`;
          
          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];
            const values = columnNames.map(colName => {
              const originalColName = columns.find(col => sanitizeColumnName(col.COLUMN_NAME) === colName)?.COLUMN_NAME;
              return escapeValue(row[originalColName]);
            });
            
            insertSQL += `(${values.join(', ')})`;
            
            // Add comma if not the last row
            if (j < batch.length - 1) {
              insertSQL += ',\n';
            }
          }
          
          try {
            await mysqlConnection.query(insertSQL);
            insertedRows += batch.length;
            log(`Inserted ${insertedRows}/${result.length} rows into ${mysqlTableName}`);
          } catch (error) {
            log(`Error inserting batch into ${mysqlTableName}: ${error.message}`);
          }
        }
        
        log(`Completed inserting data into table: ${mysqlTableName}`);
      } catch (error) {
        log(`Error retrieving data from Access table ${accessTableName}: ${error.message}`);
      }
    }
    
    log('\nMigration completed successfully!');
    log(`Log file saved to: ${logFilePath}`);
    
  } catch (error) {
    log(`Error during migration: ${error.message}`);
  } finally {
    // Close connections
    if (accessConnection) {
      try {
        await accessConnection.close();
        log('Access database connection closed.');
      } catch (error) {
        log(`Error closing Access connection: ${error.message}`);
      }
    }
    
    if (mysqlConnection) {
      try {
        await mysqlConnection.end();
        log('MySQL database connection closed.');
      } catch (error) {
        log(`Error closing MySQL connection: ${error.message}`);
      }
    }
    
    // Close readline interface
    rl.close();
    
    // Close log stream
    logStream.end();
  }
}

// Run the migration function
migrateAccessToMySQL();

console.log('\nUsage instructions:');
console.log('1. Install required dependencies:');
console.log('   npm install odbc mysql2 dotenv --save');
console.log('2. Make sure you have the Microsoft Access ODBC driver installed on your system.');
console.log('3. Run the script: node accessToMysql.js');
console.log('4. Enter the full path to your Access database file when prompted.');
console.log('5. The script will automatically:');
console.log('   - Detect all tables and columns in the Access database');
console.log('   - Create corresponding tables in MySQL');
console.log('   - Migrate all data from Access to MySQL');
console.log('6. A detailed log file will be saved in the "exports" directory.');