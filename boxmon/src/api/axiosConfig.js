import axios from 'axios';

let onUnauthorized = null;

/** 401 시 로그아웃 후 로그인 페이지로 보낼 콜백 등록 (App에서 호출) */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.config?.headers?.Authorization) {
      onUnauthorized?.();
    }
    return Promise.reject(err);
  }
);
