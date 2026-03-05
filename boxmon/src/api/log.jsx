import axios from 'axios';

const API_BASE = '/api';

/** GET /api/logs → 이벤트 로그 목록 (Authorization: Bearer 필요) */
export async function getLogs(accessToken) {
  const { data } = await axios.get(`${API_BASE}/logs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return Array.isArray(data) ? data : [];
}
