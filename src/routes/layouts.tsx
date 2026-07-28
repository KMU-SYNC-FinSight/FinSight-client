import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppFrame } from '@/components/layout/AppFrame'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { ScreenTransition } from '@/components/layout/ScreenTransition'

/** 화면을 이동하면 스크롤을 맨 위로 되돌린다 (SPA 기본 동작이 아니다). */
function useScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
}

/** 모든 화면을 감싸는 앱 프레임. */
export function RootLayout() {
  useScrollReset()
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  )
}

/**
 * 하단 탭바가 함께 보이는 화면들.
 * 전환 래퍼가 탭바 바깥에 있어야 탭을 옮길 때 탭바가 같이 깜빡이지 않는다.
 */
export function TabLayout() {
  return (
    <>
      <ScreenTransition>
        <Outlet />
      </ScreenTransition>
      <BottomTabBar />
    </>
  )
}

/** 탭바 없이 위로 쌓이는 화면들 (등록·상세·리포트·인증). */
export function StackLayout() {
  return (
    <ScreenTransition>
      <Outlet />
    </ScreenTransition>
  )
}
