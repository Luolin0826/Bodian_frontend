import request from './request'

// 用户个人信息接口
export interface UserProfile {
  id: number
  username: string
  real_name: string
  email: string
  phone: string
  avatar: string
  role: string
  role_display_name: string
  department_id: number
  department_name: string
  employee_no: string
  hire_date: string
  last_login: string
  login_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  real_name?: string
  email?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  confirm_password: string
}

// 用户偏好设置接口
export interface UserPreferences {
  appearance: {
    theme_mode: 'light' | 'dark'
    sidebar_collapsed: boolean
    show_breadcrumb: boolean
    language: string
    font_size: 'small' | 'medium' | 'large'
  }
  notification: {
    system_notification: boolean
    email_notification: boolean
    sound_notification: boolean
    browser_notification: boolean
  }
  security: {
    auto_logout_time: number
    session_timeout: number
    enable_two_factor: boolean
  }
  workspace: {
    default_page: string
    items_per_page: number
    date_format: string
    time_format: '12h' | '24h'
  }
}

// 通知相关接口
export interface Notification {
  id: number
  type: 'system' | 'email' | 'push'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  is_read: boolean
  sender: string
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
  page: number
  per_page: number
  pages: number
}

export interface UnreadCountResponse {
  total_unread: number
  system_unread: number
  email_unread: number
  push_unread: number
}

// 登录日志接口
export interface LoginLog {
  id: number
  login_time: string
  logout_time?: string
  ip_address: string
  user_agent: string
  location: string
  device_type: string
  status: 'success' | 'failed'
}

export interface LoginLogResponse {
  logs: LoginLog[]
  total: number
  page: number
  per_page: number
  pages: number
  current_session: {
    session_id: string
    login_time: string
    ip_address: string
    expires_at: string
  }
}

// 活跃会话接口
export interface ActiveSession {
  id: number
  session_id: string
  ip_address: string
  device_fingerprint: string
  is_current: boolean
  created_at: string
  last_activity: string
  expires_at: string
}

export interface ActiveSessionsResponse {
  sessions: ActiveSession[]
  total: number
}

// 安全设置接口
export interface SecuritySettings {
  password_strength: string
  last_password_change: string
  password_expires_in: number
  two_factor_enabled: boolean
  security_questions_set: boolean
  failed_login_attempts: number
  account_locked_until: string | null
  trusted_devices: number
  login_stats: {
    total_logins: number
    failed_logins: number
    success_rate: number
  }
}

// API 方法

// 个人信息相关
export const getUserProfile = (): Promise<{ code: number; message: string; data: UserProfile }> => {
  return request.get('/api/v1/user/profile')
}

export const updateUserProfile = (data: UpdateProfileRequest): Promise<{ code: number; message: string }> => {
  return request.put('/api/v1/user/profile', data)
}

export const changePassword = (data: ChangePasswordRequest): Promise<{ code: number; message: string }> => {
  return request.post('/api/v1/user/change-password', data)
}

// 偏好设置相关
export const getUserPreferences = (): Promise<{ code: number; message: string; data: UserPreferences }> => {
  return request.get('/api/v1/user/preferences')
}

export const updateUserPreferences = (data: Partial<UserPreferences>): Promise<{ code: number; message: string }> => {
  return request.put('/api/v1/user/preferences', data)
}

export const resetUserPreferences = (): Promise<{ code: number; message: string }> => {
  return request.post('/api/v1/user/preferences/reset')
}

// 通知相关
export interface NotificationQueryParams {
  page?: number
  per_page?: number
  type?: 'system' | 'email' | 'push' | 'all'
  status?: 'read' | 'unread' | 'all'
  start_date?: string
  end_date?: string
}

export const getNotifications = (params?: NotificationQueryParams): Promise<{ code: number; message: string; data: NotificationListResponse }> => {
  return request.get('/api/v1/notifications', { params })
}

export const getUnreadCount = (): Promise<{ code: number; message: string; data: UnreadCountResponse }> => {
  return request.get('/api/v1/notifications/unread-count')
}

export const markNotificationAsRead = (id: number): Promise<{ code: number; message: string }> => {
  return request.put(`/api/v1/notifications/${id}/read`)
}

export const markAllAsRead = (): Promise<{ code: number; message: string }> => {
  return request.put('/api/v1/notifications/read-all')
}

export const deleteNotification = (id: number): Promise<{ code: number; message: string }> => {
  return request.delete(`/api/v1/notifications/${id}`)
}

// 安全设置相关
export interface LoginLogQueryParams {
  page?: number
  per_page?: number
  start_date?: string
  end_date?: string
}

export const getLoginLogs = (params?: LoginLogQueryParams): Promise<{ code: number; message: string; data: LoginLogResponse }> => {
  return request.get('/api/v1/user/login-logs', { params })
}

export const logoutOtherSessions = (): Promise<{ code: number; message: string; data: { logged_out_sessions: number } }> => {
  return request.post('/api/v1/user/logout-other-sessions')
}

export const getSecuritySettings = (): Promise<{ code: number; message: string; data: SecuritySettings }> => {
  return request.get('/api/v1/user/security-settings')
}

export const enableTwoFactor = (): Promise<{ code: number; message: string; data: { qr_code: string; secret_key: string; backup_codes: string[] } }> => {
  return request.post('/api/v1/user/enable-two-factor')
}

export const disableTwoFactor = (password: string): Promise<{ code: number; message: string }> => {
  return request.post('/api/v1/user/disable-two-factor', { password })
}

export const getActiveSessions = (): Promise<{ code: number; message: string; data: ActiveSessionsResponse }> => {
  return request.get('/api/v1/user/active-sessions')
}

export const terminateSession = (sessionId: string): Promise<{ code: number; message: string }> => {
  return request.delete(`/api/v1/user/sessions/${sessionId}`)
}