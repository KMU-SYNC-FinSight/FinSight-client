import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '@/api/auth'
import { toApiError } from '@/api/client'
import { Wordmark } from '@/components/brand/Wordmark'
import { AlertIcon } from '@/components/icons'
import { Headline, PageBody } from '@/components/layout/PageBody'
import { Button } from '@/components/ui/Button'
import { TextField, usePasswordToggle } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import { getKakaoAuthorizeUrl } from '@/lib/kakao'
import { validateEmail, validateLoginPassword } from '@/lib/validation'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import styles from './AuthForm.module.css'

interface LoginLocationState {
  /** RequireAuth 가 넘겨준 원래 목적지 */
  from?: string
  /** 회원가입 직후 넘어온 이메일 (다시 입력하지 않게 채워 준다) */
  email?: string
  /** 카카오 로그인 콜백이 실패했을 때 담아 보내는 사유 */
  authError?: string
}

/**
 * 카카오 브랜드 가이드가 요구하는 고정 색·심볼.
 * 앱 자체 토큰(--brand)과 다르며, 로그인 버튼 여기 한 곳에서만 쓴다.
 */
function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.85 5.36 4.63 6.79-.2.75-.73 2.75-.84 3.18-.13.53.19.52.4.38.17-.11 2.68-1.82 3.76-2.56.66.1 1.34.15 2.05.15 5.52 0 10-3.58 10-8s-4.48-8-10-8Z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LoginLocationState
  const setSession = useAuthStore((s) => s.login)
  const toast = useToast()

  const [email, setEmail] = useState(state.email ?? '')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const { type: passwordType, toggle } = usePasswordToggle()

  const emailError = touched ? validateEmail(email) : null
  const passwordError = touched ? validateLoginPassword(password) : null

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setSession(res)
      toast.show(`${res.name}님, 환영합니다`)
      navigate(state.from ?? PATHS.stores, { replace: true })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)

    if (validateEmail(email) || validateLoginPassword(password)) return

    mutation.mutate({ email: email.trim(), password })
  }

  const serverError = mutation.isError ? toApiError(mutation.error).message : state.authError

  const handleKakaoLogin = () => {
    window.location.href = getKakaoAuthorizeUrl()
  }

  return (
    <div className={styles.page}>
      <div className={styles.brandBar}>
        <Wordmark size={30} />
      </div>

      <PageBody>
        <div className={styles.headlineArea}>
          <Headline
            title={'사장님, 안녕하세요.\n오늘 매장을 확인해 보세요.'}
            description="가입한 이메일로 로그인하세요."
          />
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {serverError && (
            <p className={styles.serverError} role="alert">
              <span className={styles.serverErrorIcon}>
                <AlertIcon size={17} strokeWidth={2} />
              </span>
              {serverError}
            </p>
          )}

          <TextField
            label="이메일"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="owner@finsight.com"
            value={email}
            error={emailError}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="비밀번호"
            type={passwordType}
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            error={passwordError}
            suffix={toggle}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className={styles.submitArea}>
            <Button type="submit" loading={mutation.isPending}>
              로그인
            </Button>
          </div>
        </form>

        <div className={styles.divider}>
          <span>또는</span>
        </div>

        <div className={styles.kakaoArea}>
          <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
            <KakaoIcon />
            카카오로 로그인
          </button>
        </div>

        <p className={styles.altAction}>
          아직 계정이 없으신가요?
          <Link to={PATHS.signup} className={styles.altLink}>
            회원가입
          </Link>
        </p>
      </PageBody>
    </div>
  )
}
