import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toApiError } from '@/api/client'
import { createStore } from '@/api/stores'
import { BUSINESS_TYPES, type BusinessType } from '@/api/types'
import { AlertIcon } from '@/components/icons'
import { Headline, PageBody, PageFooter } from '@/components/layout/PageBody'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from '@/hooks/queries'
import { businessTypeLabel } from '@/lib/format'
import {
  ADDRESS_MAX,
  STORE_NAME_MAX,
  validateAddress,
  validateOpenedAt,
  validateSeatCount,
  validateStoreName,
} from '@/lib/validation'
import { PATHS } from '@/routes/paths'
import { useAuthStore } from '@/store/authStore'
import styles from './StoreCreatePage.module.css'

const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPES.map((value) => ({
  value,
  label: businessTypeLabel(value),
}))

export function StoreCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const selectStore = useAuthStore((s) => s.selectStore)
  const toast = useToast()

  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [address, setAddress] = useState('')
  const [seatCount, setSeatCount] = useState('')
  const [openedAt, setOpenedAt] = useState('')
  const [touched, setTouched] = useState(false)

  const nameError = touched ? validateStoreName(name) : null
  const typeError = touched && !businessType ? '업종을 선택해 주세요.' : null
  const addressError = touched ? validateAddress(address) : null
  const seatError = touched ? validateSeatCount(seatCount) : null
  const openedAtError = touched ? validateOpenedAt(openedAt) : null

  // 필수 항목(이름·업종)이 채워지기 전에는 제출 버튼을 열지 않는다.
  const canSubmit = name.trim().length > 0 && businessType !== null

  const mutation = useMutation({
    mutationFn: createStore,
    onSuccess: async (store) => {
      selectStore(store.storeId)
      await queryClient.invalidateQueries({ queryKey: queryKeys.stores })
      toast.show('매장이 등록되었습니다.')
      // 등록 직후에는 업로드가 다음 할 일이므로 상세로 보낸다.
      navigate(PATHS.storeDetail(store.storeId), { replace: true })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)

    if (
      validateStoreName(name) ||
      !businessType ||
      validateAddress(address) ||
      validateSeatCount(seatCount) ||
      validateOpenedAt(openedAt)
    ) {
      return
    }

    // 선택 항목은 빈 값을 보내지 않고 아예 생략한다.
    mutation.mutate({
      name: name.trim(),
      businessType,
      ...(address.trim() ? { address: address.trim() } : {}),
      ...(seatCount.trim() ? { seatCount: Number(seatCount) } : {}),
      ...(openedAt ? { openedAt } : {}),
    })
  }

  const serverError = mutation.isError ? toApiError(mutation.error).message : null

  return (
    <>
      <TopBar title="매장 등록" back backTo={PATHS.stores} bordered />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <PageBody hasFooter>
          <div className={styles.inner}>
            <Headline
              title={'매장 정보를\n알려주세요.'}
              description="이름과 업종만 있으면 등록할 수 있습니다."
            />

            {serverError && (
              <p className={styles.serverError} role="alert">
                <span className={styles.serverErrorIcon}>
                  <AlertIcon size={17} strokeWidth={2} />
                </span>
                {serverError}
              </p>
            )}

            <div className={styles.fields}>
              <TextField
                label="매장 이름"
                type="text"
                placeholder="핀사이트 카페"
                value={name}
                error={nameError}
                counterMax={STORE_NAME_MAX}
                maxLength={STORE_NAME_MAX}
                onChange={(e) => setName(e.target.value)}
              />

              <ChipSelect
                label="업종"
                options={BUSINESS_TYPE_OPTIONS}
                value={businessType}
                onChange={setBusinessType}
                error={typeError}
              />

              <TextField
                label="주소"
                type="text"
                placeholder="서울특별시 성북구"
                value={address}
                error={addressError}
                hint="선택 항목입니다."
                maxLength={ADDRESS_MAX}
                onChange={(e) => setAddress(e.target.value)}
              />

              <TextField
                label="좌석 수"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="24"
                value={seatCount}
                error={seatError}
                hint="선택 항목입니다. 방문객 밀집도 계산에 사용됩니다."
                onChange={(e) => setSeatCount(e.target.value)}
              />

              <TextField
                label="개업일"
                type="date"
                value={openedAt}
                error={openedAtError}
                hint="선택 항목입니다."
                onChange={(e) => setOpenedAt(e.target.value)}
              />
            </div>
          </div>
        </PageBody>

        <PageFooter>
          <Button type="submit" loading={mutation.isPending} disabled={!canSubmit}>
            등록하기
          </Button>
        </PageFooter>
      </form>
    </>
  )
}
