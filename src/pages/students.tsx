import { useEffect, useRef, useState, useCallback } from "react";
import Papa from "papaparse";
import { supabase } from "../lib/supabaseClient";
import "../styles/students.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: number;
  branch_code: string;
  branch_name: string;
}

interface AcademicYear {
  id: number;
  year_name: string;
}

interface Student {
  id: number;
  student_name: string;
  roll_number: string;
  academic_year_id: number;
  branch_id: number;
  branches: { branch_name: string; branch_code: string } | null;
  academic_years: { year_name: string } | null;
  created_at: string;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  failed: number;
  errors: string[];
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onRemove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Students() {
  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // Modal visibility
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Add Student form
  const [studentForm, setStudentForm] = useState({
    student_name: "",
    roll_number: "",
    academic_year_id: "",
    branch_id: "",
  });
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});

  // Add Branch form
  const [branchForm, setBranchForm] = useState({ branch_code: "", branch_name: "" });
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchErrors, setBranchErrors] = useState<Record<string, string>>({});

  // CSV Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // ── Toast helpers ────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select(`
        id, student_name, roll_number, academic_year_id, branch_id, created_at,
        branches ( branch_name, branch_code ),
        academic_years ( year_name )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      addToast("Failed to load students: " + error.message, "error");
    } else {
      setStudents((data as unknown as Student[]) ?? []);
    }
    setLoading(false);
  }, [addToast]);

  const fetchBranches = useCallback(async () => {
    const { data, error } = await supabase
      .from("branches")
      .select("id, branch_code, branch_name")
      .eq("is_active", true)
      .order("branch_code");

    if (!error) setBranches(data ?? []);
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    const { data, error } = await supabase
      .from("academic_years")
      .select("id, year_name")
      .order("year_name", { ascending: false });

    if (!error) setAcademicYears(data ?? []);
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchBranches();
    fetchAcademicYears();
  }, [fetchStudents, fetchBranches, fetchAcademicYears]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.student_name.toLowerCase().includes(q) ||
      s.roll_number.toLowerCase().includes(q) ||
      (s.academic_years?.year_name ?? "").includes(q);
    const matchBranch =
      !branchFilter || String(s.branch_id) === branchFilter;
    return matchSearch && matchBranch;
  });

  // ── Add Student ───────────────────────────────────────────────────────────
  const validateStudentForm = () => {
    const errs: Record<string, string> = {};
    if (!studentForm.student_name.trim()) errs.student_name = "Name is required";
    if (!studentForm.roll_number.trim()) errs.roll_number = "Roll number is required";
    if (!studentForm.academic_year_id) errs.academic_year_id = "Academic year is required";
    if (!studentForm.branch_id) errs.branch_id = "Branch is required";
    return errs;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStudentForm();
    if (Object.keys(errs).length) { setStudentErrors(errs); return; }
    setStudentErrors({});
    setStudentSaving(true);

    // Check duplicate roll number
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("roll_number", studentForm.roll_number.trim().toUpperCase())
      .single();

    if (existing) {
      setStudentErrors({ roll_number: "Roll number already exists" });
      setStudentSaving(false);
      return;
    }

    // Get course_id from selected branch
    const { data: branchData } = await supabase
      .from("branches")
      .select("id, course_id")
      .eq("id", Number(studentForm.branch_id))
      .single();

    const { error } = await supabase.from("students").insert({
      student_name: studentForm.student_name.trim(),
      roll_number: studentForm.roll_number.trim().toUpperCase(),
      academic_year_id: Number(studentForm.academic_year_id),
      branch_id: Number(studentForm.branch_id),
      course_id: branchData?.course_id ?? null,
      is_active: true,
      total_fee_amount: 0,
    });

    if (error) {
      addToast("Failed to add student: " + error.message, "error");
    } else {
      addToast(`Student ${studentForm.student_name} added successfully`, "success");
      setStudentForm({ student_name: "", roll_number: "", academic_year_id: "", branch_id: "" });
      setShowAddStudent(false);
      fetchStudents();
    }
    setStudentSaving(false);
  };

  // ── Add Branch ────────────────────────────────────────────────────────────
  const validateBranchForm = () => {
    const errs: Record<string, string> = {};
    if (!branchForm.branch_code.trim()) errs.branch_code = "Branch code is required";
    if (!branchForm.branch_name.trim()) errs.branch_name = "Branch name is required";
    return errs;
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateBranchForm();
    if (Object.keys(errs).length) { setBranchErrors(errs); return; }
    setBranchErrors({});
    setBranchSaving(true);

    // Get a default course_id (B.Tech)
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("course_code", "BTECH")
      .single();

    const { error } = await supabase.from("branches").insert({
      branch_code: branchForm.branch_code.trim().toUpperCase(),
      branch_name: branchForm.branch_name.trim(),
      course_id: course?.id ?? null,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") {
        setBranchErrors({ branch_code: "Branch code already exists" });
      } else {
        addToast("Failed to add branch: " + error.message, "error");
      }
    } else {
      addToast(`Branch ${branchForm.branch_name} added successfully`, "success");
      setBranchForm({ branch_code: "", branch_name: "" });
      setShowAddBranch(false);
      fetchBranches();
    }
    setBranchSaving(false);
  };

  // ── CSV Import ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCsvFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!csvFile) { addToast("Please select a CSV file", "info"); return; }
    setImporting(true);
    setImportResult(null);

    Papa.parse<Record<string, string>>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        const result: ImportResult = { total: rows.length, imported: 0, duplicates: 0, failed: 0, errors: [] };

        // Fetch existing roll numbers for duplicate detection
        const { data: existing } = await supabase.from("students").select("roll_number");
        const existingRolls = new Set((existing ?? []).map((s) => s.roll_number.toUpperCase()));

        // Fetch academic years map: year_name → id
        const { data: years } = await supabase.from("academic_years").select("id, year_name");
        const yearMap = new Map((years ?? []).map((y) => [y.year_name, y.id]));

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2; // +2 because header is row 1

          // Normalize column names (case-insensitive, trim whitespace)
          const name = (row["name"] ?? row["Name"] ?? row["student_name"] ?? "").trim();
          const rollRaw = (row["roll_number"] ?? row["Roll Number"] ?? row["rollnumber"] ?? row["RollNumber"] ?? "").trim();
          const roll = rollRaw.toUpperCase();
          const yearStr = (row["academic_year"] ?? row["Academic Year"] ?? row["year"] ?? "").trim();

          // Validate required fields
          if (!name || !roll) {
            result.failed++;
            result.errors.push(`Row ${rowNum}: Missing name or roll_number`);
            continue;
          }

          // Duplicate check
          if (existingRolls.has(roll)) {
            result.duplicates++;
            continue;
          }
          existingRolls.add(roll); // prevent in-batch duplicates

          // Resolve academic year
          let yearId: number | null = yearMap.get(yearStr) ?? null;
          // Try active year as fallback
          if (!yearId) {
            const { data: activeYear } = await supabase
              .from("academic_years")
              .select("id")
              .eq("is_active", true)
              .single();
            yearId = activeYear?.id ?? null;
          }

          // Insert student (no branch/course from CSV — can be updated later)
          const { error } = await supabase.from("students").insert({
            student_name: name,
            roll_number: roll,
            academic_year_id: yearId,
            is_active: true,
            total_fee_amount: 0,
          });

          if (error) {
            result.failed++;
            result.errors.push(`Row ${rowNum} (${roll}): ${error.message}`);
          } else {
            result.imported++;
          }
        }

        setImportResult(result);
        setImporting(false);

        if (result.imported > 0) {
          addToast(`Imported ${result.imported} of ${result.total} students`, "success");
          fetchStudents();
        } else if (result.total === result.duplicates) {
          addToast("All records are duplicates — nothing imported", "info");
        } else {
          addToast("Import finished with issues. Check the report below.", "error");
        }
      },
      error: (err) => {
        addToast("CSV parse error: " + err.message, "error");
        setImporting(false);
      },
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const openAddStudentModal = () => {
    setStudentForm({ student_name: "", roll_number: "", academic_year_id: "", branch_id: "" });
    setStudentErrors({});
    setShowAddStudent(true);
  };

  const openAddBranchModal = () => {
    setBranchForm({ branch_code: "", branch_name: "" });
    setBranchErrors({});
    setShowAddBranch(true);
  };

  const openImportModal = () => {
    setCsvFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowImport(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="sm-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div className="sm-header">
        <div>
          <h1 className="sm-title">Students</h1>
          <p className="sm-subtitle">Manage student records, branches and bulk imports</p>
        </div>
        <div className="sm-header-actions">
          <button className="sm-btn sm-btn-outline" onClick={openAddBranchModal}>
            <span className="sm-btn-icon">＋</span> Add Branch
          </button>
          <button className="sm-btn sm-btn-secondary" onClick={openImportModal}>
            <span className="sm-btn-icon">↑</span> Import CSV
          </button>
          <button className="sm-btn sm-btn-primary" onClick={openAddStudentModal}>
            <span className="sm-btn-icon">＋</span> Add Student
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="sm-stats">
        <div className="sm-stat">
          <span className="sm-stat-value">{students.length}</span>
          <span className="sm-stat-label">Total Students</span>
        </div>
        <div className="sm-stat">
          <span className="sm-stat-value">{branches.length}</span>
          <span className="sm-stat-label">Branches</span>
        </div>
        <div className="sm-stat">
          <span className="sm-stat-value">{filtered.length}</span>
          <span className="sm-stat-label">Showing</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sm-filters">
        <div className="sm-search-wrap">
          <svg className="sm-search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="#ea580c" strokeWidth="1.8" />
            <path d="M13.5 13.5L17 17" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="sm-search-input"
            placeholder="Search by name, roll number or year…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="sm-search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>
        <select
          className="sm-select"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.branch_code} – {b.branch_name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="sm-table-wrap">
        {loading ? (
          <div className="sm-empty">
            <div className="sm-spinner" />
            <p>Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sm-empty">
            <p>No students found{search || branchFilter ? " matching your filters" : ""}.</p>
            {!search && !branchFilter && (
              <button className="sm-btn sm-btn-primary" style={{ marginTop: 12 }} onClick={openAddStudentModal}>
                Add your first student
              </button>
            )}
          </div>
        ) : (
          <table className="sm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Academic Year</th>
                <th>Branch</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="sm-student-name">
                      <div className="sm-avatar">{s.student_name.charAt(0).toUpperCase()}</div>
                      {s.student_name}
                    </div>
                  </td>
                  <td>
                    <span className="sm-badge">{s.roll_number}</span>
                  </td>
                  <td>{s.academic_years?.year_name ?? "—"}</td>
                  <td>
                    {s.branches ? (
                      <span className="sm-branch-tag">
                        {s.branches.branch_code}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="sm-date">{fmtDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          MODAL: Add Student
      ════════════════════════════════════════════════════════════ */}
      {showAddStudent && (
        <div className="sm-overlay" onClick={() => setShowAddStudent(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h2>Add New Student</h2>
              <button className="sm-modal-close" onClick={() => setShowAddStudent(false)}>×</button>
            </div>
            <form className="sm-modal-body" onSubmit={handleAddStudent} noValidate>
              {/* Name */}
              <div className="sm-field">
                <label className="sm-label">
                  Student Name <span className="sm-required">*</span>
                </label>
                <input
                  className={`sm-input ${studentErrors.student_name ? "sm-input-error" : ""}`}
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={studentForm.student_name}
                  onChange={(e) => setStudentForm((p) => ({ ...p, student_name: e.target.value }))}
                />
                {studentErrors.student_name && (
                  <span className="sm-error-msg">{studentErrors.student_name}</span>
                )}
              </div>

              {/* Roll Number */}
              <div className="sm-field">
                <label className="sm-label">
                  Roll Number <span className="sm-required">*</span>
                </label>
                <input
                  className={`sm-input ${studentErrors.roll_number ? "sm-input-error" : ""}`}
                  type="text"
                  placeholder="e.g. B23CS001"
                  value={studentForm.roll_number}
                  onChange={(e) => setStudentForm((p) => ({ ...p, roll_number: e.target.value }))}
                />
                {studentErrors.roll_number && (
                  <span className="sm-error-msg">{studentErrors.roll_number}</span>
                )}
                <span className="sm-hint">Examples: B23EC001 · B23ME001 · B23CS001</span>
              </div>

              {/* Academic Year */}
              <div className="sm-field">
                <label className="sm-label">
                  Academic Year <span className="sm-required">*</span>
                </label>
                <select
                  className={`sm-input ${studentErrors.academic_year_id ? "sm-input-error" : ""}`}
                  value={studentForm.academic_year_id}
                  onChange={(e) => setStudentForm((p) => ({ ...p, academic_year_id: e.target.value }))}
                >
                  <option value="">Select academic year</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={String(y.id)}>{y.year_name}</option>
                  ))}
                </select>
                {studentErrors.academic_year_id && (
                  <span className="sm-error-msg">{studentErrors.academic_year_id}</span>
                )}
              </div>

              {/* Branch */}
              <div className="sm-field">
                <label className="sm-label">
                  Branch <span className="sm-required">*</span>
                </label>
                <div className="sm-branch-row">
                  <select
                    className={`sm-input ${studentErrors.branch_id ? "sm-input-error" : ""}`}
                    value={studentForm.branch_id}
                    onChange={(e) => setStudentForm((p) => ({ ...p, branch_id: e.target.value }))}
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.branch_code} – {b.branch_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="sm-btn sm-btn-outline sm-btn-sm"
                    onClick={() => { setShowAddStudent(false); openAddBranchModal(); }}
                    title="Create a new branch"
                  >
                    + New
                  </button>
                </div>
                {studentErrors.branch_id && (
                  <span className="sm-error-msg">{studentErrors.branch_id}</span>
                )}
              </div>

              <div className="sm-modal-footer">
                <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setShowAddStudent(false)}>
                  Cancel
                </button>
                <button type="submit" className="sm-btn sm-btn-primary" disabled={studentSaving}>
                  {studentSaving ? (
                    <><span className="sm-spinner-sm" /> Saving…</>
                  ) : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: Add Branch
      ════════════════════════════════════════════════════════════ */}
      {showAddBranch && (
        <div className="sm-overlay" onClick={() => setShowAddBranch(false)}>
          <div className="sm-modal sm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h2>Add New Branch</h2>
              <button className="sm-modal-close" onClick={() => setShowAddBranch(false)}>×</button>
            </div>
            <form className="sm-modal-body" onSubmit={handleAddBranch} noValidate>
              {/* Branch Code */}
              <div className="sm-field">
                <label className="sm-label">
                  Branch Code <span className="sm-required">*</span>
                </label>
                <input
                  className={`sm-input ${branchErrors.branch_code ? "sm-input-error" : ""}`}
                  type="text"
                  placeholder="e.g. CSE"
                  value={branchForm.branch_code}
                  onChange={(e) => setBranchForm((p) => ({ ...p, branch_code: e.target.value }))}
                />
                {branchErrors.branch_code && (
                  <span className="sm-error-msg">{branchErrors.branch_code}</span>
                )}
                <span className="sm-hint">Short code — will be saved uppercase</span>
              </div>

              {/* Branch Name */}
              <div className="sm-field">
                <label className="sm-label">
                  Branch Name <span className="sm-required">*</span>
                </label>
                <input
                  className={`sm-input ${branchErrors.branch_name ? "sm-input-error" : ""}`}
                  type="text"
                  placeholder="e.g. Computer Science Engineering"
                  value={branchForm.branch_name}
                  onChange={(e) => setBranchForm((p) => ({ ...p, branch_name: e.target.value }))}
                />
                {branchErrors.branch_name && (
                  <span className="sm-error-msg">{branchErrors.branch_name}</span>
                )}
              </div>

              <div className="sm-modal-footer">
                <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setShowAddBranch(false)}>
                  Cancel
                </button>
                <button type="submit" className="sm-btn sm-btn-primary" disabled={branchSaving}>
                  {branchSaving ? (
                    <><span className="sm-spinner-sm" /> Saving…</>
                  ) : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: CSV Import
      ════════════════════════════════════════════════════════════ */}
      {showImport && (
        <div className="sm-overlay" onClick={() => !importing && setShowImport(false)}>
          <div className="sm-modal sm-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h2>Import Students from CSV</h2>
              <button className="sm-modal-close" onClick={() => !importing && setShowImport(false)} disabled={importing}>×</button>
            </div>

            <div className="sm-modal-body">
              {/* Format guide */}
              <div className="sm-import-guide">
                <p className="sm-import-guide-title">Required CSV Columns</p>
                <div className="sm-csv-columns">
                  <span className="sm-csv-col required">name</span>
                  <span className="sm-csv-col required">roll_number</span>
                  <span className="sm-csv-col optional">academic_year</span>
                </div>
                <p className="sm-import-guide-note">
                  <strong>name</strong> and <strong>roll_number</strong> are required.
                  <strong> academic_year</strong> is optional — falls back to the active year.
                  Roll numbers are automatically uppercased.
                </p>
                <div className="sm-csv-example">
                  <p className="sm-csv-example-label">Example CSV:</p>
                  <pre>{`name,roll_number,academic_year
Priya Sharma,B23EC001,2025-26
Rahul Kumar,B23CS001,2025-26
Anjali Reddy,B23ME001,2024-25`}</pre>
                </div>
              </div>

              {/* File upload */}
              <div className="sm-field">
                <label className="sm-label">Select CSV File</label>
                <div
                  className={`sm-dropzone ${csvFile ? "sm-dropzone-active" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.name.endsWith(".csv")) {
                      setCsvFile(file);
                      setImportResult(null);
                    } else {
                      addToast("Please drop a .csv file", "error");
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {csvFile ? (
                    <div className="sm-dropzone-selected">
                      <span className="sm-file-icon">📄</span>
                      <span className="sm-file-name">{csvFile.name}</span>
                      <span className="sm-file-size">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <div className="sm-dropzone-placeholder">
                      <span className="sm-upload-icon">↑</span>
                      <p>Drag & drop CSV here, or <span className="sm-link">click to browse</span></p>
                      <p className="sm-upload-hint">Only .csv files accepted</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Import result */}
              {importResult && (
                <div className="sm-import-result">
                  <p className="sm-import-result-title">Import Summary</p>
                  <div className="sm-import-stats">
                    <div className="sm-import-stat">
                      <span className="sm-import-stat-value">{importResult.total}</span>
                      <span className="sm-import-stat-label">Total Records</span>
                    </div>
                    <div className="sm-import-stat sm-import-stat-success">
                      <span className="sm-import-stat-value">{importResult.imported}</span>
                      <span className="sm-import-stat-label">Imported</span>
                    </div>
                    <div className="sm-import-stat sm-import-stat-warn">
                      <span className="sm-import-stat-value">{importResult.duplicates}</span>
                      <span className="sm-import-stat-label">Duplicates</span>
                    </div>
                    <div className="sm-import-stat sm-import-stat-error">
                      <span className="sm-import-stat-value">{importResult.failed}</span>
                      <span className="sm-import-stat-label">Failed</span>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="sm-import-errors">
                      <p className="sm-import-errors-title">Error Details</p>
                      <ul>
                        {importResult.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sm-modal-footer">
              <button
                type="button"
                className="sm-btn sm-btn-ghost"
                onClick={() => setShowImport(false)}
                disabled={importing}
              >
                Close
              </button>
              <button
                type="button"
                className="sm-btn sm-btn-primary"
                onClick={handleImport}
                disabled={!csvFile || importing}
              >
                {importing ? (
                  <><span className="sm-spinner-sm" /> Importing…</>
                ) : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
