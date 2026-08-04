/**
 * 폼 검증. 제약은 모두 openapi.json 의 schema 에서 가져온 값이다.
 * 서버 검증을 대체하는 게 아니라, 왕복 한 번을 줄이기 위한 클라이언트 사전 검사.
 */

/** openapi.json: SignupRequest.password { minLength: 8, maxLength: 20 } */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 20
/** openapi.json: SignupRequest.name { maxLength: 50 } */
export const NAME_MAX = 50
/** openapi.json: StoreCreateRequest.name { maxLength: 100 } */
export const STORE_NAME_MAX = 100
/** openapi.json: StoreCreateRequest.address { maxLength: 255 } */
export const ADDRESS_MAX = 255

// 지나치게 엄격한 정규식은 정상 이메일을 거부한다. 최소 형태만 본다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | null {
  const email = value.trim()
  if (!email) return '이메일을 입력해 주세요.'
  if (!EMAIL_RE.test(email)) return '이메일 형식이 올바르지 않습니다.'
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return '비밀번호를 입력해 주세요.'
  if (value.length < PASSWORD_MIN) return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`
  if (value.length > PASSWORD_MAX) return `비밀번호는 ${PASSWORD_MAX}자 이하여야 합니다.`
  return null
}

/** 로그인은 길이 제약이 명세에 없다. 빈 값만 막는다. */
export function validateLoginPassword(value: string): string | null {
  if (!value) return '비밀번호를 입력해 주세요.'
  return null
}

export function validateName(value: string): string | null {
  const name = value.trim()
  if (!name) return '이름을 입력해 주세요.'
  if (name.length > NAME_MAX) return `이름은 ${NAME_MAX}자 이하여야 합니다.`
  return null
}

export function validateStoreName(value: string): string | null {
  const name = value.trim()
  if (!name) return '매장 이름을 입력해 주세요.'
  if (name.length > STORE_NAME_MAX) return `매장 이름은 ${STORE_NAME_MAX}자 이하여야 합니다.`
  return null
}

export function validateAddress(value: string): string | null {
  if (value.length > ADDRESS_MAX) return `주소는 ${ADDRESS_MAX}자 이하여야 합니다.`
  return null
}

export function validateSeatCount(value: string): string | null {
  if (!value.trim()) return null // 선택 항목
  const num = Number(value)
  if (!Number.isInteger(num) || num < 0) return '좌석 수는 0 이상의 정수로 입력해 주세요.'
  if (num > 10_000) return '좌석 수를 다시 확인해 주세요.'
  return null
}

export function validateOpenedAt(value: string): string | null {
  if (!value) return null // 선택 항목
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '개업일 형식이 올바르지 않습니다.'
  return null
}

/**
 * 영상 촬영 일시. api-docs.json 에서 `recordedAt` 이 **필수** 쿼리 파라미터라 빈 값을 막는다.
 * 미래 시각은 서버가 거부하지 않을 수도 있지만, 아직 찍지 않은 영상은 있을 수 없으므로
 * 잘못 고른 날짜가 지표에 섞이기 전에 여기서 걸러낸다.
 */
export function validateRecordedAt(value: string): string | null {
  if (!value) return '영상 촬영 일시를 입력해 주세요.'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '촬영 일시 형식이 올바르지 않습니다.'
  // 기기 시계 오차를 감안해 1분은 허용한다.
  if (date.getTime() > Date.now() + 60_000) return '촬영 일시가 현재보다 미래입니다.'
  return null
}
