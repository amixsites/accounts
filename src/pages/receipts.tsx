import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import type { ReceiptConfig } from "../lib/supabaseClient";
import { Search, Info, Printer, X } from "lucide-react";
import { convertNumberToWords } from "../utils/numberToWords";
import "../styles/receipts.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TxLine {
  fee_types: { fee_name: string } | null;
  amount: number;
}

interface Receipt {
  id: number;
  receipt_number: string;
  receipt_date: string;
  total_amount: number;
  payment_mode: string;
  transaction_reference: string | null;
  remarks: string | null;
  students: {
    roll_number: string;
    student_name: string;
    branches:       { branch_name: string; branch_code: string } | null;
    courses:        { course_name: string } | null;
    academic_years: { year_name: string }  | null;
  } | null;
  users: { full_name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt   = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

// ─── Component ────────────────────────────────────────────────────────────────
export default function Receipts() {
  const [receipts,    setReceipts]    = useState<Receipt[]>([]);
  const [query,       setQuery]       = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [selected,    setSelected]    = useState<Receipt | null>(null);
  const [txLines,     setTxLines]     = useState<TxLine[]>([]);
  const [config,      setConfig]      = useState<ReceiptConfig | null>(null);
  const [loading,     setLoading]     = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Data load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchReceipts();
    fetchConfig();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("receipts")
      .select(`
        id, receipt_number, receipt_date, total_amount,
        payment_mode, transaction_reference, remarks,
        students (
          roll_number, student_name,
          branches       ( branch_name, branch_code ),
          courses        ( course_name ),
          academic_years ( year_name )
        ),
        users:collected_by ( full_name )
      `)
      .order("receipt_date", { ascending: false });

    if (!error && data) setReceipts(data as unknown as Receipt[]);
    setLoading(false);
  };

  const fetchConfig = async () => {
    const { data } = await supabase.from("receipt_config").select("*").limit(1).single();
    if (data) setConfig(data as ReceiptConfig);
  };

  const fetchTxLines = async (receiptId: number) => {
    const { data } = await supabase
      .from("transactions")
      .select("amount, fee_types ( fee_name )")
      .eq("receipt_id", receiptId);
    if (data) setTxLines(data as unknown as TxLine[]);
  };

  const handleSelect = (r: Receipt) => {
    setSelected(r);
    fetchTxLines(r.id);
  };

  // ── Print: inject only receipt HTML into an iframe ────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Receipt - ${selected?.receipt_number}</title>
<style>
  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Page ── */
  .rp {
    width: 190mm;
    margin: 10mm auto;
    padding: 0;
  }

  /* ── Outer border ── */
  .rp-border {
    border: 2px solid #000;
    padding: 8mm 10mm 6mm;
  }

  /* ── College header ── */
  .rp-college-name {
    text-align: center;
    font-size: 16pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1.3;
  }
  .rp-college-sub {
    text-align: center;
    font-size: 9pt;
    color: #333;
    margin-top: 3px;
    line-height: 1.5;
  }
  .rp-divider {
    border: none;
    border-top: 2px solid #000;
    margin: 5mm 0 4mm;
  }
  .rp-divider-thin {
    border: none;
    border-top: 1px solid #555;
    margin: 3mm 0;
  }

  /* ── Title row ── */
  .rp-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4mm;
  }
  .rp-title {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-decoration: underline;
  }
  .rp-receipt-no {
    font-size: 10pt;
    text-align: right;
  }
  .rp-receipt-no strong { font-size: 11pt; }

