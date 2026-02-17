import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MemberMgmt from './pages/MemberMgmt';
import Monitoring from './pages/Monitoring';
import FeeMgmt from './pages/FeeMgmt';
import LogMgmt from './pages/LogMgmt';
import InquiryMgmt from './pages/InquiryMgmt';

import './App.css';

function App() {
  return (
    <Router>
      <div className="admin-container">
        <Sidebar />
        

        <div className="main-layout">
          <main className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/members" />} />
              <Route path="/members" element={<MemberMgmt />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/fees" element={<FeeMgmt />} />
              <Route path="/logs" element={<LogMgmt />} />
              <Route path="/inquiry" element={<InquiryMgmt />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;