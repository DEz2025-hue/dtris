-- Migration: Add status field to users table
ALTER TABLE users ADD COLUMN status text NOT NULL DEFAULT 'active';
-- Optionally, add a check constraint for allowed values
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended'));
-- Update existing rows to 'active' if needed
UPDATE users SET status = 'active' WHERE status IS NULL; 