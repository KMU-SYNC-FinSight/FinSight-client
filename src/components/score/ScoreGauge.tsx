import type { Grade, RiskLevel } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { clampScore, gradeMeta, hasScore, riskMeta, SCORE_MAX } from '@/lib/grade'
import styles from './ScoreGauge.module.css'

/* ── 계기판 형상 ──────────────────────────────────────────
 * 220° 스윕(위쪽 기준 -110° ~ +110°)의 반원 계기판.
 * 각도 θ 는 위쪽(12시)을 0 으로 두고 시계방향이 양수다.
 *   x = cx + r·sin θ
 *   y = cy - r·cos θ
 *
 * 바늘은 두지 않는다. 중심에서 뻗는 선이 가운데 점수 숫자를 관통해
 * 화살표처럼 보였다. 채워지는 아크만으로 값을 표현한다.
 */
const VIEW_W = 240
const VIEW_H = 158
const CX = 120
const CY = 112
const R = 92
const STROKE = 18
const SWEEP_DEG = 220
const START_DEG = -SWEEP_DEG / 2

/** 아크 전체 길이. dasharray/dashoffset 으로 채움 정도를 만든다. */
const ARC_LENGTH = R * ((SWEEP_DEG * Math.PI) / 180)

function polar(radius: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  }
}

const arcStart = polar(R, START_DEG)
const arcEnd = polar(R, START_DEG + SWEEP_DEG)

// large-arc-flag=1 (220° > 180°), sweep-flag=1 (시계방향)
const TRACK_PATH = `M ${arcStart.x.toFixed(2)} ${arcStart.y.toFixed(2)} A ${R} ${R} 0 1 1 ${arcEnd.x.toFixed(2)} ${arcEnd.y.toFixed(2)}`

/** 0 / 100 눈금 라벨 반경. 밴드 외곽(R + STROKE/2 = 101)보다 살짝 바깥. */
const LABEL_R = 112

interface ScoreGaugeProps {
  /** 0~100. null/undefined 면 "데이터 없음" 상태로 그린다. */
  score: number | null | undefined
  grade: Grade | null | undefined
  riskLevel?: RiskLevel | null
  /** 게이지 위 작은 캡션 */
  caption?: string
  /** 등급 라벨·설명을 게이지 아래에 함께 보여줄지 */
  showGrade?: boolean
  /** 리포트 화면용 축소 배치 */
  compact?: boolean
}

export function ScoreGauge({
  score,
  grade,
  riskLevel,
  caption = '운영 안정성 점수',
  showGrade = true,
  compact = false,
}: ScoreGaugeProps) {
  const meta = gradeMeta(grade)
  const risk = riskMeta(riskLevel)
  const scored = hasScore(score)
  const target = clampScore(score)

  // 아크와 숫자가 같은 값을 공유해 정확히 함께 움직인다.
  const animated = useAnimatedNumber(scored ? target : 0)
  const ratio = animated / SCORE_MAX

  return (
    <div>
      <div className={styles.gauge} data-compact={compact}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={
            scored
              ? `운영 안정성 점수 ${target.toFixed(1)}점, 등급 ${meta.label}`
              : '운영 안정성 점수를 계산할 데이터가 부족합니다'
          }
        >
          {/* 배경 트랙 */}
          <path
            className={styles.track}
            d={TRACK_PATH}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* 채워지는 아크 — 브랜드색으로 통일. 등급은 아래 pill 이 구분한다. */}
          {scored && (
            <path
              className={styles.progress}
              d={TRACK_PATH}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={ARC_LENGTH}
              strokeDashoffset={ARC_LENGTH * (1 - ratio)}
            />
          )}

          {/* 양 끝 눈금 라벨 */}
          <text
            className={styles.endLabel}
            x={polar(LABEL_R, START_DEG).x}
            y={polar(LABEL_R, START_DEG).y}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            0
          </text>
          <text
            className={styles.endLabel}
            x={polar(LABEL_R, START_DEG + SWEEP_DEG).x}
            y={polar(LABEL_R, START_DEG + SWEEP_DEG).y}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            100
          </text>
        </svg>

        <div className={styles.center}>
          <span className={styles.caption}>{caption}</span>
          <span className={styles.scoreLine}>
            <span className={styles.score} data-empty={!scored}>
              {scored ? animated.toFixed(1) : '—'}
            </span>
            {scored && <span className={styles.unit}>점</span>}
          </span>
          {/*
            등급 pill 을 게이지 안, 점수 바로 아래에 둔다.
            아크를 브랜드색으로 통일하면서 "가장 큰 시각 요소가 아무 정보도 안 나르는" 문제가
            생겼는데, 등급을 점수와 같은 시선 안에 넣어 한 번에 읽히게 만든다.
          */}
          {showGrade && (
            <span
              className={styles.gradePill}
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          )}
        </div>
      </div>

      {showGrade && (
        <div className={styles.footer}>
          {risk && <Badge tone={risk.tone}>{risk.label}</Badge>}
          <p className={styles.gradeCaption}>{meta.caption}</p>
        </div>
      )}
    </div>
  )
}
