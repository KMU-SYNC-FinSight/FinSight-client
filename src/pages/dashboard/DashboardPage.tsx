import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_CODES, isApiCode, toApiError } from '@/api/client'
import type { DashboardResponse } from '@/api/types'
import {
  DocumentIcon,
  HelpIcon,
  StoreIcon,
  SwapIcon,
  TableIcon,
  UserIcon,
} from '@/components/icons'
import { PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { DashboardSkeleton } from '@/components/ui/Skeletons'
import { ErrorState } from '@/components/ui/States'
import { ListRow } from '@/components/ui/Surface'
import { MetricCard, type Metric } from '@/components/dashboard/MetricGrid'
import { ScoreCarousel } from '@/components/score/ScoreCarousel'
import { ScoreFormulaSheet } from '@/components/score/ScoreFormulaSheet'
import { ScoreGauge } from '@/components/score/ScoreGauge'
import { useDashboard, useReport } from '@/hooks/queries'
import {
  congestionLabel,
  congestionTone,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPeople,
} from '@/lib/format'
import { buildSlides } from '@/lib/slides'
import { PATHS } from '@/routes/paths'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const navigate = useNavigate()
  const { storeId: storeIdParam } = useParams<{ storeId: string }>()
  const storeId = Number(storeIdParam)
  const isValidId = Number.isInteger(storeId) && storeId > 0

  const dashboard = useDashboard(isValidId ? storeId : null)
  // 게이지 옆 슬라이드에 쓸 summary/evidence 는 리포트 API 에만 있어 함께 호출한다.
  const report = useReport(isValidId ? storeId : null)

  if (!isValidId) {
    return (
      <>
        <TopBar title="대시보드" bordered />
        <PageBody>
          <ErrorState title="잘못된 주소입니다" message="매장 정보를 찾을 수 없습니다." />
        </PageBody>
      </>
    )
  }

  const data = dashboard.data

  return (
    <>
      <TopBar
        title="운영 대시보드"
        bordered
        actions={
          <button
            type="button"
            className={styles.storeSwitch}
            onClick={() => navigate(PATHS.stores)}
          >
            <SwapIcon size={15} strokeWidth={2} />
            매장 변경
          </button>
        }
      />

      <PageBody>
        {dashboard.isPending && <DashboardSkeleton />}

        {dashboard.isError && (
          <ErrorState
            message={toApiError(dashboard.error).message}
            onRetry={() => dashboard.refetch()}
          />
        )}

        {data && (
          <>
            <section className={styles.gaugeBlock}>
              {data.storeName && <p className={styles.storeName}>{data.storeName}</p>}
              <ScoreGauge
                score={data.operationScore}
                grade={data.grade}
                riskLevel={data.riskLevel}
              />
            </section>

            <ScoreExplanation
              summary={report.data?.summary}
              evidence={report.data?.evidence}
              isPending={report.isPending}
              error={report.isError ? report.error : null}
              storeId={storeId}
            />

            <div className={styles.metrics}>
              <h2 className={styles.metricsTitle}>방문객 · 매출 지표</h2>

              <MetricCard
                title="방문객"
                icon={<UserIcon size={17} strokeWidth={1.9} />}
                emptyNotice="아직 분석된 방문객 데이터가 없습니다. 매장 영상을 업로드하면 방문객 지표가 채워집니다."
                metrics={visitorMetrics(data)}
              />

              <MetricCard
                title="매출"
                icon={<TableIcon size={17} strokeWidth={1.9} />}
                emptyNotice="아직 등록된 매출 데이터가 없습니다. 매출 CSV를 업로드하면 매출 지표가 채워집니다."
                metrics={salesMetrics(data)}
              />
            </div>

            <nav className={styles.reportLink}>
              <ListRow
                icon={<DocumentIcon size={19} strokeWidth={1.8} />}
                title="금융기관용 리포트"
                description="운영 안정성 보조지표 요약과 근거"
                to={PATHS.report(storeId)}
              />
              <ListRow
                icon={<StoreIcon size={19} strokeWidth={1.8} />}
                title="데이터 업로드"
                description="영상 · 매출 CSV 추가하기"
                to={PATHS.storeDetail(storeId)}
              />
            </nav>
          </>
        )}
      </PageBody>
    </>
  )
}

