/**
 * 아이콘.
 *
 * 예전에는 SVG path 를 직접 그렸는데, 좌표를 손으로 찍다 보니 아이콘마다
 * 획 굵기와 시각 무게가 미묘하게 어긋났다. 검증된 세트(lucide-react)로 교체했다.
 *
 * 여기는 얇은 어댑터 레이어다. 호출부는 그대로 `<StoreIcon size={20} />` 를 쓰고,
 * 아이콘을 바꾸고 싶으면 이 파일의 매핑만 고치면 된다.
 *
 * 이모지는 쓰지 않는다 — 플랫폼마다 모양이 달라 금융 UI 톤이 깨진다.
 */
import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gauge,
  Info,
  Landmark,
  LogOut,
  Pause,
  PiggyBank,
  Play,
  Plus,
  RotateCw,
  ShieldCheck,
  Store,
  TrendingUp,
  Upload,
  User,
  Video,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'

export interface IconProps {
  size?: number
  /** 기본 1.8. lucide 기본값(2)은 작은 크기에서 다소 무겁다. */
  strokeWidth?: number
  className?: string
}

/**
 * lucide 아이콘을 프로젝트 기본값(크기 24, 굵기 1.8, aria-hidden)으로 감싼다.
 * 아이콘은 항상 장식이므로 스크린리더에서 숨긴다 — 의미는 옆 텍스트가 전달한다.
 */
function adapt(Icon: LucideIcon) {
  return function Adapted({ size = 24, strokeWidth = 1.8, className }: IconProps) {
    return (
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        className={className}
        aria-hidden="true"
        focusable="false"
      />
    )
  }
}

export const StoreIcon = adapt(Store)
export const ChartIcon = adapt(BarChart3)
export const UserIcon = adapt(User)
export const ChevronRightIcon = adapt(ChevronRight)
export const ChevronLeftIcon = adapt(ChevronLeft)
export const PlusIcon = adapt(Plus)
export const VideoIcon = adapt(Video)
export const TableIcon = adapt(FileSpreadsheet)
export const UploadIcon = adapt(Upload)
export const CheckIcon = adapt(Check)
export const AlertIcon = adapt(AlertCircle)
export const InfoIcon = adapt(Info)
export const DocumentIcon = adapt(FileText)
export const SwapIcon = adapt(ArrowLeftRight)
export const LogoutIcon = adapt(LogOut)
export const RefreshIcon = adapt(RotateCw)
export const CloseIcon = adapt(X)
export const TrendIcon = adapt(TrendingUp)
export const PauseIcon = adapt(Pause)
export const PlayIcon = adapt(Play)

/* 금융기관 유형 타일용 */
export const BankIcon = adapt(Landmark)
export const SavingsIcon = adapt(PiggyBank)
export const CapitalIcon = adapt(Building2)
export const CardIcon = adapt(CreditCard)
export const GuaranteeIcon = adapt(ShieldCheck)
export const RatingIcon = adapt(Gauge)
export const FundIcon = adapt(Wallet)
