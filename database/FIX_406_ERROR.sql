-- =====================================================
-- FIX 406 NOT ACCEPTABLE ERROR
-- This enables public access to necessary tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- OPTION 1: Disable RLS (Quick Fix - For Development)
-- This allows unrestricted access to these tables

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_config DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'students', 'receipts', 'transactions')
ORDER BY tablename;

-- Test the users table access
SELECT id, username, role, is_active FROM users WHERE username = 'admin';

-- =====================================================
-- EXPECTED OUTPUT:
-- 
-- For pg_tables query:
--   All tables should show rowsecurity = false
--
-- For users query:
--   Should show your admin user with no 406 error
--
-- NEXT STEPS:
-- 1. Restart your dev server: npm run dev
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. Login with: admin / admin123
-- =====================================================
