import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { DashboardEntryPage } from '@/pages/dashboard/DashboardEntryPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { GuidePage } from '@/pages/guide/GuidePage'
import { MyPage } from '@/pages/my/MyPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ReportPage } from '@/pages/report/ReportPage'
import { SplashPage } from '@/pages/SplashPage'
import { StoreCreatePage } from '@/pages/stores/StoreCreatePage'
import { StoreDetailPage } from '@/pages/stores/StoreDetailPage'
import { StoreListPage } from '@/pages/stores/StoreListPage'
import { RedirectIfAuthed, RequireAuth } from '@/routes/RequireAuth'
import { RootLayout, StackLayout, TabLayout } from '@/routes/layouts'
import { PATHS } from '@/routes/paths'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<RootLayout />}>
            {/* 공개 화면 */}
            <Route element={<RedirectIfAuthed />}>
              <Route element={<StackLayout />}>
                <Route path={PATHS.login} element={<LoginPage />} />
                <Route path={PATHS.signup} element={<SignupPage />} />
              </Route>
            </Route>

            {/* 인증 필요 */}
            <Route element={<RequireAuth />}>
              {/* 하단 탭바가 함께 보이는 화면 */}
              <Route element={<TabLayout />}>
                <Route path={PATHS.stores} element={<StoreListPage />} />
                <Route path={PATHS.dashboard} element={<DashboardEntryPage />} />
                <Route path="/dashboard/:storeId" element={<DashboardPage />} />
                <Route path={PATHS.my} element={<MyPage />} />
              </Route>

              {/* 위로 쌓이는 화면 (탭바 없음) */}
              <Route element={<StackLayout />}>
                <Route path={PATHS.storeNew} element={<StoreCreatePage />} />
                <Route path="/stores/:storeId" element={<StoreDetailPage />} />
                <Route path="/report/:storeId" element={<ReportPage />} />
                <Route path={PATHS.guide} element={<GuidePage />} />
              </Route>
            </Route>

            {/* 앱 진입점. 브랜드 스플래시를 잠깐 보여준 뒤 세션에 따라 분기한다. */}
            <Route path="/" element={<SplashPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
