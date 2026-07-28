import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@/components/icons'
import styles from './Surface.module.css'

/*
 * 화면 구획 컴포넌트.
 *
 * 예전에 Card / Section 도 있었는데 각 화면이 자기 CSS 모듈로 구획을 짜면서
 * 한 번도 쓰이지 않았다. 죽은 코드라 걷어냈다. 필요해지면 그때 다시 만든다.
 */

interface ListRowProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** 우측에 표시할 값 (chevron 대신) */
  value?: ReactNode
  /** 링크 행 */
  to?: string
  onClick?: () => void
  /** 좌우 여백을 행 안쪽에 넣을지 (카드 안에서 쓸 때) */
  inset?: boolean
}

export function ListRow({
  title,
  description,
  icon,
  value,
  to,
  onClick,
  inset = false,
}: ListRowProps) {
  const content = (
    <>
      {icon && <span className={styles.rowIcon}>{icon}</span>}
      <span className={styles.rowBody}>
        <span className={styles.rowTitle}>{title}</span>
        {description && <span className={styles.rowDesc}>{description}</span>}
      </span>
      {value !== undefined ? (
        <span className={styles.rowValue}>{value}</span>
      ) : (
        (to || onClick) && (
          <span className={styles.rowChevron}>
            <ChevronRightIcon size={18} strokeWidth={1.9} />
          </span>
        )
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={styles.row} data-inset={inset}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" className={styles.row} data-inset={inset} onClick={onClick}>
        {content}
      </button>
    )
  }

  return (
    <div className={styles.row} data-inset={inset}>
      {content}
    </div>
  )
}
