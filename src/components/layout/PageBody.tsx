import type { ReactNode } from 'react'
import styles from './PageBody.module.css'

interface PageBodyProps {
  children: ReactNode
  /** 좌우 기본 여백 적용 (섹션을 직접 쓰는 화면은 false) */
  gutter?: boolean
  /** 하단 고정 CTA 가 있는 화면 */
  hasFooter?: boolean
  /**
   * 위 여백을 없앤다.
   * 자체 헤더(매장 목록의 옐로우 영역처럼)를 가진 화면에서만 쓴다.
   */
  flush?: boolean
}

export function PageBody({
  children,
  gutter = false,
  hasFooter = false,
  flush = false,
}: PageBodyProps) {
  return (
    <div className={styles.body} data-gutter={gutter} data-cta={hasFooter} data-flush={flush}>
      {children}
    </div>
  )
}

/** 화면 하단에 붙는 액션 영역. */
export function PageFooter({
  children,
  withTabBar = false,
}: {
  children: ReactNode
  withTabBar?: boolean
}) {
  return (
    <div className={styles.footer} data-with-tabbar={withTabBar}>
      {children}
    </div>
  )
}

/** 큰 굵은 한글 헤드라인 + 회색 서브텍스트. */
export function Headline({ title, description }: { title: string; description?: string }) {
  return (
    <div className={styles.headline}>
      <h2 className={styles.headlineTitle}>{title}</h2>
      {description && <p className={styles.headlineDesc}>{description}</p>}
    </div>
  )
}
