-- =====================================================
-- FIX LOGIN ISSUE - Update Admin User Password
-- Run this if you already have tables but can't login
-- =====================================================

-- Check if user exists
DO $$
BEGIN
    -- If user exists, update it
    IF EXISTS (SELECT 1 FROM users WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c') THEN
        UPDATE users 
        SET password_hash = 'admin123',
            role = 'Admin',
            full_name = 'System Administrator',
            email = 'admin@kitsw.ac.in',
            is_active = true,
            updated_at = NOW()
        WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';
        
        RAISE NOTICE 'User updated successfully';
    ELSE
        -- If user doesn't exist, create it
        INSERT INTO users (id, username, password_hash, full_name, role, email, is_active) 
        VALUES (
            'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
            'admin',
            'admin123',
            'System Administrator',
            'Admin',
            'admin@kitsw.ac.in',
            true
        );
        
        RAISE NOTICE 'User created successfully';
    END IF;
END $$;

-- Also ensure username 'admin' points to your user ID (in case of conflicts)
UPDATE users 
SET id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
    password_hash = 'admin123',
    role = 'Admin',
    full_name = 'System Administrator',
    email = 'admin@kitsw.ac.in',
    is_active = true,
    updated_at = NOW()
WHERE username = 'admin';

-- Verify the update
SELECT 
    id,
    username,
    password_hash,
    full_name,
    role,
    email,
    is_active,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM users 
WHERE username = 'admin' OR id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';

-- =====================================================
-- Expected Result
-- =====================================================
-- You should see:
-- username: admin
-- password_hash: admin123
-- role: Admin
-- is_active: true
--
-- Now you can login with:
-- Username: admin
-- Password: admin123
-- =====================================================
