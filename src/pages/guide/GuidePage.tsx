import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BankIcon,
  CapitalIcon,
  CardIcon,
  ChartIcon,
  DocumentIcon,
  FundIcon,
  GuaranteeIcon,
  InfoIcon,
  RatingIcon,
  SavingsIcon,
  TrendIcon,
  UploadIcon,
} from '@/components/icons'
import { PageBody, PageFooter } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { useStores } from '@/hooks/queries'
import { PATHS } from '@/routes/paths'
import styles from './GuidePage.module.css'

/**
 * 금융기관 유형 타일.
 *
 * 실제 은행 로고를 쓰지 않는다. 특정 은행 로고를 "이 점수를 참고합니다" 옆에 붙이면
 * 존재하지 않는 제휴를 사실처럼 보여주게 되고 상표 문제도 생긴다.
 * 기관 "유형"만 보여주는 것으로 충분히 같은 메시지가 전달된다.
 */
/*
 * 타일이 컨테이너(408px)보다 넓어야 흐름이 보인다.
 * 7개 × 72px + gap 12px = 576px. 개수를 줄이면 흐를 게 없어진다.
 */
const INSTITUTIONS: { label: string; icon: ReactNode; color: string; bg: string }[] = [
  { label: '은행', icon: <BankIcon size={26} strokeWidth={1.7} />, color: 'var(--info)', bg: 'var(--info-bg)' },
  { label: '저축은행', icon: <SavingsIcon size={26} strokeWidth={1.7} />, color: 'var(--positive)', bg: 'var(--positive-bg)' },
  { label: '캐피탈', icon: <CapitalIcon size={26} strokeWidth={1.7} />, color: 'var(--brand-ink)', bg: 'var(--brand-dim)' },
  // --warning 은 이 배경 위에서 2.71:1 로 그래픽 최소 대비(3:1)에 못 미친다.
  { label: '카드사', icon: <CardIcon size={26} strokeWidth={1.7} />, color: 'var(--on-warning-bg)', bg: 'var(--warning-bg)' },
  { label: '보증재단', icon: <GuaranteeIcon size={26} strokeWidth={1.7} />, color: 'var(--ink-2)', bg: 'var(--neutral-bg)' },
  { label: '신용평가사', icon: <RatingIcon size={26} strokeWidth={1.7} />, color: 'var(--info)', bg: 'var(--info-bg)' },
  { label: '정책자금', icon: <FundIcon size={26} strokeWidth={1.7} />, color: 'var(--positive)', bg: 'var(--positive-bg)' },
]

const STEPS = [
  {
    icon: <UploadIcon size={19} strokeWidth={1.9} />,
    title: '매장 데이터를 올려요',
    desc: '매장 내부 영상과 일자별 매출 CSV를 업로드합니다.',
  },
  {
    icon: <ChartIcon size={19} strokeWidth={1.9} />,
    title: '방문객과 매출을 분석해요',
    desc: '영상에서 방문객 수·체류 시간을, CSV에서 매출 흐름을 계산합니다.',
  },
  {
    icon: <DocumentIcon size={19} strokeWidth={1.9} />,
    title: '점수와 근거가 나와요',
    desc: '운영 안정성 점수와 그렇게 나온 이유를 함께 보여드립니다.',
  },
]

function InstitutionTile({
  item,
  ariaHidden = false,
}: {
  item: (typeof INSTITUTIONS)[number]
  ariaHidden?: boolean
}) {
  return (
    <div className={styles.tile} aria-hidden={ariaHidden || undefined}>
      <span className={styles.tileMark} style={{ background: item.bg, color: item.color }}>
        {item.icon}
      </span>
      <span className={styles.tileLabel}>{item.label}</span>
    </div>
  )
}

export function GuidePage() {
  const navigate = useNavigate()
  const { data: stores } = useStores()
  const hasStores = Boolean(stores && stores.length > 0)

  return (
    <div className={styles.page}>
      <TopBar title="사용 방법" back backTo={PATHS.stores} />

      <PageBody flush hasFooter>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h2 className={styles.heroTitle}>{'매장 운영 데이터가\n금융기관의 참고 자료가 됩니다'}</h2>
            <p className={styles.heroSub}>매출과 방문 흐름을 하나의 지표로 정리해 드려요</p>
          </div>

          {/*
            같은 목록을 두 벌 이어 붙이고 -50% 를 밀어 이음매 없이 흐르게 한다.
            두 번째 벌은 화면 낭독기에 중복으로 읽히지 않도록 숨긴다.
          */}
          <div className={`${styles.tiles} no-scrollbar`}>
            <div className={styles.tileRow}>
              {INSTITUTIONS.map((item) => (
                <InstitutionTile key={item.label} item={item} />
              ))}
              {INSTITUTIONS.map((item) => (
                <InstitutionTile key={`${item.label}-dup`} item={item} ariaHidden />
              ))}
            </div>
          </div>
        </section>

        {/* 아래 섹션들은 스크롤해 들어올 때 하나씩 떠오른다. */}
        <Reveal>
          <section className={styles.section}>
            <span className={styles.sectionKicker}>사장님</span>
            <h3 className={styles.sectionTitle}>{'점수를 보면서\n매장을 관리해요'}</h3>
            <p className={styles.sectionDesc}>
              데이터를 올릴 때마다 운영 안정성 점수가 갱신됩니다. 방문객이 줄었는지, 매출 흐름이
              흔들리는지 숫자로 확인하고 대응할 수 있어요.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.section}>
            <span className={styles.sectionKicker}>금융기관</span>
            <h3 className={styles.sectionTitle}>{'재무제표 밖의\n운영 상태를 봅니다'}</h3>
            <p className={styles.sectionDesc}>
              매장이 실제로 어떻게 돌아가는지는 서류만으로 알기 어렵습니다. 현장 데이터로 만든
              보조지표가 그 공백을 메웁니다.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>어떻게 만들어지나요?</h3>
            <ol className={styles.steps}>
              {/* Reveal 은 div 를 그리므로 ol 의 직계 자식이 되면 안 된다 (li 만 허용).
                  li 안쪽에 두고 스텝 스타일을 그 아래 div 로 옮겼다. */}
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  {/* 세 단계는 순서대로 올라와야 "1 → 2 → 3" 흐름이 읽힌다. */}
                  <Reveal delay={i * 90}>
                    <div className={styles.step}>
                      <span className={styles.stepMark}>{step.icon}</span>
                      <span className={styles.stepBody}>
                        <span className={styles.stepTitle}>{step.title}</span>
                        <span className={styles.stepDesc}>{step.desc}</span>
                      </span>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <p className={styles.notice}>
            <span className={styles.noticeIcon}>
              <InfoIcon size={16} strokeWidth={2} />
            </span>
            FinSight 점수는 운영 상태를 참고하기 위한 보조지표입니다. 신용등급이나 대출 심사 결과가
            아니며, 표시된 기관 유형은 활용 예시로 실제 제휴를 뜻하지 않습니다.
          </p>
        </Reveal>
      </PageBody>

      <PageFooter>
        <Button
          variant="brand"
          onClick={() => navigate(hasStores ? PATHS.stores : PATHS.storeNew)}
        >
          <TrendIcon size={18} strokeWidth={2} />
          {hasStores ? '내 매장 점수 확인하기' : '매장 등록하고 시작하기'}
        </Button>
      </PageFooter>
    </div>
  )
}
