import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Search, RefreshCw, Download, Database
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { exportCsv, exportExcel, exportPdf } from '../utils/exporters';

const ProductsPage = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf');

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

  const exportHeaders = ['Product Name', 'Category', 'Stock Units', 'Unit Price', 'Stock Value'];
  const exportRows = filteredProducts.map((p) => [
    p.name,
    p.category?.name || 'Uncategorized',
    p.stock,
    p.price,
    p.stock * p.price,
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
          </div>
        </header>

        <div className="bento-grid">
          {/* STATS */}
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Total Products</span>
            <span className="stat-value neon-text grotesk">{products.length} ITEMS</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Packaging Stock Value</span>
            <span className="stat-value neon-text grotesk" style={{ color: '#38bdf8' }}>
              Rs. {products.reduce((acc, p) => {
                const cat = categories.find(c => c.id === p.categoryId);
                return cat?.type === 'PACKAGING' ? acc + (p.stock * p.price) : acc;
              }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Food Stock Value</span>
            <span className="stat-value neon-text grotesk" style={{ color: '#facc15' }}>
              Rs. {products.reduce((acc, p) => {
                const cat = categories.find(c => c.id === p.categoryId);
                return cat?.type === 'FOOD' ? acc + (p.stock * p.price) : acc;
              }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
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
                    <th className="syncopate">Stock Units</th>
                    <th className="syncopate">Unit Price</th>
                    <th className="syncopate">Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td><div className="id-block"><span className="client">{product.name}</span></div></td>
                      <td><span className="payload-chip">{product.category?.name}</span></td>
                      <td><span className="valuation" style={{ color: product.stock < 1000 ? '#ef4444' : 'var(--text-dark)' }}>{product.stock.toLocaleString()}</span></td>
                      <td><span className="date">Rs.{product.price.toFixed(2)}</span></td>
                      <td><span className="valuation">Rs.{(product.stock * product.price).toFixed(2)}</span></td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No products match the current search or category.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

    </AppShell>
  );
};

export default ProductsPage;
