# KITSW Fees Management System

A comprehensive fee management system built with React, TypeScript, and Supabase for Kakatiya Institute of Technology & Science for Women.

## 🚀 Features

- **Dashboard** - Real-time collection statistics and analytics
- **Student Management** - Complete student records with transaction history
- **Fee Collection** - Easy fee collection with receipt generation
- **Receipts** - View, search, print, and download receipts
- **Transactions** - Detailed payment transaction tracking
- **Due Fees** - Track pending fees with advanced filtering
- **Universal Search** - Search across students, receipts, and transactions
- **Reports** - Generate analytical reports (Branch-wise, Date-wise, Payment Type)
- **User Management** - Manage system users and roles
- **Settings** - Configure courses, branches, fee types, and academic years
- **Multi-payment Support** - Cash, UPI, Bank Transfer, Card, Cheque, DD

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier works)
- Modern web browser

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the entire content from `SUPABASE_SETUP.sql`
4. Get your Project URL and anon key from Project Settings → API

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace with your actual Supabase credentials.

### 4. Start Development Server

```bash
npm run dev
```

Or use the provided batch file (Windows):

```bash
start.cmd
```

Access at `http://localhost:5173`

## 🔐 Default Login Credentials

**⚠️ Change immediately after first login!**

```
Username: admin
Password: admin123
```

## 📊 Database Schema

Main tables:
- **users** - System users
- **students** - Student records
- **courses** - Course types
- **branches** - Department branches
- **academic_years** - Academic years
- **fee_types** - Fee categories
- **receipts** - Payment receipts
- **transactions** - Fee details
- **due_fees_view** - Pending fees

See `SUPABASE_SETUP.sql` for complete schema.

## 📝 Quick Start Guide

### Collect Fees
1. Go to Fee Collection
2. Enter roll number → Search
3. Add fee items
4. Enter payment details
5. Generate receipt

### View Reports
1. Go to Reports
2. Select report type
3. Choose date range
4. Generate & Export

### Manage Due Fees
1. Go to Due Fees
2. Apply filters
3. View pending students
4. Check detailed dues

## 🛠️ Tech Stack

- React 19.2 + TypeScript 6.0
- Supabase (PostgreSQL)
- Vite 8.0
- React Router DOM 7.17
- Lucide React Icons

## 📚 Documentation

- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Detailed setup
- [Database Schema](SUPABASE_SETUP.sql) - Complete structure

## 🔒 Security Notes

Current implementation is for demonstration. For production:
- Implement password hashing
- Enable Row Level Security (RLS)
- Add role-based access control
- Input validation
- HTTPS only
- Audit logging

## 🐛 Troubleshooting

**Vite not recognized:** Run `npm install`  
**Supabase error:** Check `.env` file and credentials  
**No data:** Check browser console and database permissions

## 💡 Future Enhancements

- SMS/Email notifications
- Bulk import via Excel
- Charts and graphs
- Mobile app
- Payment gateway
- QR code receipts
- Multi-language support
- Dark mode

## 📞 Support

- **Email:** accounts@kitsw.ac.in
- **Phone:** +91-870-2974750
- **Website:** www.kitsw.ac.in

---

**Version:** 1.0.0  
**Last Updated:** June 6, 2026  
**© 2026 Kakatiya Institute of Technology & Science for Women**
