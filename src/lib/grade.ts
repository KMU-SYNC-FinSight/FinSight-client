import type { Grade, RiskLevel } from '@/api/types'

export interface GradeMeta {
  /** 화면에 보여줄 한글 라벨 */
  label: string
  /** CSS 변수 참조 (게이지 아크, 뱃지 등) */
  color: string
  /** 뱃지 배경용 연한 색 */
  bg: string
  /** 게이지 아래 한 줄 설명 */
  caption: string
}

/**
 * openapi.json 에서 grade 는 enum 이 아닌 자유 string 이다.
 * 알 수 없는 값이 와도 화면이 깨지지 않게 회색 폴백으로 떨어지고,
 * 라벨은 서버가 준 원문을 그대로 보여준다.
 */
const GRADE_META: Record<string, GradeMeta> = {
  VERY_STABLE: {
    label: '매우 안정',
    color: 'var(--grade-very-stable)',
    bg: 'var(--positive-bg)',
    caption: '운영 흐름이 매우 안정적으로 유지되고 있습니다.',
  },
  STABLE: {
    label: '안정',
    color: 'var(--grade-stable)',
    bg: 'var(--info-bg)',
    caption: '운영 지표가 안정 구간에 있습니다.',
  },
  CAUTION: {
    label: '주의',
    color: 'var(--grade-caution)',
    bg: 'var(--warning-bg)',
    caption: '일부 지표에서 변동이 관찰됩니다.',
  },
  RISK: {
    label: '위험',
    color: 'var(--grade-risk)',
    bg: 'var(--danger-bg)',
    caption: '운영 지표가 위험 구간에 있습니다.',
  },
}

const UNKNOWN_GRADE: GradeMeta = {
  label: '측정 중',
  color: 'var(--grade-unknown)',
  bg: 'var(--neutral-bg)',
  caption: '점수를 산출할 데이터가 아직 충분하지 않습니다.',
}

export function gradeMeta(grade: Grade | null | undefined): GradeMeta {
  if (!grade) return UNKNOWN_GRADE
  const known = GRADE_META[grade]
  if (known) return known
  // 서버가 새 등급을 추가한 경우: 색은 중립, 라벨은 원문 유지.
  return { ...UNKNOWN_GRADE, label: grade }
}

/* ───────────────────────── riskLevel ───────────────────────── */

export interface RiskMeta {
  label: string
  tone: 'positive' | 'info' | 'warning' | 'danger' | 'neutral'
}

const RISK_META: Record<string, RiskMeta> = {
  LOW: { label: '위험도 낮음', tone: 'positive' },
  MEDIUM: { label: '위험도 보통', tone: 'warning' },
  HIGH: { label: '위험도 높음', tone: 'danger' },
}

export function riskMeta(risk: RiskLevel | null | undefined): RiskMeta | null {
  if (!risk) return null
  return RISK_META[risk] ?? { label: `위험도 ${risk}`, tone: 'neutral' }
}

/* ───────────────────────── 점수 ───────────────────────── */

export const SCORE_MIN = 0
export const SCORE_MAX = 100

/** 게이지가 범위를 벗어난 값에 깨지지 않도록 0~100 으로 자른다. */
export function clampScore(score: number | null | undefined): number {
  if (score === null || score === undefined || Number.isNaN(score)) return SCORE_MIN
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, score))
}

export function hasScore(score: number | null | undefined): score is number {
  return score !== null && score !== undefined && !Number.isNaN(score)
}
