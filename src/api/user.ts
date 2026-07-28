import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type { UserMeResponse } from './types'

export async function getMe(): Promise<UserMeResponse> {
  const { data } = await api.get<UserMeResponse>(ENDPOINTS.users.me)
  return data
}
