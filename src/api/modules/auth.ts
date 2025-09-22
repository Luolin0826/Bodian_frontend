// src/api/modules/auth.ts
import request from '@/api/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  session_id?: string  // 新增会话ID字段
  user: {
    id: number
    username: string
    real_name?: string
    role: 'super_admin' | 'admin' | 'manager' | 'sales' | 'teacher' | 'viewer'
    avatar?: string
    role_display_name?: string
    department_name?: string
    last_login?: string
  }
}

// 权限相关接口类型定义
export interface PermissionTreeResponse {
  code: number
  message: string
  data: {
    menu_permissions: any[]
    operation_modules: any[]
    data_scopes: string[]
    sensitive_fields: string[]
  }
}

export interface PermissionTemplate {
  name: string
  display_name: string
  description: string
  permissions: {
    menu: string[]
    operation: Record<string, string[]>
    data: any
  }
}

export interface PermissionTemplatesResponse {
  code: number
  message: string
  data: {
    templates: PermissionTemplate[]
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
    request.get('/api/v1/auth/me'),

  // 获取权限树结构
  getPermissionTree: (): Promise<PermissionTreeResponse> =>
    request.get('/api/v1/roles/permissions/tree'),

  // 获取权限模板
  getPermissionTemplates: (): Promise<PermissionTemplatesResponse> =>
    request.get('/api/v1/roles/templates'),

  // 验证权限配置
  validatePermissions: (permissions: any) =>
    request.post('/api/v1/roles/validate-permissions', permissions)
}