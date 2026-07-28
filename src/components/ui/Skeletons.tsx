import type { CSSProperties } from 'react'
import styles from './Skeletons.module.css'

/** 회색 막대 하나. width 는 % 나 px 문자열. */
export function Bar({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  const style: CSSProperties = { width: w, height: h }
  return <span className={styles.bar} style={style} />
}

/**
 * 매장 슬라이드 로딩.
 * 실제 카드(태그+이름 → 메타 → 점수 → 버튼 2개)와 같은 골격을 그린다.
 */
export function StoreListSkeleton() {
  return (
    <div className={styles.storeCardWrap} aria-hidden="true">
      <Bar w="34%" h={17} />
      <div className={styles.storeCard}>
        <div className={styles.storeCardHead}>
          <Bar w={44} h={22} />
          <Bar w="46%" h={18} />
        </div>
        <Bar w="72%" h={13} />
        <span className={styles.storeCardScore} />
        <div className={styles.storeCardActions}>
          <Bar w="100%" h={48} />
          <Bar w="100%" h={48} />
        </div>
      </div>
    </div>
  )
}

/**
 * 대시보드 로딩.
 * 게이지 → 설명 카드 → 지표 카드 순서로 실제 화면과 같은 자리를 잡는다.
 */
export function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.gaugeBlock}>
        <Bar w="40%" h={18} />
        <span className={styles.gaugeShape} />
        <Bar w="28%" h={24} />
        <Bar w="60%" h={13} />
      </div>

      <div className={styles.cardBlock}>
        <Bar w="34%" h={17} />
        <div className={styles.card}>
          <Bar w="30%" h={15} />
          <div className={styles.cardGrid}>
            <Bar w="70%" h={20} />
            <Bar w="60%" h={20} />
            <Bar w="65%" h={20} />
            <Bar w="55%" h={20} />
          </div>
        </div>
        <div className={styles.card}>
          <Bar w="24%" h={15} />
          <div className={styles.cardGrid}>
            <Bar w="80%" h={20} />
            <Bar w="50%" h={20} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** 리포트 로딩. */
export function ReportSkeleton() {
  return (
    <div aria-hidden="true" style={{ padding: '0 var(--gutter)' }}>
      <div className={styles.gaugeBlock} style={{ paddingInline: 0 }}>
        <span className={styles.gaugeShape} style={{ maxWidth: 216 }} />
      </div>
      <Bar w="100%" h={180} />
      <span style={{ display: 'block', height: 24 }} />
      <Bar w="32%" h={17} />
      <span style={{ display: 'block', height: 12 }} />
      <Bar w="100%" h={72} />
    </div>
  )
}
