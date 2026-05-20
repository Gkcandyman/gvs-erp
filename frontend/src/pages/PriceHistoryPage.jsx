import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import api from '../services/api';
import { RefreshCw } from 'lucide-react';

const PriceHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ clientId: '', productId: '' });

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.productId) params.set('productId', filters.productId);

    const [historyRes, clientsRes, productsRes] = await Promise.all([
      api.get(`/price-history?${params.toString()}`),
      api.get('/clients'),
      api.get('/inventory'),
    ]);
    setHistory(historyRes.data);
    setClients(clientsRes.data);
    setProducts(productsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [filters.clientId, filters.productId]);

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Price History</h1>
            <p className="grotesk">Customer-wise product pricing history from billing</p>
          </div>
          <div className="header-meta">
            <button className="icon-btn" onClick={fetchData}><RefreshCw size={18} /></button>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Pricing Register</h3>
              <div className="table-actions">
                <select className="table-select" value={filters.clientId} onChange={(e) => setFilters((p) => ({ ...p, clientId: e.target.value }))}>
                  <option value="">All customers</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <select className="table-select" value={filters.productId} onChange={(e) => setFilters((p) => ({ ...p, productId: e.target.value }))}>
                  <option value="">All products</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.date).toLocaleDateString()}</td>
                      <td><span className="client">{row.clientName}</span></td>
                      <td>{row.productName}</td>
                      <td><span className="valuation">Rs.{Number(row.price).toFixed(2)}</span></td>
                      <td><span className="payload-chip">{row.source}</span></td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30 }}>No price history found.</td></tr>
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

export default PriceHistoryPage;
