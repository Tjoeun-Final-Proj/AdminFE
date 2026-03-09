import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContactList, getContactDetail, answerContact } from '../api/contact';
import '../styles/InquiryMgmt.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
};

const userTypeLabel = (type) => (type === 'SHIPPER' ? '화주' : type === 'DRIVER' ? '차주' : type ?? '-');

const PAGE_SIZE = 15;

const InquiryMgmt = () => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadList = () => {
    if (!accessToken) return;
    setListLoading(true);
    getContactList(accessToken)
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      })
      .catch(() => {
        setList([]);
        setCurrentPage(1);
      })
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadList();
  }, [accessToken]);

  const openDetail = (contactId) => {
    setDetail(null);
    setReplyText('');
    setReplyError('');
    setDetailLoading(true);
    getContactDetail(accessToken, contactId)
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setDetail(null);
    setReplyText('');
    setReplyError('');
    loadList();
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    const contactId = detail?.contact?.contactId ?? detail?.contactId;
    if (contactId == null || !replyText.trim() || !accessToken) return;
    setReplyError('');
    setSubmitting(true);
    try {
      await answerContact(accessToken, {
        contactId,
        answerContent: replyText.trim(),
      });
      setReplyText('');
      getContactDetail(accessToken, contactId).then((data) => setDetail(data));
      loadList();
    } catch (err) {
      setReplyError(err.response?.data?.message ?? err.message ?? '답변 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = list
    .filter((item) => {
      const content = item.contactContent ?? item.content ?? '';
      return content.includes(searchTerm);
    })
    .sort((a, b) => {
      const idA = a.contactId ?? a.id ?? 0;
      const idB = b.contactId ?? b.id ?? 0;
      return Number(idA) - Number(idB);
    });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedList = filteredList.slice(pageStart, pageStart + PAGE_SIZE);

  const handleInquirySearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="inquiry-page">
      {detail == null ? (
        <>
          <div className="inquiry-controls">
            <div className="filter-group">
              <button type="button" className="refresh-btn" onClick={loadList} disabled={listLoading}>
                새로고침
              </button>
            </div>
          </div>
          <div className="search-row">
            <div className="unified-search-box">
              <input
                type="text"
                className="unified-search-input"
                placeholder="문의 내용 검색"
                value={searchTerm}
                onChange={handleInquirySearchChange}
              />
              <button type="button" className="unified-search-btn">검색</button>
            </div>
          </div>
          <div className="inquiry-table-container">
            {listLoading ? (
              <p className="inquiry-loading">문의 목록 로딩 중...</p>
            ) : (
              <table className="inquiry-table">
                <thead>
                  <tr>
                    <th className="th-id">번호</th>
                    <th className="th-time">문의 시각</th>
                    <th className="th-user">문의 회원</th>
                    <th className="th-content">문의 내용</th>
                    <th className="th-status">답변상태</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="inquiry-empty">문의가 없습니다.</td>
                    </tr>
                  ) : (
                    paginatedList.map((item) => (
                      <tr
                        key={item.contactId ?? item.id}
                        className="inquiry-table-row-clickable"
                        onClick={() => openDetail(item.contactId ?? item.id)}
                      >
                        <td className="td-id">{item.contactId ?? item.id ?? '-'}</td>
                        <td className="td-time">{formatDateTime(item.createdAt)}</td>
                        <td className="td-user">{item.userId?.name ?? '-'}</td>
                        <td className="td-content">
                          {(item.contactContent ?? item.content ?? '').slice(0, 50)}
                          {(item.contactContent ?? item.content ?? '').length > 50 ? '…' : ''}
                        </td>
                        <td className="td-status">
                          {item.answerContent != null && item.answerContent !== '' ? (
                            <span className="inquiry-status-done">답변 완료</span>
                          ) : (
                            <span className="inquiry-status-pending">미답변</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {!listLoading && filteredList.length > 0 && totalPages > 1 && (
              <div className="inquiry-pagination">
                <button
                  type="button"
                  className="inquiry-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  이전
                </button>
                <span className="inquiry-page-info">
                  {safePage} / {totalPages} (총 {filteredList.length}건)
                </span>
                <button
                  type="button"
                  className="inquiry-page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="inquiry-detail">
          <header className="inquiry-detail-header">
            <button type="button" className="inquiry-detail-back" onClick={closeDetail}>
              ← 목록으로
            </button>
          </header>
          {detailLoading ? (
            <p className="inquiry-loading">상세 로딩 중...</p>
          ) : (
            (() => {
              const c = detail.contact ?? detail;
              const imageUrls = detail.contactAttatchment ?? detail.imageUrls ?? [];
              return (
                <div className="inquiry-detail-body">
                  <section className="inquiry-detail-section inquiry-detail-user-card">
                    <h3 className="inquiry-detail-section-title">문의 회원</h3>
                    <div className="inquiry-detail-user-grid">
                      <div className="inquiry-detail-user-item inquiry-detail-user-item-name">
                        <span className="inquiry-detail-user-label">이름</span>
                        <span className="inquiry-detail-user-value">
                          {c.userId?.name ?? '-'}
                          <span className={`inquiry-detail-user-type inquiry-detail-user-type--${(c.userId?.userType ?? '').toLowerCase()}`}>
                            {userTypeLabel(c.userId?.userType)}
                          </span>
                        </span>
                      </div>
                      <div className="inquiry-detail-user-item">
                        <span className="inquiry-detail-user-label">이메일</span>
                        <span className="inquiry-detail-user-value">{c.userId?.email ?? '-'}</span>
                      </div>
                      <div className="inquiry-detail-user-item">
                        <span className="inquiry-detail-user-label">연락처</span>
                        <span className="inquiry-detail-user-value">{c.userId?.phone ?? '-'}</span>
                      </div>
                    </div>
                    <p className="inquiry-detail-time-text">{formatDateTime(c.createdAt)}</p>
                  </section>

                  <section className="inquiry-detail-section inquiry-detail-content-card">
                    <h3 className="inquiry-detail-section-title">문의 내용</h3>
                    <div className="inquiry-detail-content-body">
                      <p>{c.contactContent ?? c.content ?? '-'}</p>
                    </div>
                    {imageUrls.length > 0 && (
                      <div className="inquiry-detail-images">
                        {imageUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inquiry-image-wrap">
                            <img src={url} alt={`문의 이미지 ${i + 1}`} className="inquiry-image" />
                          </a>
                        ))}
                      </div>
                    )}
                  </section>

                  {c.answerContent != null && c.answerContent !== '' && (
                    <section className="inquiry-detail-section inquiry-detail-answer-card">
                      <h3 className="inquiry-detail-section-title">답변</h3>
                      <div className="inquiry-reply-item">
                        <div className="inquiry-reply-meta">
                          <span className="inquiry-reply-badge">{c.answererId?.name ?? '관리자'}</span>
                          {c.answeredAt && (
                            <span className="inquiry-reply-date">{formatDateTime(c.answeredAt)}</span>
                          )}
                        </div>
                        <p className="inquiry-reply-body">{c.answerContent}</p>
                      </div>
                    </section>
                  )}

                  {(!c.answerContent || c.answerContent === '') && (
                    <section className="inquiry-detail-section inquiry-detail-reply-form-card">
                      <h3 className="inquiry-detail-section-title">답변 작성</h3>
                      <form onSubmit={handleSubmitReply}>
                        {replyError && <p className="inquiry-reply-error">{replyError}</p>}
                        <textarea
                          className="inquiry-reply-textarea"
                          placeholder="답변을 입력하세요"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={5}
                          disabled={submitting}
                        />
                        <div className="inquiry-reply-form-actions">
                          <button type="submit" className="inquiry-reply-submit" disabled={submitting || !replyText.trim()}>
                            {submitting ? '등록 중...' : '답변 등록'}
                          </button>
                        </div>
                      </form>
                    </section>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};

export default InquiryMgmt;
