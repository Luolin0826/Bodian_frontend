// src/api/modules/auth.ts
import request from '@/api/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  user: {
    id: number
    username: string
    real_name: string
    role: 'admin' | 'sales' | 'teacher' | 'viewer'
    avatar?: string
    role_display_name?: string
    department_name?: string
    last_login?: string
  }
}

export const authApi = {
  login: (data: LoginParams) => 
    request.post<any, LoginResponse>('/api/v1/auth/login', data),
  
  // 登出
  logout: () => 
    request.post('/api/v1/auth/logout'),
  
  // 刷新token
  refresh: () => 
    request.post('/api/v1/auth/refresh'),
  
  // 获取用户信息
  getUserInfo: () => 
    request.get('/api/v1/auth/me')
}