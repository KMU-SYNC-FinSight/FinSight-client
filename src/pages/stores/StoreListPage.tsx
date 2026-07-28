import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toApiError } from '@/api/client'
import type { DashboardResponse, StoreResponse } from '@/api/types'
import {
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  InfoIcon,
  PlusIcon,
  StoreIcon,
  TrendIcon,
  UploadIcon,
  UserIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { StoreListSkeleton } from '@/components/ui/Skeletons'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { useStoreDashboards, useStores } from '@/hooks/queries'
import {
  businessTypeLabel,
  formatCurrency,
  formatDate,
  formatNumber,
  formatScore,
} from '@/lib/format'
import { gradeMeta, hasScore } from '@/lib/grade'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import { PromoCarousel, type PromoSlide } from './PromoCarousel'
import styles from './StoreListPage.module.css'

/** 상단 안내를 닫으면 다시 띄우지 않는다. */
const PROMO_DISMISSED_KEY = 'finsight.promoDismissed'

export function StoreListPage() {
  const navigate = useNavigate()
  const name = useAuthStore((s) => s.session?.name)
  const { data: stores, isPending, isError, error, refetch } = useStores()

  // 매장별 점수를 카드와 요약에 함께 쓴다. 목록 API 에는 점수가 없다.
  const dashboards = useStoreDashboards((stores ?? []).map((s) => s.storeId))
  const dashboardOf = (storeId: number): DashboardResponse | undefined =>
    dashboards.find((q) => q.data?.storeId === storeId)?.data

  const [promoDismissed, setPromoDismissed] = useState(
    () => localStorage.getItem(PROMO_DISMISSED_KEY) === '1',
  )
  const dismissPromo = () => {
    localStorage.setItem(PROMO_DISMISSED_KEY, '1')
    setPromoDismissed(true)
  }

  const goToCreate = () => navigate(PATHS.storeNew)
  const hasStores = Boolean(stores && stores.length > 0)
  /** 빠른 메뉴가 가리킬 매장. 마지막으로 본 매장이 없으면 첫 매장. */
  const primaryStoreId = useAuthStore((s) => s.selectedStoreId) ?? stores?.[0]?.storeId ?? null

  const promoSlides: PromoSlide[] = [
    {
      title: '이 점수, 어디에 쓰이나요?',
      desc: (
        <>
          매장 데이터가 어떻게 지표가 되고
          <br />
          금융기관이 어떻게 참고하는지 알려드려요
        </>
      ),
      cta: '사용 방법 보기',
      icon: <TrendIcon size={26} strokeWidth={1.9} />,
      onClick: () => navigate(PATHS.guide),
    },
    {
      title: '영상만 올려도 방문객이 보여요',
      desc: (
        <>
          매장 내부 영상에서 방문객 수와
          <br />
          평균 체류 시간을 계산해 드려요
        </>
      ),
      cta: hasStores ? '영상 올리러 가기' : '매장 등록하러 가기',
      icon: <UploadIcon size={26} strokeWidth={1.9} />,
      onClick: () =>
        navigate(primaryStoreId ? PATHS.storeDetail(primaryStoreId) : PATHS.storeNew),
    },
    {
      title: '금융기관용 리포트로 정리돼요',
      desc: (
        <>
          점수와 근거를 한 장으로 묶어
          <br />
          그대로 보여줄 수 있어요
        </>
      ),
      cta: hasStores ? '리포트 보기' : '매장 등록하러 가기',
      icon: <DocumentIcon size={26} strokeWidth={1.9} />,
      onClick: () => navigate(primaryStoreId ? PATHS.report(primaryStoreId) : PATHS.storeNew),
    },
  ]

  return (
    <div className={styles.page}>
      {/* 이름을 누르면 내 정보로. 로고·인사말 없이 최소한만 둔다. */}
      <header className={styles.topRow}>
        <button type="button" className={styles.identity} onClick={() => navigate(PATHS.my)}>
          <span className={styles.identityName}>{name ? `${name}님` : '내 정보'}</span>
          <span className={styles.identityChevron}>
            <ChevronRightIcon size={20} strokeWidth={2.2} />
          </span>
        </button>
      </header>

      {!promoDismissed && <PromoCarousel slides={promoSlides} onClose={dismissPromo} />}

      {isPending && <StoreListSkeleton />}

      {isError && <ErrorState message={toApiError(error).message} onRetry={() => refetch()} />}

      {stores && stores.length === 0 && (
        <EmptyState
          icon={<StoreIcon size={26} strokeWidth={1.8} />}
          title="등록된 매장이 없습니다"
          description="매장을 등록하면 영상과 매출 데이터를 분석해 운영 안정성 점수를 계산합니다."
          action={
            <Button variant="brand" size="md" inline onClick={goToCreate}>
              <PlusIcon size={18} strokeWidth={2} />첫 매장 등록하기
            </Button>
          }
        />
      )}

      {hasStores && stores && (
        <>
          <SummaryStrip stores={stores} dashboardOf={dashboardOf} />
          <StoreCarousel stores={stores} dashboardOf={dashboardOf} />
          <TodoSection stores={stores} dashboardOf={dashboardOf} />
          <QuickMenu storeId={primaryStoreId} />

          <div className={styles.createArea}>
            <Button variant="secondary" size="md" onClick={goToCreate}>
              <PlusIcon size={18} strokeWidth={2} />
              매장 등록
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

type DashboardLookup = (storeId: number) => DashboardResponse | undefined

/** 전체 매장을 한 줄로 요약한다. 값은 이미 받아온 대시보드에서 계산한다. */
function SummaryStrip({
  stores,
  dashboardOf,
}: {
  stores: StoreResponse[]
  dashboardOf: DashboardLookup
}) {
  const scores = stores
    .map((s) => dashboardOf(s.storeId)?.operationScore)
    .filter((v): v is number => hasScore(v))

  const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  const waiting = stores.length - scores.length

  return (
    <dl className={styles.summary}>
      <div className={styles.summaryItem}>
        <dt className={styles.summaryLabel}>매장</dt>
        <dd className={`${styles.summaryValue} num`}>{formatNumber(stores.length)}곳</dd>
      </div>
      <span className={styles.summaryDivider} />
      <div className={styles.summaryItem}>
        <dt className={styles.summaryLabel}>평균 점수</dt>
        <dd className={`${styles.summaryValue} num`}>
          {average !== null ? formatScore(average) : '—'}
        </dd>
      </div>
      <span className={styles.summaryDivider} />
      <div className={styles.summaryItem}>
        <dt className={styles.summaryLabel}>분석 대기</dt>
        <dd className={`${styles.summaryValue} num`} data-tone={waiting > 0 ? 'attention' : 'calm'}>
          {formatNumber(waiting)}곳
        </dd>
      </div>
    </dl>
  )
}

/** 데이터가 없어 점수를 못 낸 매장을 모아 다음 할 일로 제안한다. */
function TodoSection({
  stores,
  dashboardOf,
}: {
  stores: StoreResponse[]
  dashboardOf: DashboardLookup
}) {
  const pending = stores.filter((s) => !hasScore(dashboardOf(s.storeId)?.operationScore))
  if (pending.length === 0) return null

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>지금 할 일</h2>
      <ul className={styles.todoList}>
        {pending.map((store) => (
          <li key={store.storeId}>
            <TodoRow store={store} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function TodoRow({ store }: { store: StoreResponse }) {
  const navigate = useNavigate()
  const selectStore = useAuthStore((s) => s.selectStore)

  return (
    <button
      type="button"
      className={styles.todoRow}
      onClick={() => {
        selectStore(store.storeId)
        navigate(PATHS.storeDetail(store.storeId))
      }}
    >
      <span className={styles.todoMark}>
        <UploadIcon size={18} strokeWidth={1.9} />
      </span>
      <span className={styles.todoBody}>
        <span className={styles.todoTitle}>{store.name}</span>
        <span className={styles.todoDesc}>영상·매출 데이터를 올리면 점수가 나와요</span>
      </span>
      <ChevronRightIcon size={18} strokeWidth={2} />
    </button>
  )
}

/** 자주 쓰는 화면 바로가기. */
function QuickMenu({ storeId }: { storeId: number | null }) {
  const navigate = useNavigate()
  if (storeId === null) return null

  const items = [
    { label: '대시보드', icon: <ChartIcon size={20} strokeWidth={1.9} />, to: PATHS.dashboardOf(storeId) },
    { label: '리포트', icon: <DocumentIcon size={20} strokeWidth={1.9} />, to: PATHS.report(storeId) },
    { label: '데이터 업로드', icon: <UploadIcon size={20} strokeWidth={1.9} />, to: PATHS.storeDetail(storeId) },
    { label: '사용 방법', icon: <InfoIcon size={20} strokeWidth={1.9} />, to: PATHS.guide },
  ]

  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>바로가기</h2>
      <div className={styles.quickGrid}>
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.quickItem}
            onClick={() => navigate(item.to)}
          >
            <span className={styles.quickIcon}>{item.icon}</span>
            <span className={styles.quickLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** 스크롤이 멈췄다고 볼 때까지 기다리는 시간. 이 뒤에 복제 카드 순간이동을 처리한다. */
const SETTLE_MS = 120

/**
 * 매장 슬라이드 — 사용자가 직접 넘기는 무한 순환. 자동으로 넘어가지 않는다.
 *
 * 네이티브 scroll-snap 은 끝에서 멈추므로 앞뒤에 복제 카드를 붙여 순환을 만든다.
 *
 *   DOM:  [3']  [1]  [2]  [3]  [1']      ' 는 복제
 *   idx:   0     1    2    3    4
 *
 * 3 에서 오른쪽으로 넘기면 복제 1' 로 부드럽게 이동하고, 스크롤이 멈춘 순간
 * 애니메이션 없이 진짜 1 로 순간이동시킨다. 두 카드가 같아서 보이지 않는다.
 *
 * scroll-snap-align: center 이므로 DOM 인덱스 i 의 스크롤 위치는 정확히 `i × step` 이다
 * (step = 카드 폭 + gap). 유도: P + i(C+G) − (W−C)/2 = i(C+G).
 */
function StoreCarousel({
  stores,
  dashboardOf,
}: {
  stores: StoreResponse[]
  dashboardOf: DashboardLookup
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const count = stores.length
  const loop = count > 1

  const slides = loop ? [stores[count - 1], ...stores, stores[0]] : stores
  const toReal = useCallback(
    (domIndex: number) => (loop ? (domIndex - 1 + count) % count : domIndex),
    [loop, count],
  )

  const stepOf = (track: HTMLElement) => {
    const cards = track.querySelectorAll<HTMLElement>('[data-slide]')
    if (cards.length < 2) return track.clientWidth
    return cards[1].offsetLeft - cards[0].offsetLeft
  }

  const scrollToDom = useCallback((domIndex: number, smooth: boolean) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: domIndex * stepOf(track), behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useLayoutEffect(() => {
    if (!loop) return
    scrollToDom(1, false)
  }, [loop, scrollToDom, count])

  const handleSettle = useCallback(() => {
    const track = trackRef.current
    if (!track || !loop) return
    const domIndex = Math.round(track.scrollLeft / stepOf(track))
    if (domIndex === 0) {
      scrollToDom(count, false)
    } else if (domIndex === count + 1) {
      scrollToDom(1, false)
    }
  }, [loop, count, scrollToDom])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setActive(toReal(Math.round(track.scrollLeft / stepOf(track))))
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(handleSettle, SETTLE_MS)
  }, [toReal, handleSettle])

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    },
    [],
  )

  const step = (delta: number) => {
    const track = trackRef.current
    if (!track) return
    const domIndex = Math.round(track.scrollLeft / stepOf(track))
    scrollToDom(domIndex + delta, true)
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.blockTitle}>내 매장</h2>
      </div>

      <div ref={trackRef} className={`${styles.track} no-scrollbar`} onScroll={handleScroll}>
        {slides.map((store, domIndex) => {
          const real = toReal(domIndex)
          return (
            <StoreCard
              key={`${store.storeId}-${domIndex}`}
              store={store}
              dashboard={dashboardOf(store.storeId)}
              index={real}
              total={count}
              isActive={real === active}
            />
          )
        })}
      </div>

      {loop && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerButton}
            onClick={() => step(-1)}
            aria-label="이전 매장"
          >
            <ChevronLeftIcon size={18} strokeWidth={2.2} />
          </button>
          <span className={styles.pagerLabel}>
            {active + 1} / {count}
          </span>
          <button
            type="button"
            className={styles.pagerButton}
            onClick={() => step(1)}
            aria-label="다음 매장"
          >
            <ChevronRightIcon size={18} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </section>
  )
}

function StoreCard({
  store,
  dashboard,
  index,
  total,
  isActive,
}: {
  store: StoreResponse
  dashboard: DashboardResponse | undefined
  index: number
  total: number
  isActive: boolean
}) {
  const navigate = useNavigate()
  const selectStore = useAuthStore((s) => s.selectStore)

  const open = (path: string) => {
    selectStore(store.storeId)
    navigate(path)
  }

  const meta =
    [
      store.address || null,
      store.seatCount != null ? `좌석 ${formatNumber(store.seatCount)}석` : null,
      store.openedAt ? `${formatDate(store.openedAt)} 개업` : null,
    ]
      .filter(Boolean)
      .join(' · ') || '추가 정보 없음'

  const scored = hasScore(dashboard?.operationScore)
  const grade = gradeMeta(dashboard?.grade)
  const visitors = dashboard?.visitorMetrics?.trackedObjectCount
  const sales = dashboard?.salesMetrics?.salesAmount

  return (
    <article
      className={styles.card}
      data-slide={index}
      data-active={isActive}
      aria-roledescription="슬라이드"
      aria-label={`${index + 1} / ${total} ${store.name}`}
    >
      <div className={styles.cardHead}>
        <span className={styles.cardTag}>{businessTypeLabel(store.businessType)}</span>
        <h3 className={styles.cardName}>{store.name}</h3>
      </div>
      <p className={styles.cardMeta}>{meta}</p>

      <div className={styles.cardScore}>
        {scored ? (
          <>
            <span className={`${styles.cardScoreValue} num`}>
              {formatScore(dashboard?.operationScore)}
            </span>
            <span className={styles.cardScoreUnit}>점</span>
            <span
              className={styles.cardGradePill}
              style={{ background: grade.bg, color: grade.color }}
            >
              {grade.label}
            </span>
          </>
        ) : (
          <span className={styles.cardScoreEmpty}>데이터를 올리면 점수가 계산돼요</span>
        )}
      </div>

      {/* 점수 밑에 핵심 지표 둘. 카드만 보고도 매장 상태가 감이 오게 한다. */}
      <dl className={styles.cardStats}>
        <div className={styles.cardStat}>
          <dt className={styles.cardStatLabel}>
            <UserIcon size={13} strokeWidth={2} />
            방문객
          </dt>
          <dd className={`${styles.cardStatValue} num`}>
            {visitors != null ? `${formatNumber(visitors)}명` : '—'}
          </dd>
        </div>
        <div className={styles.cardStat}>
          <dt className={styles.cardStatLabel}>
            <TrendIcon size={13} strokeWidth={2} />
            매출
          </dt>
          <dd className={`${styles.cardStatValue} num`}>{formatCurrency(sales)}</dd>
        </div>
      </dl>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.cardAction}
          data-variant="brand"
          onClick={() => open(PATHS.dashboardOf(store.storeId))}
        >
          대시보드
        </button>
        <button
          type="button"
          className={styles.cardAction}
          data-variant="quiet"
          onClick={() => open(PATHS.storeDetail(store.storeId))}
        >
          데이터 업로드
        </button>
      </div>
    </article>
  )
}
