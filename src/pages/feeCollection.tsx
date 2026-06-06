import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase, type FeeType, type User } from "../lib/supabaseClient";
import { Search, Plus, Trash2, FileText, X, Users } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeItem {
  fee_type_id: number;
  fee_name: string;
  amount: number;
}

interface StudentRow {
  id: number;
  student_name: string;
  roll_number: string;
  total_fee_amount: number;
  academic_year_id: number;
  courses:       { course_name: string }  | null;
  branches:      { branch_name: string }  | null;
  academic_years:{ year_name: string }    | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FeeCollection() {
  // ── All students (fetched once) ───────────────────────────────────────────
  const [allStudents, setAllStudents]     = useState<StudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // ── Search state ──────────────────────────────────────────────────────────
  const [rollQuery, setRollQuery]         = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const searchRef                         = useRef<HTMLDivElement>(null);

  // ── Selected student (fee form) ───────────────────────────────────────────
  const [student, setStudent]             = useState<StudentRow | null>(null);

  // ── Fee form ──────────────────────────────────────────────────────────────
  const [feeTypes, setFeeTypes]           = useState<FeeType[]>([]);
  const [collectors, setCollectors]       = useState<User[]>([]);
  const [selectedFees, setSelectedFees]   = useState<FeeItem[]>([]);
  const [paymentMode, setPaymentMode]     = useState("Cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [collectedBy, setCollectedBy]     = useState("");
  const [remarks, setRemarks]             = useState("");
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllStudents();
    fetchFeeTypes();
    fetchCollectors();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAllStudents = async () => {
    setStudentsLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select(`
        id, student_name, roll_number, total_fee_amount, academic_year_id,
        courses       ( course_name ),
        branches      ( branch_name ),
        academic_years( year_name )
      `)
      .eq("is_active", true)
      .order("roll_number");

    if (!error && data) setAllStudents(data as unknown as StudentRow[]);
    setStudentsLoading(false);
  };

  const fetchFeeTypes = async () => {
    const { data, error } = await supabase.from("fee_types").select("*").eq("is_active", true);
    if (!error && data) setFeeTypes(data);
  };

  const fetchCollectors = async () => {
    const { data, error } = await supabase.from("users").select("*").eq("is_active", true);
    if (!error && data) setCollectors(data);
  };

  // ── Real-time filtered results (useMemo — no re-fetch needed) ─────────────
  const filteredStudents = useMemo(() => {
    const q = rollQuery.trim().toUpperCase();
    if (!q) return allStudents;
    return allStudents.filter((s) => s.roll_number.toUpperCase().includes(q));
  }, [rollQuery, allStudents]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRollInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRollQuery(val);
    setShowDropdown(true);
    // If user clears input, deselect student
    if (!val.trim()) {
      setStudent(null);
      setMessage(null);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setRollQuery("");
    setStudent(null);
    setShowDropdown(false);
    setMessage(null);
  }, []);

  const handleSelectStudent = useCallback((s: StudentRow) => {
    setStudent(s);
    setRollQuery(s.roll_number);
    setShowDropdown(false);
    setMessage(null);
    setSelectedFees([]);
  }, []);

  // ── Fee form helpers ──────────────────────────────────────────────────────
  const addFeeItem = () => {
    if (!feeTypes.length) return;
    setSelectedFees((prev) => [
      ...prev,
      { fee_type_id: feeTypes[0].id, fee_name: feeTypes[0].fee_name, amount: 0 },
    ]);
  };

  const removeFeeItem = (index: number) =>
    setSelectedFees((prev) => prev.filter((_, i) => i !== index));

  const updateFeeItem = (index: number, field: "fee_type_id" | "amount", value: number) => {
    setSelectedFees((prev) => {
      const updated = [...prev];
      if (field === "fee_type_id") {
        const ft = feeTypes.find((f) => f.id === value);
        updated[index] = { ...updated[index], fee_type_id: value, fee_name: ft?.fee_name ?? "" };
      } else {
        updated[index] = { ...updated[index], amount: value };
      }
      return updated;
    });
  };

  const getTotalAmount = () => selectedFees.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student) {
      setMessage({ type: "error", text: "Please select a student first" });
      return;
    }
    if (!selectedFees.length) {
      setMessage({ type: "error", text: "Please add at least one fee item" });
      return;
    }
    if (getTotalAmount() <= 0) {
      setMessage({ type: "error", text: "Total amount must be greater than zero" });
      return;
    }
    if (!collectedBy) {
      setMessage({ type: "error", text: "Please select a collector" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: receiptNumData, error: receiptNumError } = await supabase.rpc("generate_receipt_number");
      if (receiptNumError) throw receiptNumError;

      const { data: receiptData, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          receipt_number: receiptNumData,
          student_id: student.id,
          receipt_date: new Date().toISOString().split("T")[0],
          total_amount: getTotalAmount(),
          payment_mode: paymentMode,
          transaction_reference: transactionRef || null,
          remarks: remarks || null,
          collected_by: collectedBy,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      const { error: txError } = await supabase.from("transactions").insert(
        selectedFees.map((fee) => ({
          receipt_id: receiptData.id,
          student_id: student.id,
          fee_type_id: fee.fee_type_id,
          amount: fee.amount,
          academic_year_id: student.academic_year_id,
        }))
      );

      if (txError) throw txError;

      setMessage({ type: "success", text: `Fee collected successfully! Receipt No: ${receiptNumData}` });
      setTimeout(resetForm, 3000);
    } catch (err) {
      console.error("Error collecting fee:", err);
      setMessage({ type: "error", text: "Error collecting fee. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRollQuery("");
    setStudent(null);
    setSelectedFees([]);
    setPaymentMode("Cash");
    setTransactionRef("");
    setCollectedBy("");
    setRemarks("");
    setMessage(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1>Fee Collection</h1>
        <p>Collect student fees and generate receipts</p>
      </div>

      {/* Alert */}
      {message && (
        <div
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: message.type === "success" ? "#d1fae5" : "#fee2e2",
            color: message.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      {/* ── Step 1 : Student Search ── */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "6px", color: "#ea580c" }}>Step 1: Search Student by Roll Number</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>
          Type any part of the roll number — results update instantly.
        </p>

        {/* Search input + result count */}
        <div ref={searchRef} style={{ position: "relative" }}>
          {/* Input row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, border: "2px solid #ea580c", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
            {/* Icon */}
            <span style={{ padding: "0 12px", display: "flex", alignItems: "center", color: "#ea580c", flexShrink: 0 }}>
              <Search size={18} />
            </span>

            {/* Text input */}
            <input
              type="text"
              placeholder={studentsLoading ? "Loading students…" : "Type roll number  e.g. B23, B23CS001…"}
              value={rollQuery}
              onChange={handleRollInput}
              onFocus={() => setShowDropdown(true)}
              disabled={studentsLoading}
              style={{
                flex: 1,
                padding: "12px 4px",
                border: "none",
                outline: "none",
                fontSize: 15,
                fontFamily: "inherit",
                background: "transparent",
                letterSpacing: rollQuery ? "0.5px" : undefined,
              }}
              autoComplete="off"
            />

            {/* Result count badge */}
            {rollQuery && (
              <span
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  color: "#9a3412",
                  background: "#ffedd5",
                  borderRadius: 20,
                  whiteSpace: "nowrap",
                  marginRight: 6,
                  fontWeight: 600,
                }}
              >
                {filteredStudents.length === allStudents.length
                  ? `All ${allStudents.length} students`
                  : `Showing ${filteredStudents.length} of ${allStudents.length} students`}
              </span>
            )}

            {/* Clear button */}
            {rollQuery && (
              <button
                onClick={handleClearSearch}
                title="Clear search"
                style={{
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9a3412",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* ── Dropdown results ── */}
          {showDropdown && rollQuery && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1.5px solid #fdba74",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
                zIndex: 200,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {filteredStudents.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "#9a3412", fontSize: 14 }}>
                  <Users size={28} style={{ marginBottom: 6, opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>No students found matching <strong>"{rollQuery}"</strong></p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Try a shorter prefix, e.g. "B23"</p>
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const q = rollQuery.trim().toUpperCase();
                  const idx = s.roll_number.toUpperCase().indexOf(q);
                  // Highlight matched part
                  const before = s.roll_number.slice(0, idx);
                  const match  = s.roll_number.slice(idx, idx + q.length);
                  const after  = s.roll_number.slice(idx + q.length);

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      style={{
                        padding: "11px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #ffedd5",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {/* Left: name + roll */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{s.student_name}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#9a3412" }}>
                          {before}
                          <span style={{ background: "#fdba74", borderRadius: 3, padding: "0 2px" }}>{match}</span>
                          {after}
                        </span>
                      </div>

                      {/* Right: branch + year tags */}
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

        {/* ── Selected student card ── */}
        {student && (
          <div
            style={{
              marginTop: 18,
              padding: "18px 20px",
              background: "#f0fdf4",
              borderRadius: 10,
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h4 style={{ margin: "0 0 12px", color: "#065f46", fontSize: 15 }}>✅ Student Selected</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px 24px" }}>
                <div style={{ fontSize: 14 }}><span style={{ color: "#64748b" }}>Name:</span> <strong>{student.student_name}</strong></div>
                <div style={{ fontSize: 14 }}><span style={{ color: "#64748b" }}>Roll No:</span> <strong style={{ fontFamily: "monospace" }}>{student.roll_number}</strong></div>
                <div style={{ fontSize: 14 }}><span style={{ color: "#64748b" }}>Course:</span> {student.courses?.course_name ?? "—"}</div>
                <div style={{ fontSize: 14 }}><span style={{ color: "#64748b" }}>Branch:</span> {student.branches?.branch_name ?? "—"}</div>
                <div style={{ fontSize: 14 }}><span style={{ color: "#64748b" }}>Academic Year:</span> {student.academic_years?.year_name ?? "—"}</div>
                <div style={{ fontSize: 14 }}><span style={{ color: "#64748b" }}>Total Fee:</span> <strong>{formatCurrency(student.total_fee_amount)}</strong></div>
              </div>
            </div>
            <button
              onClick={resetForm}
              title="Change student"
              style={{ background: "none", border: "1px solid #10b981", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#065f46", whiteSpace: "nowrap" }}
            >
              Change
            </button>
          </div>
        )}

        {/* Empty state hint when nothing typed yet */}
        {!rollQuery && !student && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#9a3412", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={15} />
            <span>
              {studentsLoading
                ? "Loading student list…"
                : `${allStudents.length} student${allStudents.length !== 1 ? "s" : ""} available — start typing to filter`}
            </span>
          </div>
        )}
      </div>

      {/* ── Steps 2 & 3 only show after a student is selected ── */}
      {student && (
        <form onSubmit={handleSubmit}>
          {/* Step 2: Fee Selection */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ color: "#ea580c", margin: 0 }}>Step 2: Select Fee Types</h3>
              <button
                type="button"
                onClick={addFeeItem}
                style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}
              >
                <Plus size={17} /> Add Fee
              </button>
            </div>

            {selectedFees.length === 0 ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "20px 0", fontSize: 14 }}>Click "Add Fee" to add fee items</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedFees.map((fee, index) => (
                  <div key={index} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <select
                      value={fee.fee_type_id}
                      onChange={(e) => updateFeeItem(index, "fee_type_id", Number(e.target.value))}
                      style={{ flex: 2, padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
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
                      onChange={(e) => updateFeeItem(index, "amount", Number(e.target.value))}
                      style={{ flex: 1, padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
                      min="0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeFeeItem(index)}
                      style={{ padding: 10, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 6, padding: "14px 18px", background: "#fef3c7", borderRadius: 8, textAlign: "right" }}>
                  <strong style={{ fontSize: 19, color: "#92400e" }}>Total: {formatCurrency(getTotalAmount())}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Payment Details */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.09)", marginBottom: "20px" }}>
            <h3 style={{ marginBottom: 14, color: "#ea580c" }}>Step 3: Payment Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {/* Payment Mode */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 14 }}>Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="DD">DD</option>
                </select>
              </div>

              {/* Transaction Ref */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 14 }}>
                  Transaction Reference {paymentMode !== "Cash" && "*"}
                </label>
                <input
                  type="text"
                  placeholder="UPI ID / Cheque No / Transaction ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
                  required={paymentMode !== "Cash"}
                />
              </div>

              {/* Collected By */}
              <div>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 14 }}>Collected By *</label>
                <select
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
                  required
                >
                  <option value="">Select Collector</option>
                  {collectors.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 14 }}>Remarks</label>
                <textarea
                  placeholder="Additional notes (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ width: "100%", padding: 10, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, minHeight: 76, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: "12px 22px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedFees.length === 0}
              style={{
                padding: "12px 22px",
                background: loading || selectedFees.length === 0 ? "#9ca3af" : "#ea580c",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: loading || selectedFees.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FileText size={19} />
              {loading ? "Processing…" : "Generate Receipt"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
