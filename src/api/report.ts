import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type { ReportResponse } from './types'

export async function getReport(storeId: number): Promise<ReportResponse> {
  const { data } = await api.get<ReportResponse>(ENDPOINTS.stores.report(storeId))
  return data
}
