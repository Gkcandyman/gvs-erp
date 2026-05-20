import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users, Search, Plus, Trash2, Edit2, LogOut,
  LayoutDashboard, Layers, CreditCard, PackageCheck, Command, Activity, X
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';

const UsersPage = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'STAFF',
    age: '', contact: '', address: '',
    permissions: {
      billing: { view: true, edit: false },
      stock: { view: true, edit: false, delete: false },
      receipt: { view: true, edit: false, delete: false },
    }
  });

  const emptyForm = {
    name: '', email: '', password: '', role: 'STAFF',
    age: '', contact: '', address: '',
    permissions: {
      billing: { view: true, edit: false },
      stock: { view: true, edit: false, delete: false },
      receipt: { view: true, edit: false, delete: false },
    }
  };

  // Admin Only Route
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------------------------------------------------------------
  // Permission toggle helper – safely updates the nested permission object
  // ---------------------------------------------------------------------
  const handlePermissionChange = (
    module,
    action,
    checked,
  ) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          // Use the existing module permissions if they exist,
          // otherwise fall back to a full default object
          ...(prev.permissions?.[module] || {
            view: false,
            edit: false,
            delete: false,
          }),
          // Overwrite the specific flag the user just toggled
          [action]: checked,
        },
      },
    }));
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // blank unless changing
      role: u.role,
      age: u.age || '',
      contact: u.contact || '',
      address: u.address || '',
      permissions: u.permissions || {
        billing: { view: true, edit: false },
        stock: { view: true, edit: false, delete: false },
        receipt: { view: true, edit: false, delete: false },
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (e) {
      alert("Failed to delete user");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password on edit

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((staffUser) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      !query ||
      staffUser.name.toLowerCase().includes(query) ||
      staffUser.role.toLowerCase().includes(query) ||
      staffUser.contact?.toLowerCase().includes(query)
    );
  });

  if (isLoading) return <div className="arctic-loading"><div className="cryo-chamber"><Users size={40} className="ice-icon" /></div><p className="syncopate">Loading staff accounts...</p></div>;

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Staff Access</h1>
            <p className="grotesk">Manage staff accounts, admin roles, and module permissions.</p>
          </div>
          <div className="header-meta">
            <div className="search-pill">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search staff, role, contact"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="hologram-btn" onClick={() => { setEditingId(null); setFormData(emptyForm); setShowModal(true); }}><Plus size={20} /> NEW STAFF</button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">User Entity</th>
                    <th className="syncopate">Role</th>
                    <th className="syncopate">Contact</th>
                    <th className="syncopate">Age</th>
                    <th className="syncopate">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td><div className="id-block"><span className="client">{u.name}</span><span className="code">Login name</span></div></td>
                      <td><span className={`state-tag ${u.role === 'ADMIN' ? 'paid' : 'unpaid'}`}>{u.role}</span></td>
                      <td><span className="date">{u.contact || 'N/A'}</span></td>
                      <td><span className="date">{u.age || '-'}</span></td>
                      <td>
                        <div className="row-cmds">
                          <button onClick={() => handleEdit(u)} className="cmd-icon"><Edit2 size={16} /></button>
                          {u.id !== user.id && <button onClick={() => handleDelete(u.id)} className="cmd-icon" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No staff users found for the current search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="arctic-modal-overlay">
          <div className="arctic-modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="syncopate">{editingId ? 'Edit Staff User' : 'Add Staff User'}</h3>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="input-box"><label>NAME</label><input name="name" value={formData.name} onChange={handleInputChange} required /></div>
                <div className="input-box"><label>PASSWORD</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingId ? "Leave blank to keep" : ""} required={!editingId} minLength={6} /></div>
              </div>

              <div className="form-row">
                <div className="input-box"><label>ROLE</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="input-box"><label>AGE</label><input type="number" name="age" value={formData.age} onChange={handleInputChange} /></div>
                <div className="input-box"><label>CONTACT</label><input type="text" name="contact" value={formData.contact} onChange={handleInputChange} /></div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box"><label>ADDRESS</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} /></div>
              </div>

              {formData.role === 'STAFF' && (
                <div className="items-manager" style={{ marginTop: '20px' }}>
                  <div className="manager-top"><span className="syncopate">Granular Permissions</span></div>
                  <div className="permissions-grid" style={{ display: 'grid', gap: '15px', padding: '15px' }}>
                    {Object.keys(formData.permissions).map((module) => (
                      <div key={module} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px' }}>
                        <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '13px', color: '#0f766e' }}>{module} Module</span>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                            <input type="checkbox" checked={formData.permissions[module]?.view || false} onChange={(e) => handlePermissionChange(module, 'view', e.target.checked)} /> View
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                            <input type="checkbox" checked={formData.permissions[module]?.edit || false} onChange={(e) => handlePermissionChange(module, 'edit', e.target.checked)} /> Edit
                          </label>
                          {formData.permissions[module]?.delete !== undefined && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                              <input type="checkbox" checked={formData.permissions[module]?.delete || false} onChange={(e) => handlePermissionChange(module, 'delete', e.target.checked)} /> Delete
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="submit" className="hologram-btn large" disabled={isSubmitting}>{editingId ? 'UPDATE STAFF' : 'CREATE STAFF'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default UsersPage;
