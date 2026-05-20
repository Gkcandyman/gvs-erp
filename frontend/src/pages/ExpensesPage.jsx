import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import api from '../services/api';
import { Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  category: '',
  amount: '',
  remarks: '',
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchExpenses = async () => {
    const res = await api.get('/expenses');
    setExpenses(res.data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense.id);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      amount: expense.amount,
      remarks: expense.remarks || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, amount: Number(formData.amount) || 0 };
    if (editingId) {
      await api.put(`/expenses/${editingId}`, payload);
    } else {
      await api.post('/expenses', payload);
    }
    setShowModal(false);
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Expenses</h1>
            <p className="grotesk">Daily expense entries that feed Daily Reports</p>
          </div>
          <div className="header-meta">
            <button className="hologram-btn" onClick={openAdd}><Plus size={20} /> NEW EXPENSE</button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Expense Register</h3>
              <button onClick={fetchExpenses} className="icon-btn"><RefreshCw size={18} /></button>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td><span className="client">{expense.category}</span></td>
                      <td><span className="valuation">Rs.{Number(expense.amount).toFixed(2)}</span></td>
                      <td>{expense.remarks || '-'}</td>
                      <td>
                        <div className="row-cmds">
                          <button className="cmd-icon" onClick={() => openEdit(expense)}><Edit2 size={16} /></button>
                          <button className="cmd-icon" style={{ color: '#ef4444' }} onClick={() => handleDelete(expense.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30 }}>No expenses found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="arctic-modal-overlay">
          <div className="arctic-modal">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Expense' : 'New Expense'}</h3>
              <button onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-box"><label>DATE</label><input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} required /></div>
                <div className="input-box"><label>EXPENSE NAME</label><input value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} required /></div>
                <div className="input-box"><label>AMOUNT</label><input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))} required /></div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box"><label>REMARKS</label><input value={formData.remarks} onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))} /></div>
              </div>
              <div className="modal-footer">
                <div className="total-box"><span>Expense Total</span><span className="val">Rs.{Number(formData.amount || 0).toFixed(2)}</span></div>
                <button className="hologram-btn large">{editingId ? 'UPDATE EXPENSE' : 'SAVE EXPENSE'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ExpensesPage;
