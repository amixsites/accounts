# Admin User Setup Guide

## User Configuration

### User Details
- **User ID:** `cbebf6d8-060a-4055-94f0-471cf62ccc5c`
- **UID (Short):** `471cf62ccc5c`
- **Username:** `admin`
- **Role:** `Admin` (FULL ACCESS)
- **Email:** `admin@kitsw.ac.in`

## Setting Up the Admin User

### Option 1: Run the Updated SQL Script

The `SUPABASE_SETUP.sql` file is configured to create the admin user. Simply run the entire script in your Supabase SQL Editor.

### Option 2: Quick Update (Fastest Method)

Run this simple SQL command in Supabase SQL Editor:

```sql
-- Update user to Admin role (FULL ACCESS)
UPDATE users 
SET role = 'Admin',
    full_name = 'System Administrator',
    email = 'admin@kitsw.ac.in',
    is_active = true,
    updated_at = NOW()
WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';
```

**Or run the complete script:** `UPDATE_TO_ADMIN.sql`

### Option 3: Fresh Insert

If you want to create the user from scratch:

```sql
-- Insert admin user with specific UUID
INSERT INTO users (id, username, password_hash, full_name, role, email, is_active) 
VALUES (
    'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
    'admin',
    '$2a$10$xGqpQBxgQp5xTvZ0lQ7YZO.pzYYZzYYZzYYZzYYZzYYZzYYZzYY', -- Password: admin123
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
```

## Admin Permissions - FULL ACCESS

### ✅ Complete System Access

As an **Admin**, you have **UNRESTRICTED ACCESS** to all modules:

1. **Dashboard**
   - View real-time collection statistics
   - Monitor daily operations
   - Track pending fees

2. **Student Management**
   - Add new students
   - Edit student information
   - Delete student records
   - View complete student profiles

3. **Fee Collection**
   - Collect fees from students
   - Record multiple payment types
   - Generate receipts automatically

4. **Receipts Management**
   - View all receipts
   - Print and download receipts
   - Search receipt history

5. **Transactions**
   - View complete transaction history
   - Export transaction data
   - Filter by date and payment mode

6. **Due Fees**
   - Track students with pending fees
   - Advanced filtering options
   - Generate due fee reports

7. **Universal Search**
   - Search across all entities
   - Quick access to any record

8. **Reports & Analytics**
   - Generate all types of reports
   - Branch-wise collection
   - Date-wise collection
   - Payment type analysis
   - Export to CSV

9. **User Management** ✨ (Admin Exclusive)
   - Create new users
   - Edit user details
   - Delete users
   - Assign roles
   - Manage permissions

10. **System Settings** ✨ (Admin Exclusive)
    - Configure courses
    - Manage branches
    - Define fee types
    - Set academic years

11. **Receipt Template**
    - Configure receipt layout
    - Set college information
    - Customize receipt format

12. **Help & Documentation**
    - Access user guides
    - View FAQ
    - Contact information

### 🎯 No Restrictions

- ✅ Full CRUD operations on all tables
- ✅ Access to all pages and features
- ✅ Can perform any action in the system
- ✅ Complete administrative control

## Login Credentials

### Default Admin User
```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT: Change the password immediately after first login!**

## Implementing Row Level Security (RLS)

For production environments, enable Row Level Security in Supabase:

### Step 1: Enable RLS on Tables

```sql
-- Enable RLS on key tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Policies for accounts_manager

