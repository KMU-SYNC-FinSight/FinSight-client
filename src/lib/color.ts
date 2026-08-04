/**
 * 색 보간. 토큰 값(`#RRGGBB`)끼리 섞는 데만 쓴다.
 *
 * CSS 로 못 하는 곳이 하나 있어서 필요하다 — `<meta name="theme-color">` 는
 * transition 이 걸리지 않아 값을 프레임마다 직접 갈아 줘야 한다.
 */

function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace('#', '')
  if (hex.length !== 6) return null
  const num = Number.parseInt(hex, 16)
  if (Number.isNaN(num)) return null
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
}

function toHex(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, '0')
}

/**
 * `from` → `to` 를 t(0~1) 만큼 섞은 `#RRGGBB`.
 * 파싱할 수 없는 값이면 섞지 않고 목적지 색을 그대로 준다 (색이 사라지는 것보다 낫다).
 */
export function mixHex(from: string, to: string, t: number): string {
  const a = parseHex(from)
  const b = parseHex(to)
  if (!a || !b) return to

  const ratio = Math.min(1, Math.max(0, t))
  const channels = a.map((value, i) => value + (b[i] - value) * ratio)
  return `#${channels.map(toHex).join('')}`
}
