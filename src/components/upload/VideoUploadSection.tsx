import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toApiError } from '@/api/client'
import { uploadVideo } from '@/api/uploads'
import { AlertIcon, VideoIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { queryKeys } from '@/hooks/queries'
import { useUploadPolling } from '@/hooks/useUploadPolling'
import { FilePickField, UploadProgress } from './FilePickField'
import { UploadStepper } from './UploadStepper'
import { VideoPreview } from './VideoPreview'
import styles from './UploadPanel.module.css'

/** 영상 파일 상한. 서버 제한을 모르지만 브라우저에서 미리 막아 헛된 전송을 줄인다. */
const MAX_VIDEO_BYTES = 500 * 1024 * 1024

export function VideoUploadSection({ storeId }: { storeId: number }) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [percent, setPercent] = useState(0)
  const [uploadId, setUploadId] = useState<number | null>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const polling = useUploadPolling(uploadId)

  const mutation = useMutation({
    mutationFn: (target: File) => uploadVideo(storeId, target, setPercent),
    onSuccess: (res) => {
      setUploadId(res.uploadId)
    },
  })

  // 분석이 끝나면 대시보드·리포트가 새 값을 읽도록 캐시를 비운다.
  useEffect(() => {
    if (!polling.isCompleted) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(storeId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.report(storeId) })
  }, [polling.isCompleted, queryClient, storeId])

  const handleSelect = (selected: File | null) => {
    setSizeError(null)
    if (selected && selected.size > MAX_VIDEO_BYTES) {
      setSizeError('영상 파일은 500MB 이하만 업로드할 수 있습니다.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  const reset = () => {
    setFile(null)
    setPercent(0)
    setUploadId(null)
    mutation.reset()
  }

  const uploadError = mutation.isError ? toApiError(mutation.error).message : null
  const isTransferring = mutation.isPending
  const hasStarted = uploadId !== null

  return (
    <div className={styles.panel}>
      {!hasStarted && (
        <>
          <FilePickField
            accept="video/*"
            icon={<VideoIcon size={20} strokeWidth={1.8} />}
            placeholder="영상 파일 선택"
            hint="mp4, mov 등 · 최대 500MB"
            file={file}
            onSelect={handleSelect}
            disabled={isTransferring}
          />

          {/* 고른 영상을 보내기 전에 확인한다. 전송 중에도 남겨 무엇을 올리는지 보이게 한다. */}
          {file && <VideoPreview file={file} />}

          {isTransferring && percent > 0 && <UploadProgress percent={percent} />}

          {(sizeError || uploadError) && (
            <p className={styles.error} role="alert">
              <span className={styles.errorIcon}>
                <AlertIcon size={16} strokeWidth={2} />
              </span>
              {sizeError ?? uploadError}
            </p>
          )}

          <Button
            size="md"
            disabled={!file}
            loading={isTransferring}
            onClick={() => file && mutation.mutate(file)}
          >
            업로드하고 분석 시작
          </Button>
        </>
      )}

      {hasStarted && (
        <>
          <div className={styles.statusCard}>
            <div className={styles.statusHead}>
              <span className={styles.statusFile}>
                {polling.data?.originalFileName ?? file?.name ?? '업로드한 영상'}
              </span>
            </div>
            <UploadStepper
              status={polling.status}
              isFailed={polling.isFailed}
              isTimedOut={polling.isTimedOut}
              errorMessage={polling.errorMessage}
            />
          </div>

          {(polling.isCompleted || polling.isFailed || polling.isTimedOut) && (
            <Button variant="secondary" size="md" onClick={reset}>
              다른 영상 업로드
            </Button>
          )}

          <p className={styles.caption}>
            분석 상태는 이 화면에서만 추적합니다. 새로고침하면 진행 표시가 사라지지만 서버의 분석은
            계속 진행됩니다.
          </p>
        </>
      )}
    </div>
  )
}
