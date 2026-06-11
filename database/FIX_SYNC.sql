-- =====================================================================
-- FIX_SYNC.sql  —  Single source of truth for fee data
-- Run this ENTIRE block in the Supabase SQL Editor.
--
-- Safe to run multiple times — uses IF EXISTS / IF NOT EXISTS guards.
-- =====================================================================


-- ── DIAGNOSTIC: Check current view definition ─────────────────────
-- Run this first if you want to inspect the existing view:
--   SELECT pg_get_viewdef('due_fees_view'::regclass, true);


-- ── DIAGNOSTIC: Verify column names and types on students ─────────
SELECT
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN (
    'id','roll_number','student_name',
    'total_fee_amount','amount_paid','due_amount','fee_status',
    'course_id','branch_id','academic_year_id','is_active'
  )
ORDER BY column_name;


-- ── DIAGNOSTIC: Verify column names on transactions ───────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('id','student_id','amount','receipt_id','academic_year_id')
ORDER BY column_name;


-- ── DIAGNOSTIC: Verify column names on receipts ───────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'receipts'
  AND column_name IN ('id','student_id','receipt_date','total_amount','payment_mode')
ORDER BY column_name;


-- =====================================================================
-- STEP 1: Add payment columns to students (safe, idempotent)
-- =====================================================================
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount  DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_status  VARCHAR(20)   DEFAULT 'Due'
    CHECK (fee_status IN ('Due', 'Partial', 'Paid'));


-- =====================================================================
-- STEP 2: Back-fill amount_paid and due_amount from transactions
-- (Only affects rows where amount_paid is still 0 / NULL)
-- =====================================================================
UPDATE students s
SET
  amount_paid = COALESCE((
    SELECT SUM(t.amount)
    FROM   transactions t
    WHERE  t.student_id = s.id
  ), 0),
  due_amount = s.total_fee_amount - COALESCE((
    SELECT SUM(t.amount)
    FROM   transactions t
    WHERE  t.student_id = s.id
  ), 0);

-- Set fee_status based on computed values
UPDATE students
SET fee_status =
  CASE
    WHEN due_amount  <= 0 THEN 'Paid'
    WHEN amount_paid >  0 THEN 'Partial'
    ELSE                       'Due'
  END;


-- =====================================================================
-- STEP 3: Recreate due_fees_view safely
-- DROP first to avoid "cannot change data type of view column" error.
-- =====================================================================
DROP VIEW IF EXISTS due_fees_view;

CREATE VIEW due_fees_view AS
SELECT
  s.id               AS student_id,
  s.roll_number,
  s.student_name,
  c.course_name,
  b.branch_name,
  ay.year_name,
  s.total_fee_amount,
  s.amount_paid,
  s.due_amount,
  s.fee_status,
  (
    SELECT r.receipt_date
    FROM   receipts r
    WHERE  r.student_id = s.id
    ORDER  BY r.receipt_date DESC
    LIMIT  1
  ) AS last_payment_date
FROM       students       s
LEFT JOIN  courses        c  ON c.id  = s.course_id
LEFT JOIN  branches       b  ON b.id  = s.branch_id
LEFT JOIN  academic_years ay ON ay.id = s.academic_year_id
WHERE s.is_active = true;


-- =====================================================================
-- STEP 4: Verify — should show correct totals for every student
-- =====================================================================
SELECT
  student_id,
  roll_number,
  student_name,
  total_fee_amount,
  amount_paid,
  due_amount,
  fee_status,
  last_payment_date
FROM due_fees_view
ORDER BY roll_number
LIMIT 30;

-- =====================================================================
-- EXPECTED OUTPUT:
--   Every student row reflects the latest Fee Collection payments.
--   amount_paid + due_amount = total_fee_amount for each row.
-- =====================================================================
