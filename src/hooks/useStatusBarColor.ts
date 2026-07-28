import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 홈 화면 실행(standalone)에서 상태바 색을 현재 화면 상단 색과 맞춘다.
 *
 * **안드로이드 전용 효과다.** iOS standalone 은 `theme-color` 를 보지 않고
 * `apple-mobile-web-app-status-bar-style` 만 따른다 (index.html 참고).
 * iOS 는 black-translucent 로 콘텐츠 자체를 상태바 아래까지 올려서 해결한다.
 *
 * 안드로이드는 `theme-color` 로 상태바를 칠하는데, meta 를 하나로 고정하면
 * 화면마다 상단 색이 달라 띠가 생긴다 (스플래시는 노란 화면인데 상태바만 흰색).
 * 라우트가 바뀔 때마다 갈아 끼워 그 틈을 없앤다.
 *
 * 값은 tokens.css 에서 읽는다. CSS 와 색이 따로 놀지 않게 하기 위해서다.
 */
export function useStatusBarColor() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return

    const root = getComputedStyle(document.documentElement)
    // 스플래시(/)만 브랜드색 전면이고, 나머지 화면은 상단이 흰색이다.
    const token = pathname === '/' ? '--brand' : '--bg'
    const color = root.getPropertyValue(token).trim()
    if (color) meta.setAttribute('content', color)
  }, [pathname])
}
