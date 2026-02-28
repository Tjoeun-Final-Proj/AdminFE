import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getFeeSetting, setFeeSetting } from '../api/Fee';
import '../styles/FeeMgmt.css';

const FeeMgmt = () => {
  const { accessToken } = useAuth();
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getFeeSetting(accessToken)
      .then((val) => {
        if (val !== null && val !== undefined) {
          const num = Number(val);
          setCurrentRate(Number.isNaN(num) ? val : num);
        } else {
          setCurrentRate(null);
        }
      })
      .catch((err) => setError(err.message || '수수료율 조회에 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const openModal = () => {
    setEditValue(currentRate != null ? String(Math.round(currentRate * 10000) / 100) : '');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleConfirm = async () => {
    const percentNum = Number(editValue);
    if (Number.isNaN(percentNum) || percentNum < 0 || percentNum > 100) return;
    if (!accessToken) return;
    const decimalValue = percentNum / 100;
    setSaving(true);
    setError(null);
    try {
      await setFeeSetting(accessToken, decimalValue);
      setCurrentRate(decimalValue);
      closeModal();
      const next = await getFeeSetting(accessToken);
      if (next !== null && next !== undefined) {
        const n = Number(next);
        setCurrentRate(Number.isNaN(n) ? next : n);
      }
    } catch (err) {
      const res = err.response?.data;
      const msg = typeof res === 'string' ? res : res?.message ?? res?.error ?? (res && typeof res === 'object' ? JSON.stringify(res) : null);
      setError(msg || err.message || '수수료율 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const data = [
    { name: 'Jan', fee: 55 }, { name: 'Feb', fee: 35 }, { name: 'Mar', fee: 65 },
    { name: 'Apr', fee: 70 }, { name: 'May', fee: 28 }, { name: 'Jun', fee: 22 },
    { name: 'Jul', fee: 58 }, { name: 'Aug', fee: 58 }, { name: 'Sep', fee: 75 },
    { name: 'Oct', fee: 28 }, { name: 'Nov', fee: 28 }, { name: 'Dec', fee: 0 },
  ];

  return (
    <div className="fee-page">
      <h1 className="page-title">수수료 관리</h1>

      <div className="fee-rate-card">
        <h3>현재 수수료</h3>
        {error && <p className="fee-rate-error">{error}</p>}
        <div className="rate-display">
          <span className="rate-number">{loading ? '…' : (currentRate != null ? (Math.round(currentRate * 10000) / 100) : '-')}</span>
          <span className="rate-unit">%</span>
        </div>
        <button type="button" className="rate-change-btn" onClick={openModal} disabled={loading}>수정 〉</button>
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
        <span className="total-label-text">누적 수수료</span>
      </div>

      {modalOpen && (
        <div className="fee-modal-overlay" onClick={closeModal}>
          <div className="fee-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="fee-modal-title">수수료율 수정</h3>
            <div className="fee-modal-field">
              <label htmlFor="fee-rate-input">수수료 (%)</label>
              <input
                id="fee-rate-input"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="fee-modal-input"
              />
            </div>
            <div className="fee-modal-actions">
              <button type="button" className="fee-modal-btn cancel" onClick={closeModal} disabled={saving}>취소</button>
              <button type="button" className="fee-modal-btn confirm" onClick={handleConfirm} disabled={saving}>{saving ? '저장 중...' : '확인'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeMgmt;