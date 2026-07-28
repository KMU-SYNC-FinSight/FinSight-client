import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { CarouselSlide } from '@/lib/slides'
import styles from './ScoreCarousel.module.css'

/**
 * 리포트의 summary + evidence[] 를 한 장씩 넘겨보는 슬라이드.
 *
 * 라이브러리를 쓰지 않고 CSS scroll-snap 으로 구현했다.
 * 터치 스와이프가 브라우저 네이티브라 관성·바운스가 자연스럽고 번들도 늘지 않는다.
 * 도트 동기화는 IntersectionObserver 로 실제 보이는 카드를 관찰한다.
 */
export function ScoreCarousel({ slides }: { slides: CarouselSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'))
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number((entry.target as HTMLElement).dataset.slide)
          if (!Number.isNaN(index)) setActive(index)
        }
      },
      // 좌우 peek 때문에 두 장이 동시에 걸치므로, 60% 이상 보일 때만 활성으로 본다.
      { root: track, threshold: 0.6 },
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [slides.length])

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(`[data-slide="${index}"]`)
    if (!card) return
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollTo(Math.min(slides.length - 1, active + 1))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollTo(Math.max(0, active - 1))
    }
  }

  if (slides.length === 0) return null

  return (
    <div className={styles.wrap}>
      <div
        ref={trackRef}
        className={`${styles.track} no-scrollbar`}
        // 키보드로도 넘길 수 있게 스크롤 영역에 포커스를 준다.
        tabIndex={0}
        role="group"
        aria-label="점수 설명 슬라이드"
        onKeyDown={handleKeyDown}
      >
        {slides.map((slide, index) => (
          <article
            key={`${slide.kind}-${index}`}
            className={styles.card}
            data-slide={index}
            data-kind={slide.kind}
            aria-roledescription="슬라이드"
            aria-label={`${index + 1} / ${slides.length} ${slide.label}`}
          >
            <p className={styles.cardLabel}>
              <span className={styles.cardIndex}>
                {slide.kind === 'summary' ? '!' : slide.index}
              </span>
              {slide.label}
            </p>
            <p className={styles.cardText}>{slide.text}</p>
          </article>
        ))}
      </div>

      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((slide, index) => (
            <button
              key={`dot-${slide.kind}-${index}`}
              type="button"
              className={styles.dotButton}
              onClick={() => scrollTo(index)}
              aria-label={`${index + 1}번째 슬라이드로 이동`}
            >
              <span className={styles.dot} aria-current={index === active} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
