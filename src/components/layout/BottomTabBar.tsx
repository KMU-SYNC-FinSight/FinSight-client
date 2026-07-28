import { NavLink } from 'react-router-dom'
import { ChartIcon, StoreIcon, UserIcon } from '@/components/icons'
import { PATHS } from '@/routes/paths'
import styles from './BottomTabBar.module.css'

const TABS = [
  { to: PATHS.stores, label: '내 매장', Icon: StoreIcon },
  { to: PATHS.dashboard, label: '대시보드', Icon: ChartIcon },
  { to: PATHS.my, label: '내 정보', Icon: UserIcon },
] as const

export function BottomTabBar() {
  return (
    <nav className={styles.bar} aria-label="주요 메뉴">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={styles.tab}
          // /stores 탭은 하위 경로(/stores/1, /stores/new)에서도 활성으로 보이게 한다.
          // 단 /stores/:id/dashboard 는 대시보드 탭이 맡으므로 end 판정을 직접 한다.
          end={false}
        >
          {({ isActive }) => (
            <span className={styles.tabInner}>
              {isActive && <span className={styles.indicator} />}
              <Icon size={23} strokeWidth={isActive ? 2.1 : 1.7} />
              <span className={styles.label}>{label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
