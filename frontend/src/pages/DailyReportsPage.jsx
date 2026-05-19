import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppShell from '../components/AppShell';
import { Plus, Printer, Trash2, Edit2, Loader2, FileSpreadsheet, X, Search, RefreshCw } from 'lucide-react';

const DailyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const defaultCashDenominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];
  
  const emptyForm = {
    date: new Date().toISOString().split('T')[0],
    staffName: user?.name || '',
    voucherNoFrom: '',
    voucherNoTo: '',
    totalVouchers: 0,
    voucherValue: 0,
    expenses: Array(6).fill({ name: '', amount: '' }),
    totalExpenses: 0,
    cashBreakdown: defaultCashDenominations.map(d => ({ denomination: d, count: '' })),
    cashTotal: 0,
    gpayAmount: 0,
    grandTotal: 0,
    totalSales: 0,
    totalCollection: 0,
    dueAmount: 0
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/daily-reports');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to fetch daily reports', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const calculateTotals = (data) => {
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];
    const totalExp = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    const cash = Array.isArray(data.cashBreakdown) ? data.cashBreakdown : [];
    const totalCash = cash.reduce((sum, item) => sum + ((parseFloat(item.denomination) || 0) * (parseInt(item.count) || 0)), 0);
    
    const grandTotal = totalCash + (parseFloat(data.gpayAmount) || 0);

    return { totalExp, totalCash, grandTotal };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (['gpayAmount'].includes(name)) {
        const totals = calculateTotals(newData);
        newData.grandTotal = totals.grandTotal;
      }
      return newData;
    });
  };

  const handleExpenseChange = (index, field, value) => {
    setFormData(prev => {
      const newExpenses = [...prev.expenses];
      newExpenses[index] = { ...newExpenses[index], [field]: value };
      const totals = calculateTotals({ ...prev, expenses: newExpenses });
      return { ...prev, expenses: newExpenses, totalExpenses: totals.totalExp };
    });
  };

  const handleCashChange = (index, value) => {
    setFormData(prev => {
      const newCash = [...prev.cashBreakdown];
      newCash[index] = { ...newCash[index], count: value };
      const totals = calculateTotals({ ...prev, cashBreakdown: newCash });
      return { ...prev, cashBreakdown: newCash, cashTotal: totals.totalCash, grandTotal: totals.grandTotal };
    });
  };

  const handleAddExpenseRow = () => {
    setFormData(prev => ({ ...prev, expenses: [...prev.expenses, { name: '', amount: '' }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        totalVouchers: parseInt(formData.totalVouchers) || 0,
        voucherValue: parseFloat(formData.voucherValue) || 0,
        totalExpenses: parseFloat(formData.totalExpenses) || 0,
        cashTotal: parseFloat(formData.cashTotal) || 0,
        gpayAmount: parseFloat(formData.gpayAmount) || 0,
        grandTotal: parseFloat(formData.grandTotal) || 0,
        totalSales: parseFloat(formData.totalSales) || 0,
        totalCollection: parseFloat(formData.totalCollection) || 0,
        dueAmount: parseFloat(formData.dueAmount) || 0,
        expenses: formData.expenses.filter(e => e.name || e.amount).map(e => ({ name: e.name, amount: parseFloat(e.amount) || 0 })),
        cashBreakdown: formData.cashBreakdown.map(c => ({ denomination: parseInt(c.denomination) || 0, count: parseInt(c.count) || 0 }))
      };

      if (editingId) {
        await api.put(`/daily-reports/${editingId}`, payload);
      } else {
        await api.post('/daily-reports', payload);
      }
      setShowModal(false);
      fetchReports();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save daily report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (report) => {
    setEditingId(report.id);
    
    // Format date to YYYY-MM-DD
    const dateStr = new Date(report.date).toISOString().split('T')[0];
    
    // Ensure expenses are at least 6 rows
    let exps = Array.isArray(report.expenses) ? [...report.expenses] : [];
    while (exps.length < 6) exps.push({ name: '', amount: '' });
    
    // Map cash breakdown
    const parsedCash = Array.isArray(report.cashBreakdown) ? report.cashBreakdown : [];
    const cb = defaultCashDenominations.map(d => {
      const found = parsedCash.find(c => c.denomination === d);
      return { denomination: d, count: found ? found.count : '' };
    });

    setFormData({
      date: dateStr,
      staffName: report.staffName || '',
      voucherNoFrom: report.voucherNoFrom || '',
      voucherNoTo: report.voucherNoTo || '',
      totalVouchers: report.totalVouchers || 0,
      voucherValue: report.voucherValue || 0,
      expenses: exps,
      totalExpenses: report.totalExpenses || 0,
      cashBreakdown: cb,
      cashTotal: report.cashTotal || 0,
      gpayAmount: report.gpayAmount || 0,
      grandTotal: report.grandTotal || 0,
      totalSales: report.totalSales || 0,
      totalCollection: report.totalCollection || 0,
      dueAmount: report.dueAmount || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this daily report?')) return;
    try {
      await api.delete(`/daily-reports/${id}`);
      fetchReports();
    } catch (e) {
      alert('Failed to delete report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <main className="arctic-main hide-on-print">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Daily Reports</h1>
            <p className="grotesk">End-of-day accounts and cash reconciliations</p>
          </div>
          <div className="header-meta">
            <button className="hologram-btn" onClick={openAddModal}><Plus size={20} /> NEW REPORT</button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Recent Reports</h3>
              <div className="table-actions">
                <button onClick={fetchReports} className="icon-btn"><RefreshCw size={18} /></button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Date</th>
                    <th className="syncopate">Staff</th>
                    <th className="syncopate">Total Sales</th>
                    <th className="syncopate">Total Collection</th>
                    <th className="syncopate">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td><span className="date">{new Date(r.date).toLocaleDateString()}</span></td>
                      <td><span className="client">{r.staffName}</span></td>
                      <td><span className="valuation">Rs.{parseFloat(r.totalSales).toFixed(2)}</span></td>
                      <td><span className="valuation" style={{ color: '#10b981' }}>Rs.{parseFloat(r.totalCollection).toFixed(2)}</span></td>
                      <td>
                        <div className="row-cmds">
                          <button onClick={() => openEditModal(r)} className="cmd-icon" title="View/Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(r.id)} className="cmd-icon" style={{ color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No reports found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="report-modal-overlay">
          <div className="report-modal-container">
            <div className="report-modal-actions hide-on-print">
              <button className="hologram-btn" onClick={handlePrint}><Printer size={16} /> PRINT</button>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            
            <div className="daily-report-paper" id="printable-report">
              <div className="report-header">
                <h2>GVS PACKAGES</h2>
                <h3>Daily Accounts</h3>
                <div className="header-fields">
                  <div className="field-group">
                    <label>Name :</label>
                    <input type="text" name="staffName" value={formData.staffName} onChange={handleInputChange} className="border-input" />
                  </div>
                  <div className="field-group date-group">
                    <label>Date:</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="border-input" />
                  </div>
                </div>
              </div>

              <div className="voucher-section section-box">
                <div className="v-row">
                  <div className="v-col">Voucher no :</div>
                  <div className="v-col"><input type="text" name="voucherNoFrom" value={formData.voucherNoFrom} onChange={handleInputChange} className="clean-input" /></div>
                  <div className="v-col text-center">To</div>
                  <div className="v-col"><input type="text" name="voucherNoTo" value={formData.voucherNoTo} onChange={handleInputChange} className="clean-input" /></div>
                  <div className="v-col text-center">Total no of Vouchers</div>
                </div>
                <div className="v-row border-top">
                  <div className="v-col">Voucher Value :</div>
                  <div className="v-col-span"><input type="number" name="voucherValue" value={formData.voucherValue} onChange={handleInputChange} className="clean-input text-right" /></div>
                  <div className="v-col text-center"><input type="number" name="totalVouchers" value={formData.totalVouchers} onChange={handleInputChange} className="clean-input text-center" /></div>
                </div>
              </div>

              <div className="body-section">
                <div className="expenses-col">
                  <h4>Expense</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.expenses.map((exp, idx) => (
                        <tr key={idx}>
                          <td><input type="text" value={exp.name} onChange={(e) => handleExpenseChange(idx, 'name', e.target.value)} className="clean-input" /></td>
                          <td><input type="number" value={exp.amount} onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)} className="clean-input text-right" /></td>
                        </tr>
                      ))}
                      <tr className="hide-on-print">
                        <td colSpan="2" style={{ textAlign: 'center', cursor: 'pointer', color: '#3b82f6', fontSize: '12px' }} onClick={handleAddExpenseRow}>+ Add Row</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Expenses Total</strong></td>
                        <td className="text-right"><strong>{formData.totalExpenses.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <div className="balance-row mt-4">
                    <strong>Balance Amount</strong>
                    <strong className="text-right">{(formData.totalCollection - formData.totalExpenses).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="cash-col">
                  <table className="report-table cash-table">
                    <tbody>
                      {formData.cashBreakdown.map((cash, idx) => (
                        <tr key={idx}>
                          <td className="text-right">{cash.denomination}</td>
                          <td><input type="number" value={cash.count} onChange={(e) => handleCashChange(idx, e.target.value)} className="clean-input text-center" /></td>
                          <td className="text-right">{cash.count ? (cash.denomination * parseInt(cash.count)).toFixed(2) : '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2"><strong>Cash Total</strong></td>
                        <td className="text-right"><strong>{formData.cashTotal.toFixed(2)}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="text-right">Gpay</td>
                        <td className="text-right"><input type="number" name="gpayAmount" value={formData.gpayAmount} onChange={handleInputChange} className="clean-input text-right" /></td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="text-right"><strong>G.Total</strong></td>
                        <td className="text-right"><strong>{formData.grandTotal.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <div className="diff-row mt-2">
                    <span className="diff-label">Diff</span>
                    <input type="text" readOnly value={(formData.grandTotal - (formData.totalCollection - formData.totalExpenses)).toFixed(2)} className="clean-input text-right diff-input" />
                  </div>
                </div>
              </div>

              <div className="footer-section">
                <div className="summary-col">
                  <table className="report-table no-border">
                    <tbody>
                      <tr><td className="text-right">Total Sales :</td><td><input type="number" name="totalSales" value={formData.totalSales} onChange={handleInputChange} className="clean-input text-right" /></td></tr>
                      <tr><td className="text-right">Total Voucher :</td><td><input type="number" value={formData.voucherValue} readOnly className="clean-input text-right" /></td></tr>
                      <tr><td className="text-right">Total Expenses :</td><td><input type="number" value={formData.totalExpenses} readOnly className="clean-input text-right" /></td></tr>
                      <tr><td className="text-right">Total Collection :</td><td><input type="number" name="totalCollection" value={formData.totalCollection} onChange={handleInputChange} className="clean-input text-right" /></td></tr>
                      <tr><td className="text-right">Gpay Cash recd :</td><td><input type="number" value={formData.gpayAmount} readOnly className="clean-input text-right" /></td></tr>
                      <tr><td className="text-right">Cash received :</td><td><input type="number" value={formData.cashTotal} readOnly className="clean-input text-right" /></td></tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="due-col">
                   <div className="due-row"><span>Amount</span><input type="number" readOnly value={(parseFloat(formData.totalSales) + parseFloat(formData.totalCollection)).toFixed(2)} className="clean-input text-right" /></div>
                   <div className="due-row"><span>Due 15</span><input type="number" name="dueAmount" value={formData.dueAmount} onChange={handleInputChange} className="clean-input text-right" /></div>
                   <div className="due-row"><strong>Total</strong><input type="number" readOnly value={((parseFloat(formData.totalSales) + parseFloat(formData.totalCollection)) + parseFloat(formData.dueAmount)).toFixed(2)} className="clean-input text-right" style={{fontWeight: 'bold'}} /></div>
                </div>
              </div>
            </div>

            <div className="report-modal-footer hide-on-print">
              <button type="button" onClick={handleSubmit} className="hologram-btn large w-full" disabled={isSubmitting}>
                {isSubmitting ? 'SAVING...' : 'SAVE DAILY REPORT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default DailyReportsPage;