  /* ── Info grid ── */
  .rp-info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-bottom: 4mm;
  }
  .rp-info-table td {
    padding: 2px 0;
    vertical-align: top;
  }
  .rp-info-table .lbl {
    width: 38mm;
    font-weight: bold;
    white-space: nowrap;
  }
  .rp-info-table .sep { width: 5mm; text-align: center; }
  .rp-info-table .val { }

  /* ── Fee table ── */
  .rp-fee-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-bottom: 3mm;
  }
  .rp-fee-table th {
    background: #000;
    color: #fff;
    padding: 4px 8px;
    text-align: left;
    font-weight: bold;
  }
  .rp-fee-table th:last-child { text-align: right; }
  .rp-fee-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #ddd;
  }
  .rp-fee-table td:last-child { text-align: right; }
  .rp-fee-table tr:nth-child(even) td { background: #f7f7f7; }
  .rp-fee-table .rp-total-row td {
    border-top: 2px solid #000;
    border-bottom: none;
    font-weight: bold;
    font-size: 11pt;
    background: #e8e8e8;
    padding: 5px 8px;
  }

  /* ── Amount in words ── */
  .rp-words {
    font-size: 9.5pt;
    margin: 2mm 0 4mm;
    padding: 3px 8px;
    border: 1px dashed #777;
    border-radius: 3px;
    background: #fafafa;
  }
  .rp-words span { font-weight: bold; }

  /* ── Payment mode badge ── */
  .rp-pay-row {
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
    margin-bottom: 3mm;
  }
  .rp-pay-badge {
    background: #000;
    color: #fff;
    padding: 2px 10px;
    border-radius: 3px;
    font-size: 9pt;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  /* ── Footer ── */
  .rp-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 10mm;
  }
  .rp-footer-left { font-size: 9pt; color: #555; line-height: 1.6; }
  .rp-footer-right { text-align: center; }
  .rp-sig-line {
    border-top: 1px solid #000;
    width: 55mm;
    padding-top: 3px;
    font-size: 9pt;
    font-weight: bold;
  }
  .rp-sig-desig { font-size: 8.5pt; color: #333; }

  /* ── Stamp area ── */
  .rp-stamp {
    width: 30mm;
    height: 30mm;
    border: 1px dashed #aaa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8pt;
    color: #aaa;
    margin-bottom: 4mm;
  }

  /* ── Watermark ── */
  .rp-watermark {
    position: relative;
  }
  .rp-watermark::after {
    content: 'ORIGINAL';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 48pt;
    font-weight: bold;
    color: rgba(0,0,0,0.04);
    pointer-events: none;
    white-space: nowrap;
  }

  @page { size: A4; margin: 12mm; }
</style>
</head>
<body>
${printRef.current.innerHTML}
</body>
</html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  // ── Filtered receipts ──────────────────────────────────────────────────────
  const filtered = receipts.filter((r) => {
    const q = query.toLowerCase();
    const matchesQuery = (
      r.receipt_number.toLowerCase().includes(q) ||
      (r.students?.student_name ?? "").toLowerCase().includes(q) ||
      (r.students?.roll_number ?? "").toLowerCase().includes(q)
    );

    let matchesDate = true;
    if (r.receipt_date) {
      const txDate = new Date(r.receipt_date);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) matchesDate = false;
      }
    } else if (startDate || endDate) {
      matchesDate = false;
    }

    return matchesQuery && matchesDate;
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rcp-page">

      {/* ── Page header ── */}
      <div className="rcp-page-header">
        <h2>Receipts</h2>
        <p>Search, view and reprint fee receipts</p>
      </div>

      {/* ── Search bar + Date Filters ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div className="rcp-search-bar" style={{ marginBottom: 0, flex: "1 1 300px" }}>
          <Search size={18} className="rcp-search-icon" />
          <input
            type="text"
            className="rcp-search-input"
            placeholder="Search by receipt number, student name or roll number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="rcp-search-clear" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="rcp-date-filters" style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", padding: "0 12px", borderRadius: "9px", border: "1.5px solid #fdba74", flexShrink: 0 }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#ea580c" }}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ border: "none", outline: "none", padding: "10px 0", fontSize: "14px", color: "#1e293b", background: "transparent" }}
          />
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#ea580c", marginLeft: "8px" }}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ border: "none", outline: "none", padding: "10px 0", fontSize: "14px", color: "#1e293b", background: "transparent" }}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: "4px", display: "flex", alignItems: "center", borderRadius: "4px" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Two-pane layout ── */}
      <div className="rcp-layout">

        {/* Left: receipt list */}
        <div className="rcp-list-pane">
          {loading ? (
            <div className="rcp-empty"><div className="rcp-spinner" /><p>Loading receipts…</p></div>
          ) : filtered.length === 0 ? (
            <div className="rcp-empty"><p>No receipts found{query ? ` for "${query}"` : ""}.</p></div>
          ) : (
            <table className="rcp-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={selected?.id === r.id ? "rcp-row-active" : ""}
                    onClick={() => handleSelect(r)}
                  >
                    <td className="rcp-rcpt-no">{r.receipt_number}</td>
                    <td className="rcp-date">{fmtDt(r.receipt_date)}</td>
                    <td>
                      <div className="rcp-student-name">{r.students?.student_name}</div>
                      <div className="rcp-student-roll">{r.students?.roll_number}</div>
                    </td>
                    <td className="rcp-amount">{fmt(r.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: detail + print preview */}
        <div className="rcp-detail-pane">
          {!selected ? (
            <div className="rcp-empty rcp-empty-detail">
              <Info size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Select a receipt from the list to view details</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="rcp-detail-header">
                <div>
                  <div className="rcp-detail-title">Receipt Details</div>
                  <div className="rcp-detail-sub">{selected.receipt_number}</div>
                </div>
                <button className="rcp-print-btn" onClick={handlePrint}>
                  <Printer size={16} /> Print Receipt
                </button>
              </div>

              {/* Quick summary grid */}
              <div className="rcp-summary-grid">
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Receipt No</span>
                  <span className="rcp-val rcp-val-accent">{selected.receipt_number}</span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Date</span>
                  <span className="rcp-val">{fmtDt(selected.receipt_date)}</span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Student</span>
                  <span className="rcp-val">{selected.students?.student_name}</span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Roll Number</span>
                  <span className="rcp-val">{selected.students?.roll_number}</span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Branch</span>
                  <span className="rcp-val">{selected.students?.branches?.branch_name ?? "—"}</span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Academic Year</span>
                  <span className="rcp-val">{selected.students?.academic_years?.year_name ?? "—"}</span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Payment Mode</span>
                  <span className="rcp-val">
                    <span className="rcp-mode-badge">{selected.payment_mode}</span>
                  </span>
                </div>
                <div className="rcp-summary-cell">
                  <span className="rcp-lbl">Collected By</span>
                  <span className="rcp-val">{selected.users?.full_name ?? "—"}</span>
                </div>
                {selected.transaction_reference && (
                  <div className="rcp-summary-cell" style={{ gridColumn: "1 / -1" }}>
                    <span className="rcp-lbl">Ref / UPI / Cheque No</span>
                    <span className="rcp-val">{selected.transaction_reference}</span>
                  </div>
                )}
                {selected.remarks && (
                  <div className="rcp-summary-cell" style={{ gridColumn: "1 / -1" }}>
                    <span className="rcp-lbl">Remarks</span>
                    <span className="rcp-val">{selected.remarks}</span>
                  </div>
                )}
              </div>

              {/* Fee breakdown */}
              <div className="rcp-breakdown-title">Fee Breakdown</div>
              <table className="rcp-breakdown-table">
                <thead>
                  <tr>
                    <th>Fee Type</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {txLines.map((t, i) => (
                    <tr key={i}>
                      <td>{t.fee_types?.fee_name}</td>
                      <td style={{ textAlign: "right" }}>{fmt(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="rcp-total-row">
                    <td>Total Paid</td>
                    <td style={{ textAlign: "right" }}>{fmt(selected.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Hidden print-only receipt  (rendered in iframe)
          This div is NEVER visible on screen.
      ══════════════════════════════════════════════════════ */}
      {selected && (
        <div style={{ display: "none" }}>
          <div ref={printRef}>
            <div className="rp rp-watermark">
              <div className="rp-border">

                {/* ── College header ── */}
                <div className="rp-college-name">
                  {config?.college_name ?? "Kakatiya Institute of Technology & Science for Women"}
                </div>
                {(config?.college_address || config?.college_phone || config?.college_email) && (
                  <div className="rp-college-sub">
                    {config?.college_address && <span>{config.college_address}</span>}
                    {(config?.college_phone || config?.college_email) && (
                      <span>
                        {config?.college_address ? " | " : ""}
                        {config?.college_phone && `Ph: ${config.college_phone}`}
                        {config?.college_phone && config?.college_email && " | "}
                        {config?.college_email && `Email: ${config.college_email}`}
                      </span>
                    )}
                  </div>
                )}
                <hr className="rp-divider" />

                {/* ── Title + receipt no ── */}
                <div className="rp-title-row">
                  <div className="rp-title">Fee Receipt</div>
                  <div className="rp-receipt-no">
                    <div>Receipt No: <strong>{selected.receipt_number}</strong></div>
                    <div>Date: <strong>{fmtDt(selected.receipt_date)}</strong></div>
                  </div>
                </div>

                <hr className="rp-divider-thin" />

                {/* ── Student info ── */}
                <table className="rp-info-table">
                  <tbody>
                    <tr>
                      <td className="lbl">Student Name</td>
                      <td className="sep">:</td>
                      <td className="val"><strong>{selected.students?.student_name}</strong></td>
                      <td className="lbl" style={{ paddingLeft: "10mm" }}>Roll Number</td>
                      <td className="sep">:</td>
                      <td className="val"><strong>{selected.students?.roll_number}</strong></td>
                    </tr>
                    <tr>
                      <td className="lbl">Course / Branch</td>
                      <td className="sep">:</td>
                      <td className="val">
                        {selected.students?.courses?.course_name ?? "—"}
                        {selected.students?.branches?.branch_name ? ` / ${selected.students.branches.branch_name}` : ""}
                      </td>
                      <td className="lbl" style={{ paddingLeft: "10mm" }}>Academic Year</td>
                      <td className="sep">:</td>
                      <td className="val">{selected.students?.academic_years?.year_name ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>

                <hr className="rp-divider-thin" />

                {/* ── Fee table ── */}
                <table className="rp-fee-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description / Fee Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txLines.map((t, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{t.fee_types?.fee_name ?? "Fee"}</td>
                        <td>{fmt(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="rp-total-row">
                      <td colSpan={2}>Total Amount Paid</td>
                      <td>{fmt(selected.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* ── Amount in words ── */}
                <div className="rp-words">
                  Rupees in words: <span>{convertNumberToWords(selected.total_amount)}</span>
                </div>

                {/* ── Payment mode + ref ── */}
                <div className="rp-pay-row">
                  <div>
                    Mode of Payment:&nbsp;
                    <span className="rp-pay-badge">{selected.payment_mode}</span>
                    {selected.transaction_reference && (
                      <span style={{ marginLeft: 8, fontSize: "9pt" }}>
                        Ref: <strong>{selected.transaction_reference}</strong>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "9pt" }}>
                    Received by: <strong>{selected.users?.full_name ?? "—"}</strong>
                  </div>
                </div>

                {selected.remarks && (
                  <div style={{ fontSize: "9pt", marginBottom: "3mm", color: "#444" }}>
                    Remarks: {selected.remarks}
                  </div>
                )}

                {/* ── Footer ── */}
                <div className="rp-footer">
                  <div className="rp-footer-left">
                    <div>Generated on: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
                    <div style={{ marginTop: 4, color: "#888" }}>This is a computer generated receipt.</div>
                  </div>
                  <div className="rp-footer-right">
                    <div className="rp-stamp">Office Seal</div>
                    <div className="rp-sig-line">
                      {config?.authorized_signatory_name ?? "Authorized Signatory"}
                    </div>
                    <div className="rp-sig-desig">
                      {config?.authorized_signatory_designation ?? "Accounts Department"}
                    </div>
                  </div>
                </div>

              </div>{/* rp-border */}
            </div>{/* rp */}
          </div>
        </div>
      )}
    </div>
  );
}
