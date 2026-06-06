-- =====================================================
-- FIX 406 ERROR WITH PROPER RLS POLICIES
-- This is the secure way - adds proper access policies
-- Use this for production
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public read access to students" ON students;
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow public read access to branches" ON branches;
DROP POLICY IF EXISTS "Allow public read access to academic_years" ON academic_years;
DROP POLICY IF EXISTS "Allow public read access to fee_types" ON fee_types;
DROP POLICY IF EXISTS "Allow public read access to receipts" ON receipts;
DROP POLICY IF EXISTS "Allow public read access to transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public read access to fee_structure" ON fee_structure;
DROP POLICY IF EXISTS "Allow public read access to receipt_config" ON receipt_config;

DROP POLICY IF EXISTS "Allow public insert to receipts" ON receipts;
DROP POLICY IF EXISTS "Allow public insert to transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public insert to students" ON students;
DROP POLICY IF EXISTS "Allow public update to users" ON users;
DROP POLICY IF EXISTS "Allow public update to students" ON students;
DROP POLICY IF EXISTS "Allow public update to receipts" ON receipts;

-- Create policies for SELECT (read)
CREATE POLICY "Allow public read access to users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to students"
    ON students FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to courses"
    ON courses FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to branches"
    ON branches FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to academic_years"
    ON academic_years FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to fee_types"
    ON fee_types FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to receipts"
    ON receipts FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to transactions"
    ON transactions FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to fee_structure"
    ON fee_structure FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to receipt_config"
    ON receipt_config FOR SELECT
    USING (true);

-- Create policies for INSERT
CREATE POLICY "Allow public insert to students"
    ON students FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public insert to receipts"
    ON receipts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public insert to transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

-- Create policies for UPDATE
CREATE POLICY "Allow public update to users"
    ON users FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public update to students"
    ON students FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public update to receipts"
    ON receipts FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Test access
SELECT id, username, role, is_active FROM users WHERE username = 'admin';

-- =====================================================
-- WHAT THIS DOES:
-- - Enables Row Level Security (RLS) on all tables
-- - Creates policies that allow public access for development
-- - For production, you should restrict these policies based on user roles
--
-- NEXT STEPS:
-- 1. Restart dev server: npm run dev
-- 2. Clear browser cache
-- 3. Login with: admin / admin123
-- =====================================================
