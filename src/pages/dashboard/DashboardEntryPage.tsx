import { Navigate, useNavigate } from 'react-router-dom'
import { ChartIcon } from '@/components/icons'
import { PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState, LoadingState } from '@/components/ui/States'
import { useStores } from '@/hooks/queries'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'

/**
 * "대시보드" 탭의 진입점.
 *
 * 백엔드에 기본 매장 개념이 없어서 어떤 매장을 보여줄지 클라이언트가 정해야 한다.
 *  1) 마지막으로 열어본 매장이 있으면 그 매장으로
 *  2) 없고 매장이 하나뿐이면 그 매장으로
 *  3) 그 외에는 매장을 고르라고 안내
 */
export function DashboardEntryPage() {
  const navigate = useNavigate()
  const selectedStoreId = useAuthStore((s) => s.selectedStoreId)
  const { data: stores, isPending } = useStores()

  if (selectedStoreId !== null) {
    return <Navigate to={PATHS.dashboardOf(selectedStoreId)} replace />
  }

  if (isPending) {
    return (
      <>
        <TopBar title="운영 대시보드" bordered />
        <PageBody>
          <LoadingState />
        </PageBody>
      </>
    )
  }

  if (stores && stores.length === 1) {
    return <Navigate to={PATHS.dashboardOf(stores[0].storeId)} replace />
  }

  const hasStores = Boolean(stores && stores.length > 0)

  return (
    <>
      <TopBar title="운영 대시보드" bordered />
      <PageBody>
        <EmptyState
          icon={<ChartIcon size={26} strokeWidth={1.8} />}
          title={hasStores ? '어떤 매장을 볼까요?' : '먼저 매장을 등록해 주세요'}
          description={
            hasStores
              ? '매장 목록에서 대시보드를 볼 매장을 선택하세요.'
              : '매장을 등록하고 영상·매출 데이터를 올리면 운영 안정성 점수를 계산합니다.'
          }
          action={
            <Button
              variant="brand"
              size="md"
              inline
              onClick={() => navigate(hasStores ? PATHS.stores : PATHS.storeNew)}
            >
              {hasStores ? '매장 선택하기' : '매장 등록하기'}
            </Button>
          }
        />
      </PageBody>
    </>
  )
}
