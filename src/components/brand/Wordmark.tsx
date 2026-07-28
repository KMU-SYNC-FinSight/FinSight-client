import styles from './Wordmark.module.css'

interface WordmarkProps {
  /** 로고 마크 한 변의 크기(px). 텍스트 크기는 여기에 비례한다. */
  size?: number
  /** 마크만 보여줄지 */
  markOnly?: boolean
  /**
   * 로고 원본은 배경이 노란색 정사각형이다.
   *  - 'tile': 흰 배경 위. 모서리를 굴려 앱 아이콘 같은 타일로 보인다.
   *  - 'bare': 옐로우 헤더 위. 로고 배경(#FDBC03)이 헤더(--brand)와 같은 값이라
   *            경계 없이 이어지고 마크만 떠 보인다. 블렌드 모드는 쓰지 않는다
   *            (multiply 는 노란색끼리 곱해져 주황으로 어두워진다).
   */
  variant?: 'tile' | 'bare'
}

export function Wordmark({ size = 28, markOnly = false, variant = 'tile' }: WordmarkProps) {
  return (
    <span className={styles.wrap} style={{ gap: size * 0.28 }}>
      <img
        className={styles.mark}
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: variant === 'tile' ? size * 0.26 : 0 }}
      />
      {!markOnly && (
        <span className={styles.text} style={{ fontSize: size * 0.66 }}>
          FinSight
        </span>
      )}
      <span className="sr-only">FinSight</span>
    </span>
  )
}
