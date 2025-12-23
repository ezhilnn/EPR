-- Migration: Add full_name to users table
-- Description: Stores the user's full name

BEGIN;

-- Step 1: Add column as NULLABLE first (safe for existing data)
ALTER TABLE users
ADD COLUMN full_name VARCHAR(255);

-- Step 2: Populate existing rows
UPDATE users
SET full_name = 'Ezhilan Nagarajan'
WHERE full_name IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE users
ALTER COLUMN full_name SET NOT NULL;

COMMIT;
