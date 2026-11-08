import { useNavigate } from 'react-router-dom'
import { AlertIcon } from '@/components/icons'
import { PageBody } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'

export function NotFoundPage() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  return (
    <>
      <TopBar title="FinSight" bordered />
      <PageBody>
        <EmptyState
          icon={<AlertIcon size={26} strokeWidth={1.8} />}
          title="페이지를 찾지 못했어요"
          description="주소가 바뀌었거나 없어진 화면이에요"
          action={
            <Button
              variant="secondary"
              size="md"
              inline
              onClick={() => navigate(session ? PATHS.stores : PATHS.login, { replace: true })}
            >
              {session ? '내 매장으로 가기' : '로그인하러 가기'}
            </Button>
          }
        />
      </PageBody>
    </>
  )
}
