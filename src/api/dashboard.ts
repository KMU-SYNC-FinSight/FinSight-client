import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type { DashboardResponse } from './types'

export async function getDashboard(storeId: number): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>(ENDPOINTS.stores.dashboard(storeId))
  return data
}
