import { HelpCircle, Book, Phone, Mail, Globe } from "lucide-react";

export default function Help() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Help & Support</h1>
        <p>User guide and system documentation</p>
      </div>

      {/* Quick Start Guide */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Book size={24} color="#ea580c" />
          <h2 style={{ margin: 0 }}>Quick Start Guide</h2>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ color: '#92400e', marginBottom: '10px' }}>1. Dashboard</h3>
            <p style={{ color: '#78350f', margin: 0 }}>
              View daily collection statistics, recent transactions, and quick navigation links. The dashboard provides an overview of total collections, payment modes, and pending fee counts.
            </p>
          </div>

          <div style={{ padding: '20px', background: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>2. Fee Collection</h3>
            <p style={{ color: '#1e3a8a', margin: 0 }}>
              <strong>Steps:</strong><br />
              • Enter student roll number and search<br />
              • Add fee items (Tuition, Hostel, Library, etc.)<br />
              • Enter payment amount and select payment mode<br />
              • For UPI, enter transaction reference<br />
              • Select collector and generate receipt
            </p>
          </div>

          <div style={{ padding: '20px', background: '#d1fae5', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ color: '#065f46', marginBottom: '10px' }}>3. Student Management</h3>
            <p style={{ color: '#064e3b', margin: 0 }}>
              Search students by name, roll number, or filter by branch and academic year. View student profiles showing complete fee history, total paid, and remaining dues.
            </p>
          </div>

          <div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
            <h3 style={{ color: '#991b1b', marginBottom: '10px' }}>4. Receipts & Transactions</h3>
            <p style={{ color: '#7f1d1d', margin: 0 }}>
              View all generated receipts, search by receipt number or student details. Print or download receipts as needed. Transaction history provides detailed payment tracking.
            </p>
          </div>

          <div style={{ padding: '20px', background: '#fce7f3', borderRadius: '8px', borderLeft: '4px solid #ec4899' }}>
            <h3 style={{ color: '#9f1239', marginBottom: '10px' }}>5. Due Fees</h3>
            <p style={{ color: '#831843', margin: 0 }}>
              Track students with pending fees. Filter by branch, year, section, fee type, and date range. View detailed pending amounts and payment status for each student.
            </p>
          </div>

          <div style={{ padding: '20px', background: '#e0e7ff', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
            <h3 style={{ color: '#3730a3', marginBottom: '10px' }}>6. Reports</h3>
            <p style={{ color: '#312e81', margin: 0 }}>
              Generate various reports: Branch-wise, Date-wise, Payment Type, Student-wise, and Due Fees reports. Export reports to CSV for further analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modes */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px', color: '#ea580c' }}>Payment Modes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Cash</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Physical currency payment</p>
          </div>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>UPI</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Unified Payment Interface (requires transaction ID)</p>
          </div>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Bank Transfer</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Direct bank to bank transfer</p>
          </div>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Card</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Credit/Debit card payment</p>
          </div>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Cheque</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Bank cheque (requires cheque number)</p>
          </div>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>DD</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Demand Draft</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#ea580c' }}>Contact Support</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#dbeafe', borderRadius: '10px' }}>
              <Phone size={24} color="#1e40af" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Phone</h4>
              <p style={{ margin: 0, color: '#666' }}>+91-870-2974750</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#d1fae5', borderRadius: '10px' }}>
              <Mail size={24} color="#065f46" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Email</h4>
              <p style={{ margin: 0, color: '#666' }}>accounts@kitsw.ac.in</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '10px' }}>
              <Globe size={24} color="#92400e" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Website</h4>
              <p style={{ margin: 0, color: '#666' }}>www.kitsw.ac.in</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <HelpCircle size={24} color="#ea580c" />
          <h2 style={{ margin: 0 }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>How do I collect fees for a student?</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Go to Fee Collection → Enter roll number → Add fee items → Enter payment details → Generate Receipt
            </p>
          </div>

          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>How do I reprint a receipt?</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Go to Receipts → Search for the receipt → Click View → Click Print Receipt
            </p>
          </div>

          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>How do I view pending fees?</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Go to Due Fees → Apply filters (branch, year, section) → View student list with pending amounts
            </p>
          </div>

          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>How do I generate reports?</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Go to Reports → Select report type → Choose date range → Click Generate Report → Export to CSV
            </p>
          </div>

          <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>What if I can't find a student?</h4>
            <p style={{ margin: 0, color: '#666' }}>
              Check if the roll number is correct. Contact admin to add new students to the system.
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '10px' }}>KITSW Fees Management System</h3>
        <p style={{ margin: '5px 0', opacity: 0.9 }}>Version: 1.0.0</p>
        <p style={{ margin: '5px 0', opacity: 0.9 }}>© 2026 Kakatiya Institute of Technology & Science for Women</p>
        <p style={{ margin: '5px 0', opacity: 0.9 }}>All Rights Reserved</p>
      </div>
    </div>
  );
}