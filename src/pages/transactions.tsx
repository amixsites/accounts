import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "../styles/transactions.css";
import { Search } from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  transaction_date: string;
  receipts: { receipt_number: string; payment_mode: string };
  students: { roll_number: string; student_name: string };
  fee_types: { fee_name: string };
  academic_years: { year_name: string };
}

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, amount, transaction_date,
        receipts ( receipt_number, payment_mode ),
        students ( roll_number, student_name ),
        fee_types ( fee_name ),
        academic_years ( year_name )
      `)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else if (data) {
      setAllTransactions(data as any);
    }
    setLoading(false);
  };

  const filteredTransactions = allTransactions.filter(tx => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      tx.receipts?.receipt_number.toLowerCase().includes(q) ||
      tx.students?.roll_number.toLowerCase().includes(q) ||
      tx.students?.student_name.toLowerCase().includes(q) ||
      tx.fee_types?.fee_name.toLowerCase().includes(q)
    );

    let matchesDate = true;
    if (tx.transaction_date) {
      const txDate = new Date(tx.transaction_date);
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

    return matchesSearch && matchesDate;
  });

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h2>Transactions History</h2>
        <p>Audit trail of all student payments and receipts</p>
      </div>

      <div className="search-section" style={{marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap"}}>
        <div className="search-input-wrapper" style={{display: "flex", alignItems: "center", background: "white", padding: "10px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flex: "1 1 300px"}}>
          <Search size={18} style={{marginRight: "10px", color: "#64748b"}} />
          <input
            type="text"
            placeholder="Search by Receipt No, Student Name, Roll No, or Fee Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{border: "none", outline: "none", width: "100%", fontSize: "16px"}}
          />
        </div>
        <div className="date-filters-wrapper" style={{display: "flex", alignItems: "center", gap: "8px", background: "white", padding: "10px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
          <label style={{fontSize: "14px", fontWeight: "600", color: "#64748b"}}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 8px", fontSize: "14px", outline: "none", color: "#1e293b"}}
          />
          <label style={{fontSize: "14px", fontWeight: "600", color: "#64748b"}}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 8px", fontSize: "14px", outline: "none", color: "#1e293b"}}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{background: "#fee2e2", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", color: "#dc2626", cursor: "pointer", transition: "background 0.15s"}}
              onMouseOver={(e) => e.currentTarget.style.background = "#fca5a5"}
              onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="transactions-list-section" style={{background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden"}}>
        {loading ? (
          <div style={{padding: "20px", textAlign: "center"}}>Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{padding: "20px", textAlign: "center", color: "#64748b"}}>No transactions found.</div>
        ) : (
          <div style={{overflowX: "auto"}}>
            <table style={{width: "100%", borderCollapse: "collapse"}}>
              <thead>
                <tr style={{background: "#f8fafc", textAlign: "left"}}>
                  <th style={{padding: "15px", borderBottom: "1px solid #e2e8f0"}}>Date</th>
                  <th style={{padding: "15px", borderBottom: "1px solid #e2e8f0"}}>Receipt No</th>
                  <th style={{padding: "15px", borderBottom: "1px solid #e2e8f0"}}>Student</th>
                  <th style={{padding: "15px", borderBottom: "1px solid #e2e8f0"}}>Fee Type</th>
                  <th style={{padding: "15px", borderBottom: "1px solid #e2e8f0"}}>Mode</th>
                  <th style={{padding: "15px", borderBottom: "1px solid #e2e8f0"}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} style={{borderBottom: "1px solid #e2e8f0"}}>
                    <td style={{padding: "15px"}}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                    <td style={{padding: "15px", fontWeight: "bold", color: "#ea580c"}}>{tx.receipts?.receipt_number}</td>
                    <td style={{padding: "15px"}}>
                      {tx.students?.student_name}<br/>
                      <small style={{color: "#64748b"}}>{tx.students?.roll_number}</small>
                    </td>
                    <td style={{padding: "15px"}}>{tx.fee_types?.fee_name}</td>
                    <td style={{padding: "15px"}}>{tx.receipts?.payment_mode}</td>
                    <td style={{padding: "15px", fontWeight: "bold", color: "#16a34a"}}>₹{tx.amount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}