import React, { useState } from 'react';
import '../styles/InquiryMgmt.css';

const InquiryMgmt = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryReplies, setInquiryReplies] = useState({});
  const [replyText, setReplyText] = useState('');

  const inquiries = [
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 관련 문의드립니다.' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 결제 오류가 발생해요.' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 화물 등록은 어떻게 하나요?' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구 계정 정지 해제 요청합니다.' },
    { time: '2026.02.02', user: '손은섭', content: '###차주@@승인 어쩌구 저쩌구' },
  ];

  const handleSubmitReply = () => {
    if (selectedInquiry == null || !replyText.trim()) return;
    const idx = selectedInquiry.index;
    if (inquiryReplies[idx]) return;
    setInquiryReplies(prev => ({ ...prev, [idx]: replyText.trim() }));
    setReplyText('');
  };

  return (
    <div className="inquiry-page">
      {!selectedInquiry && (
        <>
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
          <div className="search-row">
            <div className="unified-search-box">
              <input
                type="text"
                className="unified-search-input"
                placeholder="문의 내용 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="button" className="unified-search-btn">검색</button>
            </div>
          </div>
        </>
      )}

      {selectedInquiry ? (
        <div className="inquiry-detail">
          <button type="button" className="inquiry-detail-back" onClick={() => { setSelectedInquiry(null); setReplyText(''); }}>
            ← 목록으로
          </button>
          <h2 className="inquiry-detail-title">문의 상세</h2>
          <div className="inquiry-detail-card">
            <div className="inquiry-detail-row">
              <span className="inquiry-detail-label">문의 시각</span>
              <span>{selectedInquiry.item.time}</span>
            </div>
            <div className="inquiry-detail-row">
              <span className="inquiry-detail-label">사용자</span>
              <span>{selectedInquiry.item.user}</span>
            </div>
            <div className="inquiry-detail-row inquiry-detail-content">
              <span className="inquiry-detail-label">문의 내용</span>
              <p>{selectedInquiry.item.content}</p>
            </div>
          </div>
          {inquiryReplies[selectedInquiry.index] && (
            <div className="inquiry-replies-list">
              <h3 className="inquiry-replies-title">답변</h3>
              <div className="inquiry-reply-item">
                <span className="inquiry-reply-badge">관리자</span>
                <p>{inquiryReplies[selectedInquiry.index]}</p>
              </div>
            </div>
          )}
          {!inquiryReplies[selectedInquiry.index] && (
            <div className="inquiry-reply-form">
              <h3 className="inquiry-reply-form-title">답변 작성</h3>
              <div className="inquiry-reply-input-wrap">
                <textarea
                  className="inquiry-reply-textarea"
                  placeholder="답변을 입력하세요"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <button type="button" className="inquiry-reply-submit" onClick={handleSubmitReply}>
                  답변 등록
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="inquiry-table-container">
          <table className="inquiry-table">
            <thead>
              <tr>
                <th className="th-time">문의 내역 입력 시각</th>
                <th className="th-user">사용자 명</th>
                <th className="th-content">문의 내용</th>
                <th className="th-status">답변상태</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item, idx) => (
                <tr
                  key={idx}
                  className="inquiry-table-row-clickable"
                  onClick={() => setSelectedInquiry({ item, index: idx })}
                >
                  <td className="td-time">{item.time}</td>
                  <td className="td-user">{item.user}</td>
                  <td className="td-content">{item.content}</td>
                  <td className="td-status">
                    {inquiryReplies[idx] ? (
                      <span className="inquiry-status-done">답변 완료</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InquiryMgmt;