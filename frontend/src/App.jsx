import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/Products';
import BillingPage from './pages/BillingPage';
import ReceiptsPage from './pages/ReceiptsPage';
import OutstandingReceivablesPage from './pages/OutstandingReceivablesPage';
import UsersPage from './pages/UsersPage';
import ClientsPage from './pages/ClientsPage';
import DailyReportsPage from './pages/DailyReportsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/billing" 
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/receipts" 
          element={
            <ProtectedRoute>
              <ReceiptsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/receivables" 
          element={
            <ProtectedRoute>
              <OutstandingReceivablesPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/daily-reports" 
          element={
            <ProtectedRoute>
              <DailyReportsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          } 
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
