import React, { useState } from 'react';
import '../styles/MemberMgmt.css';

const MemberMgmt = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('전체');

  const members = [
    { id: 'user01', name: '김철수', role: '차주', emoji: '🚛', phone: '010-1234-5678', birth: '1990-05-10', joinDate: '2025-11-24' },
    { id: 'user02', name: '이영희', role: '화주', emoji: '📦', phone: '010-9876-5432', birth: '1985-11-20', joinDate: '2026-01-12' },
    { id: 'user03', name: '박지성', role: '차주', emoji: '🚚', phone: '010-5555-4444', birth: '1992-02-13', joinDate: '2026-02-01' },
    { id: 'user04', name: '손흥민', role: '화주', emoji: '🌍', phone: '010-7777-8888', birth: '1992-07-08', joinDate: '2026-02-12' },
  ];

  const filteredData = members.filter(m => {
    const isRoleMatch = filter === '전체' || m.role === filter;
    return isRoleMatch && (m.name.includes(searchTerm) || m.id.includes(searchTerm));
  });

  return (
    <div className="member-page">
      {/* 최상단 통합 검색 */}
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
      </div>

      {/* 필터 탭 */}
      <div className="list-filter-bar">
        {['전체', '차주', '화주'].map(r => (
          <button 
            key={r} 
            className={`filter-tab ${filter === r ? 'active' : ''}`} 
            onClick={() => setFilter(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* 슬림 테이블 리스트 */}
      <div className="table-container">
        <table className="member-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>구분</th>
              <th>성명</th>
              <th>아이디</th>
              <th>연락처</th>
              <th>생년월일</th>
              <th>가입일자</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(m => (
              <tr key={m.id}>
                <td>
                  <span className={`table-badge ${m.role === '차주' ? 'driver' : 'shipper'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="table-name-cell"> {m.name}님</td>
                <td className="table-id-cell">{m.id}</td>
                <td>{m.phone}</td>
                <td>{m.birth}</td>
                <td>{m.joinDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberMgmt;