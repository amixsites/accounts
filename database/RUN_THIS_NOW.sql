-- =====================================================
-- FINAL FIX - Works Whether Admin Exists or Not
-- Run this in Supabase SQL Editor
-- =====================================================

-- This will update if exists, insert if doesn't exist
INSERT INTO users (id, username, password_hash, full_name, role, email, is_active, created_at, updated_at) 
VALUES (
    'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
    'admin',
    'admin123',
    'System Administrator',
    'Admin',
    'admin@kitsw.ac.in',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) 
DO UPDATE SET 
    id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
    password_hash = 'admin123',
    role = 'Admin',
    full_name = 'System Administrator',
    email = 'admin@kitsw.ac.in',
    is_active = true,
    updated_at = NOW();

-- Verify the result
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
-- You should see ONE row with:
--   id: cbebf6d8-060a-4055-94f0-471cf62ccc5c
--   username: admin
--   password_hash: admin123
--   role: Admin
--   is_active: t (true)
--
-- NEXT STEPS:
-- 1. Restart dev server: npm run dev
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. Go to http://localhost:5173
-- 4. Login with:
--      Username: admin
--      Password: admin123
-- =====================================================
