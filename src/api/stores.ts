import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type { StoreCreateRequest, StoreResponse } from './types'

export async function getMyStores(): Promise<StoreResponse[]> {
  const { data } = await api.get<StoreResponse[]>(ENDPOINTS.stores.list)
  // 명세는 배열을 약속하지만 방어해 둔다 (빈 본문/객체가 오면 화면 전체가 죽는다).
  return Array.isArray(data) ? data : []
}

export async function getStore(storeId: number): Promise<StoreResponse> {
  const { data } = await api.get<StoreResponse>(ENDPOINTS.stores.detail(storeId))
  return data
}

export async function createStore(body: StoreCreateRequest): Promise<StoreResponse> {
  const { data } = await api.post<StoreResponse>(ENDPOINTS.stores.create, body)
  return data
}
