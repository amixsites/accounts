# 🔧 Quick Fix - Login Not Working

## ⚠️ The Problem

You got this error:
```
ERROR: duplicate key value violates unique constraint "users_username_key"
Key (username)=(admin) already exists
```

**Good News:** Your admin user EXISTS! We just need to update the password.

---

## ✅ The Solution (3 Steps - 4 Minutes)

### Step 1️⃣: Run the New SQL

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/jwzmgrjxefibcqgufpwi
   - Click **"SQL Editor"** (left sidebar)
   - Click **"+ New query"**

2. **Copy & Paste This SQL:**

```sql
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

SELECT id, username, password_hash, role, is_active FROM users WHERE username = 'admin';
```

3. **Click "Run"**
   - ✅ Should see: Success! Row with admin user details

---

### Step 2️⃣: Restart Dev Server

In your PowerShell terminal:

```powershell
# Stop the server
Ctrl+C

# Start it again
npm run dev
```

Wait for: `Local: http://localhost:5173`

---

### Step 3️⃣: Clear Cache & Login

1. Open browser: http://localhost:5173
2. Press **Ctrl+Shift+Delete**
3. Check **"Cached images and files"**
4. Click **"Clear data"**
5. Close tab, open NEW tab: http://localhost:5173
6. **Login:**
   - Username: `admin`
   - Password: `admin123`

🎉 **Should work now!**

---

## 🔍 Why This Works

| Issue | Solution |
|-------|----------|
| Old SQL tried to INSERT | New SQL uses `ON CONFLICT` |
| Admin already exists | UPDATE existing instead of INSERT |
| Password was wrong format | Now set to plain text `admin123` |
| Code expects bcrypt OR plain | Login code accepts both ✅ |

---

## 🆘 Still Not Working?

### Check These:

1. **SQL ran successfully?**
   - Should see output with admin user row
   - `password_hash` should be `admin123`

2. **Dev server restarted?**
   - Should see fresh console output
   - Check for any error messages

3. **Browser cache cleared?**
   - Close ALL tabs
   - Open ONE new tab
   - Try login again

4. **Environment variables correct?**
   - Check `.env` file in project root
   - Should have:
     ```
     VITE_SUPABASE_URL=https://jwzmgrjxefibcqgufpwi.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| **RUN_THIS_NOW.sql** | ✅ Run this SQL (new, safe version) |
| **FINAL_INSTRUCTIONS.txt** | Detailed step-by-step guide |
| SIMPLE_FIX.sql | Old version (UPDATE only) |
| FIX_LOGIN.sql | Old version (caused duplicate error) |

---

## ⏱️ Timeline

- **Step 1:** 2 minutes (run SQL)
- **Step 2:** 30 seconds (restart server)
- **Step 3:** 1 minute (clear cache & login)
- **Total:** ~4 minutes

---

## ✅ What You'll See When Working

After login:
- ✅ Redirects to Dashboard
- ✅ Shows "Welcome, System Administrator"
- ✅ All menu items visible (full admin access)
- ✅ Can access all 13 modules

---

## 🎯 Current Status

| Component | Status |
|-----------|--------|
| Database Tables | ✅ Exist (setup SQL already run) |
| Login Code | ✅ Updated (accepts plain text) |
| Environment | ✅ Configured (correct URL) |
| Admin User | ⚠️ Exists but needs password update |
| **Action Needed** | 🔧 Run RUN_THIS_NOW.sql |

---

**Last Updated:** June 6, 2026  
**Estimated Time to Fix:** 4 minutes  
**Files to Use:** `RUN_THIS_NOW.sql` + `FINAL_INSTRUCTIONS.txt`
