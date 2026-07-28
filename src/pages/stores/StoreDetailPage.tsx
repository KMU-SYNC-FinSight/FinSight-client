import { useParams } from 'react-router-dom'
import { API_CODES, toApiError } from '@/api/client'
import { ChartIcon, DocumentIcon, TableIcon, VideoIcon } from '@/components/icons'
import { PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { ListRow } from '@/components/ui/Surface'
import { SalesUploadSection } from '@/components/upload/SalesUploadSection'
import { VideoUploadSection } from '@/components/upload/VideoUploadSection'
import { useStore } from '@/hooks/queries'
import { businessTypeLabel, formatDate, formatNumber } from '@/lib/format'
import { PATHS } from '@/routes/paths'
import styles from './StoreDetailPage.module.css'

export function StoreDetailPage() {
  const { storeId: storeIdParam } = useParams<{ storeId: string }>()
  const storeId = Number(storeIdParam)
  const isValidId = Number.isInteger(storeId) && storeId > 0

  const { data: store, isPending, isError, error, refetch } = useStore(isValidId ? storeId : null)

  if (!isValidId) {
    return (
      <>
        <TopBar title="매장" back backTo={PATHS.stores} bordered />
        <PageBody>
          <ErrorState title="잘못된 주소입니다" message="매장 정보를 찾을 수 없습니다." />
        </PageBody>
      </>
    )
  }

  return (
    <>
      <TopBar title="매장 상세" back backTo={PATHS.stores} bordered />

      <PageBody>
        {isPending && <LoadingState label="매장 정보를 불러오는 중" />}

        {isError &&
          // 남의 매장이나 없는 매장은 404 STORE_NOT_FOUND 로 온다. 장애가 아니므로 안내로 처리한다.
          (toApiError(error).code === API_CODES.STORE_NOT_FOUND ? (
            <ErrorState
              title="매장을 찾을 수 없습니다"
              message="삭제되었거나 접근 권한이 없는 매장입니다."
            />
          ) : (
            <ErrorState message={toApiError(error).message} onRetry={() => refetch()} />
          ))}

        {store && (
          <>
            <section className={styles.summary}>
              <div className={styles.summaryHead}>
                <h2 className={styles.storeName}>{store.name}</h2>
                <Badge tone="brand">{businessTypeLabel(store.businessType)}</Badge>
              </div>

              <dl className={styles.summaryMeta}>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>주소</dt>
                  <dd className={styles.metaValue}>{store.address || '—'}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>좌석 수</dt>
                  <dd className={`${styles.metaValue} num`}>
                    {store.seatCount !== undefined && store.seatCount !== null
                      ? `${formatNumber(store.seatCount)}석`
                      : '—'}
                  </dd>
                </div>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>개업일</dt>
                  <dd className={`${styles.metaValue} num`}>{formatDate(store.openedAt)}</dd>
                </div>
              </dl>
            </section>

            <nav className={styles.shortcuts}>
              <ListRow
                icon={<ChartIcon size={19} strokeWidth={1.8} />}
                title="운영 대시보드"
                description="운영 안정성 점수와 방문객·매출 지표"
                to={PATHS.dashboardOf(store.storeId)}
              />
              <ListRow
                icon={<DocumentIcon size={19} strokeWidth={1.8} />}
                title="금융기관용 리포트"
                description="운영 안정성 보조지표 요약과 근거"
                to={PATHS.report(store.storeId)}
              />
            </nav>

            <div className={styles.uploads}>
              <section className={styles.uploadBlock}>
                <h3 className={styles.uploadTitle}>
                  <span className={styles.uploadTitleIcon}>
                    <VideoIcon size={18} strokeWidth={1.9} />
                  </span>
                  매장 영상 업로드
                </h3>
                <p className={styles.uploadDesc}>
                  매장 내부 영상을 올리면 방문객 수와 체류 시간을 분석합니다. 분석에는 시간이 걸리며
                  진행 상태를 단계로 보여드립니다.
                </p>
                <VideoUploadSection storeId={store.storeId} />
              </section>

              <section className={styles.uploadBlock}>
                <h3 className={styles.uploadTitle}>
                  <span className={styles.uploadTitleIcon}>
                    <TableIcon size={18} strokeWidth={1.9} />
                  </span>
                  매출 CSV 업로드
                </h3>
                <p className={styles.uploadDesc}>
                  일자별 매출 데이터를 올리면 매출 지표와 객단가를 계산합니다. 같은 날짜의 데이터는
                  최신 값으로 덮어씁니다.
                </p>
                <SalesUploadSection storeId={store.storeId} />
              </section>
            </div>
          </>
        )}
      </PageBody>
    </>
  )
}
