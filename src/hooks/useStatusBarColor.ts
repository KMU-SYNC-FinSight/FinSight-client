import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 홈 화면 실행(standalone)에서 상태바 색을 현재 화면 상단 색과 맞춘다.
 *
 * `theme-color` 는 정적 meta 로 한 번만 정하면, 화면마다 상단 색이 다를 때
 * 어긋난 띠가 생긴다. 예를 들어 스플래시는 노란 화면인데 상태바만 흰색으로 남는다.
 * 라우트가 바뀔 때마다 meta 를 갈아 끼워 그 틈을 없앤다.
 *
 * ── 왜 상태바 아래로 콘텐츠를 밀어 넣지(black-translucent) 않았나 ──
 * iOS 에서 `black-translucent` 를 쓰면 콘텐츠가 상태바 영역까지 올라가지만
 * **상태바 글자가 흰색으로 고정**된다. 이 앱은 상단이 흰색이라 시계·배터리가 안 보인다.
 * (노란 스플래시 위에서도 흰 글씨는 1.70:1 로 거의 안 읽힌다.)
 * 색을 맞추는 것만으로 틈이 사라지므로 가독성을 버릴 이유가 없다.
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
