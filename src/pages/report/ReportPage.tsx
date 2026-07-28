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
          <ErrorState title="잘못된 주소입니다" message="매장 정보를 찾을 수 없습니다." />
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
              이 리포트는 운영 안정성을 참고하기 위한 보조지표입니다. 신용등급이나 대출 심사 결과가
              아닙니다.
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
                <span className={styles.summaryValue}>{risk ? risk.label : '—'}</span>
              </div>
              {role && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>조회 권한</span>
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
                  아직 종합 의견을 낼 만큼 데이터가 모이지 않았습니다.
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
                  제시할 근거가 없습니다. 영상과 매출 데이터를 업로드하면 근거가 함께 산출됩니다.
                </p>
              )}
            </section>

            <div className={styles.usageNotice}>
              <span className={styles.usageNoticeTitle}>이용 안내</span>
              {data.usageNotice?.trim() ||
                '본 지표는 매장 운영 데이터를 기반으로 산출된 참고 자료입니다. 여신 심사, 신용평가 등 금융 의사결정의 단독 근거로 사용할 수 없습니다.'}
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
        title="아직 리포트를 만들 수 없습니다"
        description={apiError.message}
        action={
          <Button
            variant="brand"
            size="md"
            inline
            onClick={() => navigate(PATHS.storeDetail(storeId))}
          >
            데이터 업로드하기
          </Button>
        }
      />
    )
  }

  if (apiError.code === API_CODES.STORE_NOT_FOUND) {
    return (
      <EmptyState
        icon={<AlertIcon size={26} strokeWidth={1.8} />}
        title="매장을 찾을 수 없습니다"
        description="삭제되었거나 접근 권한이 없는 매장입니다."
        action={
          <Button variant="secondary" size="md" inline onClick={() => navigate(PATHS.stores)}>
            내 매장으로
          </Button>
        }
      />
    )
  }

  return <ErrorState message={apiError.message} onRetry={onRetry} />
}
