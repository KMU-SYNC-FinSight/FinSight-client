import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useAnimatedNumber'
import styles from './Reveal.module.css'

interface RevealProps {
  children: ReactNode
  /** 여러 개를 순서대로 등장시킬 때 (ms) */
  delay?: number
}

/**
 * 스크롤해서 화면에 들어오면 살짝 떠오르며 나타난다.
 *
 * 한 번 나타나면 observer 를 끊는다. 나갈 때 다시 숨기면
 * 읽는 도중 가장자리에서 글이 흐려져 오히려 방해가 된다.
 */
export function Reveal({ children, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      // 화면 아래 15% 안으로 들어왔을 때 시작해야 다 올라온 뒤에 보인다.
      { threshold: 0.1, rootMargin: '0px 0px -12% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <div
      ref={ref}
      className={styles.reveal}
      data-visible={visible}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
