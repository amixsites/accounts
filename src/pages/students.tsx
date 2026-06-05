import { useEffect, useState } from "react";
import "../styles/students.css";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  date: string;
  amount: number;
  mode: string;
  feeType: string;
}

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  course: string;
  branch: string;
  academicYear: string;
  totalFee: number;
  amountPaid: number;
  transactions: Transaction[];
}

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = ""; // ← paste your endpoint here

const LOCAL_STUDENTS: Student[] = [
  {
    id: 1,
    name: "Rahul Kumar",
    rollNumber: "CSE001",
    course: "B.Tech",
    branch: "CSE",
    academicYear: "2025",
    totalFee: 80000,
    amountPaid: 60000,
    transactions: [
      { id: 1, date: "2025-01-15", amount: 30000, mode: "UPI",  feeType: "Tuition Fee" },
      { id: 2, date: "2025-03-10", amount: 30000, mode: "Cash", feeType: "Hostel Fee"  },
    ],
  },
  {
    id: 2,
    name: "Priya Sharma",
    rollNumber: "ECE002",
    course: "B.Tech",
    branch: "ECE",
    academicYear: "2024",
    totalFee: 75000,
    amountPaid: 50000,
    transactions: [
      { id: 1, date: "2024-02-12", amount: 25000, mode: "Card", feeType: "Exam Fee" },
    ],
  },
  {
    id: 3,
    name: "Priya Sharma",
    rollNumber: "ECE002",
    course: "B.Tech",
    branch: "ECE",
    academicYear: "2024",
    totalFee: 75000,
    amountPaid: 50000,
    transactions: [
      { id: 1, date: "2024-02-12", amount: 25000, mode: "Card", feeType: "Exam Fee" },
    ],
  },


];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const BRANCH_OPTIONS = [
  "CE", "ME", "E&I", "EEE", "CSE", "IT",
  "ECE", "CSE(N)", "ECI", "CSM", "M&H", "DS", "PS", "MBA",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Student() {
  const [students, setStudents]         = useState<Student[]>(LOCAL_STUDENTS);
  const [search, setSearch]             = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [selected, setSelected]         = useState<Student | null>(null);

  // ── Fetch: use API data if URL is set AND returns a non-empty array,
  //           otherwise keep LOCAL_STUDENTS ──────────────────────────────────
  useEffect(() => {
    if (!API_URL.trim()) return; // no URL configured → stay on local data

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Student[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setStudents(data);          // ✅ API has data → use it
        }
        // API returned empty array → silently keep local data
      })
      .catch((err) => {
        console.warn("API unavailable, using local data.", err);
        // network / parse error → silently keep local data
      });
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.academicYear.includes(q);
    return matchesSearch && (!branchFilter || s.branch === branchFilter);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">

      <div className="page-header">
        <h1>Students</h1>
        <p>Student Management System</p>
      </div>

      {/* ── Filters ── */}
      <div className="filters">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="#ea580c" strokeWidth="1.8"/>
            <path d="M13.5 13.5L17 17" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by Name, Roll Number or Year (e.g. 2024)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="search-hints">
            <span>Name</span>
            <span>Roll Number</span>
            <span>Year e.g. 2024</span>
          </div>
        </div>

        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All Branches</option>
          {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* ── Main Table ── */}
      {filtered.length === 0 ? (
        <p className="empty">No students match your filters.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Academic Year</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.rollNumber}</td>
                  <td>{s.name}</td>
                  <td>{s.branch}</td>
                  <td>{s.academicYear}</td>
                  <td>
                    <button className="view-btn" onClick={() => setSelected(s)}>
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {/* Header banner */}
            <div className="modal-header">
              <div className="profile-avatar">{selected.name[0]}</div>
              <div className="profile-title">
                <h2>{selected.name}</h2>
                <p>{selected.rollNumber}&nbsp;&nbsp;·&nbsp;&nbsp;{selected.course}&nbsp;&nbsp;·&nbsp;&nbsp;{selected.branch}</p>
              </div>
            </div>

            <div className="modal-body">

              {/* Academic Info */}
              <div className="info-section">
                <div className="info-section-title">Academic Info</div>
                <div className="info-row">
                  <div className="info-cell">
                    <span className="info-label">Course</span>
                    <span className="info-value">{selected.course}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-label">Branch</span>
                    <span className="info-value">{selected.branch}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-label">Academic Year</span>
                    <span className="info-value">{selected.academicYear}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-label">Roll Number</span>
                    <span className="info-value">{selected.rollNumber}</span>
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              <div className="info-section">
                <div className="info-section-title">Fee Details</div>
                <div className="info-row">
                  <div className="info-cell">
                    <span className="info-label">Total Fee</span>
                    <span className="info-value">{fmt(selected.totalFee)}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-label">Amount Paid</span>
                    <span className="info-value paid">{fmt(selected.amountPaid)}</span>
                  </div>
                  <div className="info-cell">
                    <span className="info-label">Remaining Due</span>
                    <span className={`info-value ${selected.totalFee - selected.amountPaid > 0 ? "due" : "cleared"}`}>
                      {fmt(selected.totalFee - selected.amountPaid)}
                    </span>
                  </div>
                  {/* Extra empty cell to keep the row balanced — remove when you add a 4th fee field */}
                  <div className="info-cell empty-cell" />
                </div>
              </div>

              {/* Transaction History */}
              <div className="info-section">
                <div className="info-section-title">Transaction History</div>
                <div className="tx-scroll">
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Type of Fee</th>
                        {/* Add more <th> here later as you expand columns */}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.date}</td>
                          <td>{fmt(tx.amount)}</td>
                          <td>{tx.mode}</td>
                          <td>{tx.feeType}</td>
                          {/* Add more <td> here later */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button className="close-btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}