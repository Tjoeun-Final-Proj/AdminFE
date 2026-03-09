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

/** axios 에러에서 사용자에게 보여줄 메시지 추출 (백엔드 message/error/detail 등) */
function getErrorMessage(err, fallback = '처리에 실패했습니다.') {
  const data = err.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data === 'string') return data;
  const msg = data.message ?? data.error ?? data.detail ?? data.msg;
  if (msg && typeof msg === 'string') return msg;
  return err.message || fallback;
}/** POST /api/admin/delete → 현재 로그인 관리자 계정 탈퇴 (RequestBody: 비밀번호 평문, Authorization: Bearer 필요) */
export async function deleteAdmin(accessToken, password) {
  try {
    await axios.post(`${API_BASE}/admin/delete`, password, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain; charset=UTF-8',
      },
    });
  } catch (err) {
    throw new Error(getErrorMessage(err, '탈퇴 처리에 실패했습니다.'));
  }
}