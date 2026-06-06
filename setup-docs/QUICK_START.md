# 🚀 KITSW Fees Management System - Quick Start

## ⚡ Super Fast Setup (3 Steps)

### Step 1: Run Database Setup (2 minutes)

1. Go to your Supabase project: [https://supabase.com](https://supabase.com)
2. Click **SQL Editor**
3. Run **Option A** or **Option B**:

**Option A: Full Setup (Recommended)**
- Copy entire content from `SUPABASE_SETUP.sql`
- Paste and Run

**Option B: Quick Accounts Manager Only**
- Copy entire content from `SETUP_ACCOUNTS_MANAGER.sql`
- Paste and Run

### Step 2: Configure .env File (30 seconds)

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from: **Supabase → Project Settings → API**

### Step 3: Start Application (1 minute)

```bash
npm install
npm run dev
```

Or double-click `start.cmd` (Windows)

---

## 🔐 Login Credentials

Your specific user is configured as **FULL ADMIN**:

```
User ID: cbebf6d8-060a-4055-94f0-471cf62ccc5c
UID: 471cf62ccc5c
Username: admin
Password: admin123
Role: Admin (FULL ACCESS)
```

**⚠️ Change password after first login!**

---

## ✅ Admin Access - ALL Modules Enabled

Your role has **COMPLETE ACCESS** to:

✅ **Dashboard** - Real-time statistics and analytics  
✅ **Students** - View, add, edit student records  
✅ **Fee Collection** - Collect fees, record payments  
✅ **Receipts** - Generate, view, print receipts  
✅ **Transactions** - View all payment history  
✅ **Due Fees** - Track pending payments  
✅ **Search** - Universal search across all data  
✅ **Reports** - Generate all financial reports  
✅ **User Management** - Create, edit, delete users  
✅ **Settings** - Configure courses, branches, fee types  
✅ **Receipt Template** - Configure receipt layout  
✅ **Help** - Access documentation  

**NO RESTRICTIONS - Full administrative control!**  

---

## 📊 What You Can Do

### Collect Fees
1. Go to **Fee Collection**
2. Enter roll number (try: `CSE001`)
3. Add fee items
4. Enter payment details
5. Generate receipt

### View Reports
1. Go to **Reports**
2. Select report type (Branch-wise, Date-wise, etc.)
3. Set date range
4. Generate & Export

### Track Due Fees
1. Go to **Due Fees**
2. Apply filters (Branch, Year, etc.)
3. View students with pending fees

---

## 🎯 Test with Sample Data

The database includes 3 sample students:

- **CSE001** - Rahul Kumar (B.Tech CSE, 2025-26)
- **ECE002** - Priya Sharma (B.Tech ECE, 2024-25)
- **EEE003** - Anjali Reddy (B.Tech EEE, 2025-26)

Try collecting fees for these students!

---

## 📁 Important Files

- `SUPABASE_SETUP.sql` - Complete database schema
- `SETUP_ACCOUNTS_MANAGER.sql` - Quick user setup
- `ACCOUNTS_MANAGER_SETUP.md` - Detailed role guide
- `IMPLEMENTATION_GUIDE.md` - Full documentation
- `README.md` - Project overview

---

## 🆘 Quick Troubleshooting

**Cannot login?**
→ Run `SETUP_ACCOUNTS_MANAGER.sql` in Supabase

**No data showing?**
→ Check browser console (F12) for errors
→ Verify `.env` file has correct credentials

**"Permission denied"?**
→ Check user role is 'accounts_manager'
→ Run verification query from setup SQL

---

## 📞 Need Help?

Check these in order:
1. Browser console (F12) for errors
2. `ACCOUNTS_MANAGER_SETUP.md` for role details
3. `IMPLEMENTATION_GUIDE.md` for full guide
4. Contact: accounts@kitsw.ac.in

---

## 🎉 You're Ready!

Your system is configured with:
- ✅ Database with sample data
- ✅ Your specific user UUID
- ✅ **Full Admin Role**
- ✅ **Complete access to all modules**
- ✅ All features operational

**Access at:** `http://localhost:5173`

---

**Total Setup Time:** ~5 minutes  
**Version:** 1.0.0  
**Date:** June 6, 2026
