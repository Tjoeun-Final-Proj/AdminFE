import axios from 'axios';

const API_BASE = '/api';

/** GET /api/admin/unassigned/basic → 미배차 화물 basic 목록 */
export async function getUnassignedBasic(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/unassigned/basic`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/admin/unassigned/detail/{shipmentId} → 미배차 화물 상세 */
export async function getUnassignedDetail(accessToken, shipmentId) {
  const id = Number(shipmentId);
  const { data } = await axios.get(`${API_BASE}/admin/unassigned/detail/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data ?? {};
}

/** GET /api/admin/assigned/basic → 배차 화물 basic 목록 */
export async function getAssignedBasic(accessToken) {
  const { data } = await axios.get(`${API_BASE}/admin/assigned/basic`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/admin/assigned/detail/{shipmentId} → 배차 화물 상세 */
export async function getAssignedDetail(accessToken, shipmentId) {
  const id = Number(shipmentId);
  const { data } = await axios.get(`${API_BASE}/admin/assigned/detail/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data ?? {};
}
