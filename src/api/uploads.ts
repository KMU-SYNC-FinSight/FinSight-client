import { api, uploadApi } from './client'
import { ENDPOINTS } from './endpoints'
import type { SalesUploadResponse, UploadStatusResponse, VideoUploadResponse } from './types'

/**
 * 매장 영상 업로드. 비동기 처리라 응답의 uploadId 로 상태를 폴링해야 한다.
 * onProgress 는 0~100 (서버가 Content-Length 를 못 계산하는 경우 호출되지 않을 수 있다).
 *
 * recordedAt 은 **필수 쿼리 파라미터**다 (파일 본문이 아니라 query 로 간다).
 * 오프셋 없는 ISO 로컬 일시 문자열이어야 한다 — `2026-07-15T14:00:00`.
 * `toApiDateTime()` 이 datetime-local 입력값을 이 형태로 맞춰 준다.
 */
export async function uploadVideo(
  storeId: number,
  file: File,
  recordedAt: string,
  onProgress?: (percent: number) => void,
): Promise<VideoUploadResponse> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await uploadApi.post<VideoUploadResponse>(
    ENDPOINTS.stores.videos(storeId),
    form,
    {
      params: { recordedAt },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return
        onProgress(Math.round((event.loaded / event.total) * 100))
      },
    },
  )
  return data
}

/**
 * 매출 CSV 업로드. 파싱 결과(행 수)를 즉시 돌려준다.
 * VideoUploadResponse 와 달리 processingStatus 가 없지만 uploadId 는 주므로
 * 후속 처리 상태는 getUploadStatus 로 확인할 수 있다.
 */
export async function uploadSalesCsv(
  storeId: number,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<SalesUploadResponse> {
  const form = new FormData()
  form.append('file', file)

  const { data } = await uploadApi.post<SalesUploadResponse>(
    ENDPOINTS.stores.sales(storeId),
    form,
    {
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return
        onProgress(Math.round((event.loaded / event.total) * 100))
      },
    },
  )
  return data
}

export async function getUploadStatus(uploadId: number): Promise<UploadStatusResponse> {
  const { data } = await api.get<UploadStatusResponse>(ENDPOINTS.uploads.status(uploadId))
  return data
}
