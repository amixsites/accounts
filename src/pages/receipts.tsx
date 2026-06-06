import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { convertNumberToWords } from "../utils/numberToWords";
import "../styles/receipts.css";
import { 
  Save, 
  RotateCcw, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  User,
  FileText
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ReceiptData {
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

const DEFAULT_TRANSACTIONS: ReceiptData[] = [
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

export default function Receipts() {
  const navigate = useNavigate();

  // Helper to get today's date in YYYY-MM-DD local timezone format
  const getTodayLocalDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ─── State Variables ────────────────────────────────────────────────────────
  const [receiptsList, setReceiptsList] = useState<ReceiptData[]>([]);
  const [receiptNumber, setReceiptNumber] = useState<number>(1);
  const [date, setDate] = useState<string>(getTodayLocalDate());
  
  // Student details
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [yearOfStudying, setYearOfStudying] = useState("");

  // Payment Details
  const [towards, setTowards] = useState("");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [amountReceivedWords, setAmountReceivedWords] = useState("Zero Rupees Only");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [upiNumber, setUpiNumber] = useState("");
  const [upiDate, setUpiDate] = useState(getTodayLocalDate());
  const [paymentStatus, setPaymentStatus] = useState("Paid");

  // Conditional Status Fields
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [pendingReason, setPendingReason] = useState("");

  // Notification and Modals
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ─── Effects ────────────────────────────────────────────────────────────────
  // Load existing receipts and compute next sequential receipt number
  useEffect(() => {
    try {
      const stored = localStorage.getItem("receipts_list");
      if (stored) {
        const parsed: ReceiptData[] = JSON.parse(stored);
        setReceiptsList(parsed);
        // Sequential numbering based on list length
        setReceiptNumber(parsed.length + 1);
      } else {
        localStorage.setItem("receipts_list", JSON.stringify(DEFAULT_TRANSACTIONS));
        setReceiptsList(DEFAULT_TRANSACTIONS);
        setReceiptNumber(DEFAULT_TRANSACTIONS.length + 1);
      }
    } catch (e) {
      console.error("Failed to load receipts from localStorage", e);
      setReceiptNumber(1);
    }
  }, []);

  // Update Amount in Words automatically when Amount Received changes
  useEffect(() => {
    const numericAmount = parseFloat(amountReceived);
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      setAmountReceivedWords(convertNumberToWords(numericAmount));
    } else {
      setAmountReceivedWords("Zero Rupees Only");
    }
  }, [amountReceived]);

  // Adjust conditional fields based on payment status selection
  useEffect(() => {
    if (paymentStatus === "Paid") {
      setTotalAmount("");
      setPaidAmount("");
      setPendingAmount(0);
      setPendingReason("");
    } else if (paymentStatus === "Pending") {
      // For pending, Amount Received is forced to 0
      setAmountReceived("0");
      setPaidAmount("0");
      setPendingReason("");
    } else if (paymentStatus === "Partial Payment") {
      // For partial, Paid Amount is bound/synchronized to Amount Received
      setPaidAmount(amountReceived);
    }
  }, [paymentStatus]);

  // Keep paidAmount in sync with amountReceived for Partial Payment
  useEffect(() => {
    if (paymentStatus === "Partial Payment") {
      setPaidAmount(amountReceived);
    }
  }, [amountReceived, paymentStatus]);

  // Auto-calculate pendingAmount for Partial Payment or Pending
  useEffect(() => {
    if (paymentStatus === "Partial Payment") {
      const tot = parseFloat(totalAmount) || 0;
      const paid = parseFloat(paidAmount) || 0;
      const calcPending = Math.max(0, tot - paid);
      setPendingAmount(calcPending);
    } else if (paymentStatus === "Pending") {
      const tot = parseFloat(totalAmount) || 0;
      setPendingAmount(tot);
    }
  }, [totalAmount, paidAmount, paymentStatus]);

  // Clear UPI number if mode changes away from UPI
  useEffect(() => {
    if (modeOfPayment !== "UPI") {
      setUpiNumber("");
    }
  }, [modeOfPayment]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Roll Number *
    if (!rollNumber.trim()) {
      newErrors.rollNumber = "Roll Number is required.";
    }

    // Student Name *
    if (!studentName.trim()) {
      newErrors.studentName = "Student Name is required.";
    }

    // Year of Studying *
    if (!yearOfStudying) {
      newErrors.yearOfStudying = "Year of Studying is required.";
    }

    // Towards *
    if (!towards.trim()) {
      newErrors.towards = "Towards field is required.";
    }

    // Amount Received *
    if (amountReceived === "") {
      newErrors.amountReceived = "Amount Received is required.";
    } else {
      const amt = parseFloat(amountReceived);
      if (isNaN(amt)) {
        newErrors.amountReceived = "Amount must be a number.";
      } else if (amt < 0) {
        newErrors.amountReceived = "Amount cannot be negative.";
      }
    }

    // Mode of Payment *
    if (!modeOfPayment) {
      newErrors.modeOfPayment = "Mode of Payment is required.";
    }

    // UPI Validation
    if (modeOfPayment === "UPI") {
      if (!upiNumber.trim()) {
        newErrors.upiNumber = "UPI transaction number is required when payment mode is UPI.";
      }
      if (!upiDate) {
        newErrors.upiDate = "UPI date is required when payment mode is UPI.";
      }
    }

    // Payment Status Validation (Total/Paid/Pending verification)
    if (paymentStatus === "Pending") {
      if (!totalAmount) {
        newErrors.totalAmount = "Total Amount is required for pending status.";
      } else {
        const tot = parseFloat(totalAmount);
        if (isNaN(tot) || tot < 0) {
          newErrors.totalAmount = "Total Amount must be a positive number.";
        }
      }
    } else if (paymentStatus === "Partial Payment") {
      const tot = parseFloat(totalAmount);
      const paid = parseFloat(amountReceived); // Paid Amount is bound to amountReceived

      if (!totalAmount) {
        newErrors.totalAmount = "Total Amount is required.";
      } else if (isNaN(tot) || tot < 0) {
        newErrors.totalAmount = "Total Amount must be a positive number.";
      }

      if (!isNaN(tot) && !isNaN(paid) && paid > tot) {
        newErrors.amountReceived = "Paid Amount (Amount Received) cannot exceed Total Amount.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the top error banner
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Create the receipt data object
    const newReceipt: ReceiptData = {
      receiptNumber,
      date,
      rollNumber: rollNumber.trim(),
      studentName: studentName.trim(),
      yearOfStudying,
      towards: towards.trim(),
      amountReceived: parseFloat(amountReceived),
      amountReceivedWords,
      modeOfPayment,
      paymentStatus,
    };

    if (modeOfPayment === "UPI") {
      newReceipt.upiNumber = upiNumber.trim();
      newReceipt.upiDate = upiDate;
    }

    if (paymentStatus === "Pending") {
      newReceipt.totalAmount = parseFloat(totalAmount);
      newReceipt.pendingAmount = pendingAmount;
      if (pendingReason.trim()) {
        newReceipt.pendingReason = pendingReason.trim();
      }
    } else if (paymentStatus === "Partial Payment") {
      newReceipt.totalAmount = parseFloat(totalAmount);
      newReceipt.paidAmount = parseFloat(paidAmount);
      newReceipt.pendingAmount = pendingAmount;
    }

    // Save to list and localStorage
    const updatedList = [...receiptsList, newReceipt];
    setReceiptsList(updatedList);
    localStorage.setItem("receipts_list", JSON.stringify(updatedList));

    // ─── Save the details in another file (Client-side trigger) ───
    try {
      const jsonStr = JSON.stringify(newReceipt, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `receipt_record_#${receiptNumber}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Failed to download file", err);
    }

    // Show beautiful success notification
    setSuccessToast(`Receipt #${receiptNumber} saved and downloaded successfully for ${studentName}!`);

    // Reset Form for next entry but increment receipt number
    const nextReceiptNumber = receiptNumber + 1;
    handleResetFields();
    setReceiptNumber(nextReceiptNumber);

    // Clear toast automatically after 4 seconds
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);

    // Scroll to top to see success banner
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFields = () => {
    setRollNumber("");
    setStudentName("");
    setYearOfStudying("");
    setTowards("");
    setAmountReceived("");
    setAmountReceivedWords("Zero Rupees Only");
    setModeOfPayment("");
    setUpiNumber("");
    setUpiDate(getTodayLocalDate());
    setPaymentStatus("Paid");
    setTotalAmount("");
    setPaidAmount("");
    setPendingAmount(0);
    setPendingReason("");
    setErrors({});
  };

  const handleResetClick = () => {
    handleResetFields();
    // Re-verify the receipt number matching localStorage length
    setReceiptNumber(receiptsList.length + 1);
  };

  const handleCancel = () => {
    // Show a modal asking if they want to discard changes
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    handleResetFields();
    navigate("/dashboard");
  };

  return (
    <div className="receipt-page">
      {/* Page Header */}
      <div className="receipt-header-section">
        <h2>Receipt Entry Form</h2>
        <p>Record student fees and general payments for college accounts administration</p>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="receipt-alert receipt-alert-success">
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Header Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="receipt-alert receipt-alert-error">
          <AlertCircle size={20} />
          <div>
            <strong>Please fix the following validation errors:</strong>
            <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
              {Object.values(errors).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="receipt-form" noValidate>
        
        {/* SECTION 1: Receipt Details */}
        <div className="receipt-card">
          <div className="receipt-card-title">
            <FileText size={18} color="#ee5e1a" />
            <span>Receipt Details</span>
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Receipt Number (Auto-generated)</label>
              <div className="input-icon-wrapper">
                <span className="input-icon-prefix" style={{ fontSize: "14px", fontWeight: "bold" }}>#</span>
                <input 
                  type="text" 
                  value={receiptNumber} 
                  className="form-input form-input-with-icon" 
                  readOnly 
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="receipt-date">Date <span className="required-star">*</span></label>
              <div className="input-icon-wrapper">
                <Calendar size={16} className="input-icon-prefix" />
                <input 
                  id="receipt-date"
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input form-input-with-icon"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Student Details */}
        <div className="receipt-card">
          <div className="receipt-card-title">
            <User size={18} color="#ee5e1a" />
            <span>Student Details</span>
          </div>

          <div className="grid-3-col">
            <div className={`form-group ${errors.rollNumber ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="student-roll">Roll Number <span className="required-star">*</span></label>
              <input 
                id="student-roll"
                type="text" 
                value={rollNumber} 
                onChange={(e) => {
                  setRollNumber(e.target.value);
                  if (errors.rollNumber) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.rollNumber;
                      return copy;
                    });
                  }
                }}
                placeholder="Enter Roll Number"
                className="form-input"
                required
              />
              {errors.rollNumber && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.rollNumber}</span>
              )}
            </div>

            <div className={`form-group ${errors.studentName ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="student-name">Student Name <span className="required-star">*</span></label>
              <input 
                id="student-name"
                type="text" 
                value={studentName} 
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (errors.studentName) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.studentName;
                      return copy;
                    });
                  }
                }}
                placeholder="Enter Student Name"
                className="form-input"
                required
              />
              {errors.studentName && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.studentName}</span>
              )}
            </div>

            <div className={`form-group ${errors.yearOfStudying ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="student-year">Year of Studying <span className="required-star">*</span></label>
              <select 
                id="student-year"
                value={yearOfStudying} 
                onChange={(e) => {
                  setYearOfStudying(e.target.value);
                  if (errors.yearOfStudying) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.yearOfStudying;
                      return copy;
                    });
                  }
                }}
                className="form-select"
                required
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
              {errors.yearOfStudying && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.yearOfStudying}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Payment Information */}
        <div className="receipt-card">
          <div className="receipt-card-title">
            <span>Payment Information</span>
          </div>

          <div className="grid-3-col">
            <div className={`form-group ${errors.amountReceived ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="payment-amount">Amount Received (Numbers) <span className="required-star">*</span></label>
              <div className="input-icon-wrapper">
                <span className="input-icon-prefix">₹</span>
                <input 
                  id="payment-amount"
                  type="number" 
                  min="0"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                    if (errors.amountReceived) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.amountReceived;
                        return copy;
                      });
                    }
                  }}
                  className="form-input form-input-with-icon"
                  disabled={paymentStatus === "Pending"}
                  required
                />
              </div>
              {errors.amountReceived && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.amountReceived}</span>
              )}
            </div>

            <div className={`form-group ${errors.modeOfPayment ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="payment-mode">Mode of Payment <span className="required-star">*</span></label>
              <select 
                id="payment-mode"
                value={modeOfPayment} 
                onChange={(e) => {
                  setModeOfPayment(e.target.value);
                  if (errors.modeOfPayment) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.modeOfPayment;
                      return copy;
                    });
                  }
                }}
                className="form-select"
                required
              >
                <option value="">Select Mode</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque">Cheque</option>
              </select>
              {errors.modeOfPayment && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.modeOfPayment}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payment-status">Payment Status</label>
              <select 
                id="payment-status"
                value={paymentStatus} 
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="form-select"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial Payment">Partial Payment</option>
              </select>
            </div>

            {/* Towards Input Field */}
            <div className={`form-group ${errors.towards ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="payment-towards">Towards <span className="required-star">*</span></label>
              <input 
                id="payment-towards"
                type="text" 
                placeholder="E.g., Tuition Fee, Hostel Fee"
                value={towards} 
                onChange={(e) => {
                  setTowards(e.target.value);
                  if (errors.towards) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.towards;
                      return copy;
                    });
                  }
                }}
                className="form-input"
                required
              />
              {errors.towards && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.towards}</span>
              )}
            </div>

            {/* UPI Number Input Field (Always visible, enabled only if mode is UPI) */}
            <div className={`form-group ${errors.upiNumber ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="payment-upi-no">
                UPI Number {modeOfPayment === "UPI" && <span className="required-star">*</span>}
              </label>
              <input 
                id="payment-upi-no"
                type="text" 
                placeholder={modeOfPayment === "UPI" ? "Enter 12-digit transaction ID" : "Enabled for UPI payment mode only"}
                value={upiNumber} 
                onChange={(e) => {
                  setUpiNumber(e.target.value);
                  if (errors.upiNumber) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.upiNumber;
                      return copy;
                    });
                  }
                }}
                className="form-input"
                disabled={modeOfPayment !== "UPI"}
                required={modeOfPayment === "UPI"}
              />
              {errors.upiNumber && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.upiNumber}</span>
              )}
            </div>

            {/* UPI Date Input Field (Always visible, enabled only if mode is UPI) */}
            <div className={`form-group ${errors.upiDate ? "has-error" : ""}`}>
              <label className="form-label" htmlFor="payment-upi-date">
                UPI Date {modeOfPayment === "UPI" && <span className="required-star">*</span>}
              </label>
              <input 
                id="payment-upi-date"
                type="date" 
                value={upiDate} 
                onChange={(e) => {
                  setUpiDate(e.target.value);
                  if (errors.upiDate) {
                    setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.upiDate;
                      return copy;
                    });
                  }
                }}
                className="form-input"
                disabled={modeOfPayment !== "UPI"}
                required={modeOfPayment === "UPI"}
              />
              {errors.upiDate && (
                <span className="field-error-msg"><AlertCircle size={12} /> {errors.upiDate}</span>
              )}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Amount Received (Words)</label>
              <input 
                type="text" 
                value={amountReceivedWords} 
                className="form-input" 
                style={{ fontStyle: "italic", fontWeight: 500, backgroundColor: "#f8fafc" }}
                readOnly 
                disabled
              />
            </div>
          </div>

          {/* Conditional Sub-section: Payment Status Detail Fields */}
          {paymentStatus === "Pending" && (
            <div className="conditional-section" style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontSize: "14px", fontWeight: 600 }}>
                <Info size={16} />
                <span>Pending Payment Registration</span>
              </div>
              <div className="conditional-grid">
                <div className={`form-group ${errors.totalAmount ? "has-error" : ""}`}>
                  <label className="form-label" htmlFor="pending-total">Total Amount <span className="required-star">*</span></label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon-prefix">₹</span>
                    <input 
                      id="pending-total"
                      type="number" 
                      min="0"
                      placeholder="0.00"
                      value={totalAmount} 
                      onChange={(e) => {
                        setTotalAmount(e.target.value);
                        if (errors.totalAmount) {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.totalAmount;
                            return copy;
                          });
                        }
                      }}
                      className="form-input form-input-with-icon"
                      required
                    />
                  </div>
                  {errors.totalAmount && (
                    <span className="field-error-msg"><AlertCircle size={12} /> {errors.totalAmount}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Pending Amount</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon-prefix">₹</span>
                    <input 
                      type="number" 
                      value={pendingAmount} 
                      className="form-input form-input-with-icon" 
                      readOnly 
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pending-reason">Pending Reason (Optional)</label>
                  <input 
                    id="pending-reason"
                    type="text" 
                    placeholder="E.g., Waiting for bank loan approval"
                    value={pendingReason} 
                    onChange={(e) => setPendingReason(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentStatus === "Partial Payment" && (
            <div className="conditional-section" style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontSize: "14px", fontWeight: 600 }}>
                <Info size={16} />
                <span>Partial Payment Calculations</span>
              </div>
              <div className="grid-2-col">
                <div className={`form-group ${errors.totalAmount ? "has-error" : ""}`}>
                  <label className="form-label" htmlFor="partial-total">Total Amount <span className="required-star">*</span></label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon-prefix">₹</span>
                    <input 
                      id="partial-total"
                      type="number" 
                      min="0"
                      placeholder="0.00"
                      value={totalAmount} 
                      onChange={(e) => {
                        setTotalAmount(e.target.value);
                        if (errors.totalAmount) {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.totalAmount;
                            return copy;
                          });
                        }
                      }}
                      className="form-input form-input-with-icon"
                      required
                    />
                  </div>
                  {errors.totalAmount && (
                    <span className="field-error-msg"><AlertCircle size={12} /> {errors.totalAmount}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Paid Amount (Equals Amount Received)</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon-prefix">₹</span>
                    <input 
                      type="number" 
                      value={paidAmount || "0"} 
                      className="form-input form-input-with-icon" 
                      readOnly 
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Payment Summary Card */}
              <div className="payment-summary-card">
                <div className="summary-item">
                  <div className="summary-item-label">Total Amount</div>
                  <div className="summary-item-value">₹{(parseFloat(totalAmount) || 0).toLocaleString("en-IN")}</div>
                </div>
                <div className="summary-item" style={{ borderLeft: "1px solid #fed7aa", borderRight: "1px solid #fed7aa" }}>
                  <div className="summary-item-label">Paid Amount</div>
                  <div className="summary-item-value highlight-paid">₹{(parseFloat(paidAmount) || 0).toLocaleString("en-IN")}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-item-label">Pending Amount</div>
                  <div className="summary-item-value highlight-pending">₹{pendingAmount.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STICKY ACTION BAR */}
        <div className="sticky-action-bar">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="receipt-btn receipt-btn-danger"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          
          <button 
            type="button" 
            onClick={handleResetClick} 
            className="receipt-btn receipt-btn-secondary"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          
          <button 
            type="submit" 
            className="receipt-btn receipt-btn-primary"
          >
            <Save size={16} />
            <span>Save Receipt</span>
          </button>
        </div>
      </form>

      {/* DISCARD CHANGES / CANCEL MODAL */}
      {showCancelModal && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal">
            <div className="receipt-modal-body">
              <div className="receipt-modal-title">
                <AlertCircle size={20} color="var(--receipt-error)" />
                <span>Discard changes?</span>
              </div>
              <div className="receipt-modal-text">
                Are you sure you want to cancel? Any unsaved information entered in this receipt form will be lost.
              </div>
              <div className="receipt-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCancelModal(false)} 
                  className="receipt-btn receipt-btn-secondary"
                >
                  Keep Editing
                </button>
                <button 
                  type="button" 
                  onClick={confirmCancel} 
                  className="receipt-btn receipt-btn-primary" 
                  style={{ backgroundColor: "var(--receipt-error)" }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}