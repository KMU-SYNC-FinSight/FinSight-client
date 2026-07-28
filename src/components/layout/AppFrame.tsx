import type { ReactNode } from 'react'
import styles from './AppFrame.module.css'

/**
 * 모든 화면을 감싸는 세로형 앱 컨테이너.
 * 데스크톱에서는 가운데 448px 로 고정되고 바깥은 회색 배경이 된다.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
