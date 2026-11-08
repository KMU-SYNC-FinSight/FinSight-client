import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toApiError } from '@/api/client'
import { uploadSalesCsv } from '@/api/uploads'
import type { SalesUploadResponse } from '@/api/types'
import { AlertIcon, TableIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { queryKeys } from '@/hooks/queries'
import { useUploadPolling } from '@/hooks/useUploadPolling'
import { CsvResultCard } from './CsvResultCard'
import { FilePickField, UploadProgress } from './FilePickField'
import { UploadStepper } from './UploadStepper'
import styles from './UploadPanel.module.css'

const MAX_CSV_BYTES = 20 * 1024 * 1024

export function SalesUploadSection({ storeId }: { storeId: number }) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [percent, setPercent] = useState(0)
  const [result, setResult] = useState<SalesUploadResponse | null>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)

  // CSV 는 파싱 결과를 즉시 받지만, uploadId 로 후속 처리 상태도 함께 추적한다.
  const polling = useUploadPolling(result?.uploadId ?? null)

  const mutation = useMutation({
    mutationFn: (target: File) => uploadSalesCsv(storeId, target, setPercent),
    onSuccess: (res) => {
      setResult(res)
      // 매출 데이터가 들어오면 지표가 바뀐다.
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(storeId) })
    },
  })

  useEffect(() => {
    if (!polling.isCompleted) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(storeId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.report(storeId) })
  }, [polling.isCompleted, queryClient, storeId])

  const handleSelect = (selected: File | null) => {
    setSizeError(null)
    if (selected && selected.size > MAX_CSV_BYTES) {
      setSizeError('20MB까지 올릴 수 있어요. 기간을 나눠서 올려 주세요.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  const reset = () => {
    setFile(null)
    setPercent(0)
    setResult(null)
    mutation.reset()
  }

  const uploadError = mutation.isError ? toApiError(mutation.error).message : null
  const isTransferring = mutation.isPending

  return (
    <div className={styles.panel}>
      {!result && (
        <>
          <FilePickField
            accept=".csv,text/csv"
            icon={<TableIcon size={20} strokeWidth={1.8} />}
            placeholder="CSV 파일 선택"
            hint="같은 날짜는 새 값으로 바뀌어요 · 20MB까지"
            file={file}
            onSelect={handleSelect}
            disabled={isTransferring}
          />

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
            매출 파일 올리기
          </Button>
        </>
      )}

      {result && (
        <>
          <div className={styles.statusCard}>
            <div className={styles.statusHead}>
              <span className={styles.statusFile}>
                {polling.data?.originalFileName ?? file?.name ?? '올린 CSV'}
              </span>
            </div>

            {/* 파싱 결과는 응답에 바로 담겨 오므로 폴링과 무관하게 먼저 보여준다. */}
            <CsvResultCard result={result} />

            <UploadStepper
              status={polling.status}
              isFailed={polling.isFailed}
              isTimedOut={polling.isTimedOut}
              errorMessage={polling.errorMessage}
            />
          </div>

          {result.skippedRows > 0 && (
            <p className={styles.error} role="alert">
              <span className={styles.errorIcon}>
                <AlertIcon size={16} strokeWidth={2} />
              </span>
              {result.skippedRows}개 행은 형식이 맞지 않아 제외했어요. 날짜와 금액을 확인해 주세요.
            </p>
          )}

          <Button variant="secondary" size="md" onClick={reset}>
            다른 파일 올리기
          </Button>
        </>
      )}
    </div>
  )
}
