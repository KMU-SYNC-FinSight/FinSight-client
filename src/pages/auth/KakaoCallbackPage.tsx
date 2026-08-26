import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { kakaoLogin } from '@/api/auth'
import { toApiError } from '@/api/client'
import { LoadingState } from '@/components/ui/States'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'

/**
 * 카카오 인가 서버가 `?code=...` 를 달아 돌려보내는 경로.
 * 사용자가 볼 새 없이 지나가는 화면이라 로딩 표시만 두고,
 * 성공하면 매장 목록으로, 실패하면 사유를 담아 로그인 화면으로 돌려보낸다.
 */
export function KakaoCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSession = useAuthStore((s) => s.login)
  const requestedRef = useRef(false)

  const mutation = useMutation({
    mutationFn: kakaoLogin,
    onSuccess: (res) => {
      setSession(res)
      navigate(PATHS.stores, { replace: true })
    },
    onError: (error) => {
      navigate(PATHS.login, { replace: true, state: { authError: toApiError(error).message } })
    },
  })

  useEffect(() => {
    // StrictMode 이중 마운트·리렌더로 code 를 두 번 보내면 카카오가 두 번째 요청을 거부한다.
    if (requestedRef.current) return
    requestedRef.current = true

    const code = searchParams.get('code')
    if (!code) {
      // 사용자가 카카오 동의 화면에서 취소했을 때도 여기로 온다 (error=access_denied 등).
      navigate(PATHS.login, {
        replace: true,
        state: { authError: '카카오 로그인이 취소되었습니다.' },
      })
      return
    }

    mutation.mutate({ code })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <LoadingState label="카카오 계정으로 로그인하는 중" />
}
