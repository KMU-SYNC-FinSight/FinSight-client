import axios, { AxiosError, type AxiosInstance } from 'axios'
import { clearSession, getAuthHeader } from '@/store/authStore'

/**
 * 백엔드 주소는 환경변수로만 주입한다 (.env / VITE_API_BASE_URL).
 * 빈 값이면 same-origin 요청이 되어 vite.config.ts 의 server.proxy 를 탈 수 있다.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
})

/**
 * 업로드는 파일 크기가 커서 별도 인스턴스로 타임아웃을 늘린다.
 * Content-Type 은 지정하지 않는다 — FormData 를 넘기면 axios 가
 * multipart boundary 를 포함해 알아서 설정한다. 직접 쓰면 boundary 가 빠져 서버가 파싱에 실패한다.
 */
export const uploadApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 10 * 60_000,
  headers: { Accept: 'application/json' },
})

/* ───────── 요청: Authorization 자동 부착 ───────── */

for (const instance of [api, uploadApi]) {
  instance.interceptors.request.use((config) => {
    const header = getAuthHeader()
    if (header) {
      config.headers.Authorization = header
    }
    return config
  })
}

/* ───────── 응답: 401/403 이면 세션 폐기 ───────── */

/**
 * 토큰 만료 시각을 알 방법이 명세에 없으므로 401 응답만이 유일한 신호다.
 * 세션을 비우면 RequireAuth 가 로그인 화면으로 돌려보낸다.
 * (여기서 직접 라우팅하지 않는 이유: 인터셉터는 라우터 밖이고,
 *  location 을 강제로 바꾸면 리다이렉트 후 복귀 경로가 사라진다.)
 */
const AUTH_FREE_PATHS = ['/api/auth/login', '/api/auth/signup']

for (const instance of [api, uploadApi]) {
  instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      const status = error.response?.status
      const url = error.config?.url ?? ''
      const isAuthEndpoint = AUTH_FREE_PATHS.some((p) => url.includes(p))

      // 로그인/회원가입 실패(401)는 "잘못된 비밀번호"이지 세션 만료가 아니다.
      if ((status === 401 || status === 403) && !isAuthEndpoint) {
        clearSession()
      }
      return Promise.reject(error)
    },
  )
}

/* ───────── 에러 정규화 ───────── */

/**
 * 백엔드 에러 코드.
 *
 * openapi.json 에는 에러 스키마가 없지만 실제 서버는 다음 형태로 일관되게 응답한다.
 *   { code, message, errors, timestamp }
 * 상태 코드만으로는 구분이 안 되는 경우가 있어(예: 404 가 "없음"인지 "아직 준비 안 됨"인지)
 * 화면 분기는 message 문자열이 아니라 이 code 로 한다.
 */
export const API_CODES = {
  /** 점수 산출 전 리포트 조회. 오류가 아니라 "데이터를 더 올려야 하는" 정상 상태다. */
  SCORE_NOT_READY: 'SCORE_NOT_READY',
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  UPLOAD_NOT_FOUND: 'UPLOAD_NOT_FOUND',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  INVALID_LOGIN_CREDENTIALS: 'INVALID_LOGIN_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const

export interface ApiError {
  status: number | null
  /** 서버가 준 에러 코드. 없으면 null. 화면 분기는 이 값으로 한다. */
  code: string | null
  message: string
  /** 네트워크 자체가 실패해 응답이 없는 경우 */
  isNetworkError: boolean
}

const DEFAULT_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 백엔드 에러 응답 스키마가 openapi.json 에 정의되어 있지 않다.
 * 흔한 Spring 형태(message / error / errors[0].defaultMessage)와 평문 본문을 순서대로 훑고,
 * 아무것도 못 찾으면 상태 코드별 기본 문구로 떨어진다.
 */
export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      status: null,
      code: null,
      message: error instanceof Error ? error.message : DEFAULT_MESSAGE,
      isNetworkError: false,
    }
  }

  const status = error.response?.status ?? null

  if (!error.response) {
    return {
      status: null,
      code: null,
      message:
        error.code === 'ECONNABORTED'
          ? '요청 시간이 초과되었습니다. 네트워크 상태를 확인해 주세요.'
          : '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
      isNetworkError: true,
    }
  }

  return {
    status,
    code: extractCode(error.response.data),
    message: extractMessage(error.response.data) ?? messageForStatus(status),
    isNetworkError: false,
  }
}

function extractCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const code = (data as Record<string, unknown>).code
  return typeof code === 'string' && code.trim() ? code.trim() : null
}

/** react-query 의 error 객체에서 바로 코드를 뽑는 편의 함수. */
export function isApiCode(error: unknown, code: string): boolean {
  return toApiError(error).code === code
}

function extractMessage(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim()
    // HTML 에러 페이지가 오는 경우가 있어 걸러낸다.
    if (!trimmed || trimmed.startsWith('<')) return null
    return trimmed
  }

  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>

  for (const key of ['message', 'error_description', 'detail', 'error'] as const) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  // Bean Validation 형태: { errors: [{ defaultMessage, field }] }
  const errors = record.errors
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown>
    for (const key of ['defaultMessage', 'message', 'reason'] as const) {
      const value = first[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }

  return null
}

function messageForStatus(status: number | null): string {
  switch (status) {
    case 400:
      return '입력한 내용을 다시 확인해 주세요.'
    case 401:
      return '이메일 또는 비밀번호가 올바르지 않습니다.'
    case 403:
      return '접근 권한이 없습니다.'
    case 404:
      return '요청한 정보를 찾을 수 없습니다.'
    case 409:
      return '이미 등록된 정보입니다.'
    case 413:
      return '파일 용량이 너무 큽니다.'
    case 415:
      return '지원하지 않는 파일 형식입니다.'
    default:
      if (status !== null && status >= 500) {
        return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      }
      return DEFAULT_MESSAGE
  }
}
