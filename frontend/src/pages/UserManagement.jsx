import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Check, 
  X, 
  Edit3, 
  Key, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer'
  });
  const [editFormData, setEditFormData] = useState({
    role: 'viewer',
    password: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createUser(formData);
      setSuccess(`User "${formData.username}" created successfully`);
      setShowAddModal(false);
      setFormData({ username: '', password: '', role: 'viewer' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        role: editFormData.role,
        is_active: editFormData.is_active
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      await updateUser(selectedUser.user_id, payload);
      setSuccess(`User "${selectedUser.username}" updated`);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (user.user_id === currentUser?.user_id) {
      setError('You cannot delete your own account');
      return;
    }
    if (!window.confirm(`Delete user "${user.username}"?`)) return;

    try {
      await deleteUser(user.user_id);
      setSuccess(`User "${user.username}" deleted`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
      password: '',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-[#4EDEA3]/10 text-[#4EDEA3] border-[#4EDEA3]/30';
      case 'operator':
        return 'bg-[#91AAEB]/10 text-[#91AAEB] border-[#91AAEB]/30';
      default:
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1024px] pb-16 font-space">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#DEE5FF]">User Management</h1>
          <p className="text-xs text-[#91AAEB] mt-1">Manage system accounts and operational roles.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-[#05183C] border border-[#2B4680]/40 text-[#91AAEB] hover:text-[#DEE5FF] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button
            onClick={() => { setError(''); setShowAddModal(true); }}
            className="bg-[#4EDEA3] hover:bg-[#4EDEA3]/90 text-[#020617] text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#06122D] border-b border-white/5 text-[11px] font-mono uppercase text-[#91AAEB] tracking-wider">
                <th className="py-3 px-6">User</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-[#91AAEB]">
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-[#91AAEB]">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.user_id === currentUser?.user_id;
                  return (
                    <tr key={u.user_id} className="hover:bg-[#031D4B]/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#020617] border border-white/10 flex items-center justify-center font-bold text-xs text-[#4EDEA3] uppercase">
                            {u.username[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#DEE5FF] flex items-center gap-2">
                              {u.username}
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-[#91AAEB] font-mono">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-[#91AAEB]/60 font-mono">{u.user_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${getRoleStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${u.is_active ? 'text-[#4EDEA3]' : 'text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-[#4EDEA3]' : 'bg-red-400'}`} />
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded bg-[#020617] border border-white/5 text-[#91AAEB] hover:text-[#DEE5FF] transition-colors cursor-pointer"
                            title="Edit user"
                          >
                            <Edit3 size={14} />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-1.5 rounded bg-red-950/30 border border-red-500/20 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#05183C] border border-[#2B4680]/50 rounded-xl p-6 w-full max-w-[400px] flex flex-col gap-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#DEE5FF]">Create User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#91AAEB] hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#91AAEB] uppercase tracking-wider font-mono text-[10px]">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. jdoe"
                  required
                  className="bg-[#020617] border border-[#2B4680]/50 rounded-lg px-3 py-2 text-[#DEE5FF] focus:outline-none focus:border-[#4EDEA3]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#91AAEB] uppercase tracking-wider font-mono text-[10px]">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="bg-[#020617] border border-[#2B4680]/50 rounded-lg px-3 py-2 text-[#DEE5FF] focus:outline-none focus:border-[#4EDEA3]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#91AAEB] uppercase tracking-wider font-mono text-[10px]">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="bg-[#020617] border border-[#2B4680]/50 rounded-lg px-3 py-2 text-[#DEE5FF] focus:outline-none focus:border-[#4EDEA3]"
                >
                  <option value="viewer">Viewer (Read-Only)</option>
                  <option value="operator">Operator (Operations & Feeds)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#020617] border border-white/5 text-[#91AAEB] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#4EDEA3] text-[#020617] font-bold hover:bg-[#4EDEA3]/90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#05183C] border border-[#2B4680]/50 rounded-xl p-6 w-full max-w-[400px] flex flex-col gap-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#DEE5FF]">Edit: {selectedUser.username}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#91AAEB] hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#91AAEB] uppercase tracking-wider font-mono text-[10px]">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="bg-[#020617] border border-[#2B4680]/50 rounded-lg px-3 py-2 text-[#DEE5FF] focus:outline-none focus:border-[#4EDEA3]"
                >
                  <option value="viewer">Viewer (Read-Only)</option>
                  <option value="operator">Operator (Operations & Feeds)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#91AAEB] uppercase tracking-wider font-mono text-[10px]">
                  New Password <span className="text-[#91AAEB]/50 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-[#020617] border border-[#2B4680]/50 rounded-lg px-3 py-2 text-[#DEE5FF] focus:outline-none focus:border-[#4EDEA3]"
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editFormData.is_active}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#4EDEA3] cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-[#DEE5FF] font-medium cursor-pointer">
                  Account Active
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#020617] border border-white/5 text-[#91AAEB] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#4EDEA3] text-[#020617] font-bold hover:bg-[#4EDEA3]/90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
