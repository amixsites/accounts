import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Search as SearchIcon, FileText, User, Receipt } from "lucide-react";

interface SearchResult {
  type: 'student' | 'receipt' | 'transaction';
  id: number;
  title: string;
  subtitle: string;
  metadata: string;
  data: any;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'student' | 'receipt' | 'transaction'>('all');

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, searchType]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search Students
      if (searchType === 'all' || searchType === 'student') {
        const { data: students } = await supabase
          .from('students')
          .select('*, courses(course_name), branches(branch_name), academic_years(year_name)')
          .or(`student_name.ilike.%${query}%,roll_number.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10);

        students?.forEach(student => {
          searchResults.push({
            type: 'student',
            id: student.id,
            title: student.student_name,
            subtitle: student.roll_number,
            metadata: `${student.courses?.course_name} - ${student.branches?.branch_name} - ${student.academic_years?.year_name}`,
            data: student
          });
        });
      }

      // Search Receipts
      if (searchType === 'all' || searchType === 'receipt') {
        const { data: receipts } = await supabase
          .from('receipts')
          .select('*, students(student_name, roll_number)')
          .or(`receipt_number.ilike.%${query}%,transaction_reference.ilike.%${query}%`)
          .limit(10);

        receipts?.forEach(receipt => {
          searchResults.push({
            type: 'receipt',
            id: receipt.id,
            title: receipt.receipt_number,
            subtitle: receipt.students?.student_name || '',
            metadata: `₹${Number(receipt.total_amount).toLocaleString('en-IN')} - ${receipt.payment_mode} - ${new Date(receipt.receipt_date).toLocaleDateString('en-IN')}`,
            data: receipt
          });
        });
      }

      // Search Transactions
      if (searchType === 'all' || searchType === 'transaction') {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*, students(student_name, roll_number), receipts(receipt_number), fee_types(fee_name)')
          .limit(10);

        const filtered = transactions?.filter(tx => 
          tx.students?.student_name.toLowerCase().includes(query.toLowerCase()) ||
          tx.students?.roll_number.toLowerCase().includes(query.toLowerCase()) ||
          tx.receipts?.receipt_number.toLowerCase().includes(query.toLowerCase())
        );

        filtered?.forEach(tx => {
          searchResults.push({
            type: 'transaction',
            id: tx.id,
            title: `Transaction #${tx.id}`,
            subtitle: `${tx.students?.student_name} (${tx.students?.roll_number})`,
            metadata: `${tx.fee_types?.fee_name} - ₹${Number(tx.amount).toLocaleString('en-IN')} - ${new Date(tx.transaction_date).toLocaleDateString('en-IN')}`,
            data: tx
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'student': return <User size={20} color="#3b82f6" />;
      case 'receipt': return <Receipt size={20} color="#10b981" />;
      case 'transaction': return <FileText size={20} color="#f59e0b" />;
      default: return <SearchIcon size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student': return '#dbeafe';
      case 'receipt': return '#d1fae5';
      case 'transaction': return '#fef3c7';
      default: return '#f3f4f6';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Universal Search</h1>
        <p>Search across students, receipts, and transactions</p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#ea580c' }} />
            <input
              type="text"
              placeholder="Search by student name, roll number, receipt number, transaction ID, UPI reference..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 15px 15px 50px',
                border: '2px solid #ea580c',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none'
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', 'student', 'receipt', 'transaction'].map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type as any)}
              style={{
                padding: '10px 20px',
                border: '2px solid',
                borderColor: searchType === type ? '#ea580c' : '#ddd',
                background: searchType === type ? '#ea580c' : 'white',
                color: searchType === type ? 'white' : '#666',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          Searching...
        </div>
      ) : query.trim().length < 2 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <SearchIcon size={48} color="#ddd" style={{ marginBottom: '20px' }} />
          <p>Type at least 2 characters to search</p>
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <SearchIcon size={48} color="#ddd" style={{ marginBottom: '20px' }} />
          <p>No results found for "{query}"</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '15px', color: '#666' }}>
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((result, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div style={{ 
                  padding: '15px', 
                  background: getTypeColor(result.type), 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(result.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{result.title}</h3>
                    <span style={{ 
                      padding: '4px 12px', 
                      background: getTypeColor(result.type),
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {result.type}
                    </span>
                  </div>
                  <div style={{ color: '#666', marginBottom: '5px' }}>{result.subtitle}</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>{result.metadata}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}