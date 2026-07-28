import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrefersReducedMotion } from '@/hooks/useAnimatedNumber'
import { isStandalone } from '@/hooks/useStatusBarColor'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import styles from './SplashPage.module.css'

/** 스플래시 전체 노출 시간 (페이드 아웃 포함). */
const SPLASH_MS = 2400

/** 마지막에 화면이 사라지는 시간. 이 구간에는 다음 화면(흰 배경)으로 자연스럽게 녹아든다. */
const FADE_OUT_MS = 520

/** 로고·문구가 온전히 보이는 구간. 하단 진행 바가 이 시간에 맞춰 찬다. */
const HOLD_MS = SPLASH_MS - FADE_OUT_MS

/**
 * 앱 진입("/") 화면.
 *
 * 브랜드를 잠깐 보여준 뒤 세션 유무에 따라 로그인 또는 매장 목록으로 넘긴다.
 * 앱을 처음 열 때만 지나가는 경로이므로 화면 이동 중에는 다시 나타나지 않는다.
 *
 * 페이드 아웃이 끝나는 시점에 이동하므로, 노란 화면이 흰 화면으로 녹아든 뒤
 * 같은 흰 배경의 로그인 화면이 이어져 끊김이 보이지 않는다.
 */
export function SplashPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const reducedMotion = usePrefersReducedMotion()
  // 세션은 첫 렌더 시점 값으로 고정한다. 타이머가 끝나기 전에 값이 바뀌어도
  // 목적지가 흔들리지 않게 한다.
  const [destination] = useState(() => (session ? PATHS.stores : PATHS.login))
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // 애니메이션을 원하지 않는 사용자는 기다리게 하지 않는다.
    if (reducedMotion) {
      navigate(destination, { replace: true })
      return
    }

    const fadeTimer = setTimeout(() => setExiting(true), HOLD_MS)
    const navTimer = setTimeout(() => navigate(destination, { replace: true }), SPLASH_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [navigate, destination, reducedMotion])

  /*
   * 상태바(= body 배경)를 콘텐츠와 같은 속도로 함께 녹인다.
   *
   * 그냥 두면 콘텐츠는 HOLD_MS 부터 FADE_OUT_MS 동안 서서히 사라지는데,
   * body 배경은 라우터가 이동하는 SPLASH_MS 에 한 번에 바뀐다.
   * 위(상태바)와 아래(화면)가 FADE_OUT_MS 만큼 어긋나 깨져 보인다.
   */
  useEffect(() => {
    // 브라우저에서는 body 를 건드리면 안 된다 — 프레임 바깥 회색이 사라진다.
    if (!exiting || !isStandalone()) return

    const { body } = document
    const previousTransition = body.style.transition
    const next = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()

    body.style.transition = `background-color ${FADE_OUT_MS}ms ease-in`
    body.style.backgroundColor = next

    return () => {
      body.style.transition = previousTransition
    }
  }, [exiting])

  return (
    <div
      className={styles.page}
      data-exiting={exiting}
      // 진행 바와 페이드 길이를 JS 상수 한 곳에서 관리한다.
      style={
        {
          '--splash-hold': `${HOLD_MS}ms`,
          '--splash-fade': `${FADE_OUT_MS}ms`,
        } as CSSProperties
      }
    >
      <div className={styles.stack}>
        <img className={styles.mark} src="/logo.png" alt="" width={112} height={112} />
        <p className={styles.wordmark}>FinSight</p>
        <p className={styles.tagline}>
          매장 운영 데이터로
          <br />
          오늘의 안정성을 봅니다
        </p>
      </div>
      <span className={styles.progress} aria-hidden="true">
        <span className={styles.progressFill} />
      </span>
      <span className="sr-only">FinSight 를 시작합니다</span>
    </div>
  )
}
