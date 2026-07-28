import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRightIcon, CloseIcon, PauseIcon, PlayIcon } from '@/components/icons'
import { usePrefersReducedMotion } from '@/hooks/useAnimatedNumber'
import styles from './PromoCarousel.module.css'

export interface PromoSlide {
  title: string
  desc: ReactNode
  cta: string
  icon: ReactNode
  onClick: () => void
}

/** 자동으로 넘어가는 주기. 짧으면 다 읽기 전에 넘어간다. */
const ROTATE_MS = 5000

/** 사용자가 직접 넘긴 뒤 자동 넘김을 다시 시작하기까지. */
const RESUME_AFTER_MS = 9000

/**
 * 상단 안내 카러셀.
 *
 * 자동으로 넘어가되 사용자를 방해하지 않는다.
 *  - 스와이프하거나 도트를 누른 직후엔 잠시 멈췄다가 다시 시작
 *  - 일시정지 버튼을 누르면 계속 정지
 *  - prefers-reduced-motion 이면 아예 자동으로 넘기지 않는다
 *  - 백그라운드 탭에서는 건너뛴다
 *
 * 자동으로 움직이는 콘텐츠에는 멈출 수단이 있어야 한다 (WCAG 2.2.2).
 */
export function PromoCarousel({
  slides,
  onClose,
}: {
  slides: PromoSlide[]
  onClose: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const reducedMotion = usePrefersReducedMotion()

  const activeRef = useRef(0)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  const holdUntilRef = useRef(0)
  const count = slides.length

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActive(Math.round(track.scrollLeft / track.clientWidth))
  }, [])

  useEffect(() => {
    if (count < 2 || !autoPlay || reducedMotion) return

    const timer = setInterval(() => {
      // 백그라운드에서 스크롤을 옮기면 돌아왔을 때 위치가 튄다.
      if (document.hidden) return
      if (Date.now() < holdUntilRef.current) return
      scrollTo((activeRef.current + 1) % count)
    }, ROTATE_MS)

    return () => clearInterval(timer)
  }, [count, autoPlay, reducedMotion, scrollTo])

  const hold = () => {
    holdUntilRef.current = Date.now() + RESUME_AFTER_MS
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={trackRef}
        className={`${styles.track} no-scrollbar`}
        onScroll={handleScroll}
        onPointerDown={hold}
      >
        {slides.map((slide) => (
          <button key={slide.title} type="button" className={styles.slide} onClick={slide.onClick}>
            <span className={styles.slideBody}>
              <span className={styles.title}>{slide.title}</span>
              <span className={styles.desc}>{slide.desc}</span>
              <span className={styles.cta}>
                {slide.cta}
                <ChevronRightIcon size={14} strokeWidth={2.6} />
              </span>
            </span>
            <span className={styles.art} aria-hidden="true">
              {slide.icon}
            </span>
          </button>
        ))}
      </div>

      {count > 1 && (
        <div className={styles.controls}>
          <div className={styles.dots}>
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                className={styles.dotButton}
                onClick={() => {
                  hold()
                  scrollTo(index)
                }}
                aria-label={`${index + 1}번째 안내 보기`}
              >
                <span className={styles.dot} data-current={index === active} />
              </button>
            ))}
          </div>

          {!reducedMotion && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setAutoPlay((v) => !v)}
              aria-label={autoPlay ? '자동 넘김 멈추기' : '자동 넘김 시작'}
              aria-pressed={!autoPlay}
            >
              {autoPlay ? (
                <PauseIcon size={14} strokeWidth={2.6} />
              ) : (
                <PlayIcon size={14} strokeWidth={2.6} />
              )}
            </button>
          )}
        </div>
      )}

      <button type="button" className={styles.close} onClick={onClose} aria-label="안내 닫기">
        <CloseIcon size={18} strokeWidth={2} />
      </button>
    </div>
  )
}
