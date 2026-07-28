/**
 * 로고 원본(scripts/icons/logo-source.png)에서 웹용 PNG 자산을 만든다.
 *
 * 원본은 평면 2색 그래픽인데도 미세한 노이즈가 섞여 있어서 그대로 리사이즈하면
 * PNG 압축이 거의 안 된다(512px 이 240KB). 여기서 색을 브랜드 2색으로 정리한 뒤
 * 다시 인코딩해 용량을 크게 줄인다. PWA 가 이 파일들을 precache 하므로 용량이 중요하다.
 *
 * 외부 의존성 없이 macOS 의 sips(리사이즈 + BMP 변환)와 Node 의 zlib 만 쓴다.
 *
 * 사용법: node scripts/build-logo-assets.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(root, 'scripts/icons/logo-source.png')

/** 로고에서 실측한 브랜드 노란색과 마크 색. */
const BRAND = [0xfd, 0xbc, 0x03]
const MARK = [0x23, 0x26, 0x2d]

const TARGETS = [
  { out: 'public/logo.png', size: 512 },
  { out: 'public/favicon.png', size: 64 },
  { out: 'public/icons/icon-512.png', size: 512 },
  { out: 'public/icons/icon-192.png', size: 192 },
  { out: 'public/icons/icon-maskable-512.png', size: 512 },
  { out: 'public/icons/apple-touch-icon.png', size: 180 },
]

/** sips 로 리사이즈 + 무압축 BMP 변환 후 픽셀을 읽는다. */
function readResizedPixels(size) {
  const tmp = `/tmp/finsight-logo-${size}.bmp`
  execFileSync('sips', ['-z', String(size), String(size), '-s', 'format', 'bmp', SOURCE, '--out', tmp], {
    stdio: 'ignore',
  })

  const b = readFileSync(tmp)
  const dataOffset = b.readUInt32LE(10)
  const width = b.readInt32LE(18)
  const rawHeight = b.readInt32LE(22)
  const topDown = rawHeight < 0
  const height = Math.abs(rawHeight)
  const bpp = b.readUInt16LE(28)
  const bytesPerPx = bpp / 8
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4

  const rgb = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    const srcRow = topDown ? y : height - 1 - y
    for (let x = 0; x < width; x++) {
      const i = dataOffset + srcRow * rowSize + x * bytesPerPx
      // BMP 는 BGR 순서
      const o = (y * width + x) * 3
      rgb[o] = b[i + 2]
      rgb[o + 1] = b[i + 1]
      rgb[o + 2] = b[i]
    }
  }

  unlinkSync(tmp)
  return { rgb, width, height }
}

/**
 * 노이즈를 없애기 위해 각 픽셀을 브랜드색/마크색 중 가까운 쪽으로 스냅한다.
 * 경계의 안티에일리어싱은 살려야 하므로, 두 색에서 모두 먼 중간 픽셀은
 * 밝기 비율로 두 색을 섞어 다시 계산한다(계단현상 방지).
 */
function quantize(rgb) {
  const dist2 = (o, c) =>
    (rgb[o] - c[0]) ** 2 + (rgb[o + 1] - c[1]) ** 2 + (rgb[o + 2] - c[2]) ** 2

  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
  const brandLum = lum(BRAND)
  const markLum = lum(MARK)

  for (let o = 0; o < rgb.length; o += 3) {
    const dBrand = dist2(o, BRAND)
    const dMark = dist2(o, MARK)
    // 확실히 한쪽에 가까우면 그 색으로 스냅 (노이즈 제거)
    const SNAP = 22 ** 2 * 3
    if (dBrand < SNAP) {
      rgb[o] = BRAND[0]; rgb[o + 1] = BRAND[1]; rgb[o + 2] = BRAND[2]
      continue
    }
    if (dMark < SNAP) {
      rgb[o] = MARK[0]; rgb[o + 1] = MARK[1]; rgb[o + 2] = MARK[2]
      continue
    }
    // 경계 픽셀: 밝기로 혼합 비율을 구해 두 브랜드색 사이 값으로 다시 만든다
    const l = 0.299 * rgb[o] + 0.587 * rgb[o + 1] + 0.114 * rgb[o + 2]
    let t = (l - markLum) / (brandLum - markLum)
    t = Math.min(1, Math.max(0, t))
    for (let c = 0; c < 3; c++) {
      rgb[o + c] = Math.round(MARK[c] + (BRAND[c] - MARK[c]) * t)
    }
  }
  return rgb
}

/* ── 최소 PNG 인코더 (truecolor, 8bit, filter 0) ── */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)
  return Buffer.concat([len, typeAndData, crc])
}

function encodePNG(rgb, width, height) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor
  // 10~12: compression(0) / filter(0) / interlace(0)

  // 스캔라인마다 filter byte 0 을 붙인다
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ── 실행 ── */

console.log('로고 자산 생성')
for (const { out, size } of TARGETS) {
  const { rgb, width, height } = readResizedPixels(size)
  const png = encodePNG(quantize(rgb), width, height)
  const dest = resolve(root, out)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, png)
  console.log(`  ${out.padEnd(36)} ${width}x${height}  ${(png.length / 1024).toFixed(1)}KB`)
}
console.log('완료')
