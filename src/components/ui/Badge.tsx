import type { CSSProperties, ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'brand' | 'positive' | 'info' | 'warning' | 'danger'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  size?: 'md' | 'lg'
  /** 등급색처럼 토큰 밖의 색을 직접 줄 때 */
  style?: CSSProperties
}

export function Badge({ children, tone = 'neutral', size = 'md', style }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone} data-size={size} style={style}>
      {children}
    </span>
  )
}
