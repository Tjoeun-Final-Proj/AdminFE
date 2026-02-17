import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/LogMgmt.css';

const DATE_TABS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last month'];

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const LogMgmt = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateTab, setDateTab] = useState('Today');
  const [selectedDate, setSelectedDate] = useState(getTodayString);

  const handleRefresh = () => {
    setDateTab('Today');
    setSelectedDate(getTodayString());
  };

  // 1. 상단 차트 데이터 (시간대별 로그 발생량 예시)
  const chartData = [
    { time: '01', count: 40 }, { time: '02', count: 32 }, { time: '03', count: 0 },
    { time: '04', count: 28 }, { time: '05', count: 45 }, { time: '06', count: 0 },
    { time: '07', count: 38 }, { time: '08', count: 30 }, { time: '09', count: 34 },
    { time: '10', count: 25 }, { time: '11', count: 40 }, { time: '12', count: 48 },
  ];

  // 2. 하단 로그 리스트 데이터
  const logs = [
    { time: '2026.02.02', type: '@@@승인', admin: '나서이', content: '###차주@@승인 어쩌구 저쩌구' },
    { time: '2026.02.02', type: '@@@승인', admin: '나서이', content: '###차주@@승인 어쩌구 저쩌구' },
    { time: '2026.02.02', type: '@@@승인', admin: '나서이', content: '###차주@@승인 어쩌구 저쩌구' },
    { time: '2026.02.02', type: '@@@승인', admin: '나서이', content: '###차주@@승인 어쩌구 저쩌구' },
    { time: '2026.02.02', type: '@@@승인', admin: '나서이', content: '###차주@@승인 어쩌구 저쩌구' },
  ];

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
            {logs.map((log, idx) => (
              <tr key={idx}>
                <td className="time-cell">{log.time}</td>
                <td className="type-cell">{log.type}</td>
                <td className="admin-cell">{log.admin}</td>
                <td className="content-cell">{log.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogMgmt;