import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '@/components/icons'
import styles from './Sheet.module.css'

interface SheetProps {
  open: boolean
  /** 시트 제목. 다이얼로그 라벨로도 쓰인다. */
  title: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 아래에서 올라오는 시트.
 *
 * 포털로 body 에 붙인다 — ScreenTransition 이 화면에 transform 을 걸기 때문에
 * 화면 안에 두면 position: fixed 의 기준이 뷰포트가 아니라 그 요소가 된다.
 *
 * 닫을 때는 애니메이션 없이 바로 사라진다. 퇴장까지 그리려면 닫힌 뒤에도
 * 한동안 마운트를 유지해야 하는데, ScreenTransition 과 같은 이유로 그만한 값어치가 없다.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Escape 는 포커스가 시트 밖으로 빠져나간 뒤에도 들어야 하므로 window 에 붙인다.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // 시트 뒤 화면이 같이 스크롤되면 시트가 떠 있는 층으로 읽히지 않는다.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // 열면 시트로 포커스를 옮기고, 닫으면 열었던 버튼으로 되돌린다.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => {
      if (opener?.isConnected) opener.focus()
    }
  }, [open])

  if (!open) return null

  /** Tab 이 시트 밖(뒤 화면)으로 나가지 않게 가둔다. */
  const trapTab = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return

    const targets = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (targets.length === 0) return

    const first = targets[0]
    const last = targets[targets.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapTab}
      >
        <div className={styles.grabber} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <CloseIcon size={20} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
