import React, { useEffect, useState } from 'react';
import {
  Download,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import api from '../services/api';
import { exportCsv, exportExcel, exportPdf } from '../utils/exporters';

const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalCollections: 0, receiptCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [formData, setFormData] = useState({
    receiptNo: `RCPT-${Date.now().toString().slice(-6)}`,
    clientId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    remarks: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [receiptsRes, clientsRes, statsRes] = await Promise.all([
        api.get('/receipts'),
        api.get('/clients'),
        api.get('/receipts/stats'),
      ]);
      setReceipts(receiptsRes.data);
      setClients(clientsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch receipts', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      receiptNo: `RCPT-${Date.now().toString().slice(-6)}`,
      clientId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'CASH',
      remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/receipts', {
        ...formData,
        clientId: Number(formData.clientId),
        amount: Number(formData.amount),
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt? Customer outstanding will be adjusted back.')) return;
    try {
      await api.delete(`/receipts/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete receipt');
    }
  };

  const formatMoney = (value) =>
    `Rs.${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const filteredReceipts = receipts.filter((receipt) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      !query ||
      receipt.receiptNo.toLowerCase().includes(query) ||
      receipt.client?.name?.toLowerCase().includes(query) ||
      receipt.paymentMode?.toLowerCase().includes(query)
    );
  });

  const exportHeaders = ['Receipt No', 'Customer', 'Amount', 'Date', 'Payment Mode', 'Remarks'];
  const exportRows = filteredReceipts.map((receipt) => [
    receipt.receiptNo,
    receipt.client?.name || '',
    receipt.amount,
    new Date(receipt.date).toLocaleDateString(),
    receipt.paymentMode,
    receipt.remarks || '',
  ]);

  const downloadReceipts = () => {
    if (exportFormat === 'csv') {
      exportCsv('gvs-collections', exportHeaders, exportRows);
      return;
    }
    if (exportFormat === 'excel') {
      exportExcel('gvs-collections', 'GVS Collection Register', exportHeaders, exportRows);
      return;
    }
    exportPdf('GVS Collection Register', exportHeaders, exportRows);
  };

  if (isLoading) {
    return (
      <div className="arctic-loading">
        <div className="cryo-chamber"><ReceiptText size={40} className="ice-icon" /></div>
        <p className="syncopate">Loading collections...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Receipts & Collections</h1>
            <p className="grotesk">Record customer payments and keep outstanding balances updated.</p>
          </div>
          <div className="header-meta">
            <div className="search-pill">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search receipt, customer, mode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="hologram-btn"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus size={20} /> NEW RECEIPT
            </button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Total Collections</span>
            <span className="stat-value neon-text grotesk">{formatMoney(stats.totalCollections)}</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Receipts</span>
            <span className="stat-value grotesk">{stats.receiptCount}</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Customers</span>
            <span className="stat-value grotesk">{clients.length}</span>
          </div>

          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Collection Register</h3>
              <div className="table-actions">
                <button onClick={fetchData} className="icon-btn" title="Refresh"><RefreshCw size={18} /></button>
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
                <button onClick={downloadReceipts} className="icon-btn" title="Download receipts"><Download size={18} /></button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Receipt No</th>
                    <th className="syncopate">Customer</th>
                    <th className="syncopate">Amount</th>
                    <th className="syncopate">Date</th>
                    <th className="syncopate">Mode</th>
                    <th className="syncopate">Remarks</th>
                    <th className="syncopate">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td><span className="code">{receipt.receiptNo}</span></td>
                      <td><span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{receipt.client?.name}</span></td>
                      <td><span className="valuation neon-text">{formatMoney(receipt.amount)}</span></td>
                      <td><span className="date">{new Date(receipt.date).toLocaleDateString()}</span></td>
                      <td><span className="payload-chip">{receipt.paymentMode}</span></td>
                      <td><span className="date">{receipt.remarks || '-'}</span></td>
                      <td>
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="cmd-icon"
                          style={{ color: '#ef4444' }}
                          title="Delete Receipt"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReceipts.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No receipts found. Add a collection receipt to get started.
                      </td>
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
          <div className="arctic-modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="syncopate">Record Collection</h3>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="input-box">
                  <label>RECEIPT NO</label>
                  <input
                    value={formData.receiptNo}
                    onChange={(e) => setFormData((p) => ({ ...p, receiptNo: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-box">
                  <label>DATE</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-box">
                  <label><Users size={13} /> CUSTOMER</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value }))}
                    required
                  >
                    <option value="">SELECT CUSTOMER</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - Outstanding {formatMoney(client.outstandingAmount)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-box">
                  <label><Wallet size={13} /> AMOUNT</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-box">
                  <label>PAYMENT MODE</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData((p) => ({ ...p, paymentMode: e.target.value }))}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box">
                  <label>REMARKS</label>
                  <input
                    value={formData.remarks}
                    onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                    placeholder="Optional payment note"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <div className="total-box">
                  <span className="syncopate">Collection</span>
                  <span className="val neon-text">{formatMoney(formData.amount)}</span>
                </div>
                <button type="submit" className="hologram-btn large" disabled={isSubmitting}>
                  {isSubmitting ? 'SAVING...' : 'SAVE RECEIPT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ReceiptsPage;
