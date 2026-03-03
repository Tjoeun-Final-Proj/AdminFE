import axios from 'axios';

const API_BASE = '/api';

/** GET /api/contact/list → 문의 목록 */
export async function getContactList(accessToken) {
  const { data } = await axios.get(`${API_BASE}/contact/list`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/contact/{contactId} → 문의 상세 (ContactDetailDto) */
export async function getContactDetail(accessToken, contactId) {
  const { data } = await axios.get(`${API_BASE}/contact/${contactId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  return data ?? {};
}

/** POST /api/contact/answer → 문의 답변 (ContactAnswerDto: contactId, answerContent) */
export async function answerContact(accessToken, body) {
  await axios.post(`${API_BASE}/contact/answer`, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}
