/**
 * 영상 업로드의 `recordedAt` 값 다루기.
 *
 * 서버가 받는 형태는 오프셋 없는 ISO 로컬 일시(`2026-07-15T14:00:00`)다.
 * 그래서 UTC 로 바꾸지 않는다 — `toISOString()` 을 쓰면 한국에서 9시간이 밀린다.
 * 화면이 다루는 값도 같은 로컬 표기(`YYYY-MM-DDTHH:00`)로 통일해 변환을 한 곳에 모았다.
 *
 * 입력은 **1시간 단위**다. 분·초를 받지 않으므로 항상 정시(`:00`)로 맞춘다.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Date → `YYYY-MM-DD` (`<input type="date">` 가 받는 형태, 로컬 시간대 기준) */
export function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Date → `YYYY-MM-DDTHH:00`.
 * 분 이하를 버리므로 결과는 항상 원본과 같거나 과거다 — 미래로 넘어갈 일이 없다.
 */
export function toRecordedAtValue(date: Date): string {
  return `${toDateValue(date)}T${pad(date.getHours())}:00`
}

/** `YYYY-MM-DDTHH:00` → 서버 전송용 `YYYY-MM-DDTHH:00:00` (명세 예시와 같은 형태) */
export function toApiDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

/** 날짜 부분만 (`2026-07-15`). 값이 없으면 빈 문자열. */
export function datePartOf(value: string): string {
  return value.slice(0, 10)
}

/** 시 부분만 (0~23). 값이 없으면 null. */
export function hourPartOf(value: string): number | null {
  if (value.length < 13) return null
  const hour = Number(value.slice(11, 13))
  return Number.isInteger(hour) ? hour : null
}

/** 날짜 + 시를 합쳐 `recordedAt` 값으로 만든다. */
export function joinRecordedAt(date: string, hour: number): string {
  return `${date}T${pad(hour)}:00`
}

/**
 * 그 날짜에 고를 수 있는 마지막 시.
 * 오늘이면 지금 시각까지만 — 아직 찍지 않은 영상을 고를 수 없게 한다.
 */
export function maxHourOf(date: string, now: Date): number {
  return date === toDateValue(now) ? now.getHours() : 23
}
