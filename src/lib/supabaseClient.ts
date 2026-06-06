import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  role: 'Admin' | 'accounts_manager' | 'User1' | 'User2';
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: number;
  roll_number: string;
  student_name: string;
  course_id: number;
  branch_id: number;
  academic_year_id: number;
  email?: string;
  phone?: string;
  parent_phone?: string;
  address?: string;
  admission_date?: string;
  total_fee_amount: number;
  is_active: boolean;
  created_at: string;
  // Joined fields
  courses?: { course_name: string };
  branches?: { branch_name: string };
  academic_years?: { year_name: string };
}

export interface Receipt {
  id: number;
  receipt_number: string;
  student_id: number;
  receipt_date: string;
  total_amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque' | 'DD';
  transaction_reference?: string;
  remarks?: string;
  collected_by: string;
  created_at: string;
  // Joined fields
  students?: Student;
  users?: { full_name: string };
}

export interface Transaction {
  id: number;
  receipt_id: number;
  student_id: number;
  fee_type_id: number;
  amount: number;
  academic_year_id: number;
  transaction_date: string;
  created_at: string;
  // Joined fields
  fee_types?: { fee_name: string };
  students?: Student;
  receipts?: Receipt;
}

export interface FeeType {
  id: number;
  fee_code: string;
  fee_name: string;
  description?: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  duration_years: number;
  is_active: boolean;
}

export interface Branch {
  id: number;
  branch_code: string;
  branch_name: string;
  course_id: number;
  is_active: boolean;
  courses?: { course_name: string };
}

export interface AcademicYear {
  id: number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ReceiptConfig {
  id: number;
  college_name: string;
  college_address?: string;
  college_phone?: string;
  college_email?: string;
  college_logo_url?: string;
  receipt_prefix: string;
  receipt_starting_number: number;
  authorized_signatory_name?: string;
  authorized_signatory_designation?: string;
  terms_and_conditions?: string;
}

export interface DueFees {
  student_id: number;
  roll_number: string;
  student_name: string;
  course_name: string;
  branch_name: string;
  year_name: string;
  total_fee_amount: number;
  amount_paid: number;
  due_amount: number;
}