/** 게이지 아래 설명 슬라이드. 리포트 호출 결과에 따라 상태를 나눈다. */
function ScoreExplanation({
  summary,
  evidence,
  isPending,
  error,
  storeId,
}: {
  summary?: string | null
  evidence?: string[] | null
  isPending: boolean
  error: unknown
  storeId: number
}) {
  const [formulaOpen, setFormulaOpen] = useState(false)
  const slides = buildSlides(summary ?? undefined, evidence ?? undefined)

  // 점수 산출 전에는 리포트가 404 SCORE_NOT_READY 로 온다.
  // 이건 오류가 아니라 "데이터를 더 올려야 한다"는 정상 상태다.
  const notReady = error !== null && isApiCode(error, API_CODES.SCORE_NOT_READY)
  const realError = error !== null && !notReady

  return (
    <section className={styles.carouselBlock}>
      <div className={styles.carouselHead}>
        <div className={styles.carouselTitleGroup}>
          <h2 className={styles.carouselTitle}>이 점수는 이렇게 나왔어요</h2>
          {/* 배점표는 상시 노출하지 않는다 — 필요할 때만 시트로 열어 본다 */}
          <button
            type="button"
            className={styles.helpButton}
            onClick={() => setFormulaOpen(true)}
            aria-label="점수 산출 방식 보기"
          >
            <HelpIcon size={18} strokeWidth={1.9} />
          </button>
        </div>
        {!isPending && !error && slides.length > 1 && (
          <span className={styles.carouselHint}>옆으로 넘겨보세요</span>
        )}
      </div>

      <ScoreFormulaSheet open={formulaOpen} onClose={() => setFormulaOpen(false)} />

      {isPending && <p className={styles.carouselFallback}>점수 설명을 불러오는 중입니다.</p>}

      {!isPending && notReady && (
        <p className={styles.carouselFallback}>
          아직 점수를 산출할 데이터가 부족합니다.{' '}
          <Link to={PATHS.storeDetail(storeId)} className={styles.inlineLink}>
            영상·매출 데이터를 업로드
          </Link>
          하면 점수와 근거가 이곳에 표시됩니다.
        </p>
      )}

      {!isPending && realError && (
        <p className={styles.carouselFallback}>
          점수 설명을 불러오지 못했습니다. 지표는 아래에서 확인할 수 있습니다.
        </p>
      )}

      {!isPending && !error && slides.length === 0 && (
        <p className={styles.carouselFallback}>
          점수를 설명할 근거가 아직 없습니다. 영상과 매출 데이터를 업로드하면 분석 결과가 이곳에
          표시됩니다.
        </p>
      )}

      {!isPending && !error && slides.length > 0 && <ScoreCarousel slides={slides} />}
    </section>
  )
}

function visitorMetrics(data: DashboardResponse): Metric[] {
  const v = data.visitorMetrics
  return [
    { label: '평균 체류 인원', value: formatPeople(v?.averageOccupancy) },
    { label: '최대 동시 인원', value: formatPeople(v?.peakOccupancy) },
    {
      label: '분석된 방문객',
      value: v?.trackedObjectCount !== undefined ? `${formatNumber(v.trackedObjectCount)}명` : '—',
      note: '영상에서 추적된 객체 수',
    },
    { label: '평균 체류 시간', value: formatDuration(v?.averageDwellSeconds) },
    {
      label: '혼잡도',
      value: congestionLabel(v?.congestionLevel),
      full: true,
      render: v?.congestionLevel ? (
        <span style={{ display: 'block', marginTop: 6 }}>
          <Badge tone={congestionTone(v.congestionLevel)} size="lg">
            {congestionLabel(v.congestionLevel)}
          </Badge>
        </span>
      ) : undefined,
    },
  ]
}

function salesMetrics(data: DashboardResponse): Metric[] {
  const s = data.salesMetrics
  return [
    { label: '매출액', value: formatCurrency(s?.salesAmount), full: true },
    {
      label: '거래 건수',
      value: s?.transactionCount !== undefined ? `${formatNumber(s.transactionCount)}건` : '—',
    },
    {
      label: '방문객당 매출',
      value: formatCurrency(s?.salesPerTrackedObject),
      note: '매출액 ÷ 분석된 방문객',
    },
  ]
}
