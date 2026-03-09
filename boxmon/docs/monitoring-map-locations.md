# 모니터링 지도 – 운행중 화물 위치 표시 (프론트 설정 가이드)

## 1. 이미 있는 것 (추가 설정 불필요)

| 항목 | 설명 |
|------|------|
| **네이버 지도** | `VITE_NAVER_MAP_CLIENT_ID` 로 스크립트 로드, 지도·마커 API 사용 가능 |
| **배차 목록 API** | `GET /api/admin/assigned/basic` – 화물조회 목록 (아직 좌표 필드 없음) |

---

## 2. 백엔드에서 준비해야 할 것 (좌표 API)

운행중인 화물의 **현재 위치 좌표**를 프론트에 줄 수 있어야 합니다. 아래 둘 중 하나만 있으면 됩니다.

### 방법 A: 기존 API 응답에 좌표 추가 (권장)

- **API:** `GET /api/admin/assigned/basic` (또는 상세 API)
- **추가 필드 (운송중인 건만 값 있으면 됨):**
  - `latitude` (또는 `lat`) : 위도 (number)
  - `longitude` (또는 `lng`) : 경도 (number)
- **조건:** `shipmentStatus === 'IN_TRANSIT'`(또는 '운송 중') 인 건에만 위도·경도 내려주면 됨.

**예시 응답 항목 하나:**
```json
{
  "shipmentId": 123,
  "driverName": "홍길동",
  "shipmentStatus": "IN_TRANSIT",
  "latitude": 37.5665,
  "longitude": 126.978
}
```

### 방법 B: 위치 전용 API 신설

- **API 예시:** `GET /api/admin/assigned/locations` 또는 `GET /api/admin/shipments/locations`
- **응답:** 운행중인 화물만, 좌표 + 식별/표시용 정보

**예시 응답:**
```json
[
  {
    "shipmentId": 123,
    "driverName": "홍길동",
    "latitude": 37.5665,
    "longitude": 126.978
  }
]
```

- **필수 필드:** `shipmentId`(또는 id), `latitude`, `longitude`
- **선택:** `driverName` → 마커 툴팁/클릭 시 표시용

---

## 3. 프론트엔드에서 필요한 것 정리

### 3.1 환경 변수 (이미 있음)

- `.env` 에 **네이버 지도 클라이언트 ID** 있으면 됨.
  - `VITE_NAVER_MAP_CLIENT_ID=발급받은키`
- 추가로 필요한 env 는 없음 (좌표는 기존 API와 동일한 인증으로 받음).

### 3.2 API 연동

- **방법 A**  
  - `getAssignedBasic` 응답에 `latitude`, `longitude`(또는 `lat`, `lng`) 가 오면,  
  - 프론트에서 `shipmentStatus === 'IN_TRANSIT'` 이고 좌표가 유효한 항목만 필터해서 사용.
- **방법 B**  
  - `Shipment.jsx` 에 함수 추가, 예:  
    `getAssignedLocations(accessToken)` → `GET /api/admin/assigned/locations`  
  - 응답 배열을 그대로 “운행중 위치 목록”으로 사용.

### 3.3 지도 쪽 구현 포인트

1. **지도 인스턴스 보관**  
   - 현재는 `useEffect` 안에서만 `new naver.maps.Map(...)` 사용.  
   - 지도 객체를 **ref**(예: `mapInstanceRef`)에 저장해 두면,  
   - 다른 `useEffect`나 이벤트에서 **마커 추가/삭제/갱신** 가능.

2. **마커 그리기**  
   - 좌표 배열을 받을 때마다:  
     - 기존 “운행중 마커” 전부 제거 후,  
     - 새 배열 기준으로 `naver.maps.Marker` 생성 (position: `new naver.maps.LatLng(lat, lng)`, map: 위에서 저장한 map 인스턴스).  
   - 마커 클릭 시: 해당 화물 상세 모달 열기(`openAssignedDetail(shipmentId)`) 연결 가능.

3. **데이터 갱신(폴링)**  
   - 이미 30초마다 `refetchLists` 호출 중.  
   - 방법 A: `refetchLists` 시 배차 목록에 좌표가 포함되면, 그때마다 “운행중” 필터 후 마커만 다시 그리면 됨.  
   - 방법 B: 위치 전용 API를 30초(또는 1분)마다 호출하고, 응답으로 마커 다시 그리면 됨.

4. **표시 범위(선택)**  
   - 운행중 마커가 여러 개일 때:  
     - `naver.maps.LatLngBounds` 로 범위 잡고 `map.fitBounds(bounds)` 하면, 모든 마커가 보이도록 지도 확대/축소 가능.

---

## 4. 체크리스트 (프론트 설정 시 확인)

- [ ] 백엔드에서 **위도·경도**를 주는 방식 결정 (기존 API 확장 vs 전용 API).
- [ ] 응답 필드 이름 확정: `latitude`/`longitude` vs `lat`/`lng` (프론트에서 동일하게 사용).
- [ ] 지도 인스턴스를 ref에 저장해 두기.
- [ ] “운행중” + 좌표 있는 항목만 필터해서 마커 생성/갱신.
- [ ] 기존 30초 폴링에 “마커 갱신” 로직 연결 (또는 위치 API 전용 폴링 추가).
- [ ] (선택) 마커 클릭 → 해당 화물 상세 모달 열기.
- [ ] (선택) 여러 마커일 때 `fitBounds` 로 한 화면에 보이기.

백엔드에서 좌표 필드(또는 전용 API) 스펙이 정해지면, 그에 맞춰 `Monitoring.jsx` 에 지도 ref·마커 그리기·폴링만 붙이면 됩니다.
