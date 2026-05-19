import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Package, Search, Plus, Filter, Trash2, Edit2,
  Loader2, LogOut, LayoutDashboard, Users, 
  Truck, ShieldCheck, BarChart3, Bell, X, 
  Globe, CreditCard, RefreshCw, AlertCircle,
  PackageCheck, Layers, Command, Box, Download,
  Database, Activity, MapPin
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { exportCsv, exportExcel, exportPdf } from '../utils/exporters';

const ProductsPage = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingProductId, setEditingProductId] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    stock: 0,
    price: 0.0,
    description: ''
  });

  const emptyForm = {
    name: '',
    categoryId: '',
    stock: 0,
    price: 0.0,
    description: ''
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/categories')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch inventory data', error);
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
      [name]: (name === 'stock' || name === 'categoryId') ? parseInt(value) : 
              name === 'price' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProductId) {
        await api.put(`/inventory/${editingProductId}`, formData);
      } else {
        await api.post('/inventory', formData);
      }
      setShowAddModal(false);
      setEditingProductId(null);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingProductId(null);
    setFormData(emptyForm);
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      stock: product.stock,
      price: product.price,
      description: product.description || ''
    });
    setShowAddModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query);
    const matchesCategory =
      categoryFilter === 'all' || String(product.categoryId) === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const exportHeaders = ['Product Name', 'Category', 'Unit Count', 'Unit Price'];
  const exportRows = filteredProducts.map((p) => [
    p.name,
    p.category?.name || 'Uncategorized',
    p.stock,
    p.price,
  ]);

  const downloadProducts = () => {
    if (exportFormat === 'csv') {
      exportCsv('gvs-inventory', exportHeaders, exportRows);
      return;
    }
    if (exportFormat === 'excel') {
      exportExcel('gvs-inventory', 'GVS Inventory Register', exportHeaders, exportRows);
      return;
    }
    exportPdf('GVS Inventory Register', exportHeaders, exportRows);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from inventory? This cannot be undone.`)) return;
    try {
      await api.delete(`/inventory/${id}`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="arctic-loading">
        <div className="cryo-chamber"><Database size={40} className="ice-icon" /></div>
        <p className="syncopate">Loading product stock...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Product Inventory</h1>
            <p className="grotesk">Packaging materials, foil containers, dairy, frozen meat, and food item stock</p>
          </div>
          <div className="header-meta">
            <div className="search-pill">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products or category"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="hologram-btn" onClick={openAddModal}><Plus size={20} /> ADD PURCHASE ENTRY</button>
          </div>
        </header>

        <div className="bento-grid">
          {/* STATS */}
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Total Products</span>
            <span className="stat-value neon-text grotesk">{products.length} ITEMS</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Critical Stock</span>
            <span className="stat-value grotesk" style={{ color: '#ef4444' }}>{products.filter(p => p.stock < 1000).length} ALERTS</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Stock Status</span>
            <span className="stat-value grotesk">ACTIVE</span>
          </div>

          {/* TABLE */}
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Inventory Items</h3>
              <div className="table-actions">
                <select
                  className="table-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
                <button onClick={downloadProducts} className="icon-btn" title="Download inventory"><Download size={18} /></button>
                <button onClick={fetchData} className="icon-btn"><RefreshCw size={18} /></button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Product Detail</th>
                    <th className="syncopate">Category</th>
                    <th className="syncopate">Unit Count</th>
                    <th className="syncopate">Unit Price</th>
                    <th className="syncopate">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td><div className="id-block"><span className="client">{product.name}</span></div></td>
                      <td><span className="payload-chip">{product.category?.name}</span></td>
                      <td><span className="valuation" style={{ color: product.stock < 1000 ? '#ef4444' : 'var(--text-dark)' }}>{product.stock.toLocaleString()}</span></td>
                      <td><span className="date">Rs.{product.price.toFixed(2)}</span></td>
                      <td>
                        <div className="row-cmds">
                          <button onClick={() => openEditModal(product)} className="cmd-icon" title="Edit Product"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(product.id, product.name)} className="cmd-icon" style={{ color: '#ef4444' }} title="Delete Product"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No products match the current search or category.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {showAddModal && (
        <div className="arctic-modal-overlay">
          <div className="arctic-modal">
            <div className="modal-header">
              <h3 className="syncopate">{editingProductId ? 'Edit Purchase Entry' : 'Add Purchase Entry'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingProductId(null); }}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="input-box"><label>PRODUCT NAME</label><input name="name" value={formData.name} onChange={handleInputChange} required /></div>
                <div className="input-box"><label>CATEGORY</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                    <option value="">SELECT CATEGORY</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="input-box"><label>{editingProductId ? 'CURRENT STOCK' : 'INITIAL STOCK'}</label><input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required /></div>
                <div className="input-box"><label>UNIT VALUE (RS)</label><input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required /></div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="input-box"><label>DESCRIPTION</label><input name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional product notes" /></div>
              </div>
              <div className="modal-footer">
                <div className="total-box"><span className="syncopate">Status</span><span className="val neon-text">{editingProductId ? 'READY TO UPDATE' : 'READY TO SAVE'}</span></div>
                <button type="submit" className="hologram-btn large" disabled={isSubmitting}>{editingProductId ? 'UPDATE ENTRY' : 'SAVE ENTRY'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ProductsPage;
