import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';
import { Users, Activity, CreditCard, FileText, MessageSquare, LogOut } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, displayName } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menus = [
    { name: '회원 관리', icon: <Users size={18} />, path: '/members' },
    { name: '모니터링', icon: <Activity size={18} />, path: '/monitoring' },
    { name: '수수료 관리', icon: <CreditCard size={18} />, path: '/fees' },
    { name: '로그 보기', icon: <FileText size={18} />, path: '/logs' },
    { name: '문의 보기', icon: <MessageSquare size={18} />, path: '/inquiry' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src={logoImg} alt="Logo" className="logo-img" />
      </div>
      
      <nav className="nav-menu">
        <p className="menu-label">ADMIN MENU</p>
        <br></br>
        <br></br>
        <br></br>
        <ul>
          {menus.map((menu, index) => (
            <li key={index}>
              <NavLink 
                to={menu.path} 
                className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
              >
                <span className="menu-icon">{menu.icon}</span>
                &nbsp;
                <span className="menu-text">{menu.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <p>Logged in as : <strong>{displayName || 'Admin'}</strong></p>
        <button type="button" className="footer-logout-btn" onClick={handleLogout}>
          <LogOut size={14} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;