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
          <ErrorState title="주소가 잘못됐어요" message="매장 정보를 찾지 못했어요" />
        </PageBody>
      </>
    )
  }

  return (
    <>
      <TopBar title="매장 상세" back backTo={PATHS.stores} bordered />

      <PageBody>
        {isPending && <LoadingState label="매장 정보를 불러오고 있어요" />}

        {isError &&
          // 남의 매장이나 없는 매장은 404 STORE_NOT_FOUND 로 온다. 장애가 아니므로 안내로 처리한다.
          (toApiError(error).code === API_CODES.STORE_NOT_FOUND ? (
            <ErrorState
              title="매장을 찾지 못했어요"
              message="없어졌거나 볼 권한이 없는 매장이에요"
            />
          ) : (
            <ErrorState
              title="매장 정보를 불러오지 못했어요"
              message={toApiError(error).message}
              onRetry={() => refetch()}
            />
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
                title="대시보드"
                description="운영 점수와 방문객·매출 보기"
                to={PATHS.dashboardOf(store.storeId)}
              />
              <ListRow
                icon={<DocumentIcon size={19} strokeWidth={1.8} />}
                title="금융기관용 리포트"
                description="금융기관에 보여줄 점수와 근거"
                to={PATHS.report(store.storeId)}
              />
            </nav>

            <div className={styles.uploads}>
              <section className={styles.uploadBlock}>
                <h3 className={styles.uploadTitle}>
                  <span className={styles.uploadTitleIcon}>
                    <VideoIcon size={18} strokeWidth={1.9} />
                  </span>
                  매장 영상 올리기
                </h3>
                <p className={styles.uploadDesc}>
                  매장 안을 찍은 영상을 올리면 방문객 수와 머문 시간을 분석해요
                </p>
                <VideoUploadSection storeId={store.storeId} />
              </section>

              <section className={styles.uploadBlock}>
                <h3 className={styles.uploadTitle}>
                  <span className={styles.uploadTitleIcon}>
                    <TableIcon size={18} strokeWidth={1.9} />
                  </span>
                  매출 파일 올리기
                </h3>
                <p className={styles.uploadDesc}>
                  날짜별 매출 CSV를 올리면 매출 흐름과 방문객당 매출을 계산해요
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
