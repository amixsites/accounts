-- =====================================================
-- ADD PARTIAL PAYMENT COLUMNS TO STUDENTS TABLE
-- Run this in Supabase SQL Editor before using the
-- partial payment feature in Fee Collection.
-- =====================================================

-- Step 1: Add amount_paid, due_amount, fee_status columns to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS amount_paid   DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount    DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_status    VARCHAR(20)   DEFAULT 'Due'
    CHECK (fee_status IN ('Due', 'Partial', 'Paid'));

-- Step 2: Back-fill existing rows from transactions
UPDATE students s
SET
  amount_paid = COALESCE((
    SELECT SUM(t.amount)
    FROM transactions t
    WHERE t.student_id = s.id
  ), 0),
  due_amount = s.total_fee_amount - COALESCE((
    SELECT SUM(t.amount)
    FROM transactions t
    WHERE t.student_id = s.id
  ), 0);

-- Step 3: Back-fill fee_status based on amounts
UPDATE students
SET fee_status =
  CASE
    WHEN due_amount <= 0           THEN 'Paid'
    WHEN amount_paid > 0           THEN 'Partial'
    ELSE                                'Due'
  END;

-- Step 4: Verify
SELECT
  id, roll_number, student_name,
  total_fee_amount, amount_paid, due_amount, fee_status
FROM students
ORDER BY roll_number
LIMIT 20;

-- =====================================================
-- EXPECTED OUTPUT:
--   Each student row now shows amount_paid, due_amount,
--   and fee_status (Due / Partial / Paid).
-- =====================================================
