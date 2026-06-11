import { useState, useEffect, useMemo, useRef } from "react";
import { supabase, type FeeType, type User } from "../lib/supabaseClient";
import {
  Search, Plus, Trash2, FileText, X,
  Users, IndianRupee, Calculator,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeItem {
  fee_type_id: number;
  fee_name:    string;
  amount:      number;
}

interface StudentRow {
  id:               number;
  student_name:     string;
  roll_number:      string;
  total_fee_amount: number;
  amount_paid:      number;
  due_amount:       number;
  academic_year_id: number;
  courses:        { course_name: string } | null;
  branches:       { branch_name: string } | null;
  academic_years: { year_name:  string } | null;
}

// ─── Pure helper ──────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ─── Sub-component (outside FeeCollection — never re-declared on render) ─────
function SummaryCard({
  label, value, color, bg, border,
}: {
  label: string; value: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{ padding: "14px 18px", background: bg, border: `1.5px solid ${border}`, borderRadius: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FeeCollection() {

  // ── Remote data (server state) ────────────────────────────────────────────
  const [allStudents,    setAllStudents]    = useState<StudentRow[]>([]);
  const [feeTypes,       setFeeTypes]       = useState<FeeType[]>([]);
  const [collectors,     setCollectors]     = useState<User[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // ── Search UI ─────────────────────────────────────────────────────────────
  const [rollQuery,     setRollQuery]     = useState("");
  const [showDropdown,  setShowDropdown]  = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── User inputs — the ONLY things in state ────────────────────────────────
  const [student,          setStudent]          = useState<StudentRow | null>(null);
  const [inputTotalFees,   setInputTotalFees]   = useState<number | "">("");
  const [inputAlreadyPaid, setInputAlreadyPaid] = useState<number | "">("");
  const [amountPayingNow,  setAmountPayingNow]  = useState<number | "">("");
  const [paymentMode,      setPaymentMode]      = useState("Cash");
  const [selectedFees,     setSelectedFees]     = useState<FeeItem[]>([]);
  const [transactionRef,   setTransactionRef]   = useState("");
  const [collectedBy,      setCollectedBy]      = useState("");
  const [remarks,          setRemarks]          = useState("");
  const [touchedPayNow,    setTouchedPayNow]    = useState(false);

  // ── Async status ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Load static data once ─────────────────────────────────────────────────
  useEffect(() => {
    fetchAllStudents();
    fetchFeeTypes();
    fetchCollectors();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  async function fetchAllStudents() {
    setStudentsLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select(`
        id, student_name, roll_number,
        total_fee_amount, amount_paid, due_amount, academic_year_id,
        courses       ( course_name ),
        branches      ( branch_name ),
        academic_years( year_name )
      `)
      .eq("is_active", true)
      .order("roll_number");

    if (error) {
      // Columns not yet added — fallback query without them
      const { data: fb } = await supabase
        .from("students")
        .select(`
          id, student_name, roll_number, total_fee_amount, academic_year_id,
          courses(course_name), branches(branch_name), academic_years(year_name)
        `)
        .eq("is_active", true)
        .order("roll_number");
      if (fb) {
        setAllStudents(
          (fb as unknown as StudentRow[]).map((s) => ({
            ...s, amount_paid: 0, due_amount: s.total_fee_amount,
          }))
        );
      }
    } else if (data) {
      setAllStudents(
        (data as unknown as StudentRow[]).map((s) => ({
          ...s,
          amount_paid: s.amount_paid ?? 0,
          due_amount:  s.due_amount  ?? s.total_fee_amount,
        }))
      );
    }
    setStudentsLoading(false);
  }

  async function fetchFeeTypes() {
    const { data } = await supabase.from("fee_types").select("*").eq("is_active", true);
    if (data) setFeeTypes(data);
  }

  async function fetchCollectors() {
    const { data } = await supabase.from("users").select("*").eq("is_active", true);
    if (data) setCollectors(data);
  }

  // ── Filtered student list (memoised — depends only on rollQuery + allStudents) ──
  const filteredStudents = useMemo(() => {
    const q = rollQuery.trim().toUpperCase();
    return q
      ? allStudents.filter((s) => s.roll_number.toUpperCase().includes(q))
      : allStudents;
  }, [rollQuery, allStudents]);

  // ─────────────────────────────────────────────────────────────────────────
  // ALL DERIVED VALUES — computed during render, never stored in state
  // ─────────────────────────────────────────────────────────────────────────
  const totalFees   = typeof inputTotalFees   === "number" ? inputTotalFees   : 0;
  const alreadyPaid = typeof inputAlreadyPaid === "number" ? inputAlreadyPaid : 0;
  const currentDue  = Math.max(0, totalFees - alreadyPaid);

  const payNow          = typeof amountPayingNow === "number" ? amountPayingNow : 0;
  const newTotalPaid    = alreadyPaid + payNow;
  const newRemainingDue = Math.max(0, totalFees - newTotalPaid);
  const statusAfter     = newRemainingDue <= 0 ? "Paid" : newTotalPaid > 0 ? "Partial" : "Due";

  const hasFeeInfo    = totalFees > 0;
  const payNowTouched = touchedPayNow && typeof amountPayingNow === "number";
  const payNowExceeds = payNowTouched && amountPayingNow > currentDue;

  const breakdownTotal = selectedFees.reduce((sum, f) => sum + f.amount, 0);
  const breakdownMismatch = payNow > 0 && selectedFees.length > 0 && Math.abs(breakdownTotal - payNow) > 0.01;

  // Submit button is enabled only when the minimum required inputs are filled
  const canSubmit = !loading && hasFeeInfo && payNow > 0 && !payNowExceeds;

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleRollInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setRollQuery(val);
    setShowDropdown(true);
    if (!val.trim()) {
      setStudent(null);
      setMessage(null);
    }
  }

  function handleClearSearch() {
    setRollQuery("");
    setStudent(null);
    setShowDropdown(false);
    setMessage(null);
  }

  function handleSelectStudent(s: StudentRow) {
    setStudent(s);
    setRollQuery(s.roll_number);
    setShowDropdown(false);
    setMessage(null);
    // Pre-fill inputs from DB record — user can still edit them
    setInputTotalFees(s.total_fee_amount);
    setInputAlreadyPaid(s.amount_paid ?? 0);
    setAmountPayingNow("");
    setSelectedFees([]);
    setTouchedPayNow(false);
  }

  // ── Fee breakdown helpers ─────────────────────────────────────────────────
  function addFeeItem() {
    if (!feeTypes.length) return;
    // Auto-fill amount from payNow when adding the first item
    const defaultAmount = selectedFees.length === 0 && payNow > 0 ? payNow : 0;
    setSelectedFees((prev) => [
      ...prev,
      { fee_type_id: feeTypes[0].id, fee_name: feeTypes[0].fee_name, amount: defaultAmount },
    ]);
  }

  function removeFeeItem(i: number) {
    setSelectedFees((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateFeeItem(i: number, field: "fee_type_id" | "amount", value: number) {
    setSelectedFees((prev) => {
      const updated = [...prev];
      if (field === "fee_type_id") {
        const ft = feeTypes.find((f) => f.id === value);
        updated[i] = { ...updated[i], fee_type_id: value, fee_name: ft?.fee_name ?? "" };
      } else {
        updated[i] = { ...updated[i], amount: value };
      }
      return updated;
    });
  }

  // ── Reset form ────────────────────────────────────────────────────────────
  function resetForm() {
    setRollQuery(""); setStudent(null);
    setInputTotalFees(""); setInputAlreadyPaid("");
    setAmountPayingNow(""); setPaymentMode("Cash");
    setSelectedFees([]); setTransactionRef("");
    setCollectedBy(""); setRemarks("");
    setMessage(null); setTouchedPayNow(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouchedPayNow(true);

    // Validate — all derived from existing state, no extra state needed
    if (!student)          return setMessage({ type: "error", text: "Please select a student first." });
    if (!hasFeeInfo)       return setMessage({ type: "error", text: "Please enter the total fees amount." });
    if (payNow <= 0)       return setMessage({ type: "error", text: "Please enter a valid amount to pay now." });
    if (payNow > currentDue) return setMessage({ type: "error", text: `Amount cannot exceed current due (${fmt(currentDue)}).` });
    if (!selectedFees.length) return setMessage({ type: "error", text: "Please add at least one fee breakdown item." });
    if (breakdownTotal <= 0)  return setMessage({ type: "error", text: "Fee breakdown total must be greater than zero." });
    if (Math.abs(breakdownTotal - payNow) > 0.01)
      return setMessage({ type: "error", text: `Breakdown total (${fmt(breakdownTotal)}) must equal Amount Paying Now (${fmt(payNow)}).` });
    if (!collectedBy) return setMessage({ type: "error", text: "Please select who collected this payment." });

    setLoading(true);
    setMessage(null);

    try {
      const { data: receiptNum, error: rnErr } = await supabase.rpc("generate_receipt_number");
      if (rnErr) throw rnErr;

      const { data: receipt, error: rErr } = await supabase
        .from("receipts")
        .insert({
          receipt_number:        receiptNum,
          student_id:            student.id,
          receipt_date:          new Date().toISOString().split("T")[0],
          total_amount:          payNow,
          payment_mode:          paymentMode,
          transaction_reference: transactionRef || null,
          remarks:               remarks || null,
          collected_by:          collectedBy,
        })
        .select()
        .single();
      if (rErr) throw rErr;

      const { error: txErr } = await supabase.from("transactions").insert(
        selectedFees.map((fee) => ({
          receipt_id:       receipt.id,
          student_id:       student.id,
          fee_type_id:      fee.fee_type_id,
          amount:           fee.amount,
          academic_year_id: student.academic_year_id,
        }))
      );
      if (txErr) throw txErr;

      // Compute updated student totals — derived here, not stored in state
      const newPaid   = alreadyPaid + payNow;
      const newDue    = totalFees - newPaid;
      const newStatus = newDue <= 0 ? "Paid" : newPaid > 0 ? "Partial" : "Due";

      console.log("Fee Collection Saved:", { receipt_number: receiptNum, student_id: student.id, total_amount: payNow, payment_mode: paymentMode });

      // Update student record — total_fee_amount kept in sync too
      const { error: su1 } = await supabase
        .from("students")
        .update({ total_fee_amount: totalFees, amount_paid: newPaid, due_amount: newDue, fee_status: newStatus })
        .eq("id", student.id);

      if (su1) {
        // Fallback: columns may not exist yet
        const { error: su2 } = await supabase
          .from("students")
          .update({ total_fee_amount: totalFees })
          .eq("id", student.id);
        if (su2) console.warn("Student update skipped — run database/FIX_SYNC.sql in Supabase.");
      }

      console.log("Student Fee Summary Updated:", { student_id: student.id, total_fee_amount: totalFees, amount_paid: newPaid, due_amount: newDue, fee_status: newStatus });

      setMessage({ type: "success", text: `✅ Payment recorded! Receipt No: ${receiptNum}` });
      setTimeout(resetForm, 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <h1>Fee Collection</h1>
        <p>Collect student fees and generate receipts</p>
      </div>

      {/* Global alert */}
      {message && (
        <div style={{
          padding: "14px 18px", marginBottom: 20, borderRadius: 8, fontSize: 14,
          background: message.type === "success" ? "#d1fae5" : "#fee2e2",
          color:      message.type === "success" ? "#065f46" : "#991b1b",
          border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
        }}>
          {message.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 1 — Student Search
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 4px", color: "#ea580c" }}>Step 1: Search Student</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>
          Type any part of the roll number — results update instantly.
        </p>

        <div ref={searchRef} style={{ position: "relative" }}>
          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", border: "2px solid #ea580c", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
            <span style={{ padding: "0 12px", display: "flex", alignItems: "center", color: "#ea580c", flexShrink: 0 }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={studentsLoading ? "Loading students…" : "Type roll number  e.g. CSE001…"}
              value={rollQuery}
              onChange={handleRollInput}
              onFocus={() => setShowDropdown(true)}
              disabled={studentsLoading}
              autoComplete="off"
              style={{ flex: 1, padding: "12px 4px", border: "none", outline: "none", fontSize: 15, fontFamily: "inherit", background: "transparent" }}
            />
            {rollQuery && (
              <span style={{ padding: "4px 12px", fontSize: 12, color: "#9a3412", background: "#ffedd5", borderRadius: 20, whiteSpace: "nowrap", marginRight: 6, fontWeight: 600 }}>
                {filteredStudents.length === allStudents.length
                  ? `All ${allStudents.length}`
                  : `${filteredStudents.length} / ${allStudents.length}`}
              </span>
            )}
            {rollQuery && (
              <button
                onClick={handleClearSearch}
                style={{ padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: "#9a3412", display: "flex", alignItems: "center" }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && rollQuery && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #fdba74", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.13)", zIndex: 200, maxHeight: 280, overflowY: "auto" }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "#9a3412", fontSize: 14 }}>
                  <Users size={28} style={{ marginBottom: 6, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>No students found for <strong>"{rollQuery}"</strong></p>
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const q   = rollQuery.trim().toUpperCase();
                  const idx = s.roll_number.toUpperCase().indexOf(q);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      style={{ padding: "11px 16px", cursor: "pointer", borderBottom: "1px solid #ffedd5", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{s.student_name}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#9a3412" }}>
                          {s.roll_number.slice(0, idx)}
                          <span style={{ background: "#fdba74", borderRadius: 3, padding: "0 2px" }}>
                            {s.roll_number.slice(idx, idx + q.length)}
                          </span>
                          {s.roll_number.slice(idx + q.length)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {s.branches?.branch_name && (
                          <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20 }}>
                            {s.branches.branch_name}
                          </span>
                        )}
                        {s.academic_years?.year_name && (
                          <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20 }}>
                            {s.academic_years.year_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected student card */}
        {student && (
          <div style={{ marginTop: 16, padding: "16px 20px", background: "#f0fdf4", border: "2px solid #10b981", borderRadius: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 10px", color: "#065f46", fontSize: 14 }}>✅ Student Selected</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "8px 20px" }}>
                <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Name: </span><strong>{student.student_name}</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Roll No: </span><strong style={{ fontFamily: "monospace" }}>{student.roll_number}</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Course: </span>{student.courses?.course_name ?? "—"}</div>
                <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Branch: </span>{student.branches?.branch_name ?? "—"}</div>
                <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Year: </span>{student.academic_years?.year_name ?? "—"}</div>
              </div>
            </div>
            <button
              onClick={resetForm}
              style={{ background: "none", border: "1px solid #10b981", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#065f46" }}
            >
              Change
            </button>
          </div>
        )}

        {!rollQuery && !student && (
          <div style={{ marginTop: 10, fontSize: 13, color: "#9a3412", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} />
            {studentsLoading ? "Loading…" : `${allStudents.length} students available`}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STEPS 2 – 4  (visible only after a student is selected)
      ═══════════════════════════════════════════════════════════════════ */}
      {student && (
        <form onSubmit={handleSubmit}>

          {/* ─────────────────────────────────────────────────────────
              STEP 2 — Payment Details
          ───────────────────────────────────────────────────────── */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Calculator size={16} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#ea580c", fontSize: 16 }}>Step 2: Payment Details</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Enter fee amounts and payment method</p>
              </div>
            </div>

            {/* 2A — Fee summary inputs */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <IndianRupee size={13} /> Fee Summary
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Total Fees *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 125000"
                  value={inputTotalFees}
                  onChange={(e) => {
                    setInputTotalFees(e.target.value === "" ? "" : Number(e.target.value));
                    setAmountPayingNow(""); // reset dependent input
                  }}
                  min={0}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Amount Already Paid <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={inputAlreadyPaid}
                  onChange={(e) => {
                    setInputAlreadyPaid(e.target.value === "" ? "" : Number(e.target.value));
                    setAmountPayingNow("");
                  }}
                  min={0}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>

            {/* Calculated summary cards — rendered from derived values, no extra state */}
            {hasFeeInfo ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
                <SummaryCard label="Total Fees"   value={fmt(totalFees)}   color="#1e293b" bg="#f8fafc" border="#cbd5e1" />
                <SummaryCard label="Already Paid" value={fmt(alreadyPaid)} color="#16a34a" bg="#f0fdf4" border="#10b981" />
                <SummaryCard
                  label="Current Due"
                  value={fmt(currentDue)}
                  color={currentDue > 0 ? "#dc2626" : "#16a34a"}
                  bg={currentDue > 0 ? "#fef2f2" : "#f0fdf4"}
                  border={currentDue > 0 ? "#fca5a5" : "#10b981"}
                />
              </div>
            ) : (
              <div style={{ padding: "14px 18px", background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 10, marginBottom: 24, color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <IndianRupee size={15} />
                Enter total fees above to calculate the due amount automatically.
              </div>
            )}

            {/* 2B — Payment inputs */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Payment
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
              {/* Amount paying now */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Amount Paying Now *
                </label>
                <input
                  type="number"
                  placeholder={hasFeeInfo ? `Max ${fmt(currentDue)}` : "Enter total fees first"}
                  value={amountPayingNow}
                  onChange={(e) => {
                    setAmountPayingNow(e.target.value === "" ? "" : Number(e.target.value));
                    setTouchedPayNow(true);
                  }}
                  onBlur={() => setTouchedPayNow(true)}
                  min={1}
                  max={currentDue || undefined}
                  disabled={!hasFeeInfo}
                  style={{
                    width: "100%", padding: "10px 12px", boxSizing: "border-box",
                    border: `1.5px solid ${payNowExceeds ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                    background: !hasFeeInfo ? "#f9fafb" : "#fff",
                    cursor: !hasFeeInfo ? "not-allowed" : "text",
                  }}
                  required
                />
                {/* Helper text — all derived, no state */}
                {!hasFeeInfo && (
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: "#94a3b8" }}>
                    Remaining due will be calculated automatically.
                  </p>
                )}
                {hasFeeInfo && !payNowTouched && (
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b" }}>
                    Current due: <strong>{fmt(currentDue)}</strong>
                  </p>
                )}
                {payNowExceeds && (
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626" }}>
                    Cannot exceed current due ({fmt(currentDue)})
                  </p>
                )}
                {hasFeeInfo && payNowTouched && !payNowExceeds && payNow > 0 && (
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: "#16a34a" }}>✓ Valid amount</p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14 }}
                  required
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Cheque">📄 Cheque</option>
                  <option value="DD">📋 DD</option>
                </select>
              </div>
            </div>

            {/* Live preview — shown only when there's a valid, non-exceeding amount */}
            {hasFeeInfo && payNow > 0 && !payNowExceeds && (
              <div style={{ padding: "18px 20px", background: "linear-gradient(135deg,#fffbeb,#fff7ed)", border: "1.5px solid #f59e0b", borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>
                  📊 Live Payment Preview
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px 20px" }}>
                  {[
                    { label: "Total Fees",         val: fmt(totalFees),       color: "#1e293b" },
                    { label: "Previously Paid",     val: fmt(alreadyPaid),     color: "#16a34a" },
                    { label: "Paying Now",          val: fmt(payNow),          color: "#d97706" },
                    { label: "Total Paid After",    val: fmt(newTotalPaid),    color: "#16a34a" },
                    { label: "Remaining Due After", val: fmt(newRemainingDue), color: newRemainingDue === 0 ? "#16a34a" : "#dc2626" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ fontSize: 13 }}>
                      <div style={{ color: "#78350f", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color }}>{val}</div>
                    </div>
                  ))}
                  <div style={{ fontSize: 13 }}>
                    <div style={{ color: "#78350f", marginBottom: 6 }}>Status After</div>
                    <span style={{
                      display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, width: "fit-content",
                      background: statusAfter === "Paid" ? "#dcfce7" : "#fef3c7",
                      color:      statusAfter === "Paid" ? "#15803d" : "#92400e",
                      border: `1px solid ${statusAfter === "Paid" ? "#86efac" : "#fcd34d"}`,
                    }}>
                      {statusAfter === "Paid" ? "✅ Paid" : "⏳ Partial"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────
              STEP 3 — Fee Breakdown
          ───────────────────────────────────────────────────────── */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", color: "#ea580c", fontSize: 16 }}>Step 3: Fee Breakdown</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Break down the payment by fee type</p>
              </div>
              <button
                type="button"
                onClick={addFeeItem}
                style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13 }}
              >
                <Plus size={15} /> Add Item
              </button>
            </div>

            {selectedFees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 14 }}>
                <Plus size={28} style={{ opacity: 0.3, marginBottom: 6 }} />
                <p style={{ margin: 0 }}>Click "Add Item" to break down the payment by fee type</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedFees.map((fee, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <select
                      value={fee.fee_type_id}
                      onChange={(e) => updateFeeItem(i, "fee_type_id", Number(e.target.value))}
                      style={{ flex: 2, padding: "9px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14 }}
                      required
                    >
                      {feeTypes.map((ft) => (
                        <option key={ft.id} value={ft.id}>{ft.fee_name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={fee.amount || ""}
                      onChange={(e) => updateFeeItem(i, "amount", Number(e.target.value))}
                      style={{ flex: 1, padding: "9px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14 }}
                      min={0}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeFeeItem(i)}
                      style={{ padding: "9px 12px", background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fca5a5", borderRadius: 8, cursor: "pointer" }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Breakdown total — derived during render */}
                <div style={{ marginTop: 4, padding: "12px 16px", background: "#fefce8", border: "1.5px solid #fde047", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#713f12" }}>Breakdown Total</span>
                  <strong style={{ fontSize: 18, color: "#92400e" }}>{fmt(breakdownTotal)}</strong>
                </div>

                {/* Mismatch warning — derived during render, no state */}
                {breakdownMismatch && (
                  <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                    ⚠ Breakdown total ({fmt(breakdownTotal)}) must equal Amount Paying Now ({fmt(payNow)}).
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────
              STEP 4 — Additional Details
          ───────────────────────────────────────────────────────── */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 2px", color: "#ea580c", fontSize: 16 }}>Step 4: Additional Details</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Transaction reference, collector, and notes</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Transaction Reference {paymentMode !== "Cash" && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <input
                  type="text"
                  placeholder="UPI ID / Cheque No / Txn ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                  required={paymentMode !== "Cash"}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>
                  Collected By <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14 }}
                  required
                >
                  <option value="">— Select Collector —</option>
                  {collectors.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#374151" }}>Remarks</label>
                <textarea
                  placeholder="Additional notes (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, minHeight: 76, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingBottom: 24 }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: "12px 24px", background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "12px 28px",
                background: !canSubmit ? "#9ca3af" : "#ea580c",
                color: "#fff", border: "none", borderRadius: 8,
                cursor: !canSubmit ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 14,
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: !canSubmit ? "none" : "0 4px 12px rgba(234,88,12,0.35)",
              }}
            >
              <FileText size={17} />
              {loading ? "Processing…" : "Generate Receipt"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
