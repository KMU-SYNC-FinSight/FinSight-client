import { useQueries, useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/api/dashboard'
import { getReport } from '@/api/report'
import { getMyStores, getStore } from '@/api/stores'
import { getMe } from '@/api/user'

/** 쿼리 키를 한곳에서 관리해 무효화 대상을 놓치지 않게 한다. */
export const queryKeys = {
  me: ['me'] as const,
  stores: ['stores'] as const,
  store: (storeId: number) => ['store', storeId] as const,
  dashboard: (storeId: number) => ['dashboard', storeId] as const,
  report: (storeId: number) => ['report', storeId] as const,
  upload: (uploadId: number) => ['upload', uploadId] as const,
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
  })
}

export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores,
    queryFn: getMyStores,
  })
}

export function useStore(storeId: number | null) {
  return useQuery({
    queryKey: queryKeys.store(storeId ?? 0),
    queryFn: () => getStore(storeId as number),
    enabled: storeId !== null,
  })
}

export function useDashboard(storeId: number | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(storeId ?? 0),
    queryFn: () => getDashboard(storeId as number),
    enabled: storeId !== null,
  })
}

/**
 * 여러 매장의 대시보드를 한 번에 읽는다.
 *
 * 메인 화면에서 매장별 점수와 전체 요약(평균 점수·분석 대기 수)을 같이 보여줘야 하는데,
 * 목록 API 에는 점수가 없어서 매장 수만큼 대시보드를 부른다.
 * queryKey 가 useDashboard 와 같아 다른 화면과 캐시를 공유한다.
 *
 * 반환값은 storeIds 와 같은 순서로 정렬된다.
 */
export function useStoreDashboards(storeIds: number[]) {
  return useQueries({
    queries: storeIds.map((id) => ({
      queryKey: queryKeys.dashboard(id),
      queryFn: () => getDashboard(id),
    })),
  })
}

export function useReport(storeId: number | null) {
  return useQuery({
    queryKey: queryKeys.report(storeId ?? 0),
    queryFn: () => getReport(storeId as number),
    enabled: storeId !== null,
  })
}
