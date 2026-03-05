import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteAdmin } from '../api/auth';
import '../styles/Sidebar.css';
import { Users, Activity, CreditCard, FileText, MessageSquare, LogOut } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const { accessToken, logout, displayName } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setShowDeleteModal(false);
      setDeletePassword('');
      setDeleteError('');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword.trim() || !accessToken) return;
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteAdmin(accessToken, deletePassword.trim());
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const msg =
        err.message ||
        (data && (data.message ?? data.error ?? data.detail ?? (typeof data === 'string' ? data : null))) ||
        '탈퇴 처리에 실패했습니다.';
      setDeleteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setDeleting(false);
    }
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
        <button type="button" className="footer-delete-account-btn" onClick={openDeleteModal}>
          <span>계정 탈퇴</span>
        </button>
      </div>

      {showDeleteModal && (
        <div className="sidebar-delete-overlay" onClick={closeDeleteModal}>
          <div className="sidebar-delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sidebar-delete-title">계정 탈퇴</h3>
            <p className="sidebar-delete-desc">비밀번호를 입력하면 현재 로그인한 관리자 계정이 삭제됩니다. 되돌릴 수 없습니다.</p>
            <form onSubmit={handleDeleteAccount}>
              {deleteError && <p className="sidebar-delete-error">{deleteError}</p>}
              <div className="sidebar-delete-field">
                <label htmlFor="sidebar-delete-pw">비밀번호</label>
                <input
                  id="sidebar-delete-pw"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  disabled={deleting}
                  autoComplete="current-password"
                />
              </div>
              <div className="sidebar-delete-actions">
                <button type="button" className="sidebar-delete-btn cancel" onClick={closeDeleteModal} disabled={deleting}>
                  취소
                </button>
                <button type="submit" className="sidebar-delete-btn submit" disabled={deleting || !deletePassword.trim()}>
                  {deleting ? '처리 중...' : '탈퇴하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;