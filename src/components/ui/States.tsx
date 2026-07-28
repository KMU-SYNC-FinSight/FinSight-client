import type { ReactNode } from 'react'
import { AlertIcon } from '@/components/icons'
import { Button } from './Button'
import styles from './States.module.css'

/** 화면 전체를 채우는 로딩 표시. */
export function LoadingState({ label = '불러오는 중' }: { label?: string }) {
  return (
    <div className={styles.center} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.desc}>{label}</span>
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.center}>
      {icon && <span className={styles.iconWrap}>{icon}</span>}
      <div>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = '불러오지 못했습니다', message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.center} role="alert">
      <span className={styles.iconWrap} data-tone="danger">
        <AlertIcon size={26} strokeWidth={1.9} />
      </span>
      <div>
        <p className={styles.title}>{title}</p>
        <p className={styles.desc}>{message}</p>
      </div>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="secondary" size="md" inline onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  )
}
