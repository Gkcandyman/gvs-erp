import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText, Search, Plus, Trash2, Loader2,
  Zap, PackageCheck,
  ChevronRight, CreditCard, Bell, LogOut,
  LayoutDashboard, Layers, Command, Printer,
  Filter, Activity, Box, Download, MoreHorizontal,
  X, Users, MapPin, AlertTriangle
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { exportCsv, exportExcel, exportPdf } from '../utils/exporters';

const BillingPage = () => {
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ todaysBilling: 0, netSales: 0, totalInvoices: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  const [formData, setFormData] = useState({
    clientName: '',
    dueDate: new Date().toISOString().split('T')[0],
    items: [{ name: '', quantity: '', price: 0, productId: null }]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invoicesRes, statsRes, productsRes, clientsRes] = await Promise.all([
        api.get('/billing'),
        api.get('/billing/stats'),
        api.get('/inventory'),
        api.get('/clients'),
      ]);
      setInvoices(invoicesRes.data);
      setStats(statsRes.data);
      setInventoryProducts(productsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Failed to fetch billing data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = invoice.items.map(item => `
      <tr>
        <td class="item-desc">${item.name}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">Rs.${item.price.toFixed(2)}</td>
        <td class="right">Rs.${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const totalAmount = invoice.amount.toFixed(2);
    const issueDate = new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #334155; 
              background: #ffffff;
              margin: 0;
              padding: 40px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-wrapper { max-width: 800px; margin: 0 auto; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 30px; margin-bottom: 40px; }
            .brand-section h1 { margin: 0 0 5px 0; font-size: 28px; font-weight: 700; color: #0f766e; letter-spacing: -0.5px; }
            .brand-section p { margin: 0; font-size: 13px; color: #64748b; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0 0 15px 0; font-size: 32px; font-weight: 300; color: #0f172a; letter-spacing: 2px; }
            .detail-grid { display: grid; grid-template-columns: auto auto; gap: 8px 24px; text-align: left; font-size: 13px; }
            .detail-label { color: #64748b; font-weight: 500; }
            .detail-value { color: #0f172a; font-weight: 600; text-align: right; }
            .billing-info { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .info-block h3 { margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .info-block p { margin: 0 0 4px 0; font-size: 15px; color: #0f172a; font-weight: 600; }
            .info-block span { display: block; font-size: 14px; color: #64748b; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; text-align: left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
            th.right { text-align: right; }
            td { padding: 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
            td.right { text-align: right; font-weight: 500; }
            .item-desc { font-weight: 600; color: #0f172a; }
            .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-table { width: 300px; }
            .totals-table div { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 14px; color: #475569; }
            .totals-table .grand-total { margin-top: 10px; background: #f0fdfa; border-radius: 8px; padding: 16px; font-size: 18px; font-weight: 700; color: #0d9488; border: 1px solid #ccfbf1; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: ${invoice.status === 'PAID' ? '#d1fae5' : '#fee2e2'}; color: ${invoice.status === 'PAID' ? '#059669' : '#dc2626'}; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <div class="brand-section">
                <h1>GVS Packages</h1>
                <p>Packages &amp; Foods</p>
              </div>
              <div class="invoice-details">
                <h2>INVOICE</h2>
                <div class="detail-grid">
                  <span class="detail-label">Invoice Number:</span>
                  <span class="detail-value">#${invoice.invoiceNumber}</span>
                  <span class="detail-label">Date of Issue:</span>
                  <span class="detail-value">${issueDate}</span>
                  <span class="detail-label">Due Date:</span>
                  <span class="detail-value">${dueDate}</span>
                </div>
              </div>
            </div>
            <div class="billing-info">
              <div class="info-block">
                <h3>Billed To</h3>
                <p>${invoice.clientName}</p>
                <span>Client Account</span>
              </div>
              <div class="info-block" style="text-align: right;">
                <h3>From</h3>
                <p>GVS Packages</p>
                <span>Perundurai</span>
                <span>638052</span>
                <span>+91 9994228060</span>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="right">Qty</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="totals-wrapper">
              <div class="totals-table">
                <div><span>Subtotal</span><span>Rs.${totalAmount}</span></div>
                <div><span>Tax (0%)</span><span>Rs.0.00</span></div>
                <div class="grand-total"><span>Total Due</span><span>Rs.${totalAmount}</span></div>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your business. Please remit payment by the due date.</p>
              <p>GVS Packages &bull; Contact: gvspackages@gmail.com &bull; +91 9994228060</p>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleProductSelect = (index, productId) => {
    const newItems = [...formData.items];
    if (!productId) {
      newItems[index] = { name: '', quantity: '', price: 0, productId: null };
      setFormData(prev => ({ ...prev, items: newItems }));
      return;
    }
    const product = inventoryProducts.find(p => p.id === parseInt(productId));
    if (product) {
      newItems[index] = {
        name: product.name,
        quantity: '',
        price: product.price,
        productId: product.id,
      };
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const addItemRow = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: '', price: 0, productId: null }] }));
  };

  const removeItemRow = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/billing/create', formData);
      setShowAddModal(false);
      setFormData({
        clientName: '',
        dueDate: new Date().toISOString().split('T')[0],
        items: [{ name: '', quantity: '', price: 0, productId: null }]
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductStock = (productId) => {
    if (!productId) return null;
    const p = inventoryProducts.find(x => x.id === productId);
    return p ? p.stock : null;
  };

  const hasStockViolation = formData.items.some(i => {
    const stock = getProductStock(i.productId);
    return stock !== null && Number(i.quantity || 0) > stock;
  });

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice? This action cannot be undone.')) return;
    try {
      await api.delete(`/billing/${id}`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.clientName.toLowerCase().includes(query);

    return matchesSearch;
  });

  const exportHeaders = ['Invoice Number', 'Client Name', 'Items', 'Amount', 'Due Date'];
  const exportRows = filteredInvoices.map((invoice) => [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.items?.length || 0,
        invoice.amount,
        new Date(invoice.dueDate).toLocaleDateString(),
      ]);

  const downloadInvoices = () => {
    if (exportFormat === 'csv') {
      exportCsv('gvs-invoices', exportHeaders, exportRows);
      return;
    }
    if (exportFormat === 'excel') {
      exportExcel('gvs-invoices', 'GVS Invoice Register', exportHeaders, exportRows);
      return;
    }
    exportPdf('GVS Invoice Register', exportHeaders, exportRows);
  };

  if (isLoading) {
    return (
      <div className="arctic-loading">
        <div className="cryo-chamber"><FileText size={40} className="ice-icon" /></div>
        <p className="syncopate">Loading invoices and receivables...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Billing & Receivables</h1>
            <p className="grotesk">Invoices for packaging materials, food supply, collections, and pending payments</p>
          </div>
          <div className="header-meta">
            <div className="search-pill">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search invoice or customer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="hologram-btn" onClick={() => setShowAddModal(true)}><Plus size={20} /> NEW INVOICE</button>
          </div>
        </header>

        <div className="bento-grid">
          {/* STATS */}
          <div className="bento-card cell-3">
            <span className="stat-label syncopate">Today's Billing</span>
            <span className="stat-value neon-text grotesk">Rs.{stats.todaysBilling?.toLocaleString() || 0}</span>
          </div>
          <div className="bento-card cell-3">
            <span className="stat-label syncopate">Net Sales</span>
            <span className="stat-value grotesk">Rs.{stats.netSales?.toLocaleString() || 0}</span>
          </div>
          <div className="bento-card cell-6">
            <div className="quick-access">
              <span className="stat-label syncopate">Total Volume</span>
              <div className="pending-nodes">
                <span className="node-count">{stats.totalInvoices} INVOICES GENERATED</span>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Invoice Register</h3>
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
                <button onClick={downloadInvoices} className="icon-btn" title="Download invoices"><Download size={18} /></button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Invoice #</th>
                    <th className="syncopate">Client Name</th>
                    <th className="syncopate">Payload</th>
                    <th className="syncopate">Amount</th>
                    <th className="syncopate">Due Date</th>
                    <th className="syncopate">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><span className="code">{invoice.invoiceNumber}</span></td>
                      <td>
                        <div className="id-block">
                          <span className="client" style={{ color: 'var(--text-dark)', fontSize: '14px' }}>{invoice.clientName}</span>
                        </div>
                      </td>
                      <td><span className="payload-chip">{invoice.items?.length} ITEMS</span></td>
                      <td><span className="valuation neon-text">Rs.{invoice.amount.toLocaleString()}</span></td>
                      <td><span className="date">{new Date(invoice.dueDate).toLocaleDateString()}</span></td>
                      <td>
                        <div className="row-cmds">
                          <button onClick={() => handlePrint(invoice)} className="cmd-icon" title="Print Invoice"><Printer size={16} /></button>
                          <button onClick={() => handleDeleteInvoice(invoice.id)} className="cmd-icon" style={{ color: '#ef4444' }} title="Delete Invoice"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No invoices found for the current search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* INVOICE MODAL */}
      {showAddModal && (
        <div className="arctic-modal-overlay">
          <div className="arctic-modal invoice-modal">
            <div className="modal-header">
              <h3 className="syncopate">Create Invoice</h3>
              <button onClick={() => setShowAddModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">

              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box">
                  <label>DUE DATE</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Client Name Dropdown */}
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} style={{ color: '#14b8a6' }} /> CLIENT NAME
                  </label>
                  {clients.length > 0 ? (
                    <select
                      value={formData.clientName}
                      onChange={(e) => setFormData(p => ({ ...p, clientName: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        background: 'var(--bg-main)',
                        color: 'var(--text-dark)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">— SELECT CLIENT —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(p => ({ ...p, clientName: e.target.value }))}
                      required
                      placeholder="Enter client name (no clients registered yet)"
                    />
                  )}
                </div>
              </div>

              {/* Invoice Items */}
              <div className="items-manager">
                <div className="manager-top">
                  <span className="syncopate">Invoice Items</span>
                  <button type="button" onClick={addItemRow}><Plus size={14} /> ADD ITEM</button>
                </div>
                <div className="billing-item-head">
                  <span>Product Name</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Net Amount</span>
                  <span></span>
                </div>
                <div className="items-list">
                  {formData.items.map((item, index) => {
                    const stock = getProductStock(item.productId);
                    const isOverStock = stock !== null && item.quantity > stock;
                    const isLowStock = stock !== null && stock <= 10 && !isOverStock;
                    const lineTotal = Number(item.quantity || 0) * Number(item.price || 0);
                    return (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        <div className="billing-item-row">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            required
                          >
                            <option value="">Select product</option>
                            {inventoryProducts.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const items = [...formData.items];
                              items[index] = { ...items[index], quantity: e.target.value === '' ? '' : parseInt(e.target.value) };
                              setFormData(p => ({ ...p, items }));
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => {
                              const items = [...formData.items];
                              items[index] = { ...items[index], price: parseFloat(e.target.value) || 0 };
                              setFormData(p => ({ ...p, items }));
                            }}
                          />
                          <div className="line-total-box">
                            Rs.{lineTotal.toFixed(2)}
                          </div>
                          <button type="button" onClick={() => removeItemRow(index)}><Trash2 size={16} /></button>
                        </div>
                        {/* Inline stock warnings */}
                        {isOverStock && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>
                            <AlertTriangle size={13} />
                            <span>Insufficient stock! Only <strong>{stock}</strong> units available — billing blocked.</span>
                          </div>
                        )}
                        {isLowStock && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>
                            <AlertTriangle size={13} />
                            <span>Low stock: only <strong>{stock}</strong> units remaining after this bill.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <div className="total-box">
                  <span className="syncopate">NET VALUATION</span>
                  <span className="val neon-text">Rs.{formData.items.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0).toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  className="hologram-btn large"
                  disabled={isSubmitting || hasStockViolation}
                  title={hasStockViolation ? 'Fix stock violations before submitting' : ''}
                >
                  {isSubmitting ? 'PROCESSING...' : 'FINALIZE TRANSACTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default BillingPage;
