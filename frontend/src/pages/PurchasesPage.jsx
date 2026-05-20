import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import api from '../services/api';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

const emptyForm = {
  productId: '',
  quantity: '',
  unitPrice: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  remarks: '',
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [purchasesRes, productsRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/inventory'),
      ]);
      setPurchases(purchasesRes.data);
      setProducts(productsRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (productId) => {
    const product = products.find((item) => item.id === Number(productId));
    setFormData((prev) => ({
      ...prev,
      productId,
      unitPrice: product ? product.price : prev.unitPrice,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/purchases', {
        ...formData,
        productId: Number(formData.productId),
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
      });
      setShowModal(false);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase entry? Stock will be reduced back.')) return;
    try {
      await api.delete(`/purchases/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete purchase');
    }
  };

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Purchase Entries</h1>
            <p className="grotesk">Stock-in entries by actual purchase date</p>
          </div>
          <div className="header-meta">
            <button className="hologram-btn" onClick={() => setShowModal(true)}>
              <Plus size={20} /> NEW PURCHASE
            </button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Purchase Register</h3>
              <button onClick={fetchData} className="icon-btn" title="Refresh"><RefreshCw size={18} /></button>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th>Purchase Date</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td><span className="date">{new Date(purchase.purchaseDate).toLocaleDateString()}</span></td>
                      <td><span className="client">{purchase.product?.name}</span></td>
                      <td><span className="valuation">{purchase.quantity}</span></td>
                      <td>Rs.{Number(purchase.unitPrice).toFixed(2)}</td>
                      <td><span className="valuation">Rs.{Number(purchase.totalAmount).toFixed(2)}</span></td>
                      <td>{purchase.remarks || '-'}</td>
                      <td>
                        <button className="cmd-icon" style={{ color: '#ef4444' }} onClick={() => handleDelete(purchase.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && !isLoading && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 30 }}>No purchase entries found.</td></tr>
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
              <h3 className="syncopate">New Purchase Entry</h3>
              <button onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-box">
                  <label>PRODUCT</label>
                  <select value={formData.productId} onChange={(e) => handleProductChange(e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-box">
                  <label>PURCHASE DATE</label>
                  <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData((p) => ({ ...p, purchaseDate: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="input-box">
                  <label>QUANTITY</label>
                  <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))} required />
                </div>
                <div className="input-box">
                  <label>UNIT PRICE</label>
                  <input type="number" min="0" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData((p) => ({ ...p, unitPrice: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box">
                  <label>REMARKS</label>
                  <input value={formData.remarks} onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <div className="total-box">
                  <span>Total Purchase</span>
                  <span className="val">Rs.{(Number(formData.quantity || 0) * Number(formData.unitPrice || 0)).toFixed(2)}</span>
                </div>
                <button className="hologram-btn large" disabled={isSubmitting}>{isSubmitting ? 'SAVING...' : 'SAVE PURCHASE'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default PurchasesPage;
