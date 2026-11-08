import { useEffect, useRef } from 'react'
import type { ProcessingStatus } from '@/api/types'
import { AlertIcon, CheckIcon } from '@/components/icons'
import styles from './UploadStepper.module.css'

type StepState = 'pending' | 'active' | 'done' | 'failed' | 'stalled'

/** openapi.json 의 ProcessingStatus 진행 순서. FAILED 는 단계가 아니라 결과다. */
const STEPS = [
  { status: 'UPLOADED' as const, label: '파일 접수', desc: '파일을 잘 받았어요' },
  { status: 'PROCESSING' as const, label: '데이터 분석', desc: '데이터를 분석하고 있어요' },
  { status: 'COMPLETED' as const, label: '분석 완료', desc: '대시보드에서 결과를 확인해 보세요' },
]

const STEP_INDEX: Record<string, number> = { UPLOADED: 0, PROCESSING: 1, COMPLETED: 2 }

interface UploadStepperProps {
  status: ProcessingStatus | null
  isFailed: boolean
  isTimedOut: boolean
  errorMessage?: string | null
  /** 5분 상한을 넘겼을 때 안내. 업로드 종류마다 할 수 있는 일이 달라 밖에서 받는다. */
  stalledMessage?: string
}

/**
 * UPLOADED → PROCESSING → COMPLETED 를 세로 단계로 보여준다.
 *
 * FAILED 응답은 어느 단계에서 실패했는지 알려주지 않는다.
 * 그래서 여기까지 도달했던 가장 마지막 단계를 기억해 그 자리에 실패를 표시한다.
 */
export function UploadStepper({
  status,
  isFailed,
  isTimedOut,
  errorMessage,
  stalledMessage = '분석이 늦어지고 있어요. 잠시 후 이 화면을 다시 열어 확인해 주세요.',
}: UploadStepperProps) {
  const furthestRef = useRef(0)

  const currentIndex = status && status in STEP_INDEX ? STEP_INDEX[status] : -1

  useEffect(() => {
    if (currentIndex > furthestRef.current) {
      furthestRef.current = currentIndex
    }
  }, [currentIndex])

  const failedAt = Math.max(furthestRef.current, 0)

  const stateOf = (index: number): StepState => {
    if (isFailed) {
      if (index < failedAt) return 'done'
      if (index === failedAt) return 'failed'
      return 'pending'
    }
    if (currentIndex < 0) return 'pending'
    if (index < currentIndex) return 'done'
    if (index === currentIndex) {
      if (status === 'COMPLETED') return 'done'
      return isTimedOut ? 'stalled' : 'active'
    }
    return 'pending'
  }

  return (
    <ol className={styles.stepper}>
      {STEPS.map((step, index) => {
        const state = stateOf(index)
        const isLast = index === STEPS.length - 1

        let desc: string = step.desc
        let tone: 'default' | 'danger' | 'warning' = 'default'

        if (state === 'failed') {
          desc = errorMessage || '분석하지 못했어요. 파일을 확인하고 다시 올려 주세요.'
          tone = 'danger'
        } else if (state === 'stalled') {
          desc = stalledMessage
          tone = 'warning'
        } else if (state === 'pending') {
          desc = ''
        }

        return (
          <li key={step.status} className={styles.step}>
            <span className={styles.marker}>
              <span className={styles.dot} data-state={state}>
                {state === 'done' && <CheckIcon size={13} strokeWidth={2.8} />}
                {state === 'active' && <span className={styles.pulse} aria-hidden="true" />}
                {state === 'failed' && <AlertIcon size={13} strokeWidth={2.6} />}
                {state === 'stalled' && <AlertIcon size={13} strokeWidth={2.6} />}
              </span>
              {!isLast && (
                <span
                  className={styles.connector}
                  data-state={state === 'done' ? 'done' : 'pending'}
                />
              )}
            </span>
            <span className={styles.body}>
              <span className={styles.label} data-state={state}>
                {step.label}
              </span>
              {desc && (
                <span className={styles.desc} data-tone={tone}>
                  {desc}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
