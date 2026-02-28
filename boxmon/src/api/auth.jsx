import axios from 'axios';

// 개발 시: /api 요청이 vite.config.js 프록시로 localhost:8080 에 전달됨 (CORS 없음)
const API_BASE = '/api';

export async function loginAdmin({ loginId, password }) {
  try {
    const { data } = await axios.post(`${API_BASE}/admin/LoginAdmin`, { loginId, password });
    // AdminLogin: { accessToken, refreshToken }
    if (!data?.accessToken) {
      throw new Error('로그인 응답 형식이 올바르지 않습니다. (accessToken 없음)');
    }
    return { accessToken: data.accessToken, refreshToken: data.refreshToken ?? null };
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.message ?? err.response.data ?? `로그인 실패: ${err.response.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    throw new Error('서버에 연결할 수 없습니다. 백엔드 실행 여부를 확인하세요.');
  }
}

/** GET /api/admin/me → 현재 로그인한 관리자 이름 (Authorization: Bearer 필요) */
export async function getAdminName(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return typeof data === 'string' ? data : (data?.name ?? data ?? null);
}

/** GET /api/admin/me → 현재 로그인한 관리자 정보 (이름, adminId 등) */
export async function getAdminInfo(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data ?? {};
}

