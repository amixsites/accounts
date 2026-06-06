import { useState, useEffect, useRef } from "react";
import "../styles/transactions.css";
import { 
  Search, 
  X, 
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TransactionData {
  receiptNumber: number;
  date: string;
  rollNumber: string;
  studentName: string;
  yearOfStudying: string;
  towards: string;
  amountReceived: number;
  amountReceivedWords: string;
  modeOfPayment: string;
  upiNumber?: string;
  upiDate?: string;
  paymentStatus: string;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  pendingReason?: string;
}

interface StudentItem {
  name: string;
  rollNumber: string;
  yearOfStudying: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LOOKUP_STUDENTS: StudentItem[] = [
  { name: "Rahul Kumar", rollNumber: "CSE001", yearOfStudying: "3rd Year" },
  { name: "Priya Sharma", rollNumber: "ECE002", yearOfStudying: "2nd Year" },
  { name: "Amit Patel", rollNumber: "EEE003", yearOfStudying: "1st Year" },
  { name: "Sneha Reddy", rollNumber: "IT004", yearOfStudying: "4th Year" },
  { name: "Vikram Malhotra", rollNumber: "ME005", yearOfStudying: "3rd Year" },
  { name: "Ananya Sen", rollNumber: "CE006", yearOfStudying: "2nd Year" },
];

const DEFAULT_TRANSACTIONS: TransactionData[] = [
  {
    receiptNumber: 1,
    date: "2026-05-15",
    rollNumber: "CSE001",
    studentName: "Rahul Kumar",
    yearOfStudying: "3rd Year",
    towards: "Tuition Fee",
    amountReceived: 45000,
    amountReceivedWords: "Forty Five Thousand Rupees Only",
    modeOfPayment: "UPI",
    upiNumber: "987654321012",
    upiDate: "2026-05-15",
    paymentStatus: "Paid"
  },
  {
    receiptNumber: 2,
    date: "2026-06-01",
    rollNumber: "CSE001",
    studentName: "Rahul Kumar",
    yearOfStudying: "3rd Year",
    towards: "Hostel Fee",
    amountReceived: 25000,
    amountReceivedWords: "Twenty Five Thousand Rupees Only",
    modeOfPayment: "Cash",
    paymentStatus: "Partial Payment",
    totalAmount: 30000,
    paidAmount: 25000,
    pendingAmount: 5000
  },
  {
    receiptNumber: 3,
    date: "2026-05-20",
    rollNumber: "ECE002",
    studentName: "Priya Sharma",
    yearOfStudying: "2nd Year",
    towards: "Exam Fee",
    amountReceived: 1200,
    amountReceivedWords: "One Thousand Two Hundred Rupees Only",
    modeOfPayment: "Debit Card",
    paymentStatus: "Paid"
  },
  {
    receiptNumber: 4,
    date: "2026-06-02",
    rollNumber: "ECE002",
    studentName: "Priya Sharma",
    yearOfStudying: "2nd Year",
    towards: "Library Fee",
    amountReceived: 0,
    amountReceivedWords: "Zero Rupees Only",
    modeOfPayment: "Cash",
    paymentStatus: "Pending",
    totalAmount: 500,
    pendingAmount: 500,
    pendingReason: "Waiting for clearance of books"
  },
  {
    receiptNumber: 5,
    date: "2026-04-10",
    rollNumber: "IT004",
    studentName: "Sneha Reddy",
    yearOfStudying: "4th Year",
    towards: "Tuition Fee",
    amountReceived: 60000,
    amountReceivedWords: "Sixty Thousand Rupees Only",
    modeOfPayment: "Net Banking",
    paymentStatus: "Paid"
  }
];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [allTransactions, setAllTransactions] = useState<TransactionData[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Load transactions and pre-populate DEFAULT_TRANSACTIONS if empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem("receipts_list");
      if (stored) {
        setAllTransactions(JSON.parse(stored));
      } else {
        localStorage.setItem("receipts_list", JSON.stringify(DEFAULT_TRANSACTIONS));
        setAllTransactions(DEFAULT_TRANSACTIONS);
      }
    } catch (e) {
      console.error("Failed to load receipts list", e);
      setAllTransactions(DEFAULT_TRANSACTIONS);
    }
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter students based on search query
  const filteredStudents = LOOKUP_STUDENTS.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Filter transactions for the currently selected student (sorted newest first)
  const studentTransactions = allTransactions
    .filter((tx) => tx.rollNumber.toLowerCase() === selectedStudent?.rollNumber.toLowerCase())
    .sort((a, b) => b.receiptNumber - a.receiptNumber);

  const handleSelectStudent = (student: StudentItem) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowSuggestions(false);
  };

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div className="transactions-header">
        <h2>Transactions History</h2>
        <p>Search and audit student receipts, UPI payments, and due records</p>
      </div>

      {/* SEARCH SECTION */}
      <div className="search-section" ref={searchRef}>
        <label className="search-label" htmlFor="student-search">Search Student</label>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-prefix" />
          <input
            id="student-search"
            type="text"
            className="search-input"
            placeholder="Type Student Name or Roll Number (e.g. Rahul, CSE001)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
        </div>

        {/* Live suggestions overlay */}
        {showSuggestions && searchQuery.trim() !== "" && (
          <ul className="suggestions-list">
            {filteredStudents.length === 0 ? (
              <li className="suggestion-item-empty">No student found.</li>
            ) : (
              filteredStudents.map((student, i) => (
                <li
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="suggestion-info">
                    <span className="suggestion-name">{student.name}</span>
                    <span className="suggestion-roll">{student.rollNumber}</span>
                  </div>
                  <span className="suggestion-year">{student.yearOfStudying}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* SELECTED STUDENT PROFILE */}
      {selectedStudent && (
        <div className="profile-card">
          <div className="profile-avatar">
            {selectedStudent.name.charAt(0)}
          </div>
          <div className="profile-details">
            <h3 className="profile-name">{selectedStudent.name}</h3>
            <div className="profile-meta">
              <span><strong>Roll Number:</strong>&nbsp;{selectedStudent.rollNumber}</span>
              <span>·</span>
              <span><strong>Year:</strong>&nbsp;{selectedStudent.yearOfStudying}</span>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS TABLE LIST */}
      {selectedStudent && (
        <div className="transactions-list-section">
          <h4 className="section-title">Transactions Records</h4>
          {studentTransactions.length === 0 ? (
            <div className="transactions-empty-state">
              <Info size={24} color="var(--tx-text-muted)" />
              <span>No transactions found for this student.</span>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Towards</th>
                    <th>Amount Received</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentTransactions.map((tx, idx) => (
                    <tr key={idx} onClick={() => setSelectedTransaction(tx)}>
                      <td>#{tx.receiptNumber}</td>
                      <td>{tx.date}</td>
                      <td>{tx.towards}</td>
                      <td>₹{tx.amountReceived.toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`badge ${
                          tx.paymentStatus === "Paid" ? "badge-paid" :
                          tx.paymentStatus === "Pending" ? "badge-pending" : "badge-partial"
                        }`}>
                          {tx.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION DETAILS MODAL POPUP */}
      {selectedTransaction && (
        <div className="detail-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3 className="detail-modal-title">Receipt Voucher Details</h3>
              <button className="detail-close-btn" onClick={() => setSelectedTransaction(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="detail-modal-body">
              {/* Part 1: Receipt Information */}
              <div>
                <div className="detail-section-title">Receipt Information</div>
                <div className="detail-grid">
                  <div className="detail-cell">
                    <span className="detail-label">Receipt Number</span>
                    <span className="detail-value detail-value-bold">#{selectedTransaction.receiptNumber}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{selectedTransaction.date}</span>
                  </div>
                </div>
              </div>

              {/* Part 2: Student Information */}
              <div>
                <div className="detail-section-title">Student Information</div>
                <div className="detail-grid">
                  <div className="detail-cell">
                    <span className="detail-label">Student Name</span>
                    <span className="detail-value">{selectedTransaction.studentName}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="detail-label">Roll Number</span>
                    <span className="detail-value">{selectedTransaction.rollNumber}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="detail-label">Year of Studying</span>
                    <span className="detail-value">{selectedTransaction.yearOfStudying}</span>
                  </div>
                </div>
              </div>

              {/* Part 3: Payment Information */}
              <div>
                <div className="detail-section-title">Payment Information</div>
                <div className="detail-grid">
                  <div className="detail-cell">
                    <span className="detail-label">Amount Received (Numbers)</span>
                    <span className="detail-value detail-value-bold">₹{selectedTransaction.amountReceived.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="detail-label">Mode of Payment</span>
                    <span className="detail-value">{selectedTransaction.modeOfPayment}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="detail-label">Payment Status</span>
                    <span className="detail-value">
                      <span className={`badge ${
                        selectedTransaction.paymentStatus === "Paid" ? "badge-paid" :
                        selectedTransaction.paymentStatus === "Pending" ? "badge-pending" : "badge-partial"
                      }`}>
                        {selectedTransaction.paymentStatus}
                      </span>
                    </span>
                  </div>
                  <div className="detail-cell detail-cell-full">
                    <span className="detail-label">Amount Received (Words)</span>
                    <span className="detail-value" style={{ fontStyle: "italic" }}>{selectedTransaction.amountReceivedWords}</span>
                  </div>
                </div>

                {/* Conditional Block: UPI Payment */}
                {selectedTransaction.modeOfPayment === "UPI" && (
                  <div className="conditional-detail-card conditional-detail-card-partial" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#c2410c", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                      <CheckCircle2 size={14} />
                      <span>UPI Reference Info</span>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-cell">
                        <span className="detail-label">UPI Reference Number</span>
                        <span className="detail-value">{selectedTransaction.upiNumber || "N/A"}</span>
                      </div>
                      <div className="detail-cell">
                        <span className="detail-label">UPI Date</span>
                        <span className="detail-value">{selectedTransaction.upiDate || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Block: Partial Payment */}
                {selectedTransaction.paymentStatus === "Partial Payment" && (
                  <div className="conditional-detail-card conditional-detail-card-partial" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#c2410c", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                      <Info size={14} />
                      <span>Partial Dues breakdown</span>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-cell">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value">₹{(selectedTransaction.totalAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="detail-cell">
                        <span className="detail-label">Paid Amount</span>
                        <span className="detail-value" style={{ color: "#15803d", fontWeight: "bold" }}>₹{(selectedTransaction.paidAmount || selectedTransaction.amountReceived || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="detail-cell">
                        <span className="detail-label">Pending Amount</span>
                        <span className="detail-value" style={{ color: "#b91c1c", fontWeight: "bold" }}>₹{(selectedTransaction.pendingAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Block: Pending Payment */}
                {selectedTransaction.paymentStatus === "Pending" && (
                  <div className="conditional-detail-card conditional-detail-card-pending" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#b91c1c", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                      <AlertCircle size={14} />
                      <span>Pending registration Details</span>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-cell">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value">₹{(selectedTransaction.totalAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="detail-cell">
                        <span className="detail-label">Pending Amount</span>
                        <span className="detail-value" style={{ color: "#b91c1c", fontWeight: "bold" }}>₹{(selectedTransaction.pendingAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      {selectedTransaction.pendingReason && (
                        <div className="detail-cell detail-cell-full">
                          <span className="detail-label">Pending Reason</span>
                          <span className="detail-value">{selectedTransaction.pendingReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Part 4: Fee Information & Breakdown Table */}
              <div>
                <div className="detail-section-title">Fee Information</div>
                <div className="detail-grid" style={{ marginBottom: "12px" }}>
                  <div className="detail-cell detail-cell-full">
                    <span className="detail-label">Towards</span>
                    <span className="detail-value">{selectedTransaction.towards}</span>
                  </div>
                </div>

                {/* Fee Breakdown Table */}
                <div className="detail-table-wrapper">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Fee Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{selectedTransaction.towards}</td>
                        <td>
                          ₹{
                            (selectedTransaction.paymentStatus === "Pending"
                              ? selectedTransaction.totalAmount || 0
                              : selectedTransaction.amountReceived
                            ).toLocaleString("en-IN")
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}