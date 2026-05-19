import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users, Search, Plus, Trash2, Edit2, LogOut, Download,
  LayoutDashboard, Layers, CreditCard, PackageCheck, Command, X, MapPin
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { exportCsv, exportExcel, exportPdf } from '../utils/exporters';

const ClientsPage = () => {
  const { user, logout } = useAuth();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  const [formData, setFormData] = useState({
    name: '', address: '', zone: ''
  });

  // Admin Only Route
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      address: c.address || '',
      zone: c.zone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client? This may affect existing invoices and shipments.")) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchData();
    } catch (e) {
      alert("Failed to delete client");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      !query ||
      client.name.toLowerCase().includes(query) ||
      client.zone?.toLowerCase().includes(query) ||
      client.address?.toLowerCase().includes(query)
    );
  });

  const exportHeaders = ['Client Name', 'Address', 'Zone', 'Outstanding Balance'];
  const exportRows = filteredClients.map((c) => [
    c.name,
    c.address || '-',
    c.zone || 'Unassigned',
    c.outstandingAmount || 0,
  ]);

  const downloadClients = () => {
    if (exportFormat === 'csv') {
      exportCsv('gvs-customers', exportHeaders, exportRows);
      return;
    }
    if (exportFormat === 'excel') {
      exportExcel('gvs-customers', 'GVS Customer Register', exportHeaders, exportRows);
      return;
    }
    exportPdf('GVS Customer Register', exportHeaders, exportRows);
  };

  if (isLoading) return <div className="arctic-loading"><div className="cryo-chamber"><Users size={40} className="ice-icon" /></div><p className="syncopate">Loading customer accounts...</p></div>;

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Customer Accounts</h1>
            <p className="grotesk">Manage shops, hotels, caterers, distributors, zones, and outstanding balances.</p>
          </div>
          <div className="header-meta">
            <div className="search-pill">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search customers or zone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="hologram-btn" onClick={() => { setEditingId(null); setFormData({name: '', address: '', zone: ''}); setShowModal(true); }}><Plus size={20} /> NEW CUSTOMER</button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Customer Register</h3>
              <div className="table-actions">
                <select
                  className="table-select"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  title="Export format"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
                <button onClick={downloadClients} className="icon-btn" title="Download customers"><Download size={18} /></button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Client Name</th>
                    <th className="syncopate">Address</th>
                    <th className="syncopate">Zone</th>
                    <th className="syncopate">Outstanding</th>
                    <th className="syncopate">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ color: 'var(--text-dark)', fontWeight: '600', fontSize: '15px' }}>{c.name}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{c.address || '—'}</span>
                      </td>
                      <td><span className="payload-chip">{c.zone || 'UNASSIGNED'}</span></td>
                      <td><span className="valuation neon-text">Rs.{c.outstandingAmount?.toLocaleString() || '0'}</span></td>
                      <td>
                        <div className="row-cmds">
                          <button onClick={() => handleEdit(c)} className="cmd-icon"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(c.id)} className="cmd-icon" style={{color: '#ef4444'}}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No customers found for the current search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ARCTIC MODAL */}
      {showModal && (
        <div className="arctic-modal-overlay">
          <div className="arctic-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="syncopate">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box">
                  <label>CLIENT NAME</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Acme Traders"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="input-box">
                  <label>ZONE / AREA</label>
                  <input name="zone" value={formData.zone} onChange={handleInputChange} placeholder="e.g. North Zone" />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box">
                  <label>ADDRESS</label>
                  <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Street, City, Pincode" />
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '30px' }}>
                <button type="submit" className="hologram-btn large" disabled={isSubmitting}>{editingId ? 'UPDATE CUSTOMER' : 'SAVE CUSTOMER'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ClientsPage;
