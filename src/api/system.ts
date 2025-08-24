import request from '@/api/request'

// 部门相关接口
export interface Department {
  id?: number
  code: string
  name: string
  parent_id?: number
  region?: string
  type: 'sales' | 'teaching' | 'admin' | 'other'
  manager_id?: number
  manager_name?: string
  is_active?: boolean
  description?: string
  children?: Department[]
  employee_count?: number
  level?: number
  statusLoading?: boolean
  created_at?: string
  updated_at?: string
}

export interface DepartmentQuery {
  keyword?: string
  type?: string
  region?: string
  is_active?: boolean
}

// 用户相关接口
export interface User {
  id?: number
  username: string
  employee_no?: string
  password?: string
  real_name: string
  role: 'super_admin' | 'admin' | 'manager' | 'sales' | 'teacher' | 'viewer'
  department_id?: number
  department_name?: string
  phone?: string
  email?: string
  hire_date?: string
  is_active?: boolean
  last_login?: string
  created_at?: string
}

export interface UserQuery {
  keyword?: string
  role?: string
  department_id?: number
  region?: string
  is_active?: boolean
  hire_date_start?: string
  hire_date_end?: string
  page?: number
  per_page?: number
}

// 时间权限接口
export interface TimePermission {
  enable_login_time: boolean
  login_time_range?: string[] | null
  login_weekdays: string[]
  session_timeout: number
  max_sessions: number
}

// 数据权限接口
export interface DataPermission {
  scope: 'all' | 'department' | 'self' | 'custom'
  custom_scopes: string[]
  sensitive: string[]
}

// 角色权限接口
export interface RolePermissions {
  menu: string[]
  operation: Record<string, string[]>
  data: DataPermission
  time: TimePermission
}

// 角色接口
export interface Role {
  name: string
  display_name: string
  level: number
  description: string
  permissions: RolePermissions
  user_count?: number
  permission_count?: number
  is_system?: boolean
  created_at?: string
  updated_at?: string
}

// 权限模板接口
export interface PermissionTemplate {
  name: string
  description: string
  role_type: string
  permissions: RolePermissions
}

// 权限节点接口
export interface PermissionNode {
  key: string
  title: string
  description?: string
  icon?: string
  level?: 'low' | 'medium' | 'high'
  risk?: 'safe' | 'warning' | 'danger'
  category?: string
  children?: PermissionNode[]
}

// 操作日志接口
export interface OperationLog {
  id: number
  user_id: number
  username: string
  employee_no: string
  department_name: string
  avatar?: string
  action: string
  resource: string
  resource_id?: string
  resource_name?: string
  description: string
  ip_address: string
  user_agent?: string
  browser?: string
  os?: string
  device?: string
  location?: string
  sensitive_operation: boolean
  duration?: number
  result?: 'success' | 'failed' | 'warning'
  error_message?: string
  changes?: any
  created_at: string
}

export interface LogQuery {
  keyword?: string
  user_id?: number
  department_id?: number
  action?: string
  resource?: string
  date_start?: string
  date_end?: string
  sensitive_only?: boolean
  page?: number
  per_page?: number
}

// 部门管理API
export const getDepartments = (params?: DepartmentQuery): Promise<Department[]> => {
  return request.get('/api/v1/departments', { params })
}

export const getDepartmentTree = (): Promise<Department[]> => {
  return request.get('/api/v1/departments/tree')
}

export const createDepartment = (data: Department): Promise<Department> => {
  return request.post('/api/v1/departments', data)
}

export const updateDepartment = (id: number, data: Department): Promise<Department> => {
  return request.put(`/api/v1/departments/${id}`, data)
}

export const deleteDepartment = (id: number): Promise<void> => {
  return request.delete(`/api/v1/departments/${id}`)
}

export const getDepartmentEmployees = (id: number): Promise<User[]> => {
  return request.get(`/api/v1/departments/${id}/employees`)
}

// 用户管理API
export const getUsers = (params?: UserQuery): Promise<{data: User[], total: number, page: number, per_page: number}> => {
  return request.get('/api/v1/users', { params })
}

export const getUser = (id: number): Promise<User> => {
  return request.get(`/api/v1/users/${id}`)
}

export const createUser = (data: User): Promise<User> => {
  return request.post('/api/v1/users', data)
}

export const updateUser = (id: number, data: User): Promise<User> => {
  return request.put(`/api/v1/users/${id}`, data)
}

export const deleteUser = (id: number): Promise<void> => {
  return request.delete(`/api/v1/users/${id}`)
}

export const resetUserPassword = (id: number, password: string): Promise<void> => {
  return request.post(`/api/v1/users/${id}/reset-password`, { password })
}

export const batchUpdateUserStatus = (ids: number[], is_active: boolean): Promise<void> => {
  return request.post('/api/v1/users/batch-status', { ids, is_active })
}

// 角色权限API
export const getRoles = (): Promise<Role[]> => {
  return request.get('/api/v1/roles/')
}

export const createRole = (data: Omit<Role, 'created_at' | 'updated_at'>): Promise<Role> => {
  return request.post('/api/v1/roles/', data)
}

export const getRolePermissions = (roleName: string): Promise<RolePermissions> => {
  return request.get(`/api/v1/roles/${roleName}/permissions`)
}

export const updateRolePermissions = (roleName: string, permissions: RolePermissions): Promise<void> => {
  return request.put(`/api/v1/roles/${roleName}/permissions`, permissions)
}

export const getRoleUsers = (roleName: string): Promise<{users: User[], total: number, role_info: any}> => {
  return request.get(`/api/v1/roles/${roleName}/users`)
}

export const getPermissionTree = (): Promise<{
  menu: PermissionNode[]
  operation_modules: any[]
  data_scopes: any[]
  sensitive_data: any[]
}> => {
  return request.get('/api/v1/roles/permissions/tree')
}

export const getPermissionTemplates = (): Promise<{
  builtin: PermissionTemplate[]
  custom: PermissionTemplate[]
}> => {
  return request.get('/api/v1/roles/templates')
}

export const validatePermissions = (permissions: RolePermissions): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> => {
  return request.post('/api/v1/roles/validate-permissions', permissions)
}

export const importPermissionTemplate = (roleName: string, templateName: string): Promise<{message: string}> => {
  return request.post(`/api/v1/roles/${roleName}/permissions/import`, { template_name: templateName })
}

// 操作日志API
export const getOperationLogs = (params?: LogQuery): Promise<{data: OperationLog[], total: number, page: number, per_page: number}> => {
  return request.get('/api/v1/operation-logs', { params })
}

export const getOperationLogDetail = (id: number): Promise<OperationLog> => {
  return request.get(`/api/v1/operation-logs/${id}`)
}

// 获取部门统计信息
export const getDepartmentStats = (): Promise<{
  total: number
  totalEmployees: number
  regions: number
  salesDepts: number
}> => {
  return request.get('/api/v1/departments/stats')
}

// 获取系统统计信息
export const getSystemStats = (): Promise<{
  total_users: number
  active_users: number
  total_departments: number
  total_logs_today: number
  sensitive_operations_today: number
}> => {
  return request.get('/api/v1/system/stats')
}