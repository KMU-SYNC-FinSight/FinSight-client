import styles from './ChipSelect.module.css'

interface ChipOption<T extends string> {
  value: T
  label: string
}

interface ChipSelectProps<T extends string> {
  label: string
  options: readonly ChipOption<T>[]
  value: T | null
  onChange: (value: T) => void
  error?: string | null
}

/**
 * 단일 선택 칩.
 * 항목이 5개 이하라 <select> 보다 한눈에 보이고 터치도 쉽다.
 */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: ChipSelectProps<T>) {
  return (
    <div className={styles.group}>
      <span className={styles.label} id={`${label}-chip-label`}>
        {label}
      </span>
      <div className={styles.chips} role="group" aria-labelledby={`${label}-chip-label`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.chip}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className={styles.error}>{error}</span>
    </div>
  )
}
