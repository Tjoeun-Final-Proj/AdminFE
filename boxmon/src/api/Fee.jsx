import axios from 'axios';

const API_BASE = '/api';

/** GET /api/admin/settings/fee → 수수료율 설정값 조회 (Authorization: Bearer 필요) */
export async function getFeeSetting(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/settings/fee`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (data != null && typeof data.value !== 'undefined') return data.value;
  if (typeof data === 'string' || typeof data === 'number') return data;
  return null;
}

/** GET /api/admin/settings/fee/graph/2weeks → 2주 일별 수수료 [{ date, feeRate, changed }] */
export async function getFeeGraph2Weeks(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/settings/fee/graph/2weeks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data || { fromDate: null, toDate: null, unit: 'DAY', points: [] };
}

/** PUT /api/admin/settings/fee → 수수료율 설정 (RequestBody: { value } - 문자열 또는 숫자) */
export async function setFeeSetting(accessToken, value) {
  const num = Number(value);
  const body = Number.isNaN(num) ? { value: String(value) } : { value: num };
  await axios.put(
    `${API_BASE}/admin/settings/fee`,
    body,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}
