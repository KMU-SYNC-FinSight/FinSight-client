import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant
  size?: Size
  /** 로딩 중에는 라벨을 유지하고 스피너만 덧붙인다 (레이아웃 점프 방지) */
  loading?: boolean
  /** 폭을 내용에 맞춤 */
  inline?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  inline = false,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={styles.button}
      data-variant={variant}
      data-size={size}
      data-inline={inline}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
