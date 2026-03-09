/* global naver */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnassignedBasic, getUnassignedDetail, getAssignedBasic, getAssignedDetail, forceCancelShipment, getLocationLogRoute } from '../api/Shipment';
import '../styles/Monitoring.css';

const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '';

function loadNaverMapScript() {
  return new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) {
      resolve();
      return;
    }
    if (!NAVER_MAP_CLIENT_ID) {
      reject(new Error('NO_CLIENT_ID'));
      return;
    }
    const existing = document.querySelector('script[src*="map.naver.com"]');
    if (existing) {
      if (window.naver && window.naver.maps) resolve();
      else existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('SCRIPT_LOAD_FAIL'));
    document.head.appendChild(script);
  });
}

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
  ASSIGNED: '배차 완료',
  REQUESTED: '배차 대기',
  INELIGIBLE: '미해당',
  IN_TRANSIT: '운송 중',
  DONE: '운송 완료',
  CANCELED: '취소됨',
  CANCEL: '취소됨',
};

function getStatusLabel(status) {
  if (status == null || status === '') return '-';
  const key = String(status).toUpperCase();
  return SHIPMENT_ENUM_LABELS[key] ?? SHIPMENT_ENUM_LABELS[status] ?? status;
}

function formatDetailValue(key, val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? '예' : '아니오';
  if (typeof val === 'object') return '';
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? str : d.toLocaleString('ko-KR');
  }
  return getStatusLabel(str);
}

const MONITORING_PAGE_SIZE = 5;

