import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createAdmin, getAdminList, getUserList, getDriverDetail, getShipperDetail, postSuspension, postRestoration, getPenaltyList, createPenalty, deletePenalty } from '../api/Member';
import { getAdminInfo } from '../api/auth';
import MemberDetail from './MemberDetail';
import '../styles/MemberMgmt.css';

const ROLE_TABS = ['전체', '차주', '화주', '관리자'];

function getBadgeClass(role) {
  if (role === '차주') return 'driver';
  if (role === '화주') return 'shipper';
  if (role === '관리자') return 'admin';
  return '';
}

function userTypeToRole(userType) {
  if (userType === 'DRIVER') return '차주';
  if (userType === 'SHIPPER') return '화주';
  return '차주';
}

const MemberMgmt = () => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('전체');
  const [modalOpen, setModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', loginId: '', password: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [memberDetailError, setMemberDetailError] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendError, setSuspendError] = useState(null);
  const [penaltyList, setPenaltyList] = useState([]);
  const [penaltyListLoading, setPenaltyListLoading] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [penaltyError, setPenaltyError] = useState('');
  const [penaltyAdding, setPenaltyAdding] = useState(false);
  const [penaltyDeletingId, setPenaltyDeletingId] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      setAdminList([]);
      return;
    }
    setAdminListLoading(true);
    getAdminList(accessToken)
      .then((list) => setAdminList(Array.isArray(list) ? list : []))
      .catch(() => setAdminList([]))
      .finally(() => setAdminListLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setUserList([]);
      return;
    }
    setUserListLoading(true);
    getUserList(accessToken)
      .then((list) => setUserList(Array.isArray(list) ? list : []))
      .catch(() => setUserList([]))
      .finally(() => setUserListLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!selectedMember || !accessToken) {
      setMemberDetail(null);
      setMemberDetailError(null);
      return;
    }
    if (selectedMember.role === '관리자') {
      setMemberDetail(null);
      return;
    }
    const uid = selectedMember.userId ?? selectedMember.id;
    if (uid == null) {
      setMemberDetailError('회원 ID를 확인할 수 없습니다.');
      setMemberDetailLoading(false);
      return;
    }
    setMemberDetailLoading(true);
    setMemberDetailError(null);
    const fetchDetail = selectedMember.role === '차주'
      ? () => getDriverDetail(accessToken, uid)
      : () => getShipperDetail(accessToken, uid);
    fetchDetail()
      .then((data) => {
        setMemberDetail(data);
        setMemberDetailError(null);
        setPenaltyListLoading(true);
        getPenaltyList(accessToken, uid)
          .then((list) => setPenaltyList(Array.isArray(list) ? list : []))
          .catch(() => setPenaltyList([]))
          .finally(() => setPenaltyListLoading(false));
      })
      .catch((err) => {
        setMemberDetailError(err.response?.status === 500
          ? '서버 오류(500)가 발생했습니다. 백엔드 로그를 확인해 주세요.'
          : (err.message || '상세 정보를 불러오지 못했습니다.'));
        setMemberDetail(null);
        setPenaltyList([]);
      })
      .finally(() => setMemberDetailLoading(false));
  }, [accessToken, selectedMember]);

  const adminRows = adminList.map((a) => ({
    id: a.loginId ?? String(a.adminId),
    displayId: a.loginId ?? '-',
    name: a.name ?? '-',
    role: '관리자',
    phone: '-',
    birth: '-',
    joinDate: '-',
  }));

  const userRows = userList.map((u) => ({
    id: u.loginId ?? String(u.userId ?? u.id),
    userId: u.userId ?? u.id,
    userType: u.userType,
    displayId: u.email ?? u.loginId ?? '-',
    name: u.name ?? '-',
    role: userTypeToRole(u.userType),
    phone: u.phone ?? u.phoneNumber ?? '-',
    birth: u.birth ?? u.birthDate ?? '-',
    joinDate: u.joinDate ?? u.createdAt ?? '-',
  }));

  const allMembers = [...userRows, ...adminRows];

  const filteredData = allMembers.filter(m => {
    const isRoleMatch = filter === '전체' || m.role === filter;
    const matchSearch = (m.name && m.name.includes(searchTerm)) || (m.id && m.id.includes(searchTerm)) || (m.displayId && m.displayId.includes(searchTerm));
    return isRoleMatch && matchSearch;
  });

  const openModal = () => {
    setAdminForm({ name: '', loginId: '', password: '' });
    setCreateError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSuspend = async (userId) => {
    if (!accessToken) return;
    setSuspendError(null);
    setSuspendLoading(true);
    try {
      await postSuspension(accessToken, userId);
      setSelectedMember(null);
      setMemberDetail(null);
      setMemberDetailError(null);
      const list = await getUserList(accessToken);
      setUserList(Array.isArray(list) ? list : []);
    } catch (err) {
      setSuspendError(err.message || '계정 정지에 실패했습니다.');
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleRestore = async (userId) => {
    if (!accessToken) return;
    setSuspendError(null);
    setSuspendLoading(true);
    try {
      await postRestoration(accessToken, userId);
      const detailFetch = selectedMember?.role === '차주'
        ? () => getDriverDetail(accessToken, userId)
        : () => getShipperDetail(accessToken, userId);
      const data = await detailFetch();
      setMemberDetail(data);
    } catch (err) {
      setSuspendError(err.message || '계정 복구에 실패했습니다.');
    } finally {
      setSuspendLoading(false);
    }
  };

  const openPenaltyModal = () => {
    setPenaltyReason('');
    setPenaltyError('');
    setPenaltyModalOpen(true);
  };

  const closePenaltyModal = () => {
    setPenaltyModalOpen(false);
  };

  const handleAddPenalty = async (e) => {
    e.preventDefault();
    const uid = selectedMember?.userId ?? selectedMember?.id;
    if (!accessToken || uid == null || !penaltyReason.trim()) {
      setPenaltyError('사유를 입력해 주세요.');
      return;
    }
    setPenaltyError('');
    setPenaltyAdding(true);
    const payloadText = penaltyReason.trim();
    try {
      const adminInfo = await getAdminInfo(accessToken);
      const adminId = adminInfo?.adminId ?? adminInfo?.id ?? 1;
      await createPenalty(accessToken, {
        adminId: Number(adminId),
        userId: Number(uid),
        payload: payloadText,
      });
      closePenaltyModal();
      const list = await getPenaltyList(accessToken, uid);
      setPenaltyList(Array.isArray(list) ? list : []);
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'string'
        ? data
        : data?.message ?? data?.error ?? (typeof data === 'object' && data !== null ? JSON.stringify(data) : null);
      setPenaltyError(msg || err.message || '경고 추가에 실패했습니다.');
    } finally {
      setPenaltyAdding(false);
    }
  };

  const handleDeletePenalty = async (penaltyId) => {
    const uid = selectedMember?.userId ?? selectedMember?.id;
    if (!accessToken || penaltyId == null) return;
    if (!window.confirm('해당 경고를 삭제하시겠습니까?')) return;
    setPenaltyDeletingId(penaltyId);
    try {
      await deletePenalty(accessToken, penaltyId);
      const list = await getPenaltyList(accessToken, uid);
      setPenaltyList(Array.isArray(list) ? list : []);
    } catch (err) {
      setSuspendError(err.response?.data?.message || err.message || '경고 삭제에 실패했습니다.');
    } finally {
      setPenaltyDeletingId(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.loginId.trim() || !adminForm.password.trim()) return;
    setCreateError('');
    setCreating(true);
    try {
      await createAdmin({
        name: adminForm.name.trim(),
        loginId: adminForm.loginId.trim(),
        password: adminForm.password,
      });
      closeModal();
      setAdminForm({ name: '', loginId: '', password: '' });
      if (accessToken) {
        const list = await getAdminList(accessToken);
        setAdminList(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setCreateError(err.message || '관리자 계정 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="member-page">
      {!selectedMember && (
        <>
          <div className="top-global-search">
            <div className="unified-search-box">
              <input
                type="text"
                className="unified-search-input"
                placeholder="회원 이름 또는 ID검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="button" className="unified-search-btn">검색</button>
            </div>
          </div>

          <div className="page-header-row">
            <h1>회원 관리</h1>
            <span className="member-count">검색 결과 {filteredData.length}건</span>
            <button type="button" className="btn-create-admin" onClick={openModal}>
              관리자 계정 생성
            </button>
          </div>

          <div className="list-filter-bar">
            {ROLE_TABS.map(r => (
              <button
                key={r}
                className={`filter-tab ${filter === r ? 'active' : ''}`}
                onClick={() => setFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table className="member-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>구분</th>
                  <th>성명</th>
                  <th>아이디/이메일</th>
                  <th>연락처</th>
                  <th>생년월일</th>
                  <th>가입일자</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 && (
                  (adminListLoading && filter === '관리자') || (userListLoading && (filter === '차주' || filter === '화주' || filter === '전체'))
                ) ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      {filter === '관리자' ? '관리자 목록 로딩 중...' : '사용자 목록 로딩 중...'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map(m => (
                    <tr
                      key={`${m.role}-${m.id}`}
                      className="member-table-row-clickable"
                      onClick={() => setSelectedMember(m)}
                    >
                      <td>
                        <span className={`table-badge ${getBadgeClass(m.role)}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="table-name-cell">{m.name}님</td>
                      <td className="table-id-cell">{m.displayId ?? m.id}</td>
                      <td>{m.phone}</td>
                      <td>{m.birth}</td>
                      <td>{m.joinDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedMember && (
        <MemberDetail
          selectedMember={selectedMember}
          memberDetail={memberDetail}
          memberDetailLoading={memberDetailLoading}
          memberDetailError={memberDetailError}
          onBack={() => { setSelectedMember(null); setMemberDetail(null); setMemberDetailError(null); setSuspendError(null); setPenaltyList([]); }}
          onSuspend={handleSuspend}
          onRestore={handleRestore}
          suspendLoading={suspendLoading}
          penaltyList={penaltyList}
          penaltyListLoading={penaltyListLoading}
          onAddPenalty={openPenaltyModal}
          onDeletePenalty={handleDeletePenalty}
          penaltyDeletingId={penaltyDeletingId}
        />
      )}
      {suspendError && (
        <p className="member-detail-error" style={{ position: 'fixed', bottom: 24, right: 24, background: '#fee2e2', padding: 12, borderRadius: 8 }}>
          {suspendError}
        </p>
      )}

      {penaltyModalOpen && (
        <div className="modal-overlay" onClick={closePenaltyModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">경고 추가</h2>
            <form onSubmit={handleAddPenalty}>
              {penaltyError && <p className="modal-error">{penaltyError}</p>}
              <div className="modal-form-group">
                <label htmlFor="penalty-reason">사유</label>
                <input
                  id="penalty-reason"
                  type="text"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="경고 사유 입력"
                  autoComplete="off"
                  disabled={penaltyAdding}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn cancel" onClick={closePenaltyModal} disabled={penaltyAdding}>취소</button>
                <button type="submit" className="modal-btn submit" disabled={penaltyAdding}>{penaltyAdding ? '추가 중...' : '추가'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">관리자 계정 생성</h2>
            <form onSubmit={handleCreateAdmin}>
              {createError && <p className="modal-error">{createError}</p>}
              <div className="modal-form-group">
                <label htmlFor="admin-name">이름</label>
                <input
                  id="admin-name"
                  name="name"
                  type="text"
                  value={adminForm.name}
                  onChange={handleAdminFormChange}
                  placeholder="이름 입력"
                  autoComplete="off"
                  disabled={creating}
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="admin-loginId">아이디</label>
                <input
                  id="admin-loginId"
                  name="loginId"
                  type="text"
                  value={adminForm.loginId}
                  onChange={handleAdminFormChange}
                  placeholder="아이디 입력"
                  autoComplete="off"
                  disabled={creating}
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="admin-password">비밀번호</label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  value={adminForm.password}
                  onChange={handleAdminFormChange}
                  placeholder="비밀번호 입력"
                  autoComplete="new-password"
                  disabled={creating}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn cancel" onClick={closeModal} disabled={creating}>취소</button>
                <button type="submit" className="modal-btn submit" disabled={creating}>{creating ? '생성 중...' : '생성'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberMgmt;