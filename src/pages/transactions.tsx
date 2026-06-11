import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "../styles/transactions.css";
import { Search, RefreshCw, AlertCircle } from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  transaction_date: string;
  receipts: {
    receipt_number: string;
    payment_mode: string;
    total_amount: number;
    collected_by: string | null;
    users: { full_name: string } | null;
  } | null;
  students: { roll_number: string; student_name: string } | null;
  fee_types: { fee_name: string } | null;
  academic_years: { year_name: string } | null;
}

// Group transactions by receipt so we show one row per payment, not per breakdown item
interface ReceiptGroup {
  receipt_number: string;
  payment_mode: string;
  receipt_total: number;        // what was actually paid (receipts.total_amount)
  breakdown_total: number;      // sum of transaction breakdown items
  transaction_date: string;
  student_name: string;
  roll_number: string;
  year_name: string;
  collected_by_name: string;
  fee_types: string[];          // list of fee types in this receipt
  tx_ids: number[];
}

const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const modeIcon: Record<string, string> = {
  Cash: "💵", UPI: "📱", Card: "💳",
  "Bank Transfer": "🏦", Cheque: "📄", DD: "📋",
};

export default function Transactions() {
  const [searchQuery, setSearchQuery]       = useState("");
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id, amount, transaction_date,
        fee_types     ( fee_name ),
        academic_years( year_name ),
        students      ( roll_number, student_name ),
        receipts      (
          receipt_number, payment_mode, total_amount, collected_by,
          users: collected_by ( full_name )
        )
      `)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else if (data) {
      setAllTransactions(data as unknown as Transaction[]);
    }

    if (silent) setRefreshing(false);
    else        setLoading(false);
  };

  // ── Group by receipt_number so each receipt = one row ──────────────
  const receiptGroups = (() => {
    const map = new Map<string, ReceiptGroup>();

    allTransactions.forEach((tx) => {
      const rn = tx.receipts?.receipt_number ?? "UNKNOWN";
      if (!map.has(rn)) {
        map.set(rn, {
          receipt_number:   rn,
          payment_mode:     tx.receipts?.payment_mode ?? "—",
          receipt_total:    Number(tx.receipts?.total_amount ?? 0),
          breakdown_total:  0,
          transaction_date: tx.transaction_date,
          student_name:     tx.students?.student_name ?? "—",
          roll_number:      tx.students?.roll_number  ?? "—",
          year_name:        tx.academic_years?.year_name ?? "—",
          collected_by_name: tx.receipts?.users?.full_name ?? "—",
          fee_types:        [],
          tx_ids:           [],
        });
      }
      const g = map.get(rn)!;
      g.breakdown_total += Number(tx.amount);
      if (tx.fee_types?.fee_name && !g.fee_types.includes(tx.fee_types.fee_name)) {
        g.fee_types.push(tx.fee_types.fee_name);
      }
      g.tx_ids.push(tx.id);
    });

    return [...map.values()];
  })();

  // ── Filter ──────────────────────────────────────────────────────────
  const filtered = receiptGroups.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (
      g.receipt_number.toLowerCase().includes(q) ||
      g.student_name.toLowerCase().includes(q)   ||
      g.roll_number.toLowerCase().includes(q)    ||
      g.fee_types.join(" ").toLowerCase().includes(q)
    );

    let matchDate = true;
    if (g.transaction_date) {
      const d = new Date(g.transaction_date);
      if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); if (d < s) matchDate = false; }
      if (endDate)   { const e = new Date(endDate);   e.setHours(23,59,59,999); if (d > e) matchDate = false; }
    } else if (startDate || endDate) matchDate = false;

    return matchSearch && matchDate;
  });

  const grandTotal = filtered.reduce((s, g) => s + g.receipt_total, 0);

  return (
    <div className="transactions-page">
      <div className="transactions-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Transaction History</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Audit trail of all fee payments — one row per receipt
          </p>
        </div>
        <button
          onClick={() => fetchTransactions(true)}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569" }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Search + Date filters ── */}
      <div style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", background: "white", padding: "10px 14px", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flex: "1 1 300px", gap: 8 }}>
          <Search size={16} style={{ color: "#64748b", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by Receipt No, Student, Roll No, or Fee Type…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", width: "100%", fontSize: 14, fontFamily: "inherit" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0 }}>✕</button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "10px 14px", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", fontSize: 13, outline: "none" }} />
          <label style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", fontSize: 13, outline: "none" }} />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#dc2626", cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "Receipts shown", value: filtered.length,       color: "#1e293b", bg: "#f8fafc", border: "#cbd5e1" },
            { label: "Total collected", value: fmt(grandTotal),       color: "#16a34a", bg: "#f0fdf4", border: "#6ee7b7" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ padding: "10px 18px", background: bg, border: `1.5px solid ${border}`, borderRadius: 10, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={22} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
            <p>Loading transactions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            <AlertCircle size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p>No transactions found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Date", "Receipt No", "Student", "Fee Type(s)", "Mode", "Collected By", "Amount Paid"].map((h) => (
                    <th key={h} style={{ padding: "13px 15px", borderBottom: "2px solid #e2e8f0", textAlign: h === "Amount Paid" ? "right" : "left", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  // Flag mismatch between receipt total and breakdown total
                  const mismatch = Math.abs(g.receipt_total - g.breakdown_total) > 0.01 && g.breakdown_total > 0;
                  return (
                    <tr key={g.receipt_number} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "13px 15px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
                        {fmtDate(g.transaction_date)}
                      </td>
                      <td style={{ padding: "13px 15px", fontWeight: 700, color: "#ea580c", whiteSpace: "nowrap" }}>
                        {g.receipt_number}
                      </td>
                      <td style={{ padding: "13px 15px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{g.student_name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{g.roll_number}</div>
                      </td>
                      <td style={{ padding: "13px 15px", fontSize: 13, color: "#475569", maxWidth: 180 }}>
                        {g.fee_types.length > 0 ? g.fee_types.join(", ") : "—"}
                      </td>
                      <td style={{ padding: "13px 15px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 10, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {modeIcon[g.payment_mode] ?? ""} {g.payment_mode}
                        </span>
                      </td>
                      <td style={{ padding: "13px 15px", fontSize: 13, color: "#475569" }}>
                        {g.collected_by_name}
                      </td>
                      <td style={{ padding: "13px 15px", textAlign: "right", whiteSpace: "nowrap" }}>
                        {/* Always show receipts.total_amount — this is what was actually paid */}
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>
                          {fmt(g.receipt_total)}
                        </span>
                        {/* Show a warning if breakdown doesn't match receipt total */}
                        {mismatch && (
                          <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }} title={`Breakdown total: ${fmt(g.breakdown_total)}`}>
                            ⚠ breakdown: {fmt(g.breakdown_total)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0fdf4", borderTop: "2px solid #10b981" }}>
                  <td colSpan={6} style={{ padding: "12px 15px", fontWeight: 700, fontSize: 14, color: "#065f46" }}>
                    Total ({filtered.length} receipt{filtered.length !== 1 ? "s" : ""})
                  </td>
                  <td style={{ padding: "12px 15px", textAlign: "right", fontWeight: 800, fontSize: 16, color: "#16a34a" }}>
                    {fmt(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}