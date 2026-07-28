import { useEffect, useRef, useState } from 'react'

/** 접근성 설정으로 애니메이션을 줄이도록 요청한 사용자인지. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * 목표값까지 부드럽게 올라가는 숫자.
 *
 * 게이지의 바늘·아크·숫자가 모두 이 값을 함께 쓰기 때문에
 * CSS transition 을 각각 걸었을 때 생기는 미세한 타이밍 차이가 없다.
 * prefers-reduced-motion 이면 애니메이션 없이 목표값을 바로 돌려준다.
 */
export function useAnimatedNumber(target: number, duration = 900): number {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(reduced ? target : 0)
  // 값이 도중에 바뀌면 지금 보이는 값에서 이어서 움직인다.
  const currentRef = useRef(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      currentRef.current = target
      setValue(target)
      return
    }

    const from = currentRef.current
    const delta = target - from
    if (Math.abs(delta) < 0.01) return

    const startedAt = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const next = from + delta * easeOutQuart(progress)
      currentRef.current = next
      setValue(next)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduced])

  return value
}
