import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import "../styles/dueFees.css";
import { Search, Info, CheckCircle2 } from "lucide-react";

interface DueFeeStudent {
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

interface TransactionData {
  id: number;
  amount: number;
  transaction_date: string;
  fee_types: { fee_name: string };
  receipts: { payment_mode: string; receipt_number: string };
}

export default function DueFees() {
  const [filterBranch, setFilterBranch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<DueFeeStudent | null>(null);
  const [studentTransactions, setStudentTransactions] = useState<TransactionData[]>([]);
  const [allDues, setAllDues] = useState<DueFeeStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('due_fees_view')
      .select('*')
      .gt('due_amount', 0); // only show students with due > 0

    if (error) {
      console.error("Error fetching dues:", error);
    } else if (data) {
      setAllDues(data as any);
    }
    setLoading(false);
  };

  const fetchStudentTransactions = async (studentId: number) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, amount, transaction_date,
        fee_types ( fee_name ),
        receipts ( payment_mode, receipt_number )
      `)
      .eq('student_id', studentId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else if (data) {
      setStudentTransactions(data as any);
    }
  };

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

  const filteredDues = allDues.filter((s) => {
    if (filterBranch && s.branch_name !== filterBranch && !s.branch_name?.includes(filterBranch)) return false;
    if (filterYear && s.year_name !== filterYear) return false;
    
    const q = searchQuery.toLowerCase().trim();
    if (q && !s.student_name.toLowerCase().includes(q) && !s.roll_number.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const handleSelectStudent = (student: DueFeeStudent) => {
    setSelectedStudent(student);
    fetchStudentTransactions(student.student_id);
    setShowSuggestions(false);
  };

  return (
    <div className="due-page">
      <div className="due-header">
        <h2>Due Fees List</h2>
        <p>Analyze outstanding student balances</p>
      </div>

      <div className="filters-panel">
        <div className="filters-panel-title">Filters Panel</div>
        <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
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
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">Mechanical</option>
              <option value="CIVIL">Civil</option>
              <option value="IT">IT</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-year">Academic Year</label>
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
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>
        </div>
      </div>

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
        {showSuggestions && searchQuery.trim() !== "" && (
          <ul className="search-suggestions-overlay">
            {filteredDues.length === 0 ? (
              <li className="search-suggestion-item" style={{ color: "var(--due-text-muted)" }}>
                No student found.
              </li>
            ) : (
              filteredDues.slice(0, 10).map((student, idx) => (
                <li
                  key={idx}
                  className="search-suggestion-item"
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="search-suggestion-info">
                    <span className="search-suggestion-name">{student.student_name}</span>
                    <span className="search-suggestion-roll">{student.roll_number}</span>
                  </div>
                  <span className="search-suggestion-year">{student.year_name}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {loading ? (
        <p style={{textAlign:'center', marginTop: '20px'}}>Loading dues...</p>
      ) : allDues.length === 0 ? (
        <div className="empty-state-card">
          <CheckCircle2 size={36} color="var(--due-primary)" />
          <span>No pending dues found in the system.</span>
        </div>
      ) : (
        <div className="due-main-layout">
          <div className="results-column">
            {filteredDues.length === 0 ? (
              <div className="empty-state-card" style={{ padding: "30px 16px" }}>
                <span>No matching students found.</span>
              </div>
            ) : (
              filteredDues.map((student) => (
                <div
                  key={student.student_id}
                  className={`student-due-card ${
                    selectedStudent?.student_id === student.student_id ? "active" : ""
                  }`}
                  onClick={() => handleSelectStudent(student)}
                >
                  <h4 className="student-due-name">{student.student_name}</h4>
                  <span className="student-due-roll">{student.roll_number}</span>
                  <div className="student-due-meta">
                    {student.branch_name} | {student.year_name}
                  </div>
                  <div className="student-due-status-wrapper">
                    <span className="badge badge-pending">Pending</span>
                    <span className="student-due-amount">
                      ₹{student.due_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="details-column">
            {!selectedStudent ? (
              <div className="empty-state-card" style={{ border: "none", minHeight: "300px" }}>
                <Info size={24} />
                <span>Select a student from the list to view outstanding balance.</span>
              </div>
            ) : (
              <>
                <div className="details-column-header">
                  <h3>{selectedStudent.student_name}</h3>
                  <p>{selectedStudent.roll_number} · {selectedStudent.branch_name} · {selectedStudent.year_name}</p>
                </div>

                <div className="due-table-wrapper" style={{marginBottom: "20px", padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                     <span style={{color: '#475569', fontWeight: 600}}>Total Fee:</span>
                     <span style={{fontWeight: 'bold'}}>₹{selectedStudent.total_fee_amount.toLocaleString('en-IN')}</span>
                   </div>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                     <span style={{color: '#475569', fontWeight: 600}}>Amount Paid:</span>
                     <span style={{color: '#16a34a', fontWeight: 'bold'}}>₹{selectedStudent.amount_paid.toLocaleString('en-IN')}</span>
                   </div>
                   <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '10px'}}>
                     <span style={{color: '#475569', fontWeight: 600}}>Remaining Due:</span>
                     <span style={{color: '#dc2626', fontWeight: 'bold', fontSize: '18px'}}>₹{selectedStudent.due_amount.toLocaleString('en-IN')}</span>
                   </div>
                </div>

                <h4 style={{marginBottom: '10px', fontSize: '16px', color: '#1e293b'}}>Transaction History</h4>
                {studentTransactions.length === 0 ? (
                  <div className="empty-state-card" style={{ border: "none" }}>
                    <span>No transactions found for this student.</span>
                  </div>
                ) : (
                  <div className="due-table-wrapper">
                    <table className="due-details-table">
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>Fee Type</th>
                          <th>Mode</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentTransactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td>{tx.receipts?.receipt_number || '-'}</td>
                            <td>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                            <td>{tx.fee_types?.fee_name}</td>
                            <td>{tx.receipts?.payment_mode}</td>
                            <td style={{ color: "#16a34a", fontWeight: 700 }}>
                              ₹{tx.amount.toLocaleString("en-IN")}
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
    </div>
  );
}