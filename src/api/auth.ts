import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  KakaoLoginRequest,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from './types'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(ENDPOINTS.auth.login, body)
  return data
}

/** 카카오 인가 코드로 로그인(또는 자동 가입)한다. */
export async function kakaoLogin(body: KakaoLoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(ENDPOINTS.auth.kakao, body)
  return data
}

/** 응답에 토큰이 없다. 가입 성공 후 로그인을 별도로 해야 한다. */
export async function signup(body: SignupRequest): Promise<SignupResponse> {
  const { data } = await api.post<SignupResponse>(ENDPOINTS.auth.signup, body)
  return data
}