function pointToLatLng(point) {
  if (!point) return null;
  const lat = point.latitude ?? point.lat ?? point.y;
  const lng = point.longitude ?? point.lng ?? point.x;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

const Monitoring = () => {
  const { accessToken } = useAuth();
  const mapElement = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeOverlaysRef = useRef([]); // { polyline, marker }[] 지도에 그린 경로/마커 정리용
  const [mapStatus, setMapStatus] = useState('loading'); // 'loading' | 'ok' | 'error' | 'no_key'
  const [unassignedList, setUnassignedList] = useState([]);
  const [assignedList, setAssignedList] = useState([]);
  const [unassignedLoading, setUnassignedLoading] = useState(true);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignedPage, setAssignedPage] = useState(1);
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [forceCancelModal, setForceCancelModal] = useState(null); // { shipmentId } | null
  const [forceCancelReason, setForceCancelReason] = useState('');
  const [forceCancelSubmitting, setForceCancelSubmitting] = useState(false);
  const [forceCancelError, setForceCancelError] = useState('');

  useEffect(() => {
    if (!mapElement.current) return;
    if (!NAVER_MAP_CLIENT_ID) {
      setMapStatus('no_key');
      return;
    }
    setMapStatus('loading');
    loadNaverMapScript()
      .then(() => {
        const { naver } = window;
        if (!mapElement.current || !naver?.maps) {
          setMapStatus('error');
          return;
        }
        const mapOptions = {
          center: new naver.maps.LatLng(37.5665, 126.9780),
          zoom: 14,
          minZoom: 6,
          zoomControl: true,
          mapTypeControl: true,
        };
        const map = new naver.maps.Map(mapElement.current, mapOptions);
        mapInstanceRef.current = map;
        setMapStatus('ok');
      })
      .catch((err) => {
        setMapStatus(err?.message === 'NO_CLIENT_ID' ? 'no_key' : 'error');
      });
  }, []);

  // 운행중인 운송만: location-log route API로 points 받아서 지도에 경로·현재위치 표시
  useEffect(() => {
    if (mapStatus !== 'ok' || !accessToken || !mapInstanceRef.current || !window.naver?.maps) return;
    const naver = window.naver;
    const inTransit = assignedList.filter((item) => {
      const s = pickDisplay(item, 'status', 'shipmentStatus', 'assignmentStatus');
      return String(s).toUpperCase() === 'IN_TRANSIT';
    });
    if (inTransit.length === 0) {
      routeOverlaysRef.current.forEach(({ polyline, marker }) => {
        if (polyline) polyline.setMap(null);
        if (marker) marker.setMap(null);
      });
      routeOverlaysRef.current = [];
      return;
    }
    routeOverlaysRef.current.forEach(({ polyline, marker }) => {
      if (polyline) polyline.setMap(null);
      if (marker) marker.setMap(null);
    });
    routeOverlaysRef.current = [];

    inTransit.forEach((item) => {
      const shipmentId = item.shipmentId ?? item.id;
      if (shipmentId == null) return;
      getLocationLogRoute(accessToken, shipmentId)
        .then((res) => {
          const points = Array.isArray(res.points) ? res.points : [];
          const coords = points.map(pointToLatLng).filter(Boolean);
          if (coords.length === 0 || !mapInstanceRef.current) return;
          const path = coords.map((c) => new naver.maps.LatLng(c.lat, c.lng));
          const polyline = new naver.maps.Polyline({
            map: mapInstanceRef.current,
            path,
            strokeColor: '#01439C',
            strokeWeight: 4,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
          });
          const last = path[path.length - 1];
          const marker = new naver.maps.Marker({
            position: last,
            map: mapInstanceRef.current,
            title: pickDisplay(item, 'driverName', 'name') || `화물 ${shipmentId}`,
            icon: {
              content: '<div style="font-size:24px;">🚛</div>',
              anchor: new naver.maps.Point(12, 12),
            },
          });
          routeOverlaysRef.current.push({ polyline, marker });
        })
        .catch(() => {});
    });
  }, [mapStatus, accessToken, assignedList]);

  const refetchLists = useCallback(() => {
    if (!accessToken) return;
    setUnassignedLoading(true);
    setAssignedLoading(true);
    getUnassignedBasic(accessToken)
      .then((list) => {
        setUnassignedList(Array.isArray(list) ? list : []);
        setUnassignedPage(1);
      })
      .catch(() => {
        setUnassignedList([]);
        setUnassignedPage(1);
      })
      .finally(() => setUnassignedLoading(false));
    getAssignedBasic(accessToken)
      .then((list) => {
        setAssignedList(Array.isArray(list) ? list : []);
        setAssignedPage(1);
        setDriverSearchTerm('');
      })
      .catch(() => {
        setAssignedList([]);
        setAssignedPage(1);
      })
      .finally(() => setAssignedLoading(false));
  }, [accessToken]);

  const assignedFiltered = driverSearchTerm.trim()
    ? assignedList.filter((item) => {
        const name = (pickDisplay(item, 'driverName', 'shipperName', 'requesterName', 'name') ?? '').toLowerCase();
        return name.includes(driverSearchTerm.trim().toLowerCase());
      })
    : assignedList;
  const assignedTotalPages = Math.max(1, Math.ceil(assignedFiltered.length / MONITORING_PAGE_SIZE));
  const assignedSafePage = Math.min(assignedPage, assignedTotalPages);
  const assignedPaginated = assignedFiltered.slice(
    (assignedSafePage - 1) * MONITORING_PAGE_SIZE,
    assignedSafePage * MONITORING_PAGE_SIZE
  );

  const unassignedTotalPages = Math.max(1, Math.ceil(unassignedList.length / MONITORING_PAGE_SIZE));
  const unassignedSafePage = Math.min(unassignedPage, unassignedTotalPages);
  const unassignedPaginated = unassignedList.slice(
    (unassignedSafePage - 1) * MONITORING_PAGE_SIZE,
    unassignedSafePage * MONITORING_PAGE_SIZE
  );

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

  const openForceCancelModal = (e, shipmentId) => {
    e.stopPropagation();
    setForceCancelModal({ shipmentId });
    setForceCancelReason('');
    setForceCancelError('');
  };

  const closeForceCancelModal = () => {
    if (!forceCancelSubmitting) {
      setForceCancelModal(null);
      setForceCancelReason('');
      setForceCancelError('');
    }
  };

  const handleForceCancelSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken || !forceCancelModal?.shipmentId || forceCancelSubmitting) return;
    setForceCancelError('');
    setForceCancelSubmitting(true);
    try {
      await forceCancelShipment(accessToken, forceCancelModal.shipmentId, forceCancelReason.trim());
      closeForceCancelModal();
      refetchLists();
    } catch (err) {
      setForceCancelError(err.response?.data?.message ?? err.message ?? '강제 취소에 실패했습니다.');
    } finally {
      setForceCancelSubmitting(false);
    }
  };

  return (
    <div className="monitoring-page">
      <div className="monitoring-container">
        <div className="left-section">
          <div className="map-area map-area-wrap">
            <div ref={mapElement} className="map-area-inner" />
            {mapStatus !== 'ok' && (
              <div className="map-area-message">
                {mapStatus === 'no_key' && (
                  <>지도를 표시하려면 <code>.env</code>에 <code>VITE_NAVER_MAP_CLIENT_ID</code>를 설정해 주세요.</>
                )}
                {mapStatus === 'loading' && '지도 로딩 중...'}
                {mapStatus === 'error' && '지도를 불러올 수 없습니다.'}
              </div>
            )}
          </div>
          <div className="status-table-section">
            <div className="monitoring-cargo-header">
              <h3 className="monitoring-cargo-title">화물조회</h3>
              <div className="monitoring-cargo-controls">
                <div className="unified-search-box">
                  <input
                    type="text"
                    className="unified-search-input"
                    placeholder="기사님 이름 검색"
                    value={driverSearchTerm}
                    onChange={(e) => {
                      setDriverSearchTerm(e.target.value);
                      setAssignedPage(1);
                    }}
                  />
                  <button type="button" className="unified-search-btn">검색</button>
                </div>
                <button type="button" className="refresh-btn" onClick={refetchLists} disabled={assignedLoading || unassignedLoading}>
                  {assignedLoading || unassignedLoading ? '새로고침 중...' : '새로고침'}
                </button>
              </div>
            </div>
            {assignedLoading ? (
              <p className="monitoring-loading">로딩 중...</p>
            ) : (
              <table className="status-table">
                <thead>
                  <tr>
                    <th>기사님</th>
                    <th>출발지</th>
                    <th>도착지</th>
                    <th>운행상태</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assignedPaginated.length === 0 ? (
                    <tr><td colSpan={5} className="monitoring-empty">배차된 화물이 없습니다.</td></tr>
                  ) : (
                    assignedPaginated.map((item, idx) => {
                      const id = item.shipmentId ?? item.id ?? idx;
                      const name = pickDisplay(item, 'driverName', 'driverName', 'shipperName', 'requesterName', 'name');
                      const start = pickDisplay(item, 'pickupAddress', 'origin', 'originAddress', 'departure', 'start');
                      const end = pickDisplay(item, 'dropoffAddress', 'destination', 'destinationAddress', 'arrival', 'end');
                      const status = pickDisplay(item, 'status', 'shipmentStatus', 'assignmentStatus') || '운행중';
                      const isCanceled = String(status).toUpperCase() === 'CANCELED' || String(status).toUpperCase() === 'CANCEL';
                      return (
                        <tr
                          key={id}
                          className="monitoring-table-row-clickable"
                          onClick={() => openAssignedDetail(id)}
                        >
                          <td className="driver-name cell-ellipsis" title={name}>👤 {name}</td>
                          <td className="cell-ellipsis" title={start}>{start}</td>
                          <td className="cell-ellipsis" title={end}>{end}</td>
                          <td>{getStatusLabel(status)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="monitoring-force-cancel-btn"
                              onClick={(e) => !isCanceled && openForceCancelModal(e, id)}
                              disabled={isCanceled}
                            >
                              강제 취소
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
            {!assignedLoading && assignedFiltered.length > 0 && assignedTotalPages > 1 && (
              <div className="monitoring-pagination">
                <button
                  type="button"
                  className="monitoring-page-btn"
                  onClick={() => setAssignedPage((p) => Math.max(1, p - 1))}
                  disabled={assignedSafePage <= 1}
                >
                  이전
                </button>
                <span className="monitoring-page-info">
                  {assignedSafePage} / {assignedTotalPages} (총 {assignedFiltered.length}건)
                </span>
                <button
                  type="button"
                  className="monitoring-page-btn"
                  onClick={() => setAssignedPage((p) => Math.min(assignedTotalPages, p + 1))}
                  disabled={assignedSafePage >= assignedTotalPages}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="right-sidebar">
          <h3 className="sidebar-title">미배차 화물</h3>
          {unassignedLoading ? (
            <p className="monitoring-loading">로딩 중...</p>
          ) : unassignedList.length === 0 ? (
            <p className="monitoring-empty">미배차 화물이 없습니다.</p>
          ) : (
            <>
              <div className="cargo-list">
                {unassignedPaginated.map((item, idx) => {
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
              {unassignedTotalPages > 1 && (
                <div className="monitoring-pagination">
                  <button
                    type="button"
                    className="monitoring-page-btn"
                    onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                    disabled={unassignedSafePage <= 1}
                  >
                    이전
                  </button>
                  <span className="monitoring-page-info">
                    {unassignedSafePage} / {unassignedTotalPages} (총 {unassignedList.length}건)
                  </span>
                  <button
                    type="button"
                    className="monitoring-page-btn"
                    onClick={() => setUnassignedPage((p) => Math.min(unassignedTotalPages, p + 1))}
                    disabled={unassignedSafePage >= unassignedTotalPages}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
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
                <section className="monitoring-detail-section monitoring-detail-route">
                  <h4 className="monitoring-detail-section-title">경로</h4>
                  <div className="monitoring-detail-route-list">
                    <div className="monitoring-detail-route-item">
                      <span className="monitoring-detail-route-badge">출발</span>
                      <span className="monitoring-detail-route-text">{detailModal.data.pickupAddress ?? '-'}</span>
                    </div>
                    {detailModal.data.waypoint1Address && (
                      <div className="monitoring-detail-route-item">
                        <span className="monitoring-detail-route-badge waypoint">경유</span>
                        <span className="monitoring-detail-route-text">{detailModal.data.waypoint1Address}</span>
                      </div>
                    )}
                    <div className="monitoring-detail-route-item">
                      <span className="monitoring-detail-route-badge">도착</span>
                      <span className="monitoring-detail-route-text">{detailModal.data.dropoffAddress ?? '-'}</span>
                    </div>
                  </div>
                </section>
                <section className="monitoring-detail-section">
                  <h4 className="monitoring-detail-section-title">상세 정보</h4>
                  <div className="monitoring-detail-grid">
                    {Object.entries(detailModal.data)
                      .filter(([key]) => !['pickupAddress', 'dropoffAddress', 'waypoint1Address'].includes(key))
                      .map(([key, val]) => {
                        if (val === null || val === undefined || typeof val === 'object') return null;
                        const label = SHIPMENT_FIELD_LABELS[key] ?? key;
                        return (
                          <div key={key} className="monitoring-detail-row">
                            <span className="monitoring-detail-label">{label}</span>
                            <span className="monitoring-detail-value">{formatDetailValue(key, val)}</span>
                          </div>
                        );
                      })}
                  </div>
                </section>
              </div>
            ) : (
              <p className="monitoring-empty">상세 정보가 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {forceCancelModal && (
        <div className="monitoring-modal-overlay" onClick={closeForceCancelModal}>
          <div className="monitoring-modal" onClick={(e) => e.stopPropagation()}>
            <div className="monitoring-modal-header">
              <h3>화물 강제 취소</h3>
              <button type="button" className="monitoring-modal-close" onClick={closeForceCancelModal}>×</button>
            </div>
            <form onSubmit={handleForceCancelSubmit}>
              {forceCancelError && <p className="monitoring-detail-error">{forceCancelError}</p>}
              <div className="monitoring-force-cancel-field">
                <label htmlFor="force-cancel-reason">취소 사유</label>
                <input
                  id="force-cancel-reason"
                  type="text"
                  value={forceCancelReason}
                  onChange={(e) => setForceCancelReason(e.target.value)}
                  placeholder="취소 사유를 입력하세요"
                  disabled={forceCancelSubmitting}
                />
              </div>
              <div className="monitoring-modal-actions">
                <button type="button" className="monitoring-force-cancel-cancel" onClick={closeForceCancelModal} disabled={forceCancelSubmitting}>
                  취소
                </button>
                <button type="submit" className="monitoring-force-cancel-submit" disabled={forceCancelSubmitting}>
                  {forceCancelSubmitting ? '처리 중...' : '강제 취소'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;