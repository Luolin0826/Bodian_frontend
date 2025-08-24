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
  is_pinned?: boolean
  is_favorited?: boolean
  created_at?: string
  // 新增字段 - 数据清洗后添加
  type?: 'grid_exam' | 'postgrad_consult' | 'sales_conversation' | 'social_media_reply'  // 话术类型
  source?: string       // 数据来源：话术库, 最新电网术库, 小红书回复话术, 考研话术库
  platform?: string     // 适用平台：小红书 (其他为空)
  customer_info?: string // 客户信息
  // v2.0新分类体系字段
  primary_category?: 'power_grid' | 'electrical_exam' | 'product_intro' | 'marketing' | 'faq' | 'learning_guidance' | 'study_planning' // 主分类
  secondary_category?: 'application_guide' | 'review_planning' | 'consultation' | string // 子分类
  // 三维分类字段（保持兼容）
  script_type_new?: 'consultation' | 'sales_promotion' | 'service_support' | 'content_marketing' | 'expert_guidance' // 话术类型
  content_type_new?: 'exam_guidance' | 'course_introduction' | 'career_planning' | 'application_process' | 'company_service' | 'general_support' // 内容类型
  platform_new?: 'wechat' | 'xiaohongshu' | 'qq' | 'phone' | 'universal' // 适用平台
  keywords_new?: string // 关键词标签
  classification_meta?: string // 分类元数据
  classification_status?: 'pending' | 'processing' | 'completed' | 'failed' // 分类处理状态
  classification_version?: string // 分类体系版本
}

export interface ScriptQuery {
  keyword?: string
  category?: string
  type?: string          // 旧：话术类型筛选
  source?: string        // 旧：数据来源筛选  
  platform?: string      // 旧：平台筛选
  // v2.0新分类体系筛选参数
  primary_category?: string   // 主分类筛选
  secondary_category?: string // 子分类筛选
  // 三维分类筛选参数（保持兼容）
  script_type_new?: string // 话术类型筛选
  content_type_new?: string // 内容类型筛选
  platform_new?: string    // 平台筛选
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

// 获取话术类型统计（新）
export const getScriptTypeNewStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/script-type-new-stats')
}

// 获取内容类型统计
export const getContentTypeStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/content-type-stats')
}

// 获取平台统计（新）
export const getPlatformNewStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/platform-new-stats')
}

// 置顶话术
export const pinScript = (id: number): Promise<ScriptResponse> => {
  return request.put(`/api/v1/scripts/${id}/pin`)
}

// 取消置顶话术
export const unpinScript = (id: number): Promise<ScriptResponse> => {
  return request.put(`/api/v1/scripts/${id}/unpin`)
}

// 收藏话术
export const favoriteScript = (id: number): Promise<ScriptResponse> => {
  return request.post(`/api/v1/scripts/${id}/favorite`)
}

// 取消收藏话术
export const unfavoriteScript = (id: number): Promise<{ message: string }> => {
  return request.delete(`/api/v1/scripts/${id}/favorite`)
}

// 获取用户收藏列表
export const getUserFavorites = (params?: { page?: number; per_page?: number }): Promise<ScriptListResponse> => {
  return request.get('/api/v1/scripts/favorites', { params })
}

// 获取三维分类综合统计
export const getThreeDimensionStats = (): Promise<{
  script_types: Array<{ value: string; label: string; count: number }>
  content_types: Array<{ value: string; label: string; count: number }>
  platforms: Array<{ value: string; label: string; count: number }>
  total_classified: number
}> => {
  return request.get('/api/v1/scripts/three-dimension-stats')
}

// 获取话术类型统计（旧，兼容）
export const getScriptTypeStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/type-stats')
}

// 获取数据来源统计（旧，兼容）
export const getScriptSourceStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/source-stats')
}

// v2.0新分类体系API
// 获取主分类统计
export const getPrimaryCategoryStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/primary-category-stats')
}

// 获取子分类统计
export const getSecondaryCategoryStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/scripts/secondary-category-stats')
}

// 获取新分类体系综合统计
export const getNewClassificationStats = (): Promise<{
  primary_categories: Array<{ value: string; label: string; count: number }>
  secondary_categories: Array<{ value: string; label: string; count: number }>
  total_classified: number
  classification_version: string
}> => {
  return request.get('/api/v1/scripts/new-classification-stats')
}