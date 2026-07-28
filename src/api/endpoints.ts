/**
 * API 경로를 한곳에 모아둔다. openapi.json 의 paths 와 1:1 대응.
 * 문자열을 화면/훅에 흩어놓지 않기 위한 단일 지점.
 */
export const ENDPOINTS = {
  auth: {
    signup: '/api/auth/signup',
    login: '/api/auth/login',
  },
  users: {
    me: '/api/users/me',
  },
  stores: {
    list: '/api/stores',
    create: '/api/stores',
    detail: (storeId: number) => `/api/stores/${storeId}`,
    dashboard: (storeId: number) => `/api/stores/${storeId}/dashboard`,
    report: (storeId: number) => `/api/stores/${storeId}/report`,
    /** 영상 업로드 (multipart, 비동기) */
    videos: (storeId: number) => `/api/stores/${storeId}/videos`,
    /** 매출 CSV 업로드 (multipart, 파싱 결과 즉시 반환) */
    sales: (storeId: number) => `/api/stores/${storeId}/sales`,
  },
  uploads: {
    status: (uploadId: number) => `/api/uploads/${uploadId}`,
  },
} as const
