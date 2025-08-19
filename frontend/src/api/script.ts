import request from '@/api/request'

export interface Script {
  id?: number
  category?: string
  title?: string
  question?: string
  answer: string
  keywords?: string
  usage_count?: number
  effectiveness?: number
  is_active?: boolean
  created_at?: string
  // 新增字段 - 数据清洗后添加
  type?: 'grid_exam' | 'postgrad_consult' | 'sales_conversation' | 'social_media_reply'  // 话术类型
  source?: string       // 数据来源：话术库, 最新电网术库, 小红书回复话术, 考研话术库
  platform?: string     // 适用平台：小红书 (其他为空)
  customer_info?: string // 客户信息
}

export interface ScriptQuery {
  keyword?: string
  category?: string
  type?: string          // 新增：话术类型筛选
  source?: string        // 新增：数据来源筛选  
  platform?: string      // 新增：平台筛选
  page?: number
  per_page?: number
}

export interface ScriptListResponse {
  data: Script[]
  total: number
  page: number
  per_page: number
}

export interface ScriptResponse {
  message: string
  data: Script
}

// 搜索话术
export const searchScripts = (params?: ScriptQuery): Promise<ScriptListResponse> => {
  return request.get('/api/v1/scripts/search', { params })
}

// 获取话术分类
export const getScriptCategories = (): Promise<string[]> => {
  return request.get('/api/v1/scripts/categories')
}

// 创建话术
export const createScript = (data: Script): Promise<ScriptResponse> => {
  return request.post('/api/v1/scripts', data)
}

// 更新话术
export const updateScript = (id: number, data: Script): Promise<ScriptResponse> => {
  return request.put(`/api/v1/scripts/${id}`, data)
}

// 删除话术
export const deleteScript = (id: number): Promise<{ message: string }> => {
  return request.delete(`/api/v1/scripts/${id}`)
}

// 获取话术统计数据
export const getScriptStats = (): Promise<{
  total: number
  popular: number
  recent: number
  categories: number
}> => {
  return request.get('/api/v1/scripts/stats')
}

// 获取话术类型统计
export const getScriptTypeStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/type-stats')
}

// 获取数据来源统计
export const getScriptSourceStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/source-stats')
}