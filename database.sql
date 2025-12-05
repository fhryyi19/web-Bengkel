-- Database Bengkel Motor Jaya
-- Script untuk setup database MySQL

-- Buat database
CREATE DATABASE IF NOT EXISTS bengkel_db;
USE bengkel_db;

-- Tabel Users (Akun Pelanggan)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(20),
    full_name VARCHAR(100),
    address TEXT,
    google_id VARCHAR(50) UNIQUE,
    oauth_provider VARCHAR(20) DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabel Bookings (Reservasi Service)
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    notes TEXT,
    points_earned INT DEFAULT 0,
    status ENUM('pending', 'confirm', 'rejected', 'done') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel User Points & Rewards (Poin dan Reward)
CREATE TABLE IF NOT EXISTS user_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    total_points INT DEFAULT 0,
    points_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Reward Shop (Daftar Reward yang Tersedia)
CREATE TABLE IF NOT EXISTS reward_shop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reward_name VARCHAR(100) NOT NULL,
    points_required INT NOT NULL,
    description TEXT,
    reward_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Reward Redemptions (Riwayat Penukaran Reward)
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_redeemed INT NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES reward_shop(id)
);

-- Tabel Services (Daftar Layanan)
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_key VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    points_earned INT NOT NULL,
    service_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Admin (Akun Admin)
CREATE TABLE IF NOT EXISTS admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- Insert default services
INSERT INTO services (service_key, service_name, description, price, points_earned, is_active) VALUES
('service-rutin', 'Service Rutin', 'Ganti oli, tune up, dan pemeriksaan berkala', 500000, 10, TRUE),
('perbaikan-mesin', 'Perbaikan Mesin', 'Service mesin dan komponen dalam', 1000000, 30, TRUE),
('ganti-ban', 'Ganti Ban & Rem', 'Penggantian ban dan service sistem rem', 350000, 20, TRUE);

-- Insert default rewards
INSERT INTO reward_shop (reward_name, points_required, description, is_active) VALUES
('Diskon 10%', 50, 'Dapatkan potongan harga 10% untuk layanan berikutnya', TRUE),
('Ganti Oli Gratis', 100, 'Layanan ganti oli gratis senilai Rp 500.000', TRUE),
('Service Premium', 200, 'Paket service premium dengan checking menyeluruh', TRUE);

-- Insert default admin (username: admin, password: admin123)
INSERT INTO admin (username, password, email, full_name, is_active) VALUES
('admin', '$2y$10$YIjlrBs7.7u1LPq0TN0TkeCKPwhpDC0WkBkp5PKGXzPQiCpXmB.rW', 'admin@bengkel.local', 'Admin Bengkel', TRUE);



-- Buat Index untuk performa query
CREATE INDEX idx_user_id ON bookings(user_id);
CREATE INDEX idx_booking_date ON bookings(booking_date);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);

-- View untuk statistik user
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(b.id) as total_bookings,
    COALESCE(wr.total_points, 0) as points,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN user_rewards wr ON u.id = wr.user_id
GROUP BY u.id, u.username, u.email, wr.total_points;
