-- Migration: Simplify booking status values to ('pending','confirm','rejected')
-- Run this on the bengkel_db database (via phpMyAdmin or mysql CLI)

USE bengkel_db;

-- Map legacy values to new set (add 'done' for completed values)
UPDATE bookings SET status = 'confirm' WHERE status IN ('confirmed','accepted');
UPDATE bookings SET status = 'done' WHERE status IN ('completed','done');
UPDATE bookings SET status = 'rejected' WHERE status IN ('cancelled','cancel','reject');
UPDATE bookings SET status = 'pending' WHERE status NOT IN ('confirm','rejected','pending','done');

-- Alter column to new ENUM including 'done'
ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','confirm','rejected','done') DEFAULT 'pending';

-- Optional: add index for status
-- Note: older MySQL versions do not support IF NOT EXISTS for ADD INDEX; run the line below only if idx_booking_status doesn't exist
ALTER TABLE bookings ADD INDEX idx_booking_status (status);
