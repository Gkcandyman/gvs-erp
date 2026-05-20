import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AppShell from '../components/AppShell';
import { Plus, Printer, Trash2, Edit2, X, RefreshCw, Save, IndianRupee, Eye } from 'lucide-react';

const defaultCashDenominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const numberValue = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const integerValue = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) => `Rs.${numberValue(value).toFixed(2)}`;

const moneyMatches = (left, right) => Math.round(numberValue(left) * 100) === Math.round(numberValue(right) * 100);

const getVoucherCount = (from, to) => {
  const start = integerValue(from);
  const end = integerValue(to);
  if (!start || !end || end < start) return 0;
  return end - start;
};

const getEmptyForm = (userName = '') => ({
  date: new Date().toISOString().split('T')[0],
  staffName: userName,
  voucherNoFrom: '',
  voucherNoTo: '',
  totalVouchers: 0,
  voucherValue: '',
  expenses: Array.from({ length: 6 }, () => ({ name: '', amount: '' })),
  totalExpenses: 0,
  cashBreakdown: defaultCashDenominations.map((denomination) => ({ denomination, count: '' })),
  cashTotal: 0,
  gpayAmount: '',
  grandTotal: 0,
  totalSales: 0,
  totalCollection: 0,
  dueAmount: 0,
  netAmount: 0,
});

const normalizeExpenseRows = (expenses = []) => {
  const rows = expenses.map((expense) => ({
    name: expense.name || expense.category || '',
    amount: expense.amount || '',
    remarks: expense.remarks || '',
  }));
  while (rows.length < 6) rows.push({ name: '', amount: '', remarks: '' });
  return rows;
};

const calculateReport = (data) => {
  const totalVouchers = getVoucherCount(data.voucherNoFrom, data.voucherNoTo);
  const totalExpenses = (Array.isArray(data.expenses) ? data.expenses : []).reduce(
    (sum, item) => sum + numberValue(item.amount),
    0,
  );
  const cashTotal = (Array.isArray(data.cashBreakdown) ? data.cashBreakdown : []).reduce(
    (sum, item) => sum + numberValue(item.denomination) * integerValue(item.count),
    0,
  );
  const totalCollection = numberValue(data.totalCollection);
  const totalGrossAmount = totalCollection;
  const gpayAmount = numberValue(data.gpayAmount);
  const netAmount = totalGrossAmount - totalExpenses;
  const collectionTotal = cashTotal + gpayAmount;
  const grandTotal = collectionTotal;
  const cashReceived = cashTotal;
  const isAmountMatched = moneyMatches(collectionTotal, netAmount);

  return {
    totalVouchers,
    totalExpenses,
    cashTotal,
    totalGrossAmount,
    netAmount,
    collectionTotal,
    grandTotal,
    cashReceived,
    isAmountMatched,
  };
};

const DailyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [printAfterOpen, setPrintAfterOpen] = useState(false);
  const [formData, setFormData] = useState(() => getEmptyForm(user?.name));

  const calculated = useMemo(() => calculateReport(formData), [formData]);
  const isViewOnly = modalMode === 'view';

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

  const fetchDailyStats = async (date) => {
    try {
      const res = await api.get(`/daily-reports/stats/${date}`);
      setFormData((prev) => ({
        ...prev,
        totalSales: numberValue(res.data.totalSales),
        totalCollection: numberValue(res.data.totalCollection),
        expenses: normalizeExpenseRows(res.data.expenses || []),
        totalExpenses: numberValue(res.data.totalExpenses),
      }));
    } catch (error) {
      console.error('Failed to fetch daily report totals', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (showModal && formData.date && !isViewOnly) {
      fetchDailyStats(formData.date);
    }
  }, [showModal, formData.date, isViewOnly]);

  useEffect(() => {
    if (!showModal || !printAfterOpen) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintAfterOpen(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [showModal, printAfterOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCashChange = (index, value) => {
    setFormData((prev) => {
      const cashBreakdown = [...prev.cashBreakdown];
      cashBreakdown[index] = { ...cashBreakdown[index], count: value };
      return { ...prev, cashBreakdown };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calculated.isAmountMatched) {
      alert(`Amount mismatch. Net amount is ${formatMoney(calculated.netAmount)} but hand cash + GPay is ${formatMoney(calculated.collectionTotal)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        totalVouchers: calculated.totalVouchers,
        voucherValue: numberValue(formData.voucherValue),
        totalExpenses: calculated.totalExpenses,
        cashTotal: calculated.cashTotal,
        gpayAmount: numberValue(formData.gpayAmount),
        grandTotal: calculated.grandTotal,
        totalSales: numberValue(formData.totalSales),
        totalCollection: numberValue(formData.totalCollection),
        dueAmount: numberValue(formData.dueAmount),
        netAmount: calculated.netAmount,
        expenses: formData.expenses
          .filter((expense) => expense.name || expense.amount)
          .map((expense) => ({ name: expense.name, amount: numberValue(expense.amount) })),
        cashBreakdown: formData.cashBreakdown.map((cash) => ({
          denomination: integerValue(cash.denomination),
          count: integerValue(cash.count),
        })),
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
    setModalMode('edit');
    setPrintAfterOpen(false);
    setFormData(getEmptyForm(user?.name));
    setShowModal(true);
  };

  const getReportFormData = (report) => {
    const expenses = normalizeExpenseRows(Array.isArray(report.expenses) ? report.expenses : []);

    const savedCash = Array.isArray(report.cashBreakdown) ? report.cashBreakdown : [];
    const cashBreakdown = defaultCashDenominations.map((denomination) => {
      const found = savedCash.find((cash) => integerValue(cash.denomination) === denomination);
      return { denomination, count: found ? found.count : '' };
    });

    return {
      date: new Date(report.date).toISOString().split('T')[0],
      staffName: report.staffName || user?.name || '',
      voucherNoFrom: report.voucherNoFrom || '',
      voucherNoTo: report.voucherNoTo || '',
      totalVouchers: report.totalVouchers || 0,
      voucherValue: report.voucherValue || '',
      expenses,
      totalExpenses: report.totalExpenses || 0,
      cashBreakdown,
      cashTotal: report.cashTotal || 0,
      gpayAmount: report.gpayAmount || '',
      grandTotal: report.grandTotal || 0,
      totalSales: report.totalSales || 0,
      totalCollection: report.totalCollection || 0,
      dueAmount: report.dueAmount || 0,
      netAmount: report.netAmount || 0,
    };
  };

  const openEditModal = (report) => {
    setEditingId(report.id);
    setModalMode('edit');
    setPrintAfterOpen(false);
    setFormData(getReportFormData(report));
    setShowModal(true);
  };

  const openViewModal = (report) => {
    setEditingId(null);
    setModalMode('view');
    setPrintAfterOpen(false);
    setFormData(getReportFormData(report));
    setShowModal(true);
  };

  const handlePrintReport = (report) => {
    setEditingId(null);
    setModalMode('view');
    setFormData(getReportFormData(report));
    setPrintAfterOpen(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this daily report?')) return;
    try {
      await api.delete(`/daily-reports/${id}`);
      fetchReports();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete report');
    }
  };

  return (
    <AppShell>
      <main className="arctic-main hide-on-print">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Daily Reports</h1>
            <p className="grotesk">End-of-day voucher, expense, and collection report</p>
          </div>
          <div className="header-meta">
            <button className="hologram-btn" onClick={openAddModal}>
              <Plus size={20} /> NEW REPORT
            </button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Recent Reports</h3>
              <div className="table-actions">
                <button onClick={fetchReports} className="icon-btn" title="Refresh reports">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Date</th>
                    <th className="syncopate">Staff</th>
                    <th className="syncopate">Voucher Count</th>
                    <th className="syncopate">Gross</th>
                    <th className="syncopate">Expenses</th>
                    <th className="syncopate">Net Amount</th>
                    <th className="syncopate">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td><span className="date">{new Date(report.date).toLocaleDateString()}</span></td>
                      <td><span className="client">{report.staffName}</span></td>
                      <td><span className="valuation">{report.totalVouchers || 0}</span></td>
                      <td><span className="valuation">{formatMoney(report.totalCollection)}</span></td>
                      <td><span className="valuation">{formatMoney(report.totalExpenses)}</span></td>
                      <td><span className="valuation" style={{ color: '#0f766e' }}>{formatMoney(report.netAmount)}</span></td>
                      <td>
                        <div className="row-cmds">
                          <button onClick={() => openViewModal(report)} className="cmd-icon" title="View">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handlePrintReport(report)} className="cmd-icon" title="Print">
                            <Printer size={16} />
                          </button>
                          <button onClick={() => openEditModal(report)} className="cmd-icon" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button onClick={() => handleDelete(report.id)} className="cmd-icon" style={{ color: '#ef4444' }} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No reports found.
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
        <form className="report-modal-overlay" onSubmit={handleSubmit}>
          <div className="report-modal-container">
            <div className="report-modal-actions hide-on-print">
              <button type="button" className="hologram-btn" onClick={() => window.print()}>
                <Printer size={16} /> PRINT
              </button>
              <button type="button" className="close-btn" onClick={() => setShowModal(false)} title="Close">
                <X size={24} />
              </button>
            </div>

            <div className="daily-report-paper" id="printable-report">
              <div className="report-title-block">
                <h2>GVS Packages</h2>
                <span>Daily Accounts Report</span>
              </div>

              <div className="report-meta-grid">
                <label>
                  <span>Name of Staff</span>
                  <input type="text" name="staffName" value={formData.staffName} onChange={handleInputChange} readOnly={isViewOnly} />
                </label>
                <label>
                  <span>Date</span>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} disabled={isViewOnly} />
                </label>
              </div>

              <section className="print-section voucher-ledger">
                <div className="section-title-row">
                  <h3>Voucher Details</h3>
                  <strong>Total Voucher Count: {calculated.totalVouchers}</strong>
                </div>
                <div className="voucher-grid">
                  <label>
                    <span>Starting Voucher No</span>
                    <input type="number" name="voucherNoFrom" value={formData.voucherNoFrom} onChange={handleInputChange} readOnly={isViewOnly} />
                  </label>
                  <label>
                    <span>Ending Voucher No</span>
                    <input type="number" name="voucherNoTo" value={formData.voucherNoTo} onChange={handleInputChange} readOnly={isViewOnly} />
                  </label>
                  <label>
                    <span>Total Voucher Count</span>
                    <input type="number" value={calculated.totalVouchers} readOnly />
                  </label>
                </div>
              </section>

              <div className="report-two-column">
                <section className="print-section">
                  <div className="section-title-row">
                    <h3>Expenses</h3>
                    <strong>{formatMoney(calculated.totalExpenses)}</strong>
                  </div>
                  <table className="report-table expense-table">
                    <thead>
                      <tr>
                        <th>Expense</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.expenses.map((expense, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={expense.name}
                              readOnly
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={expense.amount}
                              readOnly
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total Expenses</td>
                        <td>{formatMoney(calculated.totalExpenses)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="amount-match ok">Expenses are loaded from the Expenses module</div>
                </section>

                <section className="print-section">
                  <div className="section-title-row">
                    <h3>Denomination</h3>
                    <strong>{formatMoney(calculated.cashTotal)}</strong>
                  </div>
                  <table className="report-table denomination-table">
                    <thead>
                      <tr>
                        <th>Note</th>
                        <th>Count</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.cashBreakdown.map((cash, index) => (
                        <tr key={cash.denomination}>
                          <td>{cash.denomination}</td>
                          <td>
                            <input
                              type="number"
                              value={cash.count}
                              onChange={(e) => handleCashChange(index, e.target.value)}
                              readOnly={isViewOnly}
                            />
                          </td>
                          <td>{cash.denomination} x {integerValue(cash.count)} = {formatMoney(cash.denomination * integerValue(cash.count))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2">Cash Received From Hand</td>
                        <td>{formatMoney(calculated.cashTotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan="2">Cash Received GPay</td>
                        <td>
                          <input type="number" name="gpayAmount" value={formData.gpayAmount} onChange={handleInputChange} readOnly={isViewOnly} />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="2">Total Net Amount</td>
                        <td>{formatMoney(calculated.collectionTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className={calculated.isAmountMatched ? 'amount-match ok' : 'amount-match mismatch'}>
                    {calculated.isAmountMatched ? 'Amount matched' : 'Amount mismatch'}
                  </div>
                </section>
              </div>

              <section className="net-strip">
                <div>
                  <span>Total Gross Amount</span>
                  <strong>{formatMoney(calculated.totalGrossAmount)}</strong>
                </div>
                <div>
                  <span>Expenses</span>
                  <strong>{formatMoney(calculated.totalExpenses)}</strong>
                </div>
                <div>
                  <span>Net Amount</span>
                  <strong>{formatMoney(calculated.netAmount)}</strong>
                </div>
              </section>

              <section className="print-section final-summary">
                <div className="section-title-row">
                  <h3>Day Summary</h3>
                  <IndianRupee size={18} />
                </div>
                <div className="summary-grid">
                  <label>
                    <span>Total Sales From Billing</span>
                    <input type="number" value={numberValue(formData.totalSales)} readOnly />
                  </label>
                  <label>
                    <span>Total Voucher Count</span>
                    <input type="number" value={calculated.totalVouchers} readOnly />
                  </label>
                  <label>
                    <span>Total Gross Amount</span>
                    <input type="number" value={calculated.totalGrossAmount.toFixed(2)} readOnly />
                  </label>
                  <label>
                    <span>Total Expenses</span>
                    <input type="number" value={calculated.totalExpenses.toFixed(2)} readOnly />
                  </label>
                  <label>
                    <span>Net Amount</span>
                    <input type="number" value={calculated.netAmount.toFixed(2)} readOnly />
                  </label>
                  <label>
                    <span>Cash Received From Hand</span>
                    <input type="number" value={calculated.cashReceived.toFixed(2)} readOnly />
                  </label>
                  <label>
                    <span>Cash Received GPay</span>
                    <input type="number" name="gpayAmount" value={formData.gpayAmount} onChange={handleInputChange} readOnly={isViewOnly} />
                  </label>
                  <label>
                    <span>Total Net Amount</span>
                    <input type="number" value={calculated.collectionTotal.toFixed(2)} readOnly />
                  </label>
                </div>
              </section>
            </div>

            {!isViewOnly && (
              <div className="report-modal-footer hide-on-print">
                <button type="submit" className="hologram-btn large w-full" disabled={isSubmitting}>
                  <Save size={18} /> {isSubmitting ? 'SAVING...' : 'SAVE DAILY REPORT'}
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </AppShell>
  );
};

export default DailyReportsPage;
