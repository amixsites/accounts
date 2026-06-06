-- =====================================================
-- Update User to Full Admin Access
-- User ID: cbebf6d8-060a-4055-94f0-471cf62ccc5c
-- UID: 471cf62ccc5c
-- =====================================================

-- Update the user to Admin role (FULL ACCESS TO ALL MODULES)
UPDATE users 
SET role = 'Admin',
    full_name = 'System Administrator',
    email = 'admin@kitsw.ac.in',
    is_active = true,
    updated_at = NOW()
WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';

-- Verify the update
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

-- =====================================================
-- Confirmation
-- =====================================================
-- If you see role = 'Admin' above, the update was successful!
-- 
-- Your user now has FULL ADMIN ACCESS including:
--   ✅ Dashboard - View all statistics
--   ✅ Students - Full student management
--   ✅ Fee Collection - Collect fees
--   ✅ Receipts - Generate and manage receipts
--   ✅ Transactions - View all transactions
--   ✅ Due Fees - Track pending fees
--   ✅ Search - Universal search
--   ✅ Reports - Generate all reports
--   ✅ User Management - Create/Edit/Delete users
--   ✅ Settings - Configure courses, branches, fee types
--   ✅ Receipt Template - Configure receipt layout
--   ✅ Help - Access documentation
--
-- NO RESTRICTIONS - Complete application access!
-- =====================================================
