import { useEffect, useState } from 'react'
import { AlertIcon } from '@/components/icons'
import { formatDuration } from '@/lib/format'
import styles from './UploadPanel.module.css'

interface VideoMeta {
  duration: number
  width: number
  height: number
}

/**
 * 업로드 전 로컬 미리보기.
 *
 * 파일을 서버에 보내지 않고 objectURL 로 브라우저에서 바로 재생한다.
 * 분석할 수 없는 영상은 서버가 FAILED 를 주지 않고 UPLOADED 에 머물러
 * 5분 폴링 상한까지 기다려야 하므로(CLAUDE.md 참고), 보내기 전에
 * 사용자가 직접 눈으로 확인하는 것이 값이 크다.
 */
export function VideoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  const [meta, setMeta] = useState<VideoMeta | null>(null)
  const [failed, setFailed] = useState(false)

  // objectURL 은 파일이 바뀔 때마다 새로 만들고 이전 것을 반드시 해제한다.
  // 해제하지 않으면 선택을 반복할 때 수백 MB 짜리 blob 이 탭에 계속 쌓인다.
  useEffect(() => {
    const next = URL.createObjectURL(file)
    setUrl(next)
    setMeta(null)
    setFailed(false)
    return () => URL.revokeObjectURL(next)
  }, [file])

  if (!url) return null

  if (failed) {
    return (
      <p className={styles.previewFallback}>
        <span className={styles.previewFallbackIcon}>
          <AlertIcon size={16} strokeWidth={2} />
        </span>
        이 브라우저에서 미리 볼 수 없는 형식입니다. 업로드는 그대로 할 수 있지만, 분석이 되지 않을
        수 있으니 mp4 파일을 권장합니다.
      </p>
    )
  }

  return (
    <div className={styles.preview}>
      {/* controls 만 두고 자동재생하지 않는다. 데이터 요금이 드는 전송 전이므로 재생은 사용자가 시작한다. */}
      <video
        key={url}
        className={styles.previewVideo}
        src={url}
        controls
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          setMeta({
            // 일부 컨테이너는 duration 을 Infinity 로 준다.
            duration: Number.isFinite(el.duration) ? el.duration : 0,
            width: el.videoWidth,
            height: el.videoHeight,
          })
        }}
        onError={() => setFailed(true)}
      />
      <div className={styles.previewMeta}>
        <span>업로드 전 미리보기 · 아직 전송되지 않았습니다</span>
        {meta && meta.width > 0 && (
          <span className="num">
            {meta.duration > 0 && `${formatDuration(meta.duration)} · `}
            {meta.width}×{meta.height}
          </span>
        )}
      </div>
    </div>
  )
}
