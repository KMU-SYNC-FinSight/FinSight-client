import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './ScreenTransition.module.css'

/**
 * 화면이 바뀔 때 본문만 부드럽게 올라오게 한다.
 *
 * pathname 을 key 로 줘서 경로가 바뀌면 새 요소로 마운트되고 진입 애니메이션이 다시 돈다.
 * 하단 탭바는 이 래퍼 바깥에 있어 전환 중에도 고정된 채로 남는다.
 */
export function ScreenTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className={styles.screen}>
      {children}
    </div>
  )
}
