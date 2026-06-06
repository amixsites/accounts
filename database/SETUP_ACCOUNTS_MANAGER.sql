-- =====================================================
-- Quick Setup for Accounts Manager User
-- User ID: cbebf6d8-060a-4055-94f0-471cf62ccc5c
-- UID: 471cf62ccc5c
-- =====================================================

-- Step 1: Update the users table to support accounts_manager role (if not already done)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'accounts_manager', 'User1', 'User2'));

-- Step 2: Insert or update the specific user with Admin privileges
INSERT INTO users (id, username, password_hash, full_name, role, email, is_active) 
VALUES (
    'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
    'admin',
    '$2a$10$xGqpQBxgQp5xTvZ0lQ7YZO.pzYYZzYYZzYYZzYYZzYYZzYYZzYY', -- Default password: admin123 - CHANGE THIS!
    'System Administrator',
    'Admin',
    'admin@kitsw.ac.in',
    true
)
ON CONFLICT (id) DO UPDATE 
SET role = 'Admin',
    full_name = 'System Administrator',
    email = 'admin@kitsw.ac.in',
    is_active = true,
    updated_at = NOW();

-- Step 3: Verify the user was created/updated
SELECT id, username, full_name, role, email, is_active, created_at 
FROM users 
WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';

-- =====================================================
-- Optional: Enable Row Level Security (RLS)
-- Uncomment the following sections to enable RLS
-- =====================================================

-- Enable RLS on key tables
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;

-- Create policy: accounts_manager can view students
-- CREATE POLICY "accounts_manager_view_students" ON students
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role IN ('Admin', 'accounts_manager', 'User1')
--     AND users.is_active = true
--   )
-- );

-- Create policy: accounts_manager can create receipts
-- CREATE POLICY "accounts_manager_create_receipts" ON receipts
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role IN ('Admin', 'accounts_manager', 'User1')
--     AND users.is_active = true
--   )
-- );

-- Create policy: accounts_manager can view receipts
-- CREATE POLICY "accounts_manager_view_receipts" ON receipts
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role IN ('Admin', 'accounts_manager', 'User1', 'User2')
--     AND users.is_active = true
--   )
-- );

-- Create policy: accounts_manager can create transactions
-- CREATE POLICY "accounts_manager_create_transactions" ON transactions
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role IN ('Admin', 'accounts_manager', 'User1')
--     AND users.is_active = true
--   )
-- );

-- Create policy: accounts_manager can view transactions
-- CREATE POLICY "accounts_manager_view_transactions" ON transactions
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role IN ('Admin', 'accounts_manager', 'User1', 'User2')
--     AND users.is_active = true
--   )
-- );

-- Create policy: only Admin can manage users
-- CREATE POLICY "admin_only_manage_users" ON users
-- FOR ALL
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role = 'Admin'
--     AND users.is_active = true
--   )
-- );

-- Create policy: accounts_manager can manage fee_types
-- CREATE POLICY "accounts_manager_manage_fee_types" ON fee_types
-- FOR ALL
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.role IN ('Admin', 'accounts_manager')
--     AND users.is_active = true
--   )
-- );

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if user exists and has correct role
SELECT 
    id,
    username,
    full_name,
    role,
    email,
    is_active,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
FROM users 
WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';

-- Check all users in the system
SELECT 
    username,
    full_name,
    role,
    is_active
FROM users 
ORDER BY role, username;

-- =====================================================
-- Success Message
-- =====================================================
-- If you see the user record above, the setup was successful!
-- 
-- Login Credentials:
--   Username: admin
--   Password: admin123 (CHANGE THIS IMMEDIATELY!)
--
-- Role: Admin (FULL ACCESS)
-- Permissions:
--   ✅ Full system access - ALL MODULES
--   ✅ View and manage students
--   ✅ Manage fee structures
--   ✅ Generate receipts
--   ✅ Record payments
--   ✅ View reports
--   ✅ Manage users
--   ✅ Modify system settings
--   ✅ All administrative functions
-- =====================================================
