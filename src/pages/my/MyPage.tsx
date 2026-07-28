import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toApiError } from '@/api/client'
import type { AuthProvider, UserStatus } from '@/api/types'
import { InfoIcon, LogoutIcon } from '@/components/icons'
import { PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { ListRow } from '@/components/ui/Surface'
import { useMe } from '@/hooks/queries'
import { roleLabel } from '@/lib/format'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import styles from './MyPage.module.css'

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  LOCAL: '이메일',
  KAKAO: '카카오',
}

const STATUS_META: Record<UserStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: '정상', tone: 'positive' },
  SUSPENDED: { label: '이용 정지', tone: 'warning' },
  WITHDRAWN: { label: '탈퇴', tone: 'danger' },
}

export function MyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const { data: me, isPending, isError, error, refetch } = useMe()

  const handleLogout = () => {
    // 로그아웃 API 가 명세에 없다. 토큰을 지우고 캐시를 비우는 것이 전부다.
    logout()
    queryClient.clear()
    navigate(PATHS.login, { replace: true })
  }

  const status = me?.status ? STATUS_META[me.status] : null

  return (
    <>
      <TopBar title="내 정보" bordered />

      <PageBody>
        {isPending && <LoadingState label="내 정보를 불러오는 중" />}

        {isError && <ErrorState message={toApiError(error).message} onRetry={() => refetch()} />}

        {me && (
          <>
            <div className={styles.header}>
              <div className={styles.profile}>
                <span className={styles.avatar} aria-hidden="true">
                  {me.name?.trim().charAt(0) || '?'}
                </span>
                <div className={styles.profileBody}>
                  <p className={styles.name}>{me.name}</p>
                  <p className={styles.email}>{me.email}</p>
                </div>
              </div>
            </div>

            <p className={styles.sectionLabel}>계정 정보</p>
            <div className={styles.infoTable}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>권한</span>
                <span className={styles.infoValue}>{roleLabel(me.role)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>로그인 방식</span>
                <span className={styles.infoValue}>
                  {PROVIDER_LABELS[me.provider] ?? me.provider}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>계정 상태</span>
                <span className={styles.infoValue}>
                  {status ? <Badge tone={status.tone}>{status.label}</Badge> : me.status}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>회원 번호</span>
                <span className={`${styles.infoValue} num`}>{me.userId}</span>
              </div>
            </div>

            {/* 메인의 소개 카드를 닫아도 사용 방법에 다시 들어올 수 있어야 한다. */}
            <nav className={styles.links}>
              <ListRow
                icon={<InfoIcon size={19} strokeWidth={1.8} />}
                title="사용 방법"
                description="점수가 만들어지는 과정과 활용처"
                to={PATHS.guide}
              />
            </nav>

            <div className={styles.actions}>
              <Button variant="secondary" size="md" onClick={handleLogout}>
                <LogoutIcon size={18} strokeWidth={1.9} />
                로그아웃
              </Button>
            </div>

            <p className={styles.appMeta}>FinSight · 매장 운영 분석 서비스</p>
          </>
        )}
      </PageBody>
    </>
  )
}
