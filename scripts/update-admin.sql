-- Add isAdmin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='isadmin') THEN
        ALTER TABLE users ADD COLUMN isadmin INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Update at least one user to be an admin (replace email with actual admin email)
UPDATE users SET isadmin = 1 WHERE email = 'admin@example.com';
