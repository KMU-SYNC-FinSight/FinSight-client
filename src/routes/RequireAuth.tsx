import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PATHS } from './paths'

/**
 * 토큰이 없으면 로그인 화면으로 보낸다.
 *
 * axios 인터셉터가 401 을 받으면 세션을 비우므로, 세션 만료도 이 경로로 흘러온다.
 * 원래 가려던 곳을 state.from 에 담아 로그인 후 되돌려 준다.
 */
export function RequireAuth() {
  const session = useAuthStore((s) => s.session)
  const location = useLocation()

  if (!session) {
    return <Navigate to={PATHS.login} state={{ from: location.pathname + location.search }} replace />
  }

  return <Outlet />
}

/** 이미 로그인한 사용자가 로그인/회원가입 화면으로 오면 앱 안으로 되돌린다. */
export function RedirectIfAuthed() {
  const session = useAuthStore((s) => s.session)

  if (session) {
    return <Navigate to={PATHS.stores} replace />
  }

  return <Outlet />
}
