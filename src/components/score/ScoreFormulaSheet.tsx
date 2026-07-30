import { InfoIcon } from '@/components/icons'
import { Sheet } from '@/components/ui/Sheet'
import styles from './ScoreFormulaSheet.module.css'

/**
 * 운영 안정성 점수의 배점표.
 *
 * 배점은 서버가 응답으로 알려주지 않는다 (리포트에 오는 것은 `summary` / `evidence` 문장뿐).
 * 그래서 산출 규칙을 여기 상수로 적어 둔다 — **백엔드 배점이 바뀌면 이 표도 같이 고칠 것.**
 */
const FACTORS = [
  { label: '방문 수요 안정성', weight: 25 },
  { label: '매출 추세', weight: 25 },
  { label: '방문 대비 매출 효율', weight: 20 },
  { label: '영업 지속성', weight: 15 },
  { label: '매출 변동성', weight: 15 },
] as const

const TOTAL = FACTORS.reduce((sum, factor) => sum + factor.weight, 0)
const MAX_WEIGHT = Math.max(...FACTORS.map((factor) => factor.weight))

/** 데이터가 없는 항목에 대입하는 중립점 (배점 대비 비율) */
const NEUTRAL_RATIO = 0.6

export function ScoreFormulaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} title="점수 산출 방식" onClose={onClose}>
      <p className={styles.intro}>
        운영 안정성 점수는 아래 5개 항목의 배점을 더해 {TOTAL}점으로 환산한 값입니다.
      </p>

      <ul className={styles.list}>
        {FACTORS.map((factor) => (
          <li key={factor.label} className={styles.row}>
            <span className={styles.label}>{factor.label}</span>
            <span className={styles.bar} aria-hidden="true">
              <span
                className={styles.fill}
                style={{ width: `${(factor.weight / MAX_WEIGHT) * 100}%` }}
              />
            </span>
            <span className={`${styles.weight} num`}>{factor.weight}점</span>
          </li>
        ))}
      </ul>

      <p className={styles.total}>
        <span>합계</span>
        <span className="num">{TOTAL}점</span>
      </p>

      <div className={styles.note}>
        <span className={styles.noteIcon}>
          <InfoIcon size={17} strokeWidth={1.9} />
        </span>
        <p className={styles.noteBody}>
          아직 데이터가 부족한 항목은 배점의 {NEUTRAL_RATIO * 100}% 를 중립점으로 대입해 계산합니다.
          영상과 매출 데이터가 쌓이면 실제 값으로 바뀌므로 점수도 함께 달라질 수 있습니다.
        </p>
      </div>
    </Sheet>
  )
}
