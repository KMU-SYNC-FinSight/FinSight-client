import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from './types'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(ENDPOINTS.auth.login, body)
  return data
}

/** 응답에 토큰이 없다. 가입 성공 후 로그인을 별도로 해야 한다. */
export async function signup(body: SignupRequest): Promise<SignupResponse> {
  const { data } = await api.post<SignupResponse>(ENDPOINTS.auth.signup, body)
  return data
}
