import { useState, useEffect } from "react";
import { supabase, type ReceiptConfig } from "../lib/supabaseClient";
import { Save, Loader } from "lucide-react";

export default function ReceiptTemplate() {
  const [config, setConfig] = useState<ReceiptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('receipt_config')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found
          setConfig({
            id: 0,
            college_name: "Kakatiya Institute of Technology & Science for Women",
            college_address: "Nizamabad - Hyderabad Road, Warangal, Telangana 506015",
            college_phone: "+91-870-2974750",
            college_email: "principal@kitsw.ac.in",
            receipt_prefix: "KITSW",
            receipt_starting_number: 1000,
            authorized_signatory_name: "Chief Accounts Officer",
            authorized_signatory_designation: "Accounts Department"
          });
        } else {
          throw error;
        }
      } else if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error("Error fetching receipt config:", err);
      setMessage({ type: 'error', text: "Failed to load receipt configuration." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setMessage(null);

    try {
      if (config.id === 0) {
        // Insert new config
        const { id, ...newConfig } = config;
        const { data, error } = await supabase
          .from('receipt_config')
          .insert([newConfig])
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(data);
      } else {
        // Update existing config
        const { error } = await supabase
          .from('receipt_config')
          .update(config)
          .eq('id', config.id);

        if (error) throw error;
      }
      setMessage({ type: 'success', text: "Receipt configuration saved successfully!" });
    } catch (err) {
      console.error("Error saving receipt config:", err);
      setMessage({ type: 'error', text: "Failed to save receipt configuration." });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (config) {
      setConfig({ ...config, [name]: value });
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Receipt Template / Settings</h1>
        <p>Configure college information and receipt printing layout</p>
      </div>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Form Section */}
        <div style={{ flex: '1 1 500px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#ea580c', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Configuration Form</h3>
          
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>College Name</label>
                <input
                  type="text"
                  name="college_name"
                  value={config?.college_name || ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>College Address</label>
                <textarea
                  name="college_address"
                  value={config?.college_address || ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone</label>
                  <input
                    type="text"
                    name="college_phone"
                    value={config?.college_phone || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                  <input
                    type="email"
                    name="college_email"
                    value={config?.college_email || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Receipt Prefix</label>
                  <input
                    type="text"
                    name="receipt_prefix"
                    value={config?.receipt_prefix || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Starting Number</label>
                  <input
                    type="number"
                    name="receipt_starting_number"
                    value={config?.receipt_starting_number || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Signatory Name</label>
                  <input
                    type="text"
                    name="authorized_signatory_name"
                    value={config?.authorized_signatory_name || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Signatory Designation</label>
                  <input
                    type="text"
                    name="authorized_signatory_designation"
                    value={config?.authorized_signatory_designation || ''}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: saving ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px'
                }}
              >
                {saving ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div style={{ flex: '1 1 500px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#ea580c', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Print Layout Preview</h3>
          
          <div style={{ border: '1px solid #000', padding: '30px', margin: '20px 0', background: '#fff', position: 'relative' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '20px' }}>{config?.college_name || 'COLLEGE NAME'}</h2>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>{config?.college_address || 'Address Line 1, City, State, PIN'}</p>
              <p style={{ margin: '0', fontSize: '12px' }}>
                Phone: {config?.college_phone || 'XXX-XXX-XXXX'} | Email: {config?.college_email || 'email@example.com'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: 'bold' }}>
              <div>Receipt No: {config?.receipt_prefix || 'PREFIX'}-{config?.receipt_starting_number || '000000'}</div>
              <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
            </div>

            <div style={{ border: '1px dashed #ccc', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', marginBottom: '40px' }}>
              [ Student Details and Fee Particulars ]
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #000', paddingTop: '10px', minWidth: '200px' }}>
                <div style={{ fontWeight: 'bold' }}>{config?.authorized_signatory_name || 'Signatory Name'}</div>
                <div style={{ fontSize: '12px' }}>{config?.authorized_signatory_designation || 'Designation'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}