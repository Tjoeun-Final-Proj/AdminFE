import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getFeeSetting, setFeeSetting, getFeeGraph2Weeks } from '../api/Fee';
import '../styles/FeeMgmt.css';

const formatChartDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
};

const FeeMgmt = () => {
  const { accessToken } = useAuth();
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [graphData, setGraphData] = useState({ fromDate: null, toDate: null, points: [] });
  const [graphLoading, setGraphLoading] = useState(false);

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

  useEffect(() => {
    if (!accessToken) return;
    setGraphLoading(true);
    getFeeGraph2Weeks(accessToken)
      .then((res) => {
        const points = Array.isArray(res.points) ? res.points : [];
        setGraphData({
          fromDate: res.fromDate ?? null,
          toDate: res.toDate ?? null,
          points,
        });
      })
      .catch(() => setGraphData({ fromDate: null, toDate: null, points: [] }))
      .finally(() => setGraphLoading(false));
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

  const chartData = (graphData.points || []).map((p) => ({
    name: formatChartDate(p.date),
    date: p.date,
    fee: typeof p.feeRate === 'number' ? Math.round(p.feeRate * 10000) / 100 : 0,
    changed: p.changed,
  }));

  const dateRangeLabel =
    graphData.fromDate && graphData.toDate
      ? `${graphData.fromDate} ~ ${graphData.toDate}`
      : '';

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

      {/* 2주 일별 수수료 차트 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">수수료 추이</h3>
          {dateRangeLabel && <span className="chart-date-range">{dateRangeLabel}</span>}
        </div>
        {graphLoading ? (
          <div className="chart-loading">수수료 데이터 로딩 중...</div>
        ) : chartData.length === 0 ? (
          <div className="chart-loading">표시할 2주 데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(value) => [`${value}%`, '수수료율']}
                labelFormatter={(_, payload) => payload[0]?.payload?.date ?? ''}
              />
              <Bar
                dataKey="fee"
                fill="#BCE3EC"
                radius={[4, 4, 0, 0]}
                barSize={Math.max(20, 400 / chartData.length)}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
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