import { useState, useEffect, useRef } from "react";
import "../styles/dueFees.css";
import { 
  Search, 
  X, 
  Info,
  AlertCircle,
  CheckCircle2
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
  branch: string;
  section: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LOOKUP_STUDENTS: StudentItem[] = [
  { name: "Rahul Kumar", rollNumber: "CSE001", yearOfStudying: "3rd Year", branch: "CSE", section: "A Section" },
  { name: "Priya Sharma", rollNumber: "ECE002", yearOfStudying: "2nd Year", branch: "ECE", section: "B Section" },
  { name: "Amit Patel", rollNumber: "EEE003", yearOfStudying: "1st Year", branch: "EEE", section: "A Section" },
  { name: "Sneha Reddy", rollNumber: "IT004", yearOfStudying: "4th Year", branch: "IT", section: "A Section" },
  { name: "Vikram Malhotra", rollNumber: "ME005", yearOfStudying: "3rd Year", branch: "Mechanical", section: "C Section" },
  { name: "Ananya Sen", rollNumber: "CE006", yearOfStudying: "2nd Year", branch: "Civil", section: "B Section" },
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

const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DueFees() {
  // ─── Filter States ──────────────────────────────────────────────────────────
  const [filterBranch, setFilterBranch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterFeeType, setFilterFeeType] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [pendingMin, setPendingMin] = useState("");
  const [pendingMax, setPendingMax] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYearDate, setFilterYearDate] = useState("");

  // ─── Search States ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ─── Selection States ───────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [allTransactions, setAllTransactions] = useState<TransactionData[]>([]);

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

  // Close search suggestions on click outside
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

  // Helper to map roll numbers to student profile info
  const getStudentProfile = (roll: string): StudentItem => {
    const found = LOOKUP_STUDENTS.find(s => s.rollNumber.toLowerCase() === roll.toLowerCase());
    if (found) return found;
    // Safe default if entered manually
    return {
      name: "Unknown Student",
      rollNumber: roll,
      yearOfStudying: "1st Year",
      branch: "CSE",
      section: "A Section"
    };
  };

  // Check if there are any pending dues in the system at all
  const hasAnyDuesInSystem = allTransactions.some(
    (tx) => tx.paymentStatus === "Pending" || tx.paymentStatus === "Partial Payment"
  );

  // ─── Cooperative Filter Logic ───────────────────────────────────────────────
  // Filter individual outstanding transactions
  const filteredDueTransactions = allTransactions.filter((tx) => {
    // 1. Only outstanding dues
    if (tx.paymentStatus !== "Pending" && tx.paymentStatus !== "Partial Payment") {
      return false;
    }

    const profile = getStudentProfile(tx.rollNumber);

    // 2. Branch Filter
    if (filterBranch && profile.branch !== filterBranch) {
      return false;
    }

    // 3. Year of Studying Filter
    if (filterYear && profile.yearOfStudying !== filterYear) {
      return false;
    }

    // 4. Section Filter
    if (filterSection && profile.section !== filterSection) {
      return false;
    }

    // 5. Fee Type Filter
    if (filterFeeType && tx.towards.toLowerCase() !== filterFeeType.toLowerCase()) {
      return false;
    }

    // 6. Due Status Filter (Pending or Partial Payment)
    if (filterStatus !== "All" && tx.paymentStatus !== filterStatus) {
      return false;
    }

    // 7. Pending Amount Range Filter
    const pendingVal = tx.pendingAmount || 0;
    if (pendingMin !== "") {
      const minVal = parseFloat(pendingMin);
      if (!isNaN(minVal) && pendingVal < minVal) {
        return false;
      }
    }
    if (pendingMax !== "") {
      const maxVal = parseFloat(pendingMax);
      if (!isNaN(maxVal) && pendingVal > maxVal) {
        return false;
      }
    }

    // 8. Date Filter: Month and Year
    if (tx.date) {
      const txDate = new Date(tx.date);
      if (filterMonth) {
        const selectedMonthIndex = MONTHS_LIST.indexOf(filterMonth);
        if (txDate.getMonth() !== selectedMonthIndex) {
          return false;
        }
      }
      if (filterYearDate) {
        if (txDate.getFullYear().toString() !== filterYearDate) {
          return false;
        }
      }
    }

    return true;
  });

  // Group filtered due transactions by student and compute totals
  interface StudentDueGroup {
    student: StudentItem;
    totalPending: number;
    transactions: TransactionData[];
  }

  const studentDueGroupsMap: Record<string, StudentDueGroup> = {};

  filteredDueTransactions.forEach((tx) => {
    const key = tx.rollNumber.toLowerCase();
    if (!studentDueGroupsMap[key]) {
      const profile = getStudentProfile(tx.rollNumber);
      studentDueGroupsMap[key] = {
        student: profile,
        totalPending: 0,
        transactions: []
      };
    }
    studentDueGroupsMap[key].totalPending += tx.pendingAmount || 0;
    studentDueGroupsMap[key].transactions.push(tx);
  });

  // Convert map to array and apply sub-search bar query filter (Roll or Name)
  const studentDueResults = Object.values(studentDueGroupsMap).filter((group) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      group.student.name.toLowerCase().includes(query) ||
      group.student.rollNumber.toLowerCase().includes(query)
    );
  });

  // Auto-complete suggestion filter (matching only students with matching dues under filters)
  const autocompleteSuggestions = LOOKUP_STUDENTS.filter((s) => {
    const key = s.rollNumber.toLowerCase();
    const hasDues = !!studentDueGroupsMap[key];
    const query = searchQuery.toLowerCase().trim();
    if (!hasDues || !query) return false;
    return (
      s.name.toLowerCase().includes(query) ||
      s.rollNumber.toLowerCase().includes(query)
    );
  });

  const handleSelectStudentSuggestion = (student: StudentItem) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowSuggestions(false);
  };

  const handleStudentCardClick = (student: StudentItem) => {
    setSelectedStudent(student);
  };

  // Get selected student's active due transactions matching the current filters
  const selectedStudentDues = selectedStudent
    ? (studentDueGroupsMap[selectedStudent.rollNumber.toLowerCase()]?.transactions || [])
    : [];

  return (
    <div className="due-page">
      {/* Page Header */}
      <div className="due-header">
        <h2>Due Fees List</h2>
        <p>Analyze outstanding student balances, pending fee categories, and partial collection dues</p>
      </div>

      {/* 1. FILTERS SECTION */}
      <div className="filters-panel">
        <div className="filters-panel-title">Filters Panel</div>
        
        <div className="filters-grid">
          {/* Branch Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-branch">Branch</label>
            <select
              id="filter-branch"
              className="filter-select"
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setSelectedStudent(null);
              }}
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="CSM">CSM</option>
              <option value="CSN">CSN</option>
              <option value="CSD">CSD</option>
              <option value="CSO">CSO</option>
              <option value="CSC">CSC</option>
              <option value="ECI">ECI</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Civil">Civil</option>
              <option value="Mechanical">Mechanical</option>
              <option value="IT">IT</option>
              <option value="MBA">MBA</option>
            </select>
          </div>

          {/* Year Of Studying Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-year">Year Of Studying</label>
            <select
              id="filter-year"
              className="filter-select"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setSelectedStudent(null);
              }}
            >
              <option value="">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-section">Section</label>
            <select
              id="filter-section"
              className="filter-select"
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value);
                setSelectedStudent(null);
              }}
            >
              <option value="">All Sections</option>
              <option value="A Section">A Section</option>
              <option value="B Section">B Section</option>
              <option value="C Section">C Section</option>
            </select>
          </div>

          {/* Fee Type Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-fee-type">Fee Type</label>
            <select
              id="filter-fee-type"
              className="filter-select"
              value={filterFeeType}
              onChange={(e) => {
                setFilterFeeType(e.target.value);
                setSelectedStudent(null);
              }}
            >
              <option value="">All Fee Types</option>
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Exam Fee">Exam Fee</option>
              <option value="Bus Fee">Bus Fee</option>
              <option value="Hostel Fee">Hostel Fee</option>
              <option value="Library Fee">Library Fee</option>
              <option value="Lab Fee">Lab Fee</option>
              <option value="Fine">Fine</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          {/* Due Status Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-status">Due Status</label>
            <select
              id="filter-status"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setSelectedStudent(null);
              }}
            >
              <option value="All">All Dues</option>
              <option value="Pending">Pending</option>
              <option value="Partial Payment">Partial Payment</option>
            </select>
          </div>

          {/* Pending Amount Filter */}
          <div className="filter-group span-2">
            <label className="filter-label">Pending Amount Range</label>
            <div className="range-inputs-wrapper">
              <input
                type="number"
                className="filter-input"
                placeholder="Min (₹)"
                value={pendingMin}
                onChange={(e) => {
                  setPendingMin(e.target.value);
                  setSelectedStudent(null);
                }}
              />
              <span className="range-input-divider">to</span>
              <input
                type="number"
                className="filter-input"
                placeholder="Max (₹)"
                value={pendingMax}
                onChange={(e) => {
                  setPendingMax(e.target.value);
                  setSelectedStudent(null);
                }}
              />
            </div>
          </div>

          {/* Date Filter: Month / Year */}
          <div className="filter-group">
            <label className="filter-label">Date Filter</label>
            <div className="range-inputs-wrapper">
              <select
                className="filter-select"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setSelectedStudent(null);
                }}
              >
                <option value="">Month</option>
                {MONTHS_LIST.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={filterYearDate}
                onChange={(e) => {
                  setFilterYearDate(e.target.value);
                  setSelectedStudent(null);
                }}
              >
                <option value="">Year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="search-bar-section" ref={searchRef}>
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-field"
            placeholder="Search student with dues by Name or Roll Number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
        </div>

        {/* Live suggestions list */}
        {showSuggestions && searchQuery.trim() !== "" && (
          <ul className="search-suggestions-overlay">
            {autocompleteSuggestions.length === 0 ? (
              <li className="search-suggestion-item" style={{ color: "var(--due-text-muted)" }}>
                No student found.
              </li>
            ) : (
              autocompleteSuggestions.map((student, idx) => (
                <li
                  key={idx}
                  className="search-suggestion-item"
                  onClick={() => handleSelectStudentSuggestion(student)}
                >
                  <div className="search-suggestion-info">
                    <span className="search-suggestion-name">{student.name}</span>
                    <span className="search-suggestion-roll">{student.rollNumber}</span>
                  </div>
                  <span className="search-suggestion-year">{student.yearOfStudying}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* EMPTY STATE: If no dues exist in the system at all */}
      {!hasAnyDuesInSystem ? (
        <div className="empty-state-card">
          <CheckCircle2 size={36} color="var(--due-primary)" />
          <span>No pending or partial fee records found.</span>
        </div>
      ) : (
        /* 3. TWO COLUMN MAIN LAYOUT */
        <div className="due-main-layout">
          
          {/* Left Column: Student List Results */}
          <div className="results-column">
            {studentDueResults.length === 0 ? (
              <div className="empty-state-card" style={{ padding: "30px 16px" }}>
                <span>No matching students found.</span>
              </div>
            ) : (
              studentDueResults.map((group) => (
                <div
                  key={group.student.rollNumber}
                  className={`student-due-card ${
                    selectedStudent?.rollNumber === group.student.rollNumber ? "active" : ""
                  }`}
                  onClick={() => handleStudentCardClick(group.student)}
                >
                  <h4 className="student-due-name">{group.student.name}</h4>
                  <span className="student-due-roll">{group.student.rollNumber}</span>
                  <div className="student-due-meta">
                    {group.student.branch} | {group.student.yearOfStudying} | {group.student.section}
                  </div>
                  <div className="student-due-status-wrapper">
                    <span className={`badge ${
                      group.transactions.some(t => t.paymentStatus === "Pending") 
                        ? "badge-pending" 
                        : "badge-partial"
                    }`}>
                      {group.transactions.some(t => t.paymentStatus === "Pending") 
                        ? "Pending" 
                        : "Partial Payment"}
                    </span>
                    <span className="student-due-amount">
                      ₹{group.totalPending.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Student Due Details */}
          <div className="details-column">
            {!selectedStudent ? (
              <div className="empty-state-card" style={{ border: "none", minHeight: "300px" }}>
                <Info size={24} />
                <span>Select a student from the list to view outstanding balance vouchers.</span>
              </div>
            ) : (
              <>
                <div className="details-column-header">
                  <h3>{selectedStudent.name}</h3>
                  <p>{selectedStudent.rollNumber} · {selectedStudent.branch} · {selectedStudent.yearOfStudying} · {selectedStudent.section}</p>
                </div>

                {selectedStudentDues.length === 0 ? (
                  <div className="empty-state-card" style={{ border: "none" }}>
                    <span>No transactions match the selected filters.</span>
                  </div>
                ) : (
                  <div className="due-table-wrapper">
                    <table className="due-details-table">
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>Fee Type</th>
                          <th>Towards</th>
                          <th>Total Amount</th>
                          <th>Paid Amount</th>
                          <th>Pending Amount</th>
                          <th>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudentDues.map((tx, idx) => (
                          <tr key={idx} onClick={() => setSelectedTransaction(tx)}>
                            <td>#{tx.receiptNumber}</td>
                            <td>{tx.date}</td>
                            <td>{tx.towards}</td>
                            <td>{tx.towards}</td>
                            <td>₹{(tx.totalAmount || tx.amountReceived).toLocaleString("en-IN")}</td>
                            <td>₹{(tx.paidAmount || tx.amountReceived).toLocaleString("en-IN")}</td>
                            <td style={{ color: "#dc2626", fontWeight: 700 }}>
                              ₹{(tx.pendingAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <span className={`badge ${
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
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. TRANSACTION DETAILS MODAL POPUP */}
      {selectedTransaction && (
        <div className="voucher-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <h3 className="voucher-modal-title">Receipt Voucher Dues Details</h3>
              <button className="voucher-close-btn" onClick={() => setSelectedTransaction(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="voucher-modal-body">
              {/* Part 1: Receipt Information */}
              <div>
                <div className="voucher-section-title">Receipt Information</div>
                <div className="voucher-grid">
                  <div className="voucher-cell">
                    <span className="voucher-label">Receipt Number</span>
                    <span className="voucher-value voucher-value-bold">#{selectedTransaction.receiptNumber}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Date</span>
                    <span className="voucher-value">{selectedTransaction.date}</span>
                  </div>
                </div>
              </div>

              {/* Part 2: Student Information */}
              <div>
                <div className="voucher-section-title">Student Information</div>
                <div className="voucher-grid">
                  <div className="voucher-cell">
                    <span className="voucher-label">Student Name</span>
                    <span className="voucher-value">{selectedTransaction.studentName}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Roll Number</span>
                    <span className="voucher-value">{selectedTransaction.rollNumber}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Year of Studying</span>
                    <span className="voucher-value">{selectedTransaction.yearOfStudying}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Branch</span>
                    <span className="voucher-value">{getStudentProfile(selectedTransaction.rollNumber).branch}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Section</span>
                    <span className="voucher-value">{getStudentProfile(selectedTransaction.rollNumber).section}</span>
                  </div>
                </div>
              </div>

              {/* Part 3: Payment Information */}
              <div>
                <div className="voucher-section-title">Payment Information</div>
                <div className="voucher-grid">
                  <div className="voucher-cell">
                    <span className="voucher-label">Amount Received (Numbers)</span>
                    <span className="voucher-value voucher-value-bold">₹{selectedTransaction.amountReceived.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Mode of Payment</span>
                    <span className="voucher-value">{selectedTransaction.modeOfPayment}</span>
                  </div>
                  <div className="voucher-cell">
                    <span className="voucher-label">Payment Status</span>
                    <span className="voucher-value">
                      <span className={`badge ${
                        selectedTransaction.paymentStatus === "Pending" ? "badge-pending" : "badge-partial"
                      }`}>
                        {selectedTransaction.paymentStatus}
                      </span>
                    </span>
                  </div>
                  <div className="voucher-cell voucher-cell-full">
                    <span className="voucher-label">Amount Received (Words)</span>
                    <span className="voucher-value" style={{ fontStyle: "italic" }}>{selectedTransaction.amountReceivedWords}</span>
                  </div>
                </div>

                {/* Conditional Block: UPI Payment */}
                {selectedTransaction.modeOfPayment === "UPI" && (
                  <div className="conditional-card conditional-card-partial" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#c2410c", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                      <CheckCircle2 size={14} />
                      <span>UPI Reference Info</span>
                    </div>
                    <div className="voucher-grid">
                      <div className="voucher-cell">
                        <span className="voucher-label">UPI Reference Number</span>
                        <span className="voucher-value">{selectedTransaction.upiNumber || "N/A"}</span>
                      </div>
                      <div className="voucher-cell">
                        <span className="voucher-label">UPI Date</span>
                        <span className="voucher-value">{selectedTransaction.upiDate || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Block: Partial Payment */}
                {selectedTransaction.paymentStatus === "Partial Payment" && (
                  <div className="conditional-card conditional-card-partial" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#c2410c", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                      <Info size={14} />
                      <span>Partial Dues breakdown</span>
                    </div>
                    <div className="voucher-grid">
                      <div className="voucher-cell">
                        <span className="voucher-label">Total Amount</span>
                        <span className="voucher-value">₹{(selectedTransaction.totalAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="voucher-cell">
                        <span className="voucher-label">Paid Amount</span>
                        <span className="voucher-value" style={{ color: "#15803d", fontWeight: "bold" }}>₹{(selectedTransaction.paidAmount || selectedTransaction.amountReceived || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="voucher-cell">
                        <span className="voucher-label">Pending Amount</span>
                        <span className="voucher-value" style={{ color: "#b91c1c", fontWeight: "bold" }}>₹{(selectedTransaction.pendingAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Block: Pending Payment */}
                {selectedTransaction.paymentStatus === "Pending" && (
                  <div className="conditional-card conditional-card-pending" style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#b91c1c", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                      <AlertCircle size={14} />
                      <span>Pending registration Details</span>
                    </div>
                    <div className="voucher-grid">
                      <div className="voucher-cell">
                        <span className="voucher-label">Total Amount</span>
                        <span className="voucher-value">₹{(selectedTransaction.totalAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="voucher-cell">
                        <span className="voucher-label">Pending Amount</span>
                        <span className="voucher-value" style={{ color: "#b91c1c", fontWeight: "bold" }}>₹{(selectedTransaction.pendingAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      {selectedTransaction.pendingReason && (
                        <div className="voucher-cell voucher-cell-full">
                          <span className="voucher-label">Pending Reason</span>
                          <span className="voucher-value">{selectedTransaction.pendingReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Part 4: Fee Information & Breakdown Table */}
              <div>
                <div className="voucher-section-title">Fee Information</div>
                <div className="voucher-grid" style={{ marginBottom: "12px" }}>
                  <div className="voucher-cell voucher-cell-full">
                    <span className="voucher-label">Towards</span>
                    <span className="voucher-value">{selectedTransaction.towards}</span>
                  </div>
                </div>

                {/* Fee Breakdown Table */}
                <div className="voucher-table-wrapper">
                  <table className="voucher-table">
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