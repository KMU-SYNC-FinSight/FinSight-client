import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '@/components/icons'
import styles from './TopBar.module.css'

interface TopBarProps {
  title?: ReactNode
  /** 뒤로가기 버튼 표시 */
  back?: boolean
  /** 뒤로가기 대상. 생략하면 브라우저 히스토리 back. */
  backTo?: string
  /** 옐로우 헤더 화면에서 배경을 브랜드색으로 */
  tone?: 'default' | 'brand'
  bordered?: boolean
  actions?: ReactNode
}

export function TopBar({
  title,
  back = false,
  backTo,
  tone = 'default',
  bordered = false,
  actions,
}: TopBarProps) {
  const navigate = useNavigate()

  const goBack = () => {
    if (backTo) {
      navigate(backTo)
      return
    }
    // 새 탭에서 딥링크로 들어온 경우 history 가 없어 back 이 앱을 벗어난다.
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/stores')
    }
  }

  return (
    <header className={styles.bar} data-tone={tone} data-bordered={bordered}>
      {back && (
        <button type="button" className={styles.iconButton} onClick={goBack} aria-label="뒤로 가기">
          <ChevronLeftIcon size={22} strokeWidth={2} />
        </button>
      )}
      <h1 className={styles.title} data-inset={!back}>
        {title}
      </h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
