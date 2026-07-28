import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** iOS 홈 화면 실행 여부. Safari 만 가지는 비표준 플래그라 타입에 없다. */
function isIosStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/**
 * 홈 화면에서 실행 중인지.
 *
 * body 배경을 직접 건드리는 코드는 반드시 이걸로 감싸야 한다.
 * 브라우저에서는 480px 이상일 때 body 가 프레임 바깥 회색(--bg-outside)이어야 하는데,
 * 인라인 스타일로 덮으면 스타일시트를 이겨서 그 회색이 사라진다.
 */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || isIosStandalone()
}

/**
 * 홈 화면 실행 시 상태바 영역 색을 현재 화면 상단 색과 맞춘다.
 *
 * ── 두 OS 가 서로 다른 것을 본다 ──
 *
 * 안드로이드: `theme-color` meta 를 읽어 시스템이 상태바를 칠한다.
 *   런타임에 meta 를 바꾸면 즉시 반영된다.
 *
 * iOS: `theme-color` 를 **무시**한다. `apple-mobile-web-app-status-bar-style` 만 보고,
 *   그 값은 앱 실행 시점에 한 번 읽히므로 런타임에 못 바꾼다.
 *   대신 `black-translucent` 를 쓰면 상태바가 투명해지고
 *   **`body` 의 배경색**이 그 자리에 비친다. 그래서 body 배경을 함께 갈아 끼운다.
 *   (문서: "will take the same background color as the body of your web app")
 *
 * body 배경을 건드리는 것은 홈 화면 실행일 때만이다.
 * 브라우저에서는 프레임 바깥(데스크톱 회색 여백)이 이 색으로 물들면 안 된다.
 */
export function useStatusBarColor() {
  const { pathname } = useLocation()

  useEffect(() => {
    const root = getComputedStyle(document.documentElement)
    // 스플래시(/)만 브랜드색 전면이고, 나머지 화면은 상단이 흰색이다.
    const token = pathname === '/' ? '--brand' : '--bg'
    const color = root.getPropertyValue(token).trim()
    if (!color) return

    // 안드로이드
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', color)

    // iOS (black-translucent 가 body 배경을 비춘다)
    if (isStandalone()) {
      document.body.style.backgroundColor = color
    }
  }, [pathname])
}
