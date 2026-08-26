import { PATHS } from '@/routes/paths'

/**
 * 카카오는 인가 코드 발급 시 쓴 redirect_uri 와 백엔드가 토큰 교환 시 보내는
 * redirect_uri 가 정확히 일치해야 한다. 이 값을 localhost 로 고정하면 배포(Vercel 등)
 * 환경에서 어긋나므로 항상 현재 origin 기준으로 계산한다 — 로컬/배포 모두
 * 백엔드의 KAKAO_REDIRECT_URI 환경변수를 그 환경의 프론트 주소로 맞춰 두면 된다.
 */
export function getKakaoRedirectUri(): string {
  return `${window.location.origin}${PATHS.kakaoCallback}`
}

/** 카카오 로그인 동의 화면으로 이동시킬 URL. */
export function getKakaoAuthorizeUrl(): string {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getKakaoRedirectUri(),
    response_type: 'code',
  })
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
}
