import type { BusinessType, CongestionLevel, UserRole } from '@/api/types'

const EMPTY = '—'

/** 값이 없을 때 화면에 대시를 보여준다. 0 은 유효한 값이므로 통과시킨다. */
function isBlank(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value)
}

/** 1234567 → "1,234,567원" */
export function formatCurrency(value: number | null | undefined): string {
  if (isBlank(value)) return EMPTY
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/** 통화 단위 없이 천 단위 구분만. */
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  if (isBlank(value)) return EMPTY
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** 78.4 → "78.4" (점수는 소수 1자리) */
export function formatScore(value: number | null | undefined): string {
  if (isBlank(value)) return EMPTY
  return value.toFixed(1)
}

/** 754.2 → "12분 34초", 45 → "45초" */
export function formatDuration(seconds: number | null | undefined): string {
  if (isBlank(seconds)) return EMPTY
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0) return `${minutes}분 ${secs}초`
  return `${secs}초`
}

/** 명 단위. 소수가 있으면 1자리까지 (평균 체류 인원처럼 정수가 아닐 수 있다). */
export function formatPeople(value: number | null | undefined): string {
  if (isBlank(value)) return EMPTY
  const isInteger = Number.isInteger(value)
  return `${formatNumber(value, isInteger ? 0 : 1)}명`
}

/** "2024-03-01" → "2024.03.01" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  return `${match[1]}.${match[2]}.${match[3]}`
}

/** 12345678 → "11.8MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/* ───────────────────────── enum 라벨 ───────────────────────── */

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  CAFE: '카페',
  RESTAURANT: '음식점',
  BAKERY: '베이커리',
  RETAIL: '소매',
  ETC: '기타',
}

export function businessTypeLabel(type: BusinessType | null | undefined): string {
  if (!type) return EMPTY
  return BUSINESS_TYPE_LABELS[type] ?? type
}

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: '사업자',
  FINANCIAL_ANALYST: '금융기관 분석가',
  ADMIN: '관리자',
}

export function roleLabel(role: UserRole | null | undefined): string {
  if (!role) return EMPTY
  return ROLE_LABELS[role] ?? role
}

const CONGESTION_LABELS: Record<CongestionLevel, string> = {
  LOW: '여유',
  NORMAL: '보통',
  HIGH: '혼잡',
}

export function congestionLabel(level: CongestionLevel | null | undefined): string {
  if (!level) return EMPTY
  return CONGESTION_LABELS[level] ?? level
}

/** 혼잡도는 높을수록 나쁘다고 단정할 수 없다 (매출엔 좋다). 중립 톤으로 표기. */
export function congestionTone(
  level: CongestionLevel | null | undefined,
): 'neutral' | 'info' | 'warning' {
  if (level === 'HIGH') return 'warning'
  if (level === 'NORMAL') return 'info'
  return 'neutral'
}
