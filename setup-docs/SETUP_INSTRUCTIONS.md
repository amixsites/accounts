# KITSW Fees Management System - Setup Instructions

## 🎯 Step-by-Step Setup Guide

Follow these steps to get the KITSW Fees Management System up and running.

---

## Step 1: Supabase Setup (Database)

### 1.1 Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Verify your email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in:
   - **Name:** KITSW Fees Management
   - **Database Password:** (Create a strong password and save it)
   - **Region:** Choose closest region
3. Click "Create new project"
4. Wait for project provisioning (2-3 minutes)

### 1.3 Run Database Schema
1. In your Supabase dashboard, click on "SQL Editor" (left sidebar)
2. Click "New query"
3. Open the `SUPABASE_SETUP.sql` file from this project
4. Copy ALL content from the file
5. Paste into Supabase SQL Editor
6. Click "Run" button (or press Ctrl/Cmd + Enter)
7. Wait for success message: "Success. No rows returned"

### 1.4 Get API Credentials
1. Go to Project Settings (gear icon in left sidebar)
2. Click "API" section
3. Copy and save these two values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (long string starting with `eyJ`)

---

## Step 2: Application Setup

### 2.1 Install Node.js (if not installed)
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download LTS version (v18 or higher)
3. Run installer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### 2.2 Install Dependencies
Open terminal/command prompt in project folder and run:
```bash
npm install
```
Wait for all packages to install (2-3 minutes).

### 2.3 Configure Environment
1. In project root folder, create a file named `.env` (exactly this name)
2. Open `.env` in any text editor
3. Add these two lines:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Replace `your_supabase_project_url` with URL from Step 1.4
5. Replace `your_supabase_anon_key` with anon key from Step 1.4
6. Save the file

**Example `.env` file:**
```
VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3OTMyMTIwMCwiZXhwIjoxOTk0ODk3MjAwfQ.example_key_here
```

---

## Step 3: Start the Application

### Option A: Using Command Line
```bash
npm run dev
```

### Option B: Using start.cmd (Windows only)
Double-click `start.cmd` file

The application will start and show:
```
  VITE v8.0.12  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 4: Access the Application

1. Open your web browser
2. Go to: `http://localhost:5173`
3. You should see the Login page

---

## Step 5: First Login

### Default Credentials
```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change this password immediately after first login!

---

## Step 6: Verify Installation

### 6.1 Check Dashboard
- After login, you should see the Dashboard
- Initially, all statistics will show zero (no data yet)

### 6.2 Check Sample Data
The database setup script includes sample data:
- 3 sample students
- 3 sample users
- Sample courses, branches, fee types

Navigate to:
1. **Students** page → Should see 3 students
2. **Settings** page → Check courses, branches, fee types are present

### 6.3 Test Fee Collection
1. Go to **Fee Collection** page
2. Enter roll number: `CSE001`
3. Click Search
4. Student "Rahul Kumar" should appear
5. Try adding a fee item and generating a receipt

---

## Troubleshooting

### Issue: npm command not found
**Solution:** Install Node.js (Step 2.1)

### Issue: "Vite is not recognized"
**Solution:** Run `npm install` again

### Issue: Blank dashboard after login
**Solution:** 
1. Open browser console (F12)
2. Check for errors
3. Verify `.env` file has correct Supabase credentials
4. Check Supabase project is active

### Issue: "Failed to fetch" errors
**Solution:**
1. Check internet connection
2. Verify Supabase project URL is correct
3. Ensure Supabase project is not paused

### Issue: Login not working
**Solution:**
1. Check database tables were created (Step 1.3)
2. Verify users table has data:
   - Go to Supabase Dashboard
   - Click "Table Editor"
   - Click "users" table
   - Should see 3 users (admin, user1, user2)

### Issue: Cannot see sample students
**Solution:**
1. Go to Supabase Dashboard
2. Table Editor → students table
3. Verify data exists
4. If empty, re-run the INSERT statements from SUPABASE_SETUP.sql

---

## Next Steps

### Add Real Data
1. **Add Students:**
   - Currently requires direct database insertion
   - Go to Supabase → Table Editor → students → Insert row

2. **Configure Settings:**
   - Go to Settings page
   - Add your courses, branches, fee types
   - Set active academic year

3. **Add More Users:**
   - Go to User Management
   - Add staff members who will use the system

### Security Configuration
1. **Change Default Passwords:**
   - Go to Supabase → Table Editor → users
   - Update password_hash for all users
   - (Use bcrypt in production!)

2. **Enable Row Level Security (Production):**
   - Go to Supabase → Authentication → Policies
   - Enable RLS for sensitive tables

### Backup
1. **Database Backup:**
   - Supabase provides automatic daily backups
   - For manual backup: Database → Backups → Create backup

2. **Code Backup:**
   - Use Git for version control
   - Regular commits to repository

---

## File Checklist

Ensure you have these files in your project:

- ✅ `package.json` - Dependencies
- ✅ `SUPABASE_SETUP.sql` - Database schema
- ✅ `.env` - Your credentials (create this!)
- ✅ `start.cmd` - Windows startup script
- ✅ `README.md` - Project overview
- ✅ `IMPLEMENTATION_GUIDE.md` - Detailed guide
- ✅ `SETUP_INSTRUCTIONS.md` - This file
- ✅ `src/` folder - Application code

---

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check Supabase dashboard for database connectivity
3. Verify all setup steps were completed
4. Review IMPLEMENTATION_GUIDE.md for details
5. Contact IT support:
   - Email: accounts@kitsw.ac.in
   - Phone: +91-870-2974750

---

## Success Checklist

Mark these as complete:

- [ ] Supabase account created
- [ ] Database schema executed successfully
- [ ] API credentials copied to `.env` file
- [ ] Dependencies installed (`npm install`)
- [ ] Application starts without errors
- [ ] Can login with admin credentials
- [ ] Dashboard displays
- [ ] Sample students visible
- [ ] Settings page shows courses/branches
- [ ] Fee collection test successful

If all checked, your installation is complete! 🎉

---

**Setup Time:** ~15-20 minutes  
**Last Updated:** June 6, 2026  
**Version:** 1.0.0
