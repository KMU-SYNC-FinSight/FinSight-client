import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUploadStatus } from '@/api/uploads'
import type { ProcessingStatus, UploadStatusResponse } from '@/api/types'
import { toApiError } from '@/api/client'
import { queryKeys } from './queries'

/** 폴링 주기. 영상 분석은 초 단위로 끝나지 않으므로 2초면 충분하다. */
export const POLL_INTERVAL_MS = 2_000

/**
 * 폴링 상한. 이 시간을 넘기면 무한히 서버를 두드리는 대신 멈추고 안내한다.
 * 백엔드에 처리 예상 시간을 알려주는 필드가 없어 클라이언트가 상한을 정한다.
 */
export const POLL_TIMEOUT_MS = 5 * 60_000

const TERMINAL_STATUSES: ProcessingStatus[] = ['COMPLETED', 'FAILED']

function isTerminalStatus(status: ProcessingStatus | undefined): boolean {
  return status !== undefined && TERMINAL_STATUSES.includes(status)
}

export interface UploadPollingResult {
  data: UploadStatusResponse | undefined
  status: ProcessingStatus | null
  /** 아직 처리 중이라 계속 조회하고 있는 상태 */
  isPolling: boolean
  isCompleted: boolean
  isFailed: boolean
  /** 상한 시간을 넘겨 폴링을 그만둔 상태 */
  isTimedOut: boolean
  /** FAILED 면 서버가 준 errorMessage, 조회 자체가 실패하면 그 사유 */
  errorMessage: string | null
}

/**
 * 업로드 처리 상태를 주기적으로 조회한다.
 *
 * 규약
 *  - UPLOADED → PROCESSING → COMPLETED (또는 FAILED)
 *  - COMPLETED / FAILED 에 도달하면 폴링을 멈춘다.
 *  - POLL_TIMEOUT_MS 를 넘기면 멈추고 isTimedOut 을 세운다.
 *  - 화면을 벗어나면 react-query 가 구독을 정리하므로 타이머가 남지 않는다.
 */
export function useUploadPolling(uploadId: number | null): UploadPollingResult {
  const [isTimedOut, setIsTimedOut] = useState(false)

  // 업로드가 바뀌면 타임아웃 상태를 초기화한다.
  useEffect(() => {
    setIsTimedOut(false)
  }, [uploadId])

  const query = useQuery({
    queryKey: queryKeys.upload(uploadId ?? 0),
    queryFn: () => getUploadStatus(uploadId as number),
    // 타임아웃 시에도 enabled 를 유지한다. 여기서 끄면 마지막으로 받은 상태가
    // 사라져 단계 표시가 처음으로 되돌아간다. 폴링만 refetchInterval 로 멈춘다.
    enabled: uploadId !== null,
    refetchInterval: (q) => {
      if (isTimedOut) return false
      return isTerminalStatus(q.state.data?.processingStatus) ? false : POLL_INTERVAL_MS
    },
    // 처리 중 일시적인 5xx 로 폴링이 끊기지 않게 몇 번은 다시 시도한다.
    retry: 3,
    // 지난 업로드의 상태가 새 업로드 화면에 잠깐 비치는 것을 막는다.
    gcTime: 0,
    staleTime: 0,
  })

  const status = query.data?.processingStatus ?? null
  const isCompleted = status === 'COMPLETED'
  const isFailed = status === 'FAILED'
  const reachedTerminal = isCompleted || isFailed

  // 종료 상태에 도달하면 cleanup 이 타이머를 걷어간다.
  useEffect(() => {
    if (uploadId === null || reachedTerminal) return
    const timer = setTimeout(() => setIsTimedOut(true), POLL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [uploadId, reachedTerminal])

  let errorMessage: string | null = null
  if (isFailed) {
    errorMessage = query.data?.errorMessage?.trim() || '처리 중 오류가 발생했습니다.'
  } else if (query.isError) {
    errorMessage = toApiError(query.error).message
  }

  return {
    data: query.data,
    status,
    isPolling: uploadId !== null && !reachedTerminal && !isTimedOut,
    isCompleted,
    isFailed,
    isTimedOut,
    errorMessage,
  }
}
