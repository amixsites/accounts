import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabaseClient";
import { Download, RefreshCw, TrendingUp, IndianRupee, Users, BarChart2, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FinancialSummary {
  totalCollected:    number;
  totalOutstanding:  number;
  totalFeeAmount:    number;
  collectionRate:    number;   // %
  paidStudents:      number;
  pendingStudents:   number;
  totalStudents:     number;
  totalReceipts:     number;
}

interface DeptRevenue   { department: string;  revenue: number }
interface YearRevenue   { academicYear: string; revenue: number }
interface MonthlyRow    { month: string;        collected: number; receipts: number }
interface PaymentRow    { mode: string;         amount: number; count: number }

interface ReportData {
  summary:       FinancialSummary;
  byDepartment:  DeptRevenue[];
  byYear:        YearRevenue[];
  monthly:       MonthlyRow[];
  byPaymentMode: PaymentRow[];
  generatedAt:   string;
  filters:       { startDate: string; endDate: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data,      setData]      = useState<ReportData | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  // Auto-load on mount with no filters
  useEffect(() => { fetchAnalytics("", ""); }, []);

  // ── Core data fetch — NO student personal data, aggregated only ───────────
  const fetchAnalytics = useCallback(async (sd: string, ed: string) => {
    setLoading(true);
    setError(null);

    try {
      // ── 1. All receipts (aggregated — no student names/rolls) ──
      let receiptQ = supabase
        .from("receipts")
        .select("id, total_amount, payment_mode, receipt_date");
      if (sd) receiptQ = receiptQ.gte("receipt_date", sd);
      if (ed) receiptQ = receiptQ.lte("receipt_date", ed);
      const { data: receipts, error: rErr } = await receiptQ;
      if (rErr) throw rErr;

      // ── 2. All transactions with branch + academic_year (no names/rolls) ──
      let txQ = supabase
        .from("transactions")
        .select(`
          amount, transaction_date,
          students (
            branch_id,
            branches ( branch_name ),
            academic_years ( year_name )
          )
        `);
      if (sd) txQ = txQ.gte("transaction_date", sd);
      if (ed) txQ = txQ.lte("transaction_date", ed);
      const { data: txRows, error: txErr } = await txQ;
      if (txErr) throw txErr;

      // ── 3. Student totals (only fee amounts, no personal data) ──
      const { data: students, error: sErr } = await supabase
        .from("students")
        .select("id, total_fee_amount")
        .eq("is_active", true);
      if (sErr) throw sErr;

      // ── 4. Due fees view (only aggregated amounts) ──
      const { data: dues, error: dErr } = await supabase
        .from("due_fees_view")
        .select("student_id, due_amount, amount_paid, total_fee_amount");
      if (dErr) throw dErr;

      // ── Compute Financial Summary ─────────────────────────────────────────
      const totalCollected   = (receipts ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
      const totalOutstanding = (dues ?? []).reduce((s, d) => s + Number(d.due_amount), 0);
      const totalFeeAmount   = (students ?? []).reduce((s, s2) => s + Number(s2.total_fee_amount), 0);
      const pendingStudents  = (dues ?? []).filter(d => Number(d.due_amount) > 0).length;
      const paidStudents     = (students?.length ?? 0) - pendingStudents;
      const collectionRate   = totalFeeAmount > 0 ? (totalCollected / totalFeeAmount) * 100 : 0;

      // ── By Department ─────────────────────────────────────────────────────
      const deptMap = new Map<string, number>();
      (txRows ?? []).forEach((tx: any) => {
        const name = tx.students?.branches?.branch_name ?? "Unknown";
        deptMap.set(name, (deptMap.get(name) ?? 0) + Number(tx.amount));
      });
      const byDepartment: DeptRevenue[] = Array.from(deptMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([department, revenue]) => ({ department, revenue }));

      // ── By Academic Year ──────────────────────────────────────────────────
      const yearMap = new Map<string, number>();
      (txRows ?? []).forEach((tx: any) => {
        const yr = tx.students?.academic_years?.year_name ?? "Unknown";
        yearMap.set(yr, (yearMap.get(yr) ?? 0) + Number(tx.amount));
      });
      const byYear: YearRevenue[] = Array.from(yearMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([academicYear, revenue]) => ({ academicYear, revenue }));

      // ── Monthly Collections ───────────────────────────────────────────────
      const monthMap = new Map<string, { collected: number; receipts: number }>();
      (receipts ?? []).forEach((r) => {
        const d = new Date(r.receipt_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        if (!monthMap.has(key)) monthMap.set(key, { collected: 0, receipts: 0 });
        const entry = monthMap.get(key)!;
        entry.collected += Number(r.total_amount);
        entry.receipts  += 1;
        // store label alongside key so we can sort by key
        (monthMap as any).set(key, { ...entry, label });
      });
      const monthly: MonthlyRow[] = Array.from(monthMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, v]: any) => ({
          month:     v.label,
          collected: v.collected,
          receipts:  v.receipts,
        }));

      // ── By Payment Mode ───────────────────────────────────────────────────
      const modeMap = new Map<string, { amount: number; count: number }>();
      (receipts ?? []).forEach((r) => {
        const m = r.payment_mode;
        if (!modeMap.has(m)) modeMap.set(m, { amount: 0, count: 0 });
        const e = modeMap.get(m)!;
        e.amount += Number(r.total_amount);
        e.count  += 1;
      });
      const byPaymentMode: PaymentRow[] = Array.from(modeMap.entries())
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([mode, { amount, count }]) => ({ mode, amount, count }));

      setData({
        summary: {
          totalCollected,
          totalOutstanding,
          totalFeeAmount,
          collectionRate,
          paidStudents,
          pendingStudents,
          totalStudents: students?.length ?? 0,
          totalReceipts: receipts?.length ?? 0,
        },
        byDepartment,
        byYear,
        monthly,
        byPaymentMode,
        generatedAt: new Date().toLocaleString("en-IN"),
        filters: { startDate: sd, endDate: ed },
      });
    } catch (e: any) {
      console.error("Report fetch error:", e);
      setError(e?.message ?? "Failed to load report data. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = () => fetchAnalytics(startDate, endDate);

  // ── Export to Excel (.xlsx) ───────────────────────────────────────────────
  const exportExcel = () => {
    if (!data) return;
    setExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Financial Summary ───────────────────────────────────────
      const s1Rows = [
        ["KITSW — Financial Report"],
        ["Generated On", data.generatedAt],
        data.filters.startDate || data.filters.endDate
          ? ["Date Filter", `${data.filters.startDate || "All"} to ${data.filters.endDate || "All"}`]
          : ["Date Filter", "All Time"],
        [],
        ["KPI", "Value"],
        ["Total Fees Collected",        fmt(data.summary.totalCollected)],
        ["Total Outstanding Fees",      fmt(data.summary.totalOutstanding)],
        ["Total Fee Amount (All Students)", fmt(data.summary.totalFeeAmount)],
        ["Collection Rate",             pct(data.summary.collectionRate)],
        ["Total Receipts Generated",    data.summary.totalReceipts],
        ["Total Active Students",       data.summary.totalStudents],
        ["Students with Dues Cleared",  data.summary.paidStudents],
        ["Students with Pending Dues",  data.summary.pendingStudents],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
      // Column widths
      ws1["!cols"] = [{ wch: 36 }, { wch: 26 }];
      // Bold / style the header rows
      ws1["A1"] && (ws1["A1"].s = { font: { bold: true, sz: 14 } });
      ws1["A5"] && (ws1["A5"].s = { font: { bold: true } });
      ws1["B5"] && (ws1["B5"].s = { font: { bold: true } });
      XLSX.utils.book_append_sheet(wb, ws1, "Financial Summary");

      // ── Sheet 2: Department-wise Revenue ─────────────────────────────────
      const s2Rows: (string | number)[][] = [
        ["Department", "Revenue (₹)", "% of Total"],
        ...data.byDepartment.map((d) => [
          d.department,
          d.revenue,
          data.summary.totalCollected > 0
            ? parseFloat(((d.revenue / data.summary.totalCollected) * 100).toFixed(2))
            : 0,
        ]),
        [],
        ["Total", data.summary.totalCollected, 100],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
      ws2["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Department Revenue");

      // ── Sheet 3: Academic Year Revenue ────────────────────────────────────
      const s3Rows: (string | number)[][] = [
        ["Academic Year", "Revenue (₹)", "% of Total"],
        ...data.byYear.map((y) => [
          y.academicYear,
          y.revenue,
          data.summary.totalCollected > 0
            ? parseFloat(((y.revenue / data.summary.totalCollected) * 100).toFixed(2))
            : 0,
        ]),
        [],
        ["Total", data.summary.totalCollected, 100],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
      ws3["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws3, "Academic Year Revenue");

      // ── Sheet 4: Monthly Collections ─────────────────────────────────────
      const s4Rows: (string | number)[][] = [
        ["Month", "Amount Collected (₹)", "Receipts Count"],
        ...data.monthly.map((m) => [m.month, m.collected, m.receipts]),
        [],
        ["Grand Total", data.summary.totalCollected, data.summary.totalReceipts],
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
      ws4["!cols"] = [{ wch: 18 }, { wch: 24 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws4, "Monthly Collections");

      // ── Sheet 5: Payment Mode Breakdown ──────────────────────────────────
      const s5Rows: (string | number)[][] = [
        ["Payment Mode", "Amount Collected (₹)", "Receipt Count", "% Share"],
        ...data.byPaymentMode.map((p) => [
          p.mode,
          p.amount,
          p.count,
          data.summary.totalCollected > 0
            ? parseFloat(((p.amount / data.summary.totalCollected) * 100).toFixed(2))
            : 0,
        ]),
        [],
        ["Total", data.summary.totalCollected, data.summary.totalReceipts, 100],
      ];
      const ws5 = XLSX.utils.aoa_to_sheet(s5Rows);
      ws5["!cols"] = [{ wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws5, "Payment Mode");

      // ── Download ──────────────────────────────────────────────────────────
      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Financial_Report_${dateStr}.xlsx`);
    } catch (e) {
      console.error("Excel export error:", e);
      setError("Failed to generate Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Page header ── */}
      <div className="page-header">
        <h1 style={{ color: "#ea580c", margin: 0 }}>Reports & Analytics</h1>
        <p style={{ margin: "4px 0 0", color: "#9a3412", fontSize: 13 }}>
          Financial summary — no personal student data
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: loading ? "#9ca3af" : "#ea580c", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            {loading ? "Loading…" : "Generate Report"}
          </button>

          {data && !loading && (
            <button
              onClick={exportExcel}
              disabled={exporting}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: exporting ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: exporting ? "not-allowed" : "pointer" }}
            >
              <Download size={16} />
              {exporting ? "Exporting…" : "Download Excel (.xlsx)"}
            </button>
          )}
        </div>

        {(startDate || endDate) && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
            Showing data {startDate ? `from ${startDate}` : ""}{endDate ? ` to ${endDate}` : ""}
            <button onClick={() => { setStartDate(""); setEndDate(""); fetchAnalytics("", ""); }}
              style={{ marginLeft: 10, fontSize: 12, color: "#ea580c", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", marginBottom: 20, color: "#991b1b", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Error:</strong> {error}
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
              Make sure <code>FIX_406_ERROR.sql</code> has been run in Supabase (RLS disabled).
            </div>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9a3412", fontSize: 15 }}>
          <div style={{ width: 40, height: 40, border: "3px solid #fed7aa", borderTopColor: "#ea580c", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
          Fetching financial data…
        </div>
      )}

      {/* ── Main content ── */}
      {data && !loading && (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <KpiCard icon={<IndianRupee size={20}/>} label="Total Collected"   value={fmt(data.summary.totalCollected)}   color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
            <KpiCard icon={<IndianRupee size={20}/>} label="Outstanding Fees"  value={fmt(data.summary.totalOutstanding)}  color="#dc2626" bg="#fef2f2" border="#fecaca" />
            <KpiCard icon={<TrendingUp  size={20}/>} label="Collection Rate"   value={pct(data.summary.collectionRate)}    color="#0369a1" bg="#e0f2fe" border="#bae6fd" />
            <KpiCard icon={<Users       size={20}/>} label="Total Students"    value={String(data.summary.totalStudents)}  color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
            <KpiCard icon={<Users       size={20}/>} label="Dues Cleared"      value={String(data.summary.paidStudents)}   color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
            <KpiCard icon={<Users       size={20}/>} label="Pending Dues"      value={String(data.summary.pendingStudents)} color="#dc2626" bg="#fef2f2" border="#fecaca" />
            <KpiCard icon={<BarChart2   size={20}/>} label="Receipts Generated" value={String(data.summary.totalReceipts)} color="#ea580c" bg="#fff7ed" border="#fed7aa" />
            <KpiCard icon={<IndianRupee size={20}/>} label="Total Fee Amount"  value={fmt(data.summary.totalFeeAmount)}    color="#78350f" bg="#fffbeb" border="#fde68a" />
          </div>

          {/* ── Two-column detail tables ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18, marginBottom: 24 }}>

            {/* Department Revenue */}
            <ReportTable
              title="Revenue by Department"
              headers={["Department", "Revenue", "Share"]}
              rows={data.byDepartment.map((d) => [
                d.department,
                fmt(d.revenue),
                data.summary.totalCollected > 0
                  ? pct((d.revenue / data.summary.totalCollected) * 100)
                  : "—",
              ])}
              emptyMsg="No department data"
            />

            {/* Academic Year Revenue */}
            <ReportTable
              title="Revenue by Academic Year"
              headers={["Academic Year", "Revenue", "Share"]}
              rows={data.byYear.map((y) => [
                y.academicYear,
                fmt(y.revenue),
                data.summary.totalCollected > 0
                  ? pct((y.revenue / data.summary.totalCollected) * 100)
                  : "—",
              ])}
              emptyMsg="No academic year data"
            />

            {/* Payment Mode */}
            <ReportTable
              title="Collection by Payment Mode"
              headers={["Mode", "Amount", "Count", "Share"]}
              rows={data.byPaymentMode.map((p) => [
                p.mode,
                fmt(p.amount),
                String(p.count),
                data.summary.totalCollected > 0
                  ? pct((p.amount / data.summary.totalCollected) * 100)
                  : "—",
              ])}
              emptyMsg="No payment data"
            />

            {/* Monthly Collections */}
            <ReportTable
              title="Monthly Collection Summary"
              headers={["Month", "Collected", "Receipts"]}
              rows={data.monthly.map((m) => [m.month, fmt(m.collected), String(m.receipts)])}
              emptyMsg="No monthly data"
            />
          </div>

          {/* ── Footer note ── */}
          <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "right", marginBottom: 8 }}>
            Report generated: {data.generatedAt} &nbsp;·&nbsp;
            No student personal data is included in this report.
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, bg, border }: {
  icon: React.ReactNode; label: string; value: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function ReportTable({ title, headers, rows, emptyMsg }: {
  title: string; headers: string[]; rows: string[][]; emptyMsg: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(90deg,#ea580c,#fb923c)", padding: "12px 16px" }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: "30px 16px", textAlign: "center", color: "#9a3412", fontSize: 13 }}>{emptyMsg}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fff7ed" }}>
                {headers.map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, color: "#9a3412", whiteSpace: "nowrap", borderBottom: "1px solid #fed7aa" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ffedd5", background: i % 2 === 0 ? "#fff" : "#fffbf7" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "9px 14px", color: "#1e293b", whiteSpace: "nowrap" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
