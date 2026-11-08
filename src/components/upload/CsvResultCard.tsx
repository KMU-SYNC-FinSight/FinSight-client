import type { SalesUploadResponse } from '@/api/types'
import { formatNumber } from '@/lib/format'
import styles from './UploadPanel.module.css'

/**
 * 매출 CSV 파싱 결과.
 *
 * SalesUploadResponse 는 영상 업로드와 달리 processingStatus 없이
 * 행 단위 처리 결과를 즉시 돌려준다. 그래서 폴링과 별개로 이 요약을 먼저 보여준다.
 */
export function CsvResultCard({ result }: { result: SalesUploadResponse }) {
  const cells = [
    { label: '전체', value: result.totalRows, tone: 'default' as const },
    { label: '새로 추가', value: result.insertedRows, tone: 'default' as const },
    { label: '업데이트', value: result.updatedRows, tone: 'default' as const },
    {
      label: '제외',
      value: result.skippedRows,
      // 건너뛴 행이 있으면 눈에 걸리게 한다. 0 이면 회색으로 죽인다.
      tone: result.skippedRows > 0 ? ('warning' as const) : ('muted' as const),
    },
  ]

  return (
    <div className={styles.csvGrid}>
      {cells.map((cell) => (
        <div key={cell.label} className={styles.csvCell}>
          <span className={styles.csvCellLabel}>{cell.label}</span>
          <span className={`${styles.csvCellValue} num`} data-tone={cell.tone}>
            {formatNumber(cell.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
