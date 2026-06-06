# 🔧 Fix 406 Not Acceptable Error

## ⚠️ The Problem

You're getting:
```
GET https://jwzmgrjxefibcqgufpwi.supabase.co/rest/v1/users?select=*&username=eq.admin&is_active=eq.true 
406 (Not Acceptable)
```

**Root Cause:** Supabase has **Row Level Security (RLS)** enabled by default, which blocks all API access to your tables.

---

## ✅ Quick Solution (Choose ONE)

### **Option A: Disable RLS (Fast - For Development)**

This is the **fastest way** to get your app working. Good for development/testing.

#### Steps:

1. **Open Supabase SQL Editor**
   - https://supabase.com/dashboard/project/jwzmgrjxefibcqgufpwi
   - Click "SQL Editor" → "+ New query"

2. **Copy & Paste This:**

```sql
-- Disable RLS on all tables
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

-- Verify it worked
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';
```

3. **Click "Run"**
   - Should see `rowsecurity = false`

4. **Restart Dev Server**
   ```powershell
   Ctrl+C
   npm run dev
   ```

5. **Clear Browser Cache**
   - Ctrl+Shift+Delete
   - Clear "Cached images and files"

6. **Try Login Again**
   - Username: `admin`
   - Password: `admin123`

✅ **Should work now!**

---

### **Option B: Enable RLS with Policies (Secure - For Production)**

This is the **proper way** with security policies. Takes a bit longer to set up.

#### Steps:

1. **Open Supabase SQL Editor**
   - https://supabase.com/dashboard/project/jwzmgrjxefibcqgufpwi
   - Click "SQL Editor" → "+ New query"

2. **Run the file: `FIX_406_WITH_RLS.sql`**
   - Copy all content from that file
   - Paste in SQL Editor
   - Click "Run"

3. **Restart & Test** (same as Option A steps 4-6)

---

## 🎯 Recommended Approach

For your current situation:

1. **Use Option A first** (disable RLS) to get login working
2. Once everything works, you can come back and implement Option B for security

---

## 📊 What's Happening Behind the Scenes

| Issue | Explanation |
|-------|-------------|
| 406 Error | Supabase is blocking API access |
| Why? | Row Level Security (RLS) is enabled |
| RLS Status | Default = enabled on all tables |
| No Policies | Without policies, ALL access is blocked |
| Solution | Either disable RLS or add access policies |

---

## 🔍 How to Check RLS Status

Run this in Supabase SQL Editor:

```sql
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'students', 'receipts', 'transactions')
ORDER BY tablename;
```

**Expected Output After Fix:**
- All tables show `rowsecurity = false` (Option A)
- OR all tables have policies listed (Option B)

---

## 🆘 Still Getting 406?

### Checklist:

- [ ] SQL ran successfully (no errors)
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Using correct credentials (admin / admin123)
- [ ] `.env` file has correct Supabase URL

### Debug Steps:

1. **Check if RLS is actually disabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```
   Should show `rowsecurity = false`

2. **Test direct table access:**
   ```sql
   SELECT id, username, role FROM users WHERE username = 'admin';
   ```
   Should return your admin user

3. **Check browser console** (F12)
   - Still showing 406?
   - Any other errors?

4. **Check Network tab** (F12 → Network)
   - Look for the failing request
   - Check response body for details

---

## ⚡ Complete Fix Script (All-in-One)

If you want to fix **both** the 406 error AND ensure admin user is correct:

```sql
-- Fix RLS (disable for development)
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

-- Fix admin user
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
    password_hash = 'admin123',
    role = 'Admin',
    is_active = true,
    updated_at = NOW();

-- Verify everything
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
SELECT id, username, role, is_active FROM users WHERE username = 'admin';
```

Copy this entire block, run it, restart server, clear cache, and login!

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| **FIX_406_ERROR.sql** | ✅ Quick fix (disable RLS) |
| **FIX_406_WITH_RLS.sql** | Secure fix (with policies) |
| **RUN_THIS_NOW.sql** | Fix admin password |
| **COPY_THIS_SQL.txt** | Admin user fix only |

---

## ⏱️ Time to Fix

- **Option A:** 2-3 minutes
- **Option B:** 5-7 minutes

---

**Last Updated:** June 6, 2026  
**Status:** This will fix the 406 error  
**Recommendation:** Use Option A (disable RLS) for now
