import { useNavigate, useParams } from 'react-router-dom'
import { API_CODES, toApiError } from '@/api/client'
import { AlertIcon, DocumentIcon, InfoIcon } from '@/components/icons'
import { PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { ReportSkeleton } from '@/components/ui/Skeletons'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { ScoreGauge } from '@/components/score/ScoreGauge'
import { useReport, useStore } from '@/hooks/queries'
import { formatScore, roleLabel } from '@/lib/format'
import { gradeMeta, hasScore, riskMeta } from '@/lib/grade'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import styles from './ReportPage.module.css'

/**
 * 금융기관용 리포트.
 *
 * openapi.json 의 설명이 "신용등급이나 대출 판단이 아닌 참고용 지표"임을 명시하고 있어
 * 화면 상단과 하단 양쪽에 성격을 고지한다.
 */
export function ReportPage() {
  const { storeId: storeIdParam } = useParams<{ storeId: string }>()
  const storeId = Number(storeIdParam)
  const isValidId = Number.isInteger(storeId) && storeId > 0
  const role = useAuthStore((s) => s.session?.role)

  const report = useReport(isValidId ? storeId : null)
  const store = useStore(isValidId ? storeId : null)

  if (!isValidId) {
    return (
      <>
        <TopBar title="리포트" back backTo={PATHS.stores} bordered />
        <PageBody>
          <ErrorState title="주소가 잘못됐어요" message="매장 정보를 찾지 못했어요" />
        </PageBody>
      </>
    )
  }

  const data = report.data
  const meta = gradeMeta(data?.grade)
  const risk = riskMeta(data?.riskLevel)
  const evidence = (data?.evidence ?? []).filter((item) => item?.trim())

  return (
    <>
      <TopBar
        title="금융기관용 리포트"
        back
        backTo={PATHS.dashboardOf(storeId)}
        bordered
      />

      <PageBody>
        {report.isPending && <ReportSkeleton />}

        {report.isError && <ReportErrorState error={report.error} storeId={storeId} onRetry={() => report.refetch()} />}

        {data && (
          <>
            <p className={styles.disclaimerTop}>
              <span className={styles.disclaimerIcon}>
                <InfoIcon size={16} strokeWidth={2} />
              </span>
              운영 상태를 참고하는 지표예요. 신용등급이나 대출 심사 결과는 아니에요.
            </p>

            <section className={styles.scoreBlock}>
              <ScoreGauge
                score={data.operationScore}
                grade={data.grade}
                riskLevel={data.riskLevel}
                caption="운영 안정성 점수"
                showGrade={false}
                compact
              />
            </section>

            <div className={styles.summaryTable}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>매장</span>
                <span className={styles.summaryValue}>
                  {store.data?.name ?? `#${data.storeId}`}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>운영 안정성 점수</span>
                <span className={styles.summaryValue}>
                  {hasScore(data.operationScore) ? `${formatScore(data.operationScore)}점` : '—'}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>등급</span>
                <span className={styles.summaryValue} style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>위험도</span>
                <span className={styles.summaryValue}>{risk ? risk.value : '—'}</span>
              </div>
              {role && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>권한</span>
                  <span className={styles.summaryValue}>{roleLabel(role)}</span>
                </div>
              )}
            </div>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>종합 의견</h2>
              {data.summary?.trim() ? (
                <p className={styles.summaryText}>{data.summary.trim()}</p>
              ) : (
                <p className={styles.emptyText}>
                  종합 의견을 내려면 데이터가 더 필요해요
                </p>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>판단 근거</h2>
              {evidence.length > 0 ? (
                <ol className={styles.evidenceList}>
                  {evidence.map((item, index) => (
                    <li key={`${index}-${item.slice(0, 12)}`} className={styles.evidenceItem}>
                      <span className={styles.evidenceNumber}>{index + 1}</span>
                      <span className={styles.evidenceText}>{item.trim()}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.emptyText}>
                  아직 근거가 없어요. 영상이나 매출 파일을 올리면 함께 보여드려요.
                </p>
              )}
            </section>

            <div className={styles.usageNotice}>
              <span className={styles.usageNoticeTitle}>이용 안내</span>
              {data.usageNotice?.trim() ||
                '매장 운영 데이터로 계산한 참고 자료예요. 대출 심사나 신용평가 같은 금융 결정에는 다른 자료와 함께 활용해 주세요.'}
            </div>
          </>
        )}
      </PageBody>
    </>
  )
}

/**
 * 리포트 조회 실패를 성격별로 나눈다.
 *
 * 점수 산출 전에는 서버가 404 SCORE_NOT_READY 를 준다. 이건 장애가 아니라
 * "데이터를 더 올려야 한다"는 안내이므로 빨간 오류 화면으로 보여주면 안 된다.
 */
function ReportErrorState({
  error,
  storeId,
  onRetry,
}: {
  error: unknown
  storeId: number
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const apiError = toApiError(error)

  if (apiError.code === API_CODES.SCORE_NOT_READY) {
    return (
      <EmptyState
        icon={<DocumentIcon size={26} strokeWidth={1.8} />}
        title="리포트를 만들려면 데이터가 필요해요"
        description="매장 영상이나 매출 파일을 올리면 점수와 리포트를 만들어 드려요"
        action={
          <Button
            variant="brand"
            size="md"
            inline
            onClick={() => navigate(PATHS.storeDetail(storeId))}
          >
            데이터 올리기
          </Button>
        }
      />
    )
  }

  if (apiError.code === API_CODES.STORE_NOT_FOUND) {
    return (
      <EmptyState
        icon={<AlertIcon size={26} strokeWidth={1.8} />}
        title="매장을 찾지 못했어요"
        description="없어졌거나 볼 권한이 없는 매장이에요"
        action={
          <Button variant="secondary" size="md" inline onClick={() => navigate(PATHS.stores)}>
            내 매장으로 가기
          </Button>
        }
      />
    )
  }

  return <ErrorState title="리포트를 불러오지 못했어요" message={apiError.message} onRetry={onRetry} />
}
