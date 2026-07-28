export interface CarouselSlide {
  kind: 'summary' | 'evidence'
  label: string
  text: string
  /** 근거 번호 (종합 의견은 없음) */
  index?: number
}

/**
 * 리포트 응답의 summary / evidence[] 를 슬라이드 배열로 바꾼다.
 * 빈 문자열은 걸러내므로, 결과가 빈 배열이면 보여줄 설명이 없다는 뜻이다.
 */
export function buildSlides(
  summary: string | undefined,
  evidence: string[] | undefined,
): CarouselSlide[] {
  const slides: CarouselSlide[] = []

  if (summary?.trim()) {
    slides.push({ kind: 'summary', label: '종합 의견', text: summary.trim() })
  }

  evidence?.forEach((text, i) => {
    if (!text?.trim()) return
    slides.push({
      kind: 'evidence',
      label: `근거 ${i + 1}`,
      text: text.trim(),
      index: i + 1,
    })
  })

  return slides
}
