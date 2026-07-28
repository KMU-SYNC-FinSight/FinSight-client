import { useEffect, useRef } from 'react'
import type { ProcessingStatus } from '@/api/types'
import { AlertIcon, CheckIcon } from '@/components/icons'
import styles from './UploadStepper.module.css'

type StepState = 'pending' | 'active' | 'done' | 'failed' | 'stalled'

/** openapi.json 의 ProcessingStatus 진행 순서. FAILED 는 단계가 아니라 결과다. */
const STEPS = [
  { status: 'UPLOADED' as const, label: '업로드 접수', desc: '파일이 서버에 등록되었습니다.' },
  { status: 'PROCESSING' as const, label: '데이터 분석', desc: '영상·매출 데이터를 분석하고 있습니다.' },
  { status: 'COMPLETED' as const, label: '분석 완료', desc: '대시보드에서 결과를 확인할 수 있습니다.' },
]

const STEP_INDEX: Record<string, number> = { UPLOADED: 0, PROCESSING: 1, COMPLETED: 2 }

interface UploadStepperProps {
  status: ProcessingStatus | null
  isFailed: boolean
  isTimedOut: boolean
  errorMessage?: string | null
}

/**
 * UPLOADED → PROCESSING → COMPLETED 를 세로 단계로 보여준다.
 *
 * FAILED 응답은 어느 단계에서 실패했는지 알려주지 않는다.
 * 그래서 여기까지 도달했던 가장 마지막 단계를 기억해 그 자리에 실패를 표시한다.
 */
export function UploadStepper({ status, isFailed, isTimedOut, errorMessage }: UploadStepperProps) {
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
          desc = errorMessage || '처리 중 오류가 발생했습니다.'
          tone = 'danger'
        } else if (state === 'stalled') {
          desc = '처리가 지연되고 있습니다. 잠시 후 화면을 새로 열어 확인해 주세요.'
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
