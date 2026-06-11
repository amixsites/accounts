import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import "../styles/dueFees.css";
import {
  Search, Info, CheckCircle2, RefreshCw,
  AlertCircle, Clock, IndianRupee,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  fee_status: string;
  last_payment_date: string | null;
}

interface TransactionRow {
  id: number;
  amount: number;
  transaction_date: string;
  fee_types: { fee_name: string } | null;
  receipts: {
    receipt_number: string;
    payment_mode: string;
    collected_by: string | null;
    users: { full_name: string } | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const statusColor = (status: string) => {
  if (status === "Paid")    return { bg: "#f0fdf4", border: "#10b981", text: "#15803d" };
  if (status === "Partial") return { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" };
  return                           { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DueFees() {
  const [allStudents, setAllStudents]         = useState<DueFeeStudent[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [filterStatus, setFilterStatus]       = useState("Due,Partial"); // default: show only students with dues
  const [filterBranch, setFilterBranch]       = useState("");
  const [filterYear, setFilterYear]           = useState("");
  const [searchQuery, setSearchQuery]         = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<DueFeeStudent | null>(null);
  const [transactions, setTransactions]       = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading]             = useState(false);
  const [branches, setBranches]               = useState<string[]>([]);
  const [years, setYears]                     = useState<string[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);

  // ── Close suggestions on outside click ───────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadStudents();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CORE FETCH — reads directly from students table (single source of truth)
  // Falls back to view if columns don't exist yet.
  // ─────────────────────────────────────────────────────────────────────────
  const loadStudents = async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);

    // Try reading the rich view first (created by FIX_SYNC.sql)
    const { data: viewData, error: viewErr } = await supabase
      .from("due_fees_view")
      .select("*");

    if (!viewErr && viewData && viewData.length > 0) {
      console.log("Transactions Found (via due_fees_view):", viewData.length);
      const rows = viewData as DueFeeStudent[];
      setAllStudents(rows);
      setBranches([...new Set(rows.map((r) => r.branch_name).filter(Boolean))].sort());
      setYears([...new Set(rows.map((r) => r.year_name).filter(Boolean))].sort());
    } else {
      // Fallback: query students + joined tables directly
      const { data: studData, error: studErr } = await supabase
        .from("students")
        .select(`
          id, roll_number, student_name, total_fee_amount, amount_paid, due_amount, fee_status,
          courses       ( course_name ),
          branches      ( branch_name ),
          academic_years( year_name )
        `)
        .eq("is_active", true)
        .order("roll_number");

      if (studErr || !studData) {
        console.error("Error loading students:", studErr);
        if (!silent) setLoading(false);
        else         setRefreshing(false);
        return;
      }

      // If amount_paid column doesn't exist, compute from transactions
      const needsCompute = studData.some(
        (s: any) => s.amount_paid === null || s.amount_paid === undefined
      );

      let rows: DueFeeStudent[];

      if (needsCompute) {
        const { data: txData } = await supabase
          .from("transactions")
          .select("student_id, amount");

        const paidMap: Record<number, number> = {};
        (txData ?? []).forEach((t: any) => {
          paidMap[t.student_id] = (paidMap[t.student_id] ?? 0) + Number(t.amount);
        });

        rows = (studData as any[]).map((s) => {
          const paid = paidMap[s.id] ?? 0;
          const due  = Number(s.total_fee_amount) - paid;
          return {
            student_id:       s.id,
            roll_number:      s.roll_number,
            student_name:     s.student_name,
            course_name:      s.courses?.course_name  ?? "",
            branch_name:      s.branches?.branch_name ?? "",
            year_name:        s.academic_years?.year_name ?? "",
            total_fee_amount: Number(s.total_fee_amount),
            amount_paid:      paid,
            due_amount:       due,
            fee_status:       due <= 0 ? "Paid" : paid > 0 ? "Partial" : "Due",
            last_payment_date: null,
          };
        });
      } else {
        rows = (studData as any[]).map((s) => ({
          student_id:       s.id,
          roll_number:      s.roll_number,
          student_name:     s.student_name,
          course_name:      s.courses?.course_name  ?? "",
          branch_name:      s.branches?.branch_name ?? "",
          year_name:        s.academic_years?.year_name ?? "",
          total_fee_amount: Number(s.total_fee_amount),
          amount_paid:      Number(s.amount_paid ?? 0),
          due_amount:       Number(s.due_amount  ?? s.total_fee_amount),
          fee_status:       s.fee_status ?? "Due",
          last_payment_date: null,
        }));
      }

      console.log("Student Fee Summary Updated (loaded):", rows.length, "students");
      setAllStudents(rows);
      setBranches([...new Set(rows.map((r) => r.branch_name).filter(Boolean))].sort());
      setYears([...new Set(rows.map((r) => r.year_name).filter(Boolean))].sort());
    }

    if (!silent) setLoading(false);
    else         setRefreshing(false);
  };

  // ── Fetch transactions for a student ─────────────────────────────────────
  const fetchTransactions = useCallback(async (studentId: number) => {
    setTxLoading(true);
    setTransactions([]);

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id, amount, transaction_date,
        fee_types ( fee_name ),
        receipts  (
          receipt_number, payment_mode, collected_by,
          users: collected_by ( full_name )
        )
      `)
      .eq("student_id", studentId)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      console.log("Transactions Found:", data?.length ?? 0, "for student_id:", studentId);
      setTransactions((data ?? []) as unknown as TransactionRow[]);
    }
    setTxLoading(false);
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredStudents = allStudents.filter((s) => {
    // Status filter (comma-separated allowed statuses)
    if (filterStatus) {
      const allowed = filterStatus.split(",").map((x) => x.trim());
      if (!allowed.includes(s.fee_status)) return false;
    }
    if (filterBranch && s.branch_name !== filterBranch) return false;
    if (filterYear   && s.year_name   !== filterYear)   return false;

    const q = searchQuery.toLowerCase().trim();
    if (q && !s.student_name.toLowerCase().includes(q) && !s.roll_number.toLowerCase().includes(q))
      return false;

    return true;
  });

  const handleSelectStudent = (s: DueFeeStudent) => {
    setSelectedStudent(s);
    fetchTransactions(s.student_id);
    setShowSuggestions(false);
    setSearchQuery(s.student_name);
  };

  const handleRefresh = () => loadStudents(true);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="due-page">
      {/* Header */}
      <div className="due-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Due Fees</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Live student fee balances — updates after every payment
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="filters-panel" style={{ marginBottom: 16 }}>
        <div className="filters-panel-title">Filters</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Status */}
          <div className="filter-group" style={{ minWidth: 160 }}>
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setSelectedStudent(null); }}
            >
              <option value="">All Students</option>
              <option value="Due,Partial">With Dues (Due + Partial)</option>
              <option value="Due">Due Only</option>
              <option value="Partial">Partial Only</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {/* Branch */}
          <div className="filter-group" style={{ minWidth: 160 }}>
            <label className="filter-label">Branch</label>
            <select
              className="filter-select"
              value={filterBranch}
              onChange={(e) => { setFilterBranch(e.target.value); setSelectedStudent(null); }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Year */}
          <div className="filter-group" style={{ minWidth: 140 }}>
            <label className="filter-label">Academic Year</label>
            <select
              className="filter-select"
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setSelectedStudent(null); }}
            >
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="search-bar-section" ref={searchRef} style={{ marginBottom: 20 }}>
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-field"
            placeholder="Search by student name or roll number…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); if (!e.target.value) setSelectedStudent(null); }}
            onFocus={() => setShowSuggestions(true)}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedStudent(null); setShowSuggestions(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px", color: "#64748b" }}
            >✕</button>
          )}
        </div>

        {showSuggestions && searchQuery.trim() && (
          <ul className="search-suggestions-overlay">
            {filteredStudents.length === 0 ? (
              <li className="search-suggestion-item" style={{ color: "#94a3b8" }}>No students found.</li>
            ) : (
              filteredStudents.slice(0, 8).map((s) => (
                <li key={s.student_id} className="search-suggestion-item" onClick={() => handleSelectStudent(s)}>
                  <div className="search-suggestion-info">
                    <span className="search-suggestion-name">{s.student_name}</span>
                    <span className="search-suggestion-roll">{s.roll_number}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      background: statusColor(s.fee_status).bg,
                      color:      statusColor(s.fee_status).text,
                      border:    `1px solid ${statusColor(s.fee_status).border}`,
                    }}>{s.fee_status}</span>
                    <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>{fmt(s.due_amount)} due</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* ── Summary stats ── */}
      {!loading && allStudents.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Students",    value: allStudents.length,                               color: "#1e293b", bg: "#f8fafc",  border: "#cbd5e1" },
            { label: "With Dues",         value: allStudents.filter((s) => s.due_amount > 0).length, color: "#dc2626", bg: "#fef2f2",  border: "#fca5a5" },
            { label: "Partial Paid",      value: allStudents.filter((s) => s.fee_status === "Partial").length, color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
            { label: "Fully Paid",        value: allStudents.filter((s) => s.fee_status === "Paid").length,    color: "#16a34a", bg: "#f0fdf4", border: "#6ee7b7" },
            { label: "Total Outstanding", value: fmt(allStudents.reduce((s, r) => s + r.due_amount, 0)),       color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ padding: "12px 16px", background: bg, border: `1.5px solid ${border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
          <p>Loading fee data…</p>
        </div>
      ) : allStudents.length === 0 ? (
        <div className="empty-state-card">
          <CheckCircle2 size={36} color="var(--due-primary)" />
          <span>No students found in the system.</span>
        </div>
      ) : (
        <div className="due-main-layout">
          {/* ── Student list ── */}
          <div className="results-column">
            {filteredStudents.length === 0 ? (
              <div className="empty-state-card" style={{ padding: "30px 16px" }}>
                <AlertCircle size={28} style={{ opacity: 0.4, marginBottom: 6 }} />
                <span>No students match the current filters.</span>
              </div>
            ) : (
              filteredStudents.map((s) => {
                const sc = statusColor(s.fee_status);
                const isActive = selectedStudent?.student_id === s.student_id;
                return (
                  <div
                    key={s.student_id}
                    className={`student-due-card ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectStudent(s)}
                    style={{ cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <h4 className="student-due-name">{s.student_name}</h4>
                        <span className="student-due-roll">{s.roll_number}</span>
                        <div className="student-due-meta" style={{ marginTop: 4 }}>
                          {s.branch_name} {s.year_name && `· ${s.year_name}`}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {s.fee_status}
                      </span>
                    </div>

                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Total: <strong style={{ color: "#1e293b" }}>{fmt(s.total_fee_amount)}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Paid: <strong style={{ color: "#16a34a" }}>{fmt(s.amount_paid)}</strong></div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Due: <strong style={{ color: s.due_amount > 0 ? "#dc2626" : "#16a34a" }}>{fmt(s.due_amount)}</strong></div>
                      {s.last_payment_date && (
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Last: {fmtDate(s.last_payment_date)}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Student detail panel ── */}
          <div className="details-column">
            {!selectedStudent ? (
              <div className="empty-state-card" style={{ border: "none", minHeight: 300 }}>
                <Info size={24} />
                <span>Select a student to view fee details and payment history.</span>
              </div>
            ) : (() => {
              const sc = statusColor(selectedStudent.fee_status);
              return (
                <>
                  {/* Student header */}
                  <div className="details-column-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px" }}>{selectedStudent.student_name}</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                          {selectedStudent.roll_number}
                          {selectedStudent.branch_name && ` · ${selectedStudent.branch_name}`}
                          {selectedStudent.year_name   && ` · ${selectedStudent.year_name}`}
                        </p>
                      </div>
                      <span style={{
                        padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                        background: sc.bg, color: sc.text, border: `1.5px solid ${sc.border}`,
                      }}>
                        {selectedStudent.fee_status}
                      </span>
                    </div>
                  </div>

                  {/* Fee summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                    <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Total Fee</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{fmt(selectedStudent.total_fee_amount)}</div>
                    </div>
                    <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1.5px solid #10b981", borderRadius: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Amount Paid</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmt(selectedStudent.amount_paid)}</div>
                    </div>
                    <div style={{
                      padding: "12px 14px", borderRadius: 10, textAlign: "center",
                      background: selectedStudent.due_amount > 0 ? "#fef2f2" : "#f0fdf4",
                      border: `1.5px solid ${selectedStudent.due_amount > 0 ? "#fca5a5" : "#10b981"}`,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: selectedStudent.due_amount > 0 ? "#991b1b" : "#065f46", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Remaining Due</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: selectedStudent.due_amount > 0 ? "#dc2626" : "#16a34a" }}>{fmt(selectedStudent.due_amount)}</div>
                    </div>
                  </div>

                  {/* Last payment */}
                  {selectedStudent.last_payment_date && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                      <Clock size={13} />
                      Last payment: <strong>{fmtDate(selectedStudent.last_payment_date)}</strong>
                    </div>
                  )}

                  {/* Transaction history */}
                  <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                    <IndianRupee size={15} /> Payment History
                  </h4>

                  {txLoading ? (
                    <div style={{ textAlign: "center", padding: 20, color: "#64748b", fontSize: 13 }}>
                      Loading transactions…
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="empty-state-card" style={{ border: "none", padding: "20px 0" }}>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>No payment records found for this student.</span>
                    </div>
                  ) : (
                    <div className="due-table-wrapper">
                      <table className="due-details-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1.5px solid #e2e8f0" }}>Date</th>
                            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1.5px solid #e2e8f0" }}>Receipt No</th>
                            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1.5px solid #e2e8f0" }}>Fee Type</th>
                            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1.5px solid #e2e8f0" }}>Mode</th>
                            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#475569", fontWeight: 700, borderBottom: "1.5px solid #e2e8f0" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx, i) => (
                            <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>
                                {fmtDate(tx.transaction_date)}
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#ea580c" }}>
                                {tx.receipts?.receipt_number ?? "—"}
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#1e293b" }}>
                                {tx.fee_types?.fee_name ?? "—"}
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: 13 }}>
                                <span style={{ padding: "2px 8px", borderRadius: 10, background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600 }}>
                                  {tx.receipts?.payment_mode ?? "—"}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: "#16a34a", textAlign: "right" }}>
                                {fmt(tx.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f0fdf4", borderTop: "2px solid #10b981" }}>
                            <td colSpan={4} style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#065f46" }}>Total Paid</td>
                            <td style={{ padding: "10px 12px", fontSize: 15, fontWeight: 800, color: "#16a34a", textAlign: "right" }}>
                              {fmt(transactions.reduce((s, t) => s + Number(t.amount), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
