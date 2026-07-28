/**
 * 라우트 경로.
 *
 * 탭 활성 판정이 접두사 매칭으로 자연스럽게 되도록 트리를 짰다.
 *  - /stores/**    → "내 매장" 탭
 *  - /dashboard/** → "대시보드" 탭
 *  - /my           → "내 정보" 탭
 *  - /report/:id   → 탭 없음. 문서 성격의 화면이라 탭바를 감추고 뒤로가기만 둔다.
 */
export const PATHS = {
  login: '/login',
  signup: '/signup',

  stores: '/stores',
  storeNew: '/stores/new',
  storeDetail: (storeId: number | string) => `/stores/${storeId}`,

  /** 매장이 선택되어 있으면 /dashboard/:storeId 로 넘겨주는 리졸버 */
  dashboard: '/dashboard',
  dashboardOf: (storeId: number | string) => `/dashboard/${storeId}`,

  report: (storeId: number | string) => `/report/${storeId}`,

  /** 서비스 사용 방법 안내 */
  guide: '/guide',

  my: '/my',
} as const
