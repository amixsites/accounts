-- =====================================================
-- QUICK DATABASE SETUP FOR KITSW
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'accounts_manager', 'User1', 'User2')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    duration_years INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    course_id INTEGER REFERENCES courses(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Fee Types Table
CREATE TABLE IF NOT EXISTS fee_types (
    id SERIAL PRIMARY KEY,
    fee_code VARCHAR(20) UNIQUE NOT NULL,
    fee_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    course_id INTEGER REFERENCES courses(id),
    branch_id INTEGER REFERENCES branches(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    email VARCHAR(100),
    phone VARCHAR(20),
    parent_phone VARCHAR(20),
    address TEXT,
    admission_date DATE,
    total_fee_amount DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id INTEGER REFERENCES students(id),
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'DD')),
    transaction_reference VARCHAR(100),
    remarks TEXT,
    collected_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id),
    fee_type_id INTEGER REFERENCES fee_types(id),
    amount DECIMAL(10, 2) NOT NULL,
    academic_year_id INTEGER REFERENCES academic_years(id),
    transaction_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Receipt Configuration Table
CREATE TABLE IF NOT EXISTS receipt_config (
    id SERIAL PRIMARY KEY,
    college_name VARCHAR(200) NOT NULL,
    college_address TEXT,
    college_phone VARCHAR(50),
    college_email VARCHAR(100),
    college_logo_url TEXT,
    receipt_prefix VARCHAR(10) DEFAULT 'REC',
    receipt_starting_number INTEGER DEFAULT 1000,
    authorized_signatory_name VARCHAR(100),
    authorized_signatory_designation VARCHAR(100),
    terms_and_conditions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Fee Structure Table
CREATE TABLE IF NOT EXISTS fee_structure (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    branch_id INTEGER REFERENCES branches(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    fee_type_id INTEGER REFERENCES fee_types(id),
    amount DECIMAL(10, 2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, branch_id, academic_year_id, fee_type_id)
);

-- =====================================================
-- Insert Your Admin User
-- =====================================================

INSERT INTO users (id, username, password_hash, full_name, role, email, is_active) 
VALUES (
    'cbebf6d8-060a-4055-94f0-471cf62ccc5c',
    'admin',
    'admin123', -- Plain text for now - you can hash it later
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

-- =====================================================
-- Insert Sample Data
-- =====================================================

-- Academic Years
INSERT INTO academic_years (year_name, start_date, end_date, is_active) VALUES
('2024-25', '2024-06-01', '2025-05-31', false),
('2025-26', '2025-06-01', '2026-05-31', true),
('2026-27', '2026-06-01', '2027-05-31', false)
ON CONFLICT (year_name) DO NOTHING;

-- Courses
INSERT INTO courses (course_code, course_name, duration_years) VALUES
('BTECH', 'B.Tech', 4),
('MBA', 'MBA', 2),
('MTECH', 'M.Tech', 2)
ON CONFLICT (course_code) DO NOTHING;

-- Branches
INSERT INTO branches (branch_code, branch_name, course_id) VALUES
('CSE', 'Computer Science Engineering', (SELECT id FROM courses WHERE course_code = 'BTECH')),
('ECE', 'Electronics & Communication Engineering', (SELECT id FROM courses WHERE course_code = 'BTECH')),
('EEE', 'Electrical & Electronics Engineering', (SELECT id FROM courses WHERE course_code = 'BTECH')),
('MECH', 'Mechanical Engineering', (SELECT id FROM courses WHERE course_code = 'BTECH')),
('CIVIL', 'Civil Engineering', (SELECT id FROM courses WHERE course_code = 'BTECH')),
('IT', 'Information Technology', (SELECT id FROM courses WHERE course_code = 'BTECH'))
ON CONFLICT (branch_code) DO NOTHING;

-- Fee Types
INSERT INTO fee_types (fee_code, fee_name, description) VALUES
('TUITION', 'Tuition Fee', 'Academic tuition fee'),
('HOSTEL', 'Hostel Fee', 'Hostel accommodation charges'),
('LIBRARY', 'Library Fee', 'Library facility charges'),
('EXAM', 'Examination Fee', 'Semester examination fee'),
('LAB', 'Laboratory Fee', 'Lab equipment and materials'),
('TRANSPORT', 'Transport Fee', 'Bus transportation charges')
ON CONFLICT (fee_code) DO NOTHING;

-- Receipt Configuration
INSERT INTO receipt_config (
    college_name, 
    college_address, 
    college_phone, 
    college_email, 
    receipt_prefix,
    authorized_signatory_name,
    authorized_signatory_designation
) VALUES (
    'Kakatiya Institute of Technology & Science for Women',
    'Nizamabad - Hyderabad Road, Warangal, Telangana 506015',
    '+91-870-2974750',
    'principal@kitsw.ac.in',
    'KITSW',
    'Chief Accounts Officer',
    'Accounts Department'
);

-- Sample Students
INSERT INTO students (roll_number, student_name, course_id, branch_id, academic_year_id, total_fee_amount, email, phone) VALUES
('CSE001', 'Rahul Kumar', 
    (SELECT id FROM courses WHERE course_code = 'BTECH'), 
    (SELECT id FROM branches WHERE branch_code = 'CSE'), 
    (SELECT id FROM academic_years WHERE year_name = '2025-26'), 
    80000, 'rahul@example.com', '9876543210'),
('ECE002', 'Priya Sharma', 
    (SELECT id FROM courses WHERE course_code = 'BTECH'), 
    (SELECT id FROM branches WHERE branch_code = 'ECE'), 
    (SELECT id FROM academic_years WHERE year_name = '2024-25'), 
    75000, 'priya@example.com', '9876543211'),
('EEE003', 'Anjali Reddy', 
    (SELECT id FROM courses WHERE course_code = 'BTECH'), 
    (SELECT id FROM branches WHERE branch_code = 'EEE'), 
    (SELECT id FROM academic_years WHERE year_name = '2025-26'), 
    78000, 'anjali@example.com', '9876543212')
ON CONFLICT (roll_number) DO NOTHING;

-- =====================================================
-- Create View for Due Fees
-- =====================================================

CREATE OR REPLACE VIEW due_fees_view AS
SELECT 
    s.id AS student_id,
    s.roll_number,
    s.student_name,
    c.course_name,
    b.branch_name,
    ay.year_name,
    s.total_fee_amount,
    COALESCE(SUM(t.amount), 0) AS amount_paid,
    (s.total_fee_amount - COALESCE(SUM(t.amount), 0)) AS due_amount
FROM students s
LEFT JOIN courses c ON s.course_id = c.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
LEFT JOIN transactions t ON s.id = t.student_id
WHERE s.is_active = true
GROUP BY s.id, s.roll_number, s.student_name, c.course_name, b.branch_name, ay.year_name, s.total_fee_amount
HAVING (s.total_fee_amount - COALESCE(SUM(t.amount), 0)) > 0;

-- =====================================================
-- Create Function for Receipt Number Generation
-- =====================================================

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
    config_rec RECORD;
    last_receipt VARCHAR;
    next_number INTEGER;
    new_receipt_number VARCHAR;
BEGIN
    SELECT * INTO config_rec FROM receipt_config LIMIT 1;
    
    SELECT receipt_number INTO last_receipt 
    FROM receipts 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF last_receipt IS NULL THEN
        next_number := config_rec.receipt_starting_number;
    ELSE
        next_number := CAST(SUBSTRING(last_receipt FROM '[0-9]+$') AS INTEGER) + 1;
    END IF;
    
    new_receipt_number := config_rec.receipt_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN new_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(student_name);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- =====================================================
-- Verify Setup
-- =====================================================

SELECT 
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM students) as students_count,
    (SELECT COUNT(*) FROM courses) as courses_count,
    (SELECT COUNT(*) FROM branches) as branches_count,
    (SELECT COUNT(*) FROM fee_types) as fee_types_count;

-- Your admin user
SELECT id, username, full_name, role, email FROM users WHERE id = 'cbebf6d8-060a-4055-94f0-471cf62ccc5c';
