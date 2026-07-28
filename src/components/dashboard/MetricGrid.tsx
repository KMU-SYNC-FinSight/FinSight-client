import type { ReactNode } from 'react'
import styles from './MetricGrid.module.css'

export interface Metric {
  label: string
  /** 이미 포맷된 문자열. "—" 이면 값이 없는 것으로 취급한다. */
  value: string
  note?: string
  /** 한 줄을 다 쓰는 칸 */
  full?: boolean
  /** 값 대신 뱃지 등을 넣을 때 */
  render?: ReactNode
}

interface MetricCardProps {
  title: string
  icon?: ReactNode
  action?: ReactNode
  metrics: Metric[]
  /** 지표가 전부 비어 있을 때 대신 보여줄 안내 */
  emptyNotice?: string
}

export function MetricCard({ title, icon, action, metrics, emptyNotice }: MetricCardProps) {
  const allEmpty = metrics.every((m) => m.value === '—' && !m.render)

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.title}>
          {icon && <span className={styles.titleIcon}>{icon}</span>}
          {title}
        </h3>
        {action}
      </div>

      {allEmpty && emptyNotice ? (
        <p className={styles.emptyNotice}>{emptyNotice}</p>
      ) : (
        <div className={styles.grid}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={styles.cell}
              data-span={metric.full ? 'full' : undefined}
            >
              <span className={styles.cellLabel}>{metric.label}</span>
              {metric.render ?? (
                <span className={styles.cellValue} data-empty={metric.value === '—'}>
                  {metric.value}
                </span>
              )}
              {metric.note && <span className={styles.cellNote}>{metric.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
