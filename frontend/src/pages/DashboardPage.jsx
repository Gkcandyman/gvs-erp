import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart3, LayoutDashboard, LogOut,
  PackageCheck, Users, CreditCard, Layers,
  MapPin, ReceiptText, ShoppingCart, Wallet
} from 'lucide-react';
import AppShell from '../components/AppShell';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [statCards, setStatCards] = useState([]);
  const [totals, setTotals] = useState({ sales: 0, collections: 0, purchases: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [metricsRes, statsRes] = await Promise.all([
          api.get('/dashboard/daily-metrics'),
          api.get('/dashboard/stats'),
        ]);
        setDailyMetrics(metricsRes.data.series || []);
        setTotals(metricsRes.data.totals || { sales: 0, collections: 0, purchases: 0 });
        setStatCards(statsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatMoney = (value) =>
    `Rs.${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const maxMetricValue = Math.max(
    1,
    ...dailyMetrics.flatMap((day) => [
      day.sales || 0,
      day.collections || 0,
      day.purchases || 0,
    ]),
  );

  const metricCards = [
    {
      label: 'Daily Sales',
      value: totals.sales,
      icon: ReceiptText,
      className: 'sales',
    },
    {
      label: 'Daily Collections',
      value: totals.collections,
      icon: Wallet,
      className: 'collections',
    },
    {
      label: 'Daily Purchase',
      value: totals.purchases,
      icon: ShoppingCart,
      className: 'purchases',
    },
  ];

  if (isLoading) {
    return (
      <div className="arctic-loading">
        <div className="cryo-chamber">
          <div className="ice-ring"></div>
          <div className="ice-ring second"></div>
          <PackageCheck size={40} className="ice-icon" />
        </div>
        <p className="syncopate">Loading supply operations...</p>

      </div>
    );
  }

  return (
    <AppShell>
      <main className="arctic-main">
        <header className="arctic-header">
          <div className="header-text">
            <h1 className="syncopate animate-reveal">Business Dashboard</h1>
            <p className="grotesk">Daily sales, collections, and purchase values from the database</p>
          </div>
        </header>

        <div className="dashboard-metrics-grid">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`business-metric-card ${card.className}`}>
                <div className="metric-icon">
                  <Icon size={22} />
                </div>
                <div>
                  <span className="stat-label syncopate">{card.label}</span>
                  <span className="stat-value grotesk">{formatMoney(card.value)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {statCards.length > 0 && (
          <div className="bento-grid" style={{ marginBottom: '22px' }}>
            {statCards.map((card) => (
              <div key={card.label} className="bento-card cell-3">
                <span className="stat-label syncopate">{card.label}</span>
                <span className="stat-value grotesk" style={{ color: card.color }}>{card.value}</span>
                <span className="date">{card.sub}</span>
              </div>
            ))}
          </div>
        )}

        <section className="business-chart-card">
          <div className="chart-header">
            <div>
              <h3 className="syncopate"><BarChart3 size={20} /> Daily Business Chart</h3>
              <p>Last 7 days from invoices, receipts, and purchase expenses.</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item sales">Sales</span>
              <span className="legend-item collections">Collections</span>
              <span className="legend-item purchases">Purchase</span>
            </div>
          </div>

          <div className="daily-chart">
            {dailyMetrics.map((day) => (
              <div key={day.key} className="daily-chart-column">
                <div className="bar-group">
                  <div
                    className="chart-bar sales"
                    style={{ height: `${Math.max(6, (day.sales / maxMetricValue) * 220)}px` }}
                    title={`Sales: ${formatMoney(day.sales)}`}
                  />
                  <div
                    className="chart-bar collections"
                    style={{ height: `${Math.max(6, (day.collections / maxMetricValue) * 220)}px` }}
                    title={`Collections: ${formatMoney(day.collections)}`}
                  />
                  <div
                    className="chart-bar purchases"
                    style={{ height: `${Math.max(6, (day.purchases / maxMetricValue) * 220)}px` }}
                    title={`Purchase: ${formatMoney(day.purchases)}`}
                  />
                </div>
                <span className="chart-day">{day.label}</span>
                <div className="chart-values">
                  <span>{formatMoney(day.sales)}</span>
                  <span>{formatMoney(day.collections)}</span>
                  <span>{formatMoney(day.purchases)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
};

export default DashboardPage;
