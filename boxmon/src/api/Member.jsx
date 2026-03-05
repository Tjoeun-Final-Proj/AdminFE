import axios from 'axios';

const API_BASE = '/api';

/** GET /api/admin/list → 관리자 목록 (Authorization: Bearer 필요) */
export async function getAdminList(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/user/list → 사용자 목록 (userType: DRIVER | SHIPPER) (Authorization: Bearer 필요) */
export async function getUserList(accessToken) {
  const { data } = await axios.get(`${API_BASE}/user/list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return Array.isArray(data) ? data : [];
}

/** POST /api/user/driverDetail → 차주 상세 (RequestBody: Long userId 숫자만 전달) */
export async function getDriverDetail(accessToken, userId) {
  if (userId == null) throw new Error('차주 상세 조회에 userId가 필요합니다.');
  const id = Number(userId);
  const { data } = await axios.post(
    `${API_BASE}/user/driverDetail`,
    id,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return data ?? {};
}

/** POST /api/user/shipperDetail → 화주 상세 (RequestBody: Long userId 숫자만 전달) */
export async function getShipperDetail(accessToken, userId) {
  if (userId == null) throw new Error('화주 상세 조회에 userId가 필요합니다.');
  const id = Number(userId);
  const { data } = await axios.post(
    `${API_BASE}/user/shipperDetail`,
    id,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return data ?? {};
}

/** POST /api/penalty/suspension → 계정 정지 (RequestBody: Long userId) */
export async function postSuspension(accessToken, userId) {
  if (userId == null) throw new Error('userId가 필요합니다.');
  const id = Number(userId);
  await axios.post(
    `${API_BASE}/penalty/suspension`,
    id,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/** POST /api/penalty/restoration → 계정 복구 (RequestBody: Long userId) */
export async function postRestoration(accessToken, userId) {
  if (userId == null) throw new Error('userId가 필요합니다.');
  const id = Number(userId);
  await axios.post(
    `${API_BASE}/penalty/restoration`,
    id,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/** GET /api/penalty/list → 패널티 목록 (userId 전달: body 또는 쿼리) */
export async function getPenaltyList(accessToken, userId) {
  if (userId == null) return [];
  const id = Number(userId);
  const parse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };
  try {
    const { data } = await axios.request({
      method: 'GET',
      url: `${API_BASE}/penalty/list`,
      data: { userId: id },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return parse(data);
  } catch {
    const { data } = await axios.get(`${API_BASE}/penalty/list`, {
      params: { userId: id },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return parse(data);
  }
}

/** POST /api/penalty/create → 패널티 추가 (RequestBody: PenaltiesDto) */
export async function createPenalty(accessToken, request) {
  await axios.post(`${API_BASE}/penalty/create`, request, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/** POST /api/penalty/delete → 패널티 삭제 (RequestBody: Long penaltyId) */
export async function deletePenalty(accessToken, penaltyId) {
  if (penaltyId == null) throw new Error('penaltyId가 필요합니다.');
  const id = Number(penaltyId);
  await axios.post(`${API_BASE}/penalty/delete`, id, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/** POST /api/admin/create → 관리자 계정 생성 (Authorization: Bearer 필요, @AuthenticationPrincipal adminId 사용) */
export async function createAdmin(accessToken, { name, loginId, password }) {
  try {
    await axios.post(
      `${API_BASE}/admin/create`,
      { name, loginId, password },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.message ?? err.response.data ?? `생성 실패: ${err.response.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    throw new Error('서버에 연결할 수 없습니다. 백엔드 실행 여부를 확인하세요.');
  }
}