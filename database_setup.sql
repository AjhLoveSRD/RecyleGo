-- Database setup for RecycleGo application

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS recyclego_db;

-- Use the database
USE recyclego_db;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  nama_lengkap VARCHAR(100),
  alamat TEXT,
  no_telepon VARCHAR(20),
  poin_total INT DEFAULT 0,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login DATETIME,
  refresh_token VARCHAR(255),
  token_version INT DEFAULT 0,
  failed_login_attempts INT DEFAULT 0,
  account_locked_until DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Aktivitas table
CREATE TABLE IF NOT EXISTS Aktivitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  jenis_sampah ENUM('plastik', 'kertas', 'logam', 'kaca', 'organik', 'elektronik', 'lainnya') NOT NULL,
  berat DECIMAL(10,2) NOT NULL,
  poin INT NOT NULL,
  tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
  lokasi VARCHAR(255),
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  keterangan TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
);

-- Create Rewards table
CREATE TABLE IF NOT EXISTS Rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  poin_dibutuhkan INT NOT NULL,
  stok INT DEFAULT 0,
  gambar VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Edukasi table
CREATE TABLE IF NOT EXISTS Edukasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  konten TEXT NOT NULL,
  kategori ENUM('artikel', 'video', 'infografis', 'tips') NOT NULL,
  gambar VARCHAR(255),
  status ENUM('published', 'draft') DEFAULT 'published',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create RewardClaims table for tracking reward redemptions
CREATE TABLE IF NOT EXISTS RewardClaims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  rewardId INT,
  tanggal_klaim DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'processed', 'completed', 'cancelled') DEFAULT 'pending',
  keterangan TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
  FOREIGN KEY (rewardId) REFERENCES Rewards(id) ON DELETE SET NULL
);

-- Create CSRF Tokens table for CSRF protection
CREATE TABLE IF NOT EXISTS CSRFTokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Create LoginLogs table for security monitoring
CREATE TABLE IF NOT EXISTS LoginLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status ENUM('success', 'failed') NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
);

-- Insert default admin user
INSERT INTO Users (username, email, password, role, nama_lengkap, status)
VALUES ('admin', 'admin@recyclego.com', '$2a$12$1tOdPmjU8qsHJJxEFRYyR.VUoJqxwTg.9CxYlBMZxKJNXcHnXjKHC', 'admin', 'Administrator', 'active');

-- Note: The admin password is 'Admin123!' hashed with bcrypt

-- Insert some sample data for Edukasi
INSERT INTO Edukasi (judul, konten, kategori, status)
VALUES 
('Cara Memilah Sampah dengan Benar', 'Artikel tentang cara memilah sampah dengan benar untuk didaur ulang.', 'artikel', 'published'),
('Tips Mengurangi Sampah Plastik', 'Tips praktis untuk mengurangi penggunaan plastik dalam kehidupan sehari-hari.', 'tips', 'published');

-- Insert some sample rewards
INSERT INTO Rewards (nama, deskripsi, poin_dibutuhkan, stok, status)
VALUES 
('Voucher Belanja', 'Voucher belanja senilai Rp50.000', 500, 10, 'active'),
('Tumbler Eco-Friendly', 'Tumbler ramah lingkungan', 300, 20, 'active');