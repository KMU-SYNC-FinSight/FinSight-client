import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, UserRole } from '@/api/types'

interface AuthSession {
  accessToken: string
  /** 서버가 준 토큰 타입. 보통 "Bearer". */
  tokenType: string
  userId: number
  name: string
  role: UserRole
}

interface AuthState {
  session: AuthSession | null
  /**
   * 대시보드 탭이 어떤 매장을 보여줄지 기억한다.
   * 백엔드에 "기본 매장" 개념이 없어서 클라이언트가 들고 있는다.
   */
  selectedStoreId: number | null

  login: (res: LoginResponse) => void
  logout: () => void
  selectStore: (storeId: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      selectedStoreId: null,

      login: (res) =>
        set({
          session: {
            accessToken: res.accessToken,
            tokenType: res.tokenType || 'Bearer',
            userId: res.userId,
            name: res.name,
            role: res.role,
          },
        }),

      // 로그아웃 API 가 명세에 없다. 클라이언트에서 토큰을 폐기하는 것이 전부다.
      logout: () => set({ session: null, selectedStoreId: null }),

      selectStore: (storeId) => set({ selectedStoreId: storeId }),
    }),
    {
      name: 'finsight.auth',
      version: 1,
    },
  ),
)

/** React 밖(axios 인터셉터 등)에서 토큰을 읽기 위한 헬퍼. */
export function getAuthHeader(): string | null {
  const { session } = useAuthStore.getState()
  if (!session?.accessToken) return null
  return `${session.tokenType || 'Bearer'} ${session.accessToken}`
}

export function clearSession(): void {
  useAuthStore.getState().logout()
}
