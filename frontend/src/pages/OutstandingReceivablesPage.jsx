import React, { useEffect, useState } from 'react';
import {
  Download,
  Loader2,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import api from '../services/api';
import { exportCsv, exportExcel, exportPdf } from '../utils/exporters';

const OutstandingReceivablesPage = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    customersWithBalance: 0,
    customerCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/receivables/outstanding');
      setCustomers(res.data.customers || []);
      setStats(res.data.stats || {
        totalOutstanding: 0,
        customersWithBalance: 0,
        customerCount: 0,
      });
    } catch (error) {
      console.error('Failed to fetch outstanding receivables', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (value) =>
    `Rs.${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const filteredCustomers = customers.filter((customer) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      !query ||
      customer.name.toLowerCase().includes(query) ||
      customer.zone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  });

  const headers = ['Customer', 'Zone', 'Address', 'Outstanding Balance', 'Last Updated'];
  const rows = filteredCustomers.map((customer) => [
    customer.name,
    customer.zone || 'Unassigned',
    customer.address || '-',
    customer.outstandingAmount || 0,
    customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : '-',
  ]);

  const downloadReceivables = () => {
    if (exportFormat === 'csv') {
      exportCsv('gvs-outstanding-receivables', headers, rows);
      return;
    }
    if (exportFormat === 'excel') {
      exportExcel('gvs-outstanding-receivables', 'GVS Outstanding Receivables', headers, rows);
      return;
    }
    exportPdf('GVS Outstanding Receivables', headers, rows);
  };

  if (isLoading) {
    return (
      <div className="arctic-loading">
        <div className="cryo-chamber"><Wallet size={40} className="ice-icon" /></div>
        <p className="syncopate">Loading outstanding receivables...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate">Outstanding Receivables</h1>
            <p className="grotesk">Customer receivable balances from invoices and collections.</p>
          </div>
          <div className="header-meta">
            <div className="search-pill">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search customer, zone, address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="bento-grid">
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Receivable Balance</span>
            <span className="stat-value neon-text grotesk">{formatMoney(stats.totalOutstanding)}</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Customers Due</span>
            <span className="stat-value grotesk">{stats.customersWithBalance}</span>
          </div>
          <div className="bento-card cell-4">
            <span className="stat-label syncopate">Total Customers</span>
            <span className="stat-value grotesk">{stats.customerCount}</span>
          </div>

          <div className="bento-card table-cell cell-12">
            <div className="table-header">
              <h3 className="syncopate">Receivable Register</h3>
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
                <button onClick={downloadReceivables} className="icon-btn" title="Download receivables"><Download size={18} /></button>
              </div>
            </div>
            <div className="arctic-table-wrap">
              <table className="arctic-table">
                <thead>
                  <tr>
                    <th className="syncopate">Customer</th>
                    <th className="syncopate">Zone</th>
                    <th className="syncopate">Address</th>
                    <th className="syncopate">Balance</th>
                    <th className="syncopate">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td><span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{customer.name}</span></td>
                      <td><span className="payload-chip">{customer.zone || 'UNASSIGNED'}</span></td>
                      <td><span className="date">{customer.address || '-'}</span></td>
                      <td><span className="valuation neon-text">{formatMoney(customer.outstandingAmount)}</span></td>
                      <td><span className="date">{customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : '-'}</span></td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No receivable balances found for the current search.
                      </td>
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

export default OutstandingReceivablesPage;
