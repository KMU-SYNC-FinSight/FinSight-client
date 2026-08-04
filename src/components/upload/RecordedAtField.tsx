import { useId } from 'react'
import { ChevronRightIcon } from '@/components/icons'
import { datePartOf, hourPartOf, joinRecordedAt, maxHourOf, toDateValue } from '@/lib/datetime'
import { formatDate } from '@/lib/format'
import styles from './UploadPanel.module.css'

interface RecordedAtFieldProps {
  /** `YYYY-MM-DDTHH:00` 또는 아직 고르지 않았으면 빈 문자열 */
  value: string
  onChange: (value: string) => void
  error?: string | null
  disabled?: boolean
}

/**
 * 영상 촬영 일시 입력. 서버의 `recordedAt` (필수) 을 만든다.
 *
 * **1시간 단위로만 받는다.** 분까지 물으면 사장님이 모르는 값을 억지로 채우게 되고,
 * 분석도 시간대 단위로 쓰므로 정확도에 보탬이 없다.
 * 그래서 datetime-local 한 칸이 아니라 날짜 + 시(0~23) 두 칸으로 나눴다 —
 * datetime-local 은 `step` 을 줘도 브라우저마다 분 칸을 그대로 보여준다.
 *
 * 모양은 앱의 리스트 행(라벨 ─ 값 ›)을 따르고, 각 행 위에 투명한 native
 * input/select 를 덮어 어디를 눌러도 OS 기본 피커가 열리게 했다.
 * 값 표시는 우리가 그리므로 native 위젯의 글자는 보이지 않는다.
 */
export function RecordedAtField({
  value,
  onChange,
  error,
  disabled = false,
}: RecordedAtFieldProps) {
  const dateId = useId()
  const hourId = useId()

  const now = new Date()
  const today = toDateValue(now)
  const date = datePartOf(value)
  const hour = hourPartOf(value)
  const maxHour = maxHourOf(date || today, now)

  const handleDate = (next: string) => {
    if (!next) {
      onChange('')
      return
    }
    // 오늘로 옮기면 아직 오지 않은 시각이 남을 수 있어 지금 시각으로 잘라 준다.
    const limit = maxHourOf(next, now)
    onChange(joinRecordedAt(next, Math.min(hour ?? limit, limit)))
  }

  const handleHour = (next: string) => {
    if (!next) return
    onChange(joinRecordedAt(date || today, Number(next)))
  }

  return (
    <div className={styles.when}>
      <p className={styles.whenLabel}>촬영 일시</p>

      <div className={styles.whenCard} data-invalid={Boolean(error)} data-disabled={disabled}>
        <div className={styles.whenRow}>
          <label className={styles.whenRowLabel} htmlFor={dateId}>
            날짜
          </label>
          <span className={styles.whenValue} data-empty={!date} aria-hidden="true">
            {date ? formatDate(date) : '선택'}
            <span className={styles.whenChevron}>
              <ChevronRightIcon size={16} strokeWidth={2} />
            </span>
          </span>
          <input
            id={dateId}
            className={styles.whenInput}
            type="date"
            value={date}
            max={today}
            disabled={disabled}
            onChange={(e) => handleDate(e.target.value)}
            // 데스크톱 Chrome 은 달력 아이콘을 눌러야 열린다. 행 어디를 눌러도 열리게 한다.
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.()
              } catch {
                /* 지원하지 않는 브라우저는 직접 입력으로 넘어간다 */
              }
            }}
          />
        </div>

        <div className={styles.whenRow}>
          <label className={styles.whenRowLabel} htmlFor={hourId}>
            시각
          </label>
          <span className={styles.whenValue} data-empty={hour === null} aria-hidden="true">
            {hour === null ? '선택' : `${hour}시`}
            <span className={styles.whenChevron}>
              <ChevronRightIcon size={16} strokeWidth={2} />
            </span>
          </span>
          <select
            id={hourId}
            className={styles.whenInput}
            value={hour === null ? '' : String(hour)}
            disabled={disabled}
            onChange={(e) => handleHour(e.target.value)}
          >
            <option value="" disabled>
              시각 선택
            </option>
            {Array.from({ length: maxHour + 1 }, (_, h) => (
              <option key={h} value={h}>
                {h}시
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className={styles.whenError} role="alert">
          {error}
        </p>
      ) : (
        <p className={styles.whenHint}>
          1시간 단위로 입력합니다. 파일 정보에서 채운 값이니 실제 촬영 시각과 다르면 눌러서 고쳐
          주세요.
        </p>
      )}
    </div>
  )
}
