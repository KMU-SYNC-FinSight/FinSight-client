import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertIcon, CheckIcon } from '@/components/icons'
import styles from './Toast.module.css'

type ToastTone = 'default' | 'danger'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DURATION = 2600

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  // 언마운트 후 setState 를 막기 위해 타이머를 모아둔다.
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = nextId.current++
      setItems((prev) => [...prev, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION),
      )
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({ show, error: (message: string) => show(message, 'danger') }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={styles.toast} data-tone={item.tone}>
            <span className={styles.icon}>
              {item.tone === 'danger' ? (
                <AlertIcon size={17} strokeWidth={2} />
              ) : (
                <CheckIcon size={17} strokeWidth={2.2} />
              )}
            </span>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast 는 ToastProvider 안에서만 쓸 수 있습니다.')
  }
  return context
}
