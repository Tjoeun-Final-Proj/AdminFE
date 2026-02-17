import React, { useState } from 'react';
import '../styles/InquiryMgmt.css';

const InquiryMgmt = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 샘플 데이터: 문의 내역 리스트
  const inquiries = [
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 관련 문의드립니다.' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 결제 오류가 발생해요.' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 화물 등록은 어떻게 하나요?' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 계정 정지 해제 요청합니다.' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구' },
  ];

  return (
    <div className="inquiry-page">
      {/* 상단 필터 및 컨트롤 영역 (이미지 우측 상단 구성 반영) */}
      <div className="inquiry-controls">
        <div className="filter-group">
          <div className="date-tabs">
            <button className="tab active">Today</button>
            <button className="tab">Yesterday</button>
            <button className="tab">Last 7 days</button>
            <button className="tab">Last 30 days</button>
            <button className="tab">Last month</button>
            <input type="date" className="date-input" defaultValue="2022-02-08" />
          </div>
          <button className="refresh-btn">🔄 새로고침</button>
        </div>
      </div>

      {/* 검색 바 (이미지 위치 반영) */}
      <div className="search-row">
        <input 
          type="text" 
          placeholder="검색어를 입력하십시오" 
          className="inquiry-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 문의 내역 테이블 */}
      <div className="inquiry-table-container">
        <table className="inquiry-table">
          <thead>
            <tr>
              <th className="th-time">문의 내역 입력 시각</th>
              <th className="th-user">사용자 명</th>
              <th className="th-content">문의 내용</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((item, idx) => (
              <tr key={idx}>
                <td className="td-time">{item.time}</td>
                <td className="td-user">{item.user}</td>
                <td className="td-content">{item.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InquiryMgmt;