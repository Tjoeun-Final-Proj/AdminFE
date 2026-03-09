import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getLogs } from '../api/log';
import '../styles/LogMgmt.css';

const DATE_TABS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last month'];

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

/** 날짜 탭/선택일에 따른 범위 [start, end] (Date, start 00:00, end 23:59:59.999) */
function getDateRange(dateTab, selectedDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  if (dateTab === 'Today') {
    return { start: new Date(today), end: endOfToday };
  }
  if (dateTab === 'Yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const endYesterday = new Date(yesterday);
    endYesterday.setHours(23, 59, 59, 999);
    return { start: yesterday, end: endYesterday };
  }
  if (dateTab === 'Last 7 days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfToday };
  }
  if (dateTab === 'Last 30 days') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start, end: endOfToday };
  }
  if (dateTab === 'Last month') {
    const y = today.getFullYear();
    const m = today.getMonth();
    const firstLastMonth = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const lastLastMonth = new Date(y, m, 0, 23, 59, 59, 999);
    return { start: firstLastMonth, end: lastLastMonth };
  }
  // Custom: 날짜 선택기로 선택한 하루
  if (dateTab === 'Custom' && selectedDateStr) {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    return { start, end };
  }
  return { start: null, end: null };
}

function isLogInRange(log, start, end) {
  if (!start || !end) return true;
  const createdAt = log.createdAt ? new Date(log.createdAt) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
  return createdAt >= start && createdAt <= end;
}

const formatLogDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}:${sec}`;
};

const PAGE_SIZE = 10;

const LogMgmt = () => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateTab, setDateTab] = useState('Today');
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    getLogs(accessToken)
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      })
      .catch(() => {
        setLogs([]);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRefresh = () => {
    setDateTab('Today');
    setSelectedDate(getTodayString());
    loadLogs();
  };

  const handleDateTabClick = (tab) => {
    setDateTab(tab);
    if (tab === 'Today') setSelectedDate(getTodayString());
    else if (tab === 'Yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    } else if (tab !== 'Custom') setSelectedDate(getTodayString());
  };

  const handleDatePickerChange = (e) => {
    const value = e.target.value;
    setSelectedDate(value);
    setDateTab(value ? 'Custom' : 'Today');
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange(dateTab, selectedDate);

  // 표: 검색어만 필터, 전체 누적 (최신순), 페이지당 10개
  const tableFilteredLogs = logs
    .filter((log) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      const adminName = (log.adminName ?? '').toLowerCase();
      const description = (log.description ?? '').toLowerCase();
      const eventType = (log.eventType ?? '').toLowerCase();
      const payloadMessage = (log.payloadMessage ?? '').toLowerCase();
      return adminName.includes(term) || description.includes(term) || eventType.includes(term) || payloadMessage.includes(term);
    })
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

  const totalTablePages = Math.max(1, Math.ceil(tableFilteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalTablePages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedLogs = tableFilteredLogs.slice(pageStart, pageStart + PAGE_SIZE);

  // 차트: 날짜 필터 적용된 로그만 사용 (그래프만)
  const logsInRange = logs.filter((log) => isLogInRange(log, rangeStart, rangeEnd));
  const chartData = (() => {
    const buckets = Array.from({ length: 24 }, (_, i) => ({ time: String(i).padStart(2, '0'), count: 0 }));
    logsInRange.forEach((log) => {
      const d = log.createdAt ? new Date(log.createdAt) : null;
      if (d && !Number.isNaN(d.getTime())) {
        const h = d.getHours();
        if (buckets[h]) buckets[h].count += 1;
      }
    });
    return buckets;
  })();

  return (
    <div className="log-page">
      {/* 상단 필터 및 컨트롤 바 */}
      <div className="log-controls">
        <div className="date-tabs">
          {DATE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab ${dateTab === tab ? 'active' : ''}`}
              onClick={() => handleDateTabClick(tab)}
            >
              {tab}
            </button>
          ))}
          <input
            type="date"
            className="date-picker"
            value={selectedDate}
            onChange={handleDatePickerChange}
          />
        </div>
        <button type="button" className="refresh-btn" onClick={handleRefresh}>🔄 새로고침</button>
      </div>

      {/* 차트 영역 */}
      <div className="log-chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis hide />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" fill="#5c6ac4" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="log-search-row">
        <div className="unified-search-box">
          <input
            type="text"
            className="unified-search-input"
            placeholder="log검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className="unified-search-btn">검색</button>
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="log-table-container">
        {loading ? (
          <p className="log-loading">로그 불러오는 중...</p>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>이벤트 발생 시각</th>
                <th>Log 타입</th>
                <th>관리자 명</th>
                <th>Log 내용</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="log-empty">로그가 없습니다.</td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.logId ?? log.createdAt + log.adminName}>
                    <td className="time-cell">{formatLogDateTime(log.createdAt)}</td>
                    <td className="type-cell">{log.description ?? log.eventType ?? '-'}</td>
                    <td className="admin-cell">{log.adminName ?? '-'}</td>
                    <td className="content-cell">{log.payloadMessage || log.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {!loading && tableFilteredLogs.length > 0 && totalTablePages > 1 && (
          <div className="log-pagination">
            <button
              type="button"
              className="log-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              이전
            </button>
            <span className="log-page-info">
              {safePage} / {totalTablePages} (총 {tableFilteredLogs.length}건)
            </span>
            <button
              type="button"
              className="log-page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalTablePages, p + 1))}
              disabled={safePage >= totalTablePages}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogMgmt;