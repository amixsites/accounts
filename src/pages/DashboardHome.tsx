import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { IndianRupee, FileText, Clock, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalCollectionToday: number;
  cashCollection: number;
  upiCollection: number;
  bankTransferCollection: number;
  receiptsGenerated: number;
  pendingFeeCount: number;
}

interface RecentTransaction {
  id: number;
  receipt_number: string;
  student_name: string;
  amount: number;
  payment_mode: string;
  receipt_date: string;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCollectionToday: 0,
    cashCollection: 0,
    upiCollection: 0,
    bankTransferCollection: 0,
    receiptsGenerated: 0,
    pendingFeeCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's receipts
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('*, students(student_name)')
        .eq('receipt_date', today)
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Calculate stats
      const cash = receipts?.filter(r => r.payment_mode === 'Cash').reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const upi = receipts?.filter(r => r.payment_mode === 'UPI').reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const bank = receipts?.filter(r => r.payment_mode === 'Bank Transfer').reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const total = cash + upi + bank;

      // Fetch due fees count
      const { data: dueFeesData, error: dueError } = await supabase
        .from('due_fees_view')
        .select('*', { count: 'exact', head: true });

      if (dueError) throw dueError;

      setStats({
        totalCollectionToday: total,
        cashCollection: cash,
        upiCollection: upi,
        bankTransferCollection: bank,
        receiptsGenerated: receipts?.length || 0,
        pendingFeeCount: dueFeesData?.length || 0,
      });

      // Format recent transactions
      const recentTx = receipts?.slice(0, 10).map(r => ({
        id: r.id,
        receipt_number: r.receipt_number,
        student_name: r.students?.student_name || 'Unknown',
        amount: Number(r.total_amount),
        payment_mode: r.payment_mode,
        receipt_date: r.receipt_date,
      })) || [];

      setRecentTransactions(recentTx);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to KITSW Fees Management System</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <IndianRupee size={24} />
            <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>Total Collection Today</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatCurrency(stats.totalCollectionToday)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <IndianRupee size={24} />
            <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>Cash Collection</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatCurrency(stats.cashCollection)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <IndianRupee size={24} />
            <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>UPI Collection</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatCurrency(stats.upiCollection)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <IndianRupee size={24} />
            <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>Bank Transfer</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatCurrency(stats.bankTransferCollection)}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <FileText size={24} />
            <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>Receipts Generated</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.receiptsGenerated}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', color: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Clock size={24} />
            <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>Pending Fees</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.pendingFeeCount}</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={24} color="#ea580c" />
          Recent Transactions
        </h2>
        {recentTransactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No transactions today</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ea580c' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#ea580c' }}>Receipt No.</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#ea580c' }}>Student Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#ea580c' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#ea580c' }}>Payment Mode</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#ea580c' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '12px' }}>{tx.receipt_number}</td>
                    <td style={{ padding: '12px' }}>{tx.student_name}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(tx.amount)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px',
                        background: tx.payment_mode === 'Cash' ? '#fee2e2' : tx.payment_mode === 'UPI' ? '#dbeafe' : '#d1fae5',
                        color: tx.payment_mode === 'Cash' ? '#991b1b' : tx.payment_mode === 'UPI' ? '#1e40af' : '#065f46'
                      }}>
                        {tx.payment_mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(tx.receipt_date).toLocaleDateString('en-IN')}</td>
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