import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/FeeMgmt.css';

const FeeMgmt = () => {
  // 샘플 데이터: 월별 수수료 수익 현황
  const data = [
    { name: 'Jan', fee: 55 }, { name: 'Feb', fee: 35 }, { name: 'Mar', fee: 65 },
    { name: 'Apr', fee: 70 }, { name: 'May', fee: 28 }, { name: 'Jun', fee: 22 },
    { name: 'Jul', fee: 58 }, { name: 'Aug', fee: 58 }, { name: 'Sep', fee: 75 },
    { name: 'Oct', fee: 28 }, { name: 'Nov', fee: 28 }, { name: 'Dec', fee: 0 },
  ];

  return (
    <div className="fee-page">
      <h1 className="page-title">수수료 관리</h1>

      {/* 1. 현재 수수료율 카드 */}
      <div className="fee-rate-card">
        <h3>현재 수수료</h3>
        <div className="rate-display">
          <span className="rate-number">5</span>
          <span className="rate-unit">%</span>
        </div>
        <button className="rate-change-btn">수정 〉</button>
      </div>

      {/* 2. 월별 수수료 차트 영역 */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
            />
            <YAxis hide />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey="fee" 
              fill="#BCE3EC" 
              radius={[4, 4, 0, 0]} 
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. 하단 누적 수수료 바 */}
      <div className="total-fee-bar">
        <div className="total-amount">
          <span className="currency">$</span>
          <span className="amount">3000000</span>
        </div>
        <button className="total-label-btn">누적 수수료</button>
      </div>
    </div>
  );
};

export default FeeMgmt;