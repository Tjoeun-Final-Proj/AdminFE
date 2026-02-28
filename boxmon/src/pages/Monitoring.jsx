/* global naver */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnassignedBasic, getUnassignedDetail, getAssignedBasic, getAssignedDetail } from '../api/Shipment';
import '../styles/Monitoring.css';

function pickDisplay(item, ...keys) {
  if (!item || typeof item !== 'object') return '-';
  for (const k of keys) {
    const v = item[k];
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return '-';
}

const SHIPMENT_FIELD_LABELS = {
  acceptedAt: '접수일시',
  cargoType: '화물 유형',
  cargoVolume: '화물 부피',
  cargoWeight: '화물 중량(톤)',
  createdAt: '등록일시',
  description: '설명',
  driverCancelToggle: '차주 취소 여부',
  driverId: '차주 ID',
  dropoffAddress: '도착지',
  dropoffDesiredAt: '도착 희망일시',
  needFreeze: '냉동 필요',
  needRefrigerate: '냉장 필요',
  pickupAddress: '출발지',
  pickupDesiredAt: '출발 희망일시',
  platformFee: '플랫폼 수수료',
  price: '운임',
  profit: '정산 금액',
  settlementStatus: '정산 상태',
  shipmentId: '화물 번호',
  shipmentStatus: '배차 상태',
  shipperCancelToggle: '화주 취소 여부',
  shipperId: '화주 ID',
  vehicleType: '차량 유형',
  waypoint1Address: '경유지1',
};

const SHIPMENT_ENUM_LABELS = {
  MOVING: '이사',
  WINGBODY: '윙바디',
  ASSIGNED: '배차완료',
  REQUESTED: '미배차',
  INELIGIBLE: '미해당',
};

function formatDetailValue(key, val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? '예' : '아니오';
  if (typeof val === 'object') return '';
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? str : d.toLocaleString('ko-KR');
  }
  return SHIPMENT_ENUM_LABELS[str] ?? str;
}

const Monitoring = () => {
  const { accessToken } = useAuth();
  const mapElement = useRef(null);
  const [unassignedList, setUnassignedList] = useState([]);
  const [assignedList, setAssignedList] = useState([]);
  const [unassignedLoading, setUnassignedLoading] = useState(true);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;
    const mapOptions = {
      center: new naver.maps.LatLng(37.5665, 126.9780),
      zoom: 14,
      minZoom: 6,
      zoomControl: true,
      mapTypeControl: true,
    };
    const map = new naver.maps.Map(mapElement.current, mapOptions);
    new naver.maps.Marker({
      position: new naver.maps.LatLng(37.5665, 126.9780),
      map: map,
      title: '진성욱 기사님',
      icon: {
        content: '<div style="font-size:24px;">🚛</div>',
        anchor: new naver.maps.Point(12, 12),
      }
    });
  }, []);

  const refetchLists = useCallback(() => {
    if (!accessToken) return;
    setUnassignedLoading(true);
    setAssignedLoading(true);
    getUnassignedBasic(accessToken)
      .then((list) => setUnassignedList(Array.isArray(list) ? list : []))
      .catch(() => setUnassignedList([]))
      .finally(() => setUnassignedLoading(false));
    getAssignedBasic(accessToken)
      .then((list) => setAssignedList(Array.isArray(list) ? list : []))
      .catch(() => setAssignedList([]))
      .finally(() => setAssignedLoading(false));
  }, [accessToken]);

  useEffect(() => {
    refetchLists();
  }, [refetchLists]);

  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(refetchLists, 30000);
    return () => clearInterval(interval);
  }, [accessToken, refetchLists]);

  const openUnassignedDetail = (shipmentId) => {
    if (!accessToken || !shipmentId) return;
    setDetailModal({ type: 'unassigned', shipmentId });
    setDetailLoading(true);
    getUnassignedDetail(accessToken, shipmentId)
      .then((data) => setDetailModal({ type: 'unassigned', shipmentId, data }))
      .catch(() => setDetailModal({ type: 'unassigned', shipmentId, error: '상세 조회에 실패했습니다.' }))
      .finally(() => setDetailLoading(false));
  };

  const openAssignedDetail = (shipmentId) => {
    if (!accessToken || !shipmentId) return;
    setDetailModal({ type: 'assigned', shipmentId });
    setDetailLoading(true);
    getAssignedDetail(accessToken, shipmentId)
      .then((data) => setDetailModal({ type: 'assigned', shipmentId, data }))
      .catch(() => setDetailModal({ type: 'assigned', shipmentId, error: '상세 조회에 실패했습니다.' }))
      .finally(() => setDetailLoading(false));
  };

  const closeDetailModal = () => setDetailModal(null);

  return (
    <div className="monitoring-page">
      <div className="monitoring-container">
        <div className="left-section">
          <div ref={mapElement} className="map-area"></div>
          <div className="status-table-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h3 className="sidebar-title" style={{ marginBottom: 0 }}>● 배차 화물 (운행 현황)</h3>
              <button type="button" className="monitoring-refresh-btn" onClick={refetchLists} disabled={assignedLoading || unassignedLoading}>
                {assignedLoading || unassignedLoading ? '새로고침 중...' : '새로고침'}
              </button>
            </div>
            {assignedLoading ? (
              <p className="monitoring-loading">로딩 중...</p>
            ) : (
              <table className="status-table">
                <thead>
                  <tr>
                    <th>기사님/화물</th>
                    <th>출발지</th>
                    <th>도착지</th>
                    <th>운행상태</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assignedList.length === 0 ? (
                    <tr><td colSpan={5} className="monitoring-empty">배차된 화물이 없습니다.</td></tr>
                  ) : (
                    assignedList.map((item, idx) => {
                      const id = item.shipmentId ?? item.id ?? idx;
                      const name = pickDisplay(item, 'driverName', 'driverName', 'shipperName', 'requesterName', 'name');
                      const start = pickDisplay(item, 'pickupAddress', 'origin', 'originAddress', 'departure', 'start');
                      const end = pickDisplay(item, 'dropoffAddress', 'destination', 'destinationAddress', 'arrival', 'end');
                      const status = pickDisplay(item, 'status', 'shipmentStatus', 'assignmentStatus') || '운행중';
                      return (
                        <tr key={id}>
                          <td className="driver-name">👤 {name}</td>
                          <td>{start}</td>
                          <td>{end}</td>
                          <td><span className="status-dot"></span>{SHIPMENT_ENUM_LABELS[status] ?? status}</td>
                          <td><button type="button" className="monitoring-detail-btn" onClick={() => openAssignedDetail(id)}>자세히 보기</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="right-sidebar">
          <h3 className="sidebar-title">● 미배차 화물</h3>
          {unassignedLoading ? (
            <p className="monitoring-loading">로딩 중...</p>
          ) : unassignedList.length === 0 ? (
            <p className="monitoring-empty">미배차 화물이 없습니다.</p>
          ) : (
            <div className="cargo-list">
              {unassignedList.map((item, idx) => {
                const id = item.shipmentId ?? item.id ?? idx;
                const name = pickDisplay(item, 'shipperName', 'requesterName', 'name');
                const start = pickDisplay(item, 'pickupAddress', 'origin', 'originAddress', 'departure', 'start');
                const end = pickDisplay(item, 'dropoffAddress', 'destination', 'destinationAddress', 'arrival', 'end');
                return (
                  <div
                    className="cargo-card"
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openUnassignedDetail(id)}
                    onKeyDown={(e) => e.key === 'Enter' && openUnassignedDetail(id)}
                  >
                    <div className="cargo-header">
                      <span className="cargo-user-name">👤 {name} 님</span>
                      <span className="table-badge shipper">화주</span>
                    </div>
                    <div className="cargo-detail-info">
                      <p><span>id :</span> {id}</p>
                      <p><span>출발지 :</span> {start}</p>
                      <p><span>도착지 :</span> {end}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {detailModal && (
        <div className="monitoring-modal-overlay" onClick={closeDetailModal}>
          <div className="monitoring-modal" onClick={(e) => e.stopPropagation()}>
            <div className="monitoring-modal-header">
              <h3>{detailModal.type === 'unassigned' ? '미배차 화물 상세' : '배차 화물 상세'}</h3>
              <button type="button" className="monitoring-modal-close" onClick={closeDetailModal}>×</button>
            </div>
            {detailLoading ? (
              <p className="monitoring-loading">상세 로딩 중...</p>
            ) : detailModal.error ? (
              <p className="monitoring-detail-error">{detailModal.error}</p>
            ) : detailModal.data && typeof detailModal.data === 'object' ? (
              <div className="monitoring-detail-body">
                <p><span>출발지</span> {detailModal.data.pickupAddress ?? '-'}</p>
                <p><span>도착지</span> {detailModal.data.dropoffAddress ?? '-'}</p>
                {detailModal.data.waypoint1Address && (
                  <p><span>경유지1</span> {detailModal.data.waypoint1Address}</p>
                )}
                <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                {Object.entries(detailModal.data)
                  .filter(([key]) => !['pickupAddress', 'dropoffAddress', 'waypoint1Address'].includes(key))
                  .map(([key, val]) => {
                    if (val === null || val === undefined || typeof val === 'object') return null;
                    const label = SHIPMENT_FIELD_LABELS[key] ?? key;
                    return <p key={key}><span>{label}</span> {formatDetailValue(key, val)}</p>;
                  })}
              </div>
            ) : (
              <p className="monitoring-empty">상세 정보가 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;