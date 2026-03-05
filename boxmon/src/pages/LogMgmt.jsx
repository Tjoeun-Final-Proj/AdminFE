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

const LogMgmt = () => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateTab, setDateTab] = useState('Today');
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    getLogs(accessToken)
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRefresh = () => {
    setDateTab('Today');
    setSelectedDate(getTodayString());
    loadLogs();
  };

  // 클라이언트 필터: 검색어
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const adminName = (log.adminName ?? '').toLowerCase();
    const description = (log.description ?? '').toLowerCase();
    const eventType = (log.eventType ?? '').toLowerCase();
    const payloadMessage = (log.payloadMessage ?? '').toLowerCase();
    return adminName.includes(term) || description.includes(term) || eventType.includes(term) || payloadMessage.includes(term);
  });

  // 시간대별 로그 수 (차트용)
  const chartData = (() => {
    const buckets = Array.from({ length: 24 }, (_, i) => ({ time: String(i).padStart(2, '0'), count: 0 }));
    filteredLogs.forEach((log) => {
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
              onClick={() => setDateTab(tab)}
            >
              {tab}
            </button>
          ))}
          <input
            type="date"
            className="date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="log-empty">로그가 없습니다.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
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
      </div>
    </div>
  );
};

export default LogMgmt;