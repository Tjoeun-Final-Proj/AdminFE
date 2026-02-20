import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import MemberMgmt from './pages/MemberMgmt';
import Monitoring from './pages/Monitoring';
import FeeMgmt from './pages/FeeMgmt';
import LogMgmt from './pages/LogMgmt';
import InquiryMgmt from './pages/InquiryMgmt';

import './App.css';

function AdminLayout() {
  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-layout">
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Navigate to="/members" replace />} />
            <Route path="/members" element={<MemberMgmt />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/fees" element={<FeeMgmt />} />
            <Route path="/logs" element={<LogMgmt />} />
            <Route path="/inquiry" element={<InquiryMgmt />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isChecking } = useAuth();
  if (isChecking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        로딩 중...
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/members" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;