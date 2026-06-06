# 🚀 RUN THIS FIRST - Database Setup

## Current Error: 406 Not Acceptable

This means the database tables don't exist yet. You need to create them!

---

## ✅ SOLUTION (3 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/jwzmgrjxefibcqgufpwi
2. Click **"SQL Editor"** in the left sidebar
3. Click **"+ New query"** button

### Step 2: Copy and Run SQL

**Choose ONE option:**

#### Option A: Quick Setup (Recommended - 2 minutes)
1. Open file: `QUICK_DB_SETUP.sql`
2. Copy ENTIRE content
3. Paste in Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for "Success" message

#### Option B: Complete Setup (3 minutes)
1. Open file: `SUPABASE_SETUP.sql`
2. Copy ENTIRE content
3. Paste in Supabase SQL Editor
4. Click **"Run"** button
5. Wait for completion

### Step 3: Verify Setup

After running, you should see output like:
```
Setup Complete!
users_count: 1
students_count: 3
courses_count: 3
branches_count: 6
fee_types_count: 6

Your admin user:
id: cbebf6d8-060a-4055-94f0-471cf62ccc5c
username: admin
role: Admin
```

---

## ✅ After Database Setup

### Step 4: Refresh Your Application

1. Go back to your browser: http://localhost:5173
2. **Refresh the page** (F5)
3. Try logging in:
   - Username: `admin`
   - Password: `admin123`

**The 406 error will be GONE!** ✅

---

## 📊 What Gets Created

The SQL script creates:

### Tables:
- ✅ users (your admin account)
- ✅ students (3 sample students)
- ✅ courses (B.Tech, MBA, M.Tech)
- ✅ branches (CSE, ECE, EEE, etc.)
- ✅ fee_types (Tuition, Hostel, Library, etc.)
- ✅ receipts (empty, ready for use)
- ✅ transactions (empty)
- ✅ academic_years (2024-25, 2025-26, 2026-27)
- ✅ receipt_config (college info)
- ✅ fee_structure (empty)

### Functions:
- ✅ generate_receipt_number() - Auto-generates receipt numbers

### Views:
- ✅ due_fees_view - Calculates pending fees

---

## 🎯 Expected Result

### Before Running SQL:
```
❌ 406 Not Acceptable
❌ Cannot login
❌ No tables exist
```

### After Running SQL:
```
✅ Login page loads
✅ Can login with admin/admin123
✅ Dashboard shows data
✅ All modules work
```

---

## 🆘 Troubleshooting

### SQL Error: "relation already exists"
**Solution:** This is OK! It means tables already exist. Keep running the script.

### SQL Error: "permission denied"
**Solution:** Make sure you're using your Supabase project owner account.

### Login Still Fails After Setup
**Solution:** 
1. Check the users table in Supabase → Table Editor → users
2. Verify your admin user exists with ID: `cbebf6d8-060a-4055-94f0-471cf62ccc5c`
3. Verify role is 'Admin'

### Still Getting 406 Error
**Solution:**
1. Refresh your browser completely (Ctrl+Shift+R)
2. Check Supabase → Table Editor → Verify tables exist
3. Make sure SQL script ran without errors

---

## 📁 Files You Need

Pick ONE to run in Supabase:
- ✅ **QUICK_DB_SETUP.sql** - Faster, simpler (RECOMMENDED)
- ✅ **SUPABASE_SETUP.sql** - Complete with all features

---

## ✨ Quick Verification

After running SQL, check in Supabase:

1. **Go to:** Table Editor (left sidebar)
2. **Check:** You should see these tables:
   - users
   - students
   - courses
   - branches
   - fee_types
   - receipts
   - transactions
   - academic_years
   - receipt_config
   - fee_structure

3. **Click on:** users table
4. **Verify:** You see one user with username 'admin'

If YES to all → **Setup complete!** Go login! 🎉

---

**Current Status:** Database Not Created  
**Next Action:** Run QUICK_DB_SETUP.sql in Supabase  
**Time Required:** 2-3 minutes  
**After This:** You can login and use the application
