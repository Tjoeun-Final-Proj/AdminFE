/* global naver */
import React, { useEffect, useRef } from 'react';
import '../styles/Monitoring.css';

const Monitoring = () => {
  const mapElement = useRef(null);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;

    // 1. 지도 초기 설정
    const mapOptions = {
      center: new naver.maps.LatLng(37.5665, 126.9780), // 서울 시청 기준
      zoom: 14,
      minZoom: 6,
      zoomControl: true,
      mapTypeControl: true,
    };

    // 2. 지도 생성
    const map = new naver.maps.Map(mapElement.current, mapOptions);

    // 3. 샘플 마커 (운행 중인 기사님 위치 예시)
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

  // 하단 운행 현황 데이터
  const drivingStatus = [
    { name: '진성욱', start: '서울 강남구', end: '대전 서구', status: '운행중' },
    { name: '이순신', start: '서울 송파구', end: '부산 해운대', status: '운행중' },
    { name: '강감찬', start: '경기 수원', end: '강원 강릉', status: '운행중' },
    { name: '을지문덕', start: '서울 종로', end: '인천 연수', status: '운행중' },
  ];

  // 오른쪽 미배차 화물 데이터
  const unassignedCargo = [
    { id: 'hw_tv', name: '강형원', role: '화주', start: '서울 종합상가', end: '대전 종합상가' },
    { id: 'hw_tv', name: '강형원', role: '화주', start: '서울 종합상가', end: '대전 종합상가' },
    { id: 'hw_tv', name: '강형원', role: '화주', start: '서울 종합상가', end: '대전 종합상가' },
  ];

  return (
    <div className="monitoring-page">
      <div className="monitoring-container">
        
        {/* 왼쪽 섹션: 지도 + 운행 현황 테이블 */}
        <div className="left-section">
          <div ref={mapElement} className="map-area"></div>

          <div className="status-table-section">
            <table className="status-table">
              <thead>
                <tr>
                  <th>기사님 이름</th>
                  <th>출발지</th>
                  <th>도착지</th>
                  <th>운행상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {drivingStatus.map((item, idx) => (
                  <tr key={idx}>
                    <td className="driver-name">👤 {item.name}</td>
                    <td>{item.start}</td>
                    <td>{item.end}</td>
                    <td><span className="status-dot"></span>{item.status}</td>
                    <td><button className="force-cancel-btn">강제 취소</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽 섹션: 미배차 화물 리스트 */}
        <aside className="right-sidebar">
          <h3 className="sidebar-title">● 미배차 화물</h3>
          <div className="cargo-list">
            {unassignedCargo.map((cargo, idx) => (
              <div className="cargo-card" key={idx}>
                <div className="cargo-header">
                  <span className="cargo-user-name">👤 {cargo.name} 님</span>
                  <span className="cargo-role-badge">화주</span>
                </div>
                <div className="cargo-detail-info">
                  <p><span>id :</span> {cargo.id}</p>
                  <p><span>출발지 :</span> {cargo.start}</p>
                  <p><span>도착지 :</span> {cargo.end}</p>
                </div>
                <button className="cargo-detail-btn">상세보기</button>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Monitoring;