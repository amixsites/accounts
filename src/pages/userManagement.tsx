import { useState, useEffect } from "react";
import { supabase, type User } from "../lib/supabaseClient";
import { Plus, Trash2, Shield } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'User2' as 'Admin' | 'accounts_manager' | 'User1' | 'User2'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('users')
        .insert({
          username: formData.username,
          password_hash: formData.password, // In production, hash this!
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role
        });

      if (error) throw error;

      alert('User added successfully!');
      setShowAdd(false);
      setFormData({ username: '', password: '', full_name: '', email: '', role: 'User2' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return { bg: '#fee2e2', color: '#991b1b' };
      case 'accounts_manager': return { bg: '#fef3c7', color: '#92400e' };
      case 'User1': return { bg: '#dbeafe', color: '#1e40af' };
      case 'User2': return { bg: '#d1fae5', color: '#065f46' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users and roles</p>
      </div>

      {/* Add User Button */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: '12px 24px',
            background: showAdd ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {showAdd ? 'Cancel' : <><Plus size={20} /> Add New User</>}
        </button>
      </div>

      {/* Add User Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', color: '#ea580c' }}>Add New User</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                required
              >
                <option value="User2">User 2</option>
                <option value="User1">User 1</option>
                <option value="accounts_manager">Accounts Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#ea580c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Create User
          </button>
        </form>
      )}

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No users found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#ea580c', color: 'white' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Full Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const roleColor = getRoleBadgeColor(user.role);
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.username}</td>
                    <td style={{ padding: '12px' }}>{user.full_name}</td>
                    <td style={{ padding: '12px' }}>{user.email || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        background: roleColor.bg,
                        color: roleColor.color,
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Shield size={14} />
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        background: user.is_active ? '#d1fae5' : '#fee2e2',
                        color: user.is_active ? '#065f46' : '#991b1b'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '20px', padding: '20px', background: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b' }}>
        <h4 style={{ marginBottom: '10px', color: '#92400e' }}>User Roles & Permissions</h4>
        <ul style={{ marginLeft: '20px', color: '#78350f' }}>
          <li><strong>Admin:</strong> Full system access including user management and system settings</li>
          <li><strong>Accounts Manager:</strong> Can manage fees, generate receipts, view reports. Limited to finance modules only</li>
          <li><strong>User1:</strong> Can collect fees, generate receipts, and view reports</li>
          <li><strong>User2:</strong> Limited access for basic fee collection</li>
        </ul>
        <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '8px' }}>
          <h5 style={{ marginBottom: '10px', color: '#92400e' }}>Accounts Manager Permissions:</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div>✅ View students</div>
            <div>✅ Manage fee structures</div>
            <div>✅ Generate invoices</div>
            <div>✅ Record payments</div>
            <div>✅ Issue receipts</div>
            <div>✅ View fee reports</div>
            <div>❌ Manage users</div>
            <div>❌ Modify system settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}