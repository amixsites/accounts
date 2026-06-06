-- =====================================================
-- SIMPLE FIX - Just Update Existing Admin User
-- Run this in Supabase SQL Editor
-- =====================================================

-- Update the existing admin user
UPDATE users 
SET password_hash = 'admin123',
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
    is_active
FROM users 
WHERE username = 'admin';

-- =====================================================
-- Expected Output:
-- You should see:
--   username: admin
--   password_hash: admin123
--   role: Admin
--   is_active: t (true)
--
-- Now restart your dev server:
--   npm run dev
--
-- Then login with:
--   Username: admin
--   Password: admin123
-- =====================================================
