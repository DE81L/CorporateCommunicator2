-- Add missing columns to users table
ALTER TABLE users
  ADD COLUMN department_id int REFERENCES departments(id),
  ADD COLUMN job_title text DEFAULT NULL,
  ADD COLUMN language text DEFAULT 'en';
