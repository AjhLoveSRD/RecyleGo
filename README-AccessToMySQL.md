# Migrasi Data dari Access ke MySQL

Skrip ini memungkinkan migrasi otomatis data dari file Microsoft Access (.accdb) ke database MySQL. Skrip akan mendeteksi semua tabel dan kolom secara dinamis, membuat tabel yang sesuai di MySQL, dan memigrasikan semua data.

## Fitur

- Deteksi otomatis semua tabel dan struktur kolom dari database Access
- Pembuatan tabel otomatis di MySQL dengan struktur yang sesuai
- Penanganan berbagai tipe data Access dan konversinya ke MySQL
- Migrasi data dengan batching untuk menghindari masalah memori
- Pencatatan log lengkap dari proses migrasi
- Sanitasi nama tabel dan kolom untuk kompatibilitas MySQL

## Prasyarat

1. Node.js terinstal di sistem Anda
2. Driver ODBC Microsoft Access terinstal di sistem Anda
   - Untuk Windows: Microsoft Access Database Engine (32-bit atau 64-bit)
   - Unduh dari: [Microsoft Access Database Engine](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
3. MySQL server yang berjalan dan dapat diakses

## Instalasi

```bash
npm install odbc mysql2 dotenv
```

## Konfigurasi

Pastikan file `.env` berisi konfigurasi MySQL yang benar:

```
DB_NAME=nama_database_mysql_anda
DB_USER=username_mysql_anda
DB_PASSWORD=password_mysql_anda
DB_HOST=localhost
DB_PORT=3306
```

## Penggunaan

1. Jalankan skrip:
   ```bash
   node accessToMysql.js
   ```

2. Masukkan path lengkap ke file database Access (.accdb) Anda saat diminta.

3. Skrip akan secara otomatis:
   - Mendeteksi semua tabel dan kolom dalam database Access
   - Membuat tabel yang sesuai di MySQL
   - Memigrasikan semua data dari Access ke MySQL

4. File log detail akan disimpan di direktori "exports".

## Penanganan Tipe Data

Skrip ini memetakan tipe data Access ke tipe data MySQL yang sesuai:

| Tipe Data Access | Tipe Data MySQL    |
|------------------|--------------------|
| VARCHAR          | VARCHAR(255)       |
| LONGCHAR         | TEXT               |
| INTEGER          | INT                |
| SMALLINT         | SMALLINT           |
| REAL             | FLOAT              |
| DOUBLE           | DOUBLE             |
| DATETIME         | DATETIME           |
| CURRENCY         | DECIMAL(19,4)      |
| COUNTER          | INT AUTO_INCREMENT |
| BOOLEAN          | TINYINT(1)         |
| BYTE             | TINYINT UNSIGNED   |
| LONGBINARY       | LONGBLOB           |
| BINARY           | BLOB               |
| GUID             | CHAR(38)           |
| DECIMAL          | DECIMAL(18,0)      |

## Pemecahan Masalah

1. **Error koneksi ke Access**: Pastikan driver ODBC Microsoft Access terinstal dengan benar. Anda mungkin perlu menginstal versi 32-bit atau 64-bit tergantung pada sistem Anda.

2. **Error koneksi ke MySQL**: Periksa kredensial MySQL di file `.env` dan pastikan server MySQL berjalan.

3. **Masalah dengan nama tabel atau kolom**: Skrip secara otomatis menyanitasi nama tabel dan kolom untuk kompatibilitas MySQL, tetapi Anda mungkin perlu menyesuaikan fungsi sanitasi jika ada kasus khusus.

## Catatan

- Skrip ini menggunakan batching untuk menangani dataset besar, tetapi Anda mungkin perlu menyesuaikan ukuran batch (`batchSize`) untuk dataset yang sangat besar.
- Semua operasi dicatat ke file log di direktori "exports" untuk referensi dan pemecahan masalah di masa mendatang.