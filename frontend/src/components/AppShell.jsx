import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  CreditCard,
  MapPin,
  PackageCheck,
  LogOut,
  Users,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Inventory', icon: Layers },
    { to: '/billing', label: 'Billing', icon: CreditCard },
    { to: '/receipts', label: 'Receipts', icon: ReceiptText },
    { to: '/receivables', label: 'Outstanding Receivables', icon: Wallet },
    { to: '/clients', label: 'Customers', icon: MapPin, adminOnly: true },
    { to: '/users', label: 'Staff', icon: Users, adminOnly: true },
  ].filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="erp-shell">
      <aside className="erp-sidebar">
        <div className="erp-brand">
          <div className="erp-brand-mark">
            <PackageCheck size={24} />
          </div>
          <div>
            <strong>GVS Packages</strong>
          </div>
        </div>

        <nav className="erp-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'erp-nav-link active' : 'erp-nav-link'
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="erp-sidebar-footer">
          <div className="erp-user-card">
            <span className="erp-user-avatar">{user?.name?.charAt(0) || 'G'}</span>
            <div>
              <strong>{user?.name || 'GVS User'}</strong>
              <span>{user?.role || 'STAFF'}</span>
            </div>
          </div>
          <button onClick={logout} className="erp-logout-btn" type="button">
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="erp-content">
        {children}
      </div>
    </div>
  );
};

export default AppShell;
