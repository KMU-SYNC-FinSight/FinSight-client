/**
 * FinSight API 타입.
 *
 * 출처: 프로젝트 루트 openapi.json (FinSight API v1.0.0)
 * openapi.json 이 유일한 계약 기준이다. 스펙이 바뀌면 이 파일을 먼저 갱신할 것.
 */

/* ───────────────────────── enum ───────────────────────── */

export const BUSINESS_TYPES = ['CAFE', 'RESTAURANT', 'BAKERY', 'RETAIL', 'ETC'] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]

export type UploadType = 'STORE_VIDEO' | 'SALES_CSV' | 'VISITOR_CSV'

export type ProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type UserRole = 'OWNER' | 'FINANCIAL_ANALYST' | 'ADMIN'

export type AuthProvider = 'LOCAL' | 'KAKAO'

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'

export type CongestionLevel = 'LOW' | 'NORMAL' | 'HIGH'

/**
 * 운영 안정성 등급.
 *
 * 주의: openapi.json 에서 grade 는 enum 이 아닌 자유 string 이다 (example: "STABLE").
 * 백엔드가 새 값을 보내도 화면이 깨지지 않도록 알려진 값 + string 열림 타입으로 둔다.
 * 표시 매핑은 src/lib/grade.ts 에서 폴백과 함께 처리한다.
 */
export type Grade = 'VERY_STABLE' | 'STABLE' | 'CAUTION' | 'RISK' | (string & {})

/** 위험도. grade 와 마찬가지로 자유 string 이다 (example: "LOW"). */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | (string & {})

/* ───────────────────────── Auth ───────────────────────── */

export interface SignupRequest {
  /** 로그인에 사용할 이메일 */
  email: string
  /** 8~20자 */
  password: string
  /** 최대 50자 */
  name: string
}

export interface SignupResponse {
  userId: number
  email: string
  name: string
  role: UserRole
  // 주의: 토큰이 없다. 가입 후에는 로그인을 따로 해야 한다.
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  /** 예: "Bearer" */
  tokenType: string
  userId: number
  name: string
  role: UserRole
}

/* ───────────────────────── User ───────────────────────── */

export interface UserMeResponse {
  userId: number
  email: string
  name: string
  role: UserRole
  provider: AuthProvider
  status: UserStatus
}

/* ───────────────────────── Store ───────────────────────── */

export interface StoreCreateRequest {
  /** 필수, 최대 100자 */
  name: string
  /** 필수 */
  businessType: BusinessType
  /** 최대 255자 */
  address?: string
  seatCount?: number
  /** ISO date (yyyy-MM-dd) */
  openedAt?: string
}

/**
 * 주의: 서버는 값이 없는 선택 필드를 키 생략이 아니라 **null** 로 보낸다.
 * (실측: `{"storeId":4,"name":"...","businessType":"ETC","address":null,"seatCount":null,"openedAt":null}`)
 * 그래서 `?:` 만으로는 부족하고 `| null` 이 필요하다.
 */
export interface StoreResponse {
  storeId: number
  name: string
  businessType: BusinessType
  address?: string | null
  seatCount?: number | null
  /** ISO date (yyyy-MM-dd) */
  openedAt?: string | null
}

/* ───────────────────────── Upload ───────────────────────── */

/** POST /api/stores/{storeId}/videos — 비동기 처리. uploadId 로 폴링해야 한다. */
export interface VideoUploadResponse {
  uploadId: number
  uploadType: UploadType
  processingStatus: ProcessingStatus
  originalFileName: string
}

/**
 * POST /api/stores/{storeId}/sales — CSV 파싱 결과를 즉시 반환한다.
 * VideoUploadResponse 와 달리 processingStatus 가 없다.
 */
export interface SalesUploadResponse {
  uploadId: number
  /** 처리된 전체 행 수 */
  totalRows: number
  /** 새로 저장된 행 수 */
  insertedRows: number
  /** 같은 날짜라서 덮어쓴 행 수 */
  updatedRows: number
  /** 오류로 건너뛴 행 수 */
  skippedRows: number
}

/** GET /api/uploads/{uploadId} */
export interface UploadStatusResponse {
  uploadId: number
  uploadType: UploadType
  processingStatus: ProcessingStatus
  originalFileName: string
  /** FAILED 일 때만 채워진다. */
  errorMessage?: string | null
}

/* ───────────────────────── Dashboard ───────────────────────── */

export interface VisitorMetrics {
  averageOccupancy?: number | null
  peakOccupancy?: number | null
  trackedObjectCount?: number | null
  averageDwellSeconds?: number | null
  congestionLevel?: CongestionLevel | null
}

export interface SalesMetrics {
  salesAmount?: number | null
  transactionCount?: number | null
  /**
   * 추적 객체 1인당 매출 (객단가).
   * 영상 분석 전에는 분모가 없어 null 이다 (매출 CSV 만 올린 상태).
   */
  salesPerTrackedObject?: number | null
}

/**
 * 데이터 업로드 전에도 200 으로 응답하며, 값이 없는 필드는 전부 null 이다.
 * (실측: `{"storeId":3,"storeName":"...","operationScore":null,"grade":null,
 *   "riskLevel":null,"visitorMetrics":null,"salesMetrics":null}`)
 * 즉 지표 블록 자체가 null 일 수 있으므로 항상 옵셔널 체이닝으로 접근한다.
 */
export interface DashboardResponse {
  storeId: number
  storeName: string
  operationScore?: number | null
  grade?: Grade | null
  riskLevel?: RiskLevel | null
  visitorMetrics?: VisitorMetrics | null
  salesMetrics?: SalesMetrics | null
}

/* ───────────────────────── Report ───────────────────────── */

/**
 * 주의: 점수가 아직 산출되지 않았으면 이 엔드포인트는 200 이 아니라
 * **404 `SCORE_NOT_READY`** 를 반환한다. 오류가 아니라 "데이터를 더 올려야 한다"는 뜻이므로
 * 화면에서는 실패가 아닌 빈 상태로 다뤄야 한다 (API_CODES.SCORE_NOT_READY 로 분기).
 */
export interface ReportResponse {
  storeId: number
  operationScore?: number | null
  grade?: Grade | null
  riskLevel?: RiskLevel | null
  /** 요약 한 문단 */
  summary?: string | null
  /** 근거 목록 */
  evidence?: string[] | null
  /** 이용 안내 (신용등급·대출 판단용이 아니라는 고지) */
  usageNotice?: string | null
}
