import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { signup } from '@/api/auth'
import { toApiError } from '@/api/client'
import { AlertIcon } from '@/components/icons'
import { Headline, PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { TextField, usePasswordToggle } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import {
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  validateEmail,
  validateName,
  validatePassword,
} from '@/lib/validation'
import { PATHS } from '@/routes/paths'
import styles from './AuthForm.module.css'

export function SignupPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const { type: passwordType, toggle } = usePasswordToggle()

  const nameError = touched ? validateName(name) : null
  const emailError = touched ? validateEmail(email) : null
  const passwordError = touched ? validatePassword(password) : null

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: (res) => {
      // SignupResponse 에는 accessToken 이 없다. 자동 로그인이 불가능하므로
      // 로그인 화면으로 보내고 이메일만 채워 준다.
      toast.show('가입을 완료했어요. 로그인해 주세요.')
      navigate(PATHS.login, { replace: true, state: { email: res.email } })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)

    if (validateName(name) || validateEmail(email) || validatePassword(password)) return

    mutation.mutate({ name: name.trim(), email: email.trim(), password })
  }

  const apiError = mutation.isError ? toApiError(mutation.error) : null
  // 가입 충돌(409)은 이미 가입한 이메일이다. 서버 문구 대신 다음 행동을 알려 준다.
  const serverError =
    apiError?.status === 409 ? '이미 가입한 이메일이에요. 로그인해 주세요.' : (apiError?.message ?? null)

  return (
    <div className={styles.page}>
      <TopBar back backTo={PATHS.login} />

      <PageBody>
        <div className={styles.headlineArea}>
          <Headline
            title={'계정을 만들고\n매장 점수를 받아보세요'}
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
            label="이름"
            type="text"
            autoComplete="name"
            placeholder="홍길동"
            value={name}
            error={nameError}
            counterMax={NAME_MAX}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="이메일"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="owner@finsight.com"
            value={email}
            error={emailError}
            hint="로그인할 때 사용해요"
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="비밀번호"
            type={passwordType}
            autoComplete="new-password"
            placeholder="비밀번호 입력"
            value={password}
            error={passwordError}
            hint={`영문과 숫자를 섞어 ${PASSWORD_MIN}~${PASSWORD_MAX}자로 만들어 주세요`}
            suffix={toggle}
            maxLength={PASSWORD_MAX}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className={styles.submitArea}>
            <Button type="submit" loading={mutation.isPending}>
              동의하고 가입하기
            </Button>
          </div>
        </form>

        <p className={styles.notice}>
          가입하면 서비스 이용약관과 개인정보 처리방침에 동의한 것으로 봐요
        </p>

        <p className={styles.altAction}>
          이미 계정이 있나요?
          <Link to={PATHS.login} className={styles.altLink}>
            로그인
          </Link>
        </p>
      </PageBody>
    </div>
  )
}
