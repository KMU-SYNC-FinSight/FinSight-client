import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './TextField.module.css'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string
  /** 검증 실패 메시지. 있으면 테두리가 빨갛게 되고 aria-invalid 가 붙는다. */
  error?: string | null
  /** 에러가 없을 때 보여줄 안내 문구 */
  hint?: ReactNode
  /** 입력 길이 카운터를 보여줄 최대 글자 수 */
  counterMax?: number
  suffix?: ReactNode
}

export function TextField({
  label,
  error,
  hint,
  counterMax,
  suffix,
  id: idProp,
  value,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const describedById = `${id}-desc`
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          className={styles.input}
          data-invalid={Boolean(error)}
          data-has-suffix={Boolean(suffix)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? describedById : undefined}
          value={value}
          {...rest}
        />
        {suffix}
      </div>
      <div className={styles.footer}>
        <span id={describedById} className={error ? styles.error : styles.hint}>
          {error || hint}
        </span>
        {counterMax !== undefined && (
          <span className={styles.counter}>
            {length}/{counterMax}
          </span>
        )}
      </div>
    </div>
  )
}

/** 비밀번호 입력에 붙이는 "보기 / 숨기기" 토글. */
export function usePasswordToggle() {
  const [visible, setVisible] = useState(false)

  const toggle = (
    <button
      type="button"
      className={styles.suffix}
      onClick={() => setVisible((v) => !v)}
      aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
    >
      {visible ? '숨기기' : '보기'}
    </button>
  )

  return { type: visible ? ('text' as const) : ('password' as const), toggle }
}