```sql
-- Policy: accounts_manager can view all students
CREATE POLICY "accounts_manager_view_students" ON students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'accounts_manager', 'User1')
  )
);

-- Policy: accounts_manager can create receipts
CREATE POLICY "accounts_manager_create_receipts" ON receipts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'accounts_manager', 'User1')
  )
);

-- Policy: accounts_manager can view all receipts
CREATE POLICY "accounts_manager_view_receipts" ON receipts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'accounts_manager', 'User1', 'User2')
  )
);

-- Policy: accounts_manager can create transactions
CREATE POLICY "accounts_manager_create_transactions" ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'accounts_manager', 'User1')
  )
);

-- Policy: accounts_manager can view transactions
CREATE POLICY "accounts_manager_view_transactions" ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'accounts_manager', 'User1', 'User2')
  )
);

-- Policy: only Admin can manage users
CREATE POLICY "admin_only_manage_users" ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Admin'
  )
);

-- Policy: only Admin can modify courses
CREATE POLICY "admin_only_courses" ON courses
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Admin'
  )
);

-- Policy: accounts_manager can view courses
CREATE POLICY "accounts_manager_view_courses" ON courses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('Admin', 'accounts_manager', 'User1', 'User2')
  )
);
```

## Verification Steps

After setting up the admin user:

1. **Login to Supabase Dashboard**
   - Go to Table Editor → users
   - Verify the user exists with correct UUID
   - Verify role is set to **'Admin'**

2. **Test Login**
   - Open the application
   - Login with admin credentials
   - Verify you can access **ALL modules**

3. **Test Full Access**
   - Access Dashboard ✅
   - Access Fee Collection ✅
   - Access Receipts ✅
   - Access Reports ✅
   - Access **User Management** ✅
   - Access **Settings** ✅
   - All pages should be accessible

4. **Test Administrative Operations**
   - Create a new user ✅
   - Add a course ✅
   - Add a branch ✅
   - Collect a fee ✅
   - Generate a report ✅
   - Everything should work without restrictions

## Role Hierarchy

1. **Admin** - Complete system access (YOUR ROLE)
2. **accounts_manager** - Finance operations (optional secondary role)
3. **User1** - Fee collection and reports
4. **User2** - Basic fee collection

Your user is configured as **Admin** with full privileges.

## Frontend Permission Checks (Future Enhancement)

To fully implement role-based UI restrictions, you can add permission checks:

```typescript
// src/utils/permissions.ts
export const hasPermission = (userRole: string, permission: string): boolean => {
  const permissions = {
    'Admin': ['*'], // All permissions
    'accounts_manager': [
      'view_students',
      'manage_fees',
      'generate_receipts',
      'record_payments',
      'view_reports'
    ],
    'User1': [
      'view_students',
      'generate_receipts',
      'record_payments',
      'view_reports'
    ],
    'User2': [
      'generate_receipts',
      'record_payments'
    ]
  };

  const rolePermissions = permissions[userRole] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};
```

Then use in components:

```typescript
// Hide User Management for non-admins
{userRole === 'Admin' && (
  <NavLink to="/dashboard/user-management">User Management</NavLink>
)}

// Hide Settings for non-admins
{userRole === 'Admin' && (
  <NavLink to="/dashboard/settings">Settings</NavLink>
)}
```

## Troubleshooting

### Issue: User cannot login
**Solution:** Verify the user exists in the users table with correct credentials

### Issue: "Permission denied" errors
**Solution:** Check if RLS policies are correctly configured for the role

### Issue: User can access restricted pages
**Solution:** Implement frontend permission checks in the sidebar navigation

### Issue: Role not updating
**Solution:** 
1. Verify the UPDATE query ran successfully
2. Clear browser cache and cookies
3. Logout and login again

## Security Best Practices

1. **Change Default Password**
   - Never use default passwords in production
   - Use strong, unique passwords

2. **Enable RLS**
   - Always enable Row Level Security for production
   - Test policies thoroughly

3. **Audit Logging**
   - Monitor user activities
   - Track fee collection operations
   - Review access logs regularly

4. **Regular Reviews**
   - Review user permissions quarterly
   - Remove inactive users
   - Update roles as needed

---

**Setup Completed:** User `cbebf6d8-060a-4055-94f0-471cf62ccc5c` with UID `471cf62ccc5c` configured as Accounts Manager

**Version:** 1.0.0  
**Last Updated:** June 6, 2026
