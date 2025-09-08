import request from '@/api/request'

// 分类数据类型定义 - 需要先定义，在Script接口中会用到
export interface ScriptCategory {
  id?: number
  name: string
  description?: string
  parent_id?: number | null
  is_system?: boolean
  is_active?: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
  script_count?: number
  children?: ScriptCategory[]
}

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
  // 新分类系统字段
  category_id?: number | null
  category_info?: ScriptCategory  // 关联的分类信息
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
  // 新分类系统筛选参数
  category_id?: number | null  // 新分类系统筛选
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
  // 分页参数
  page?: number
  per_page?: number
  // 排序参数
  sort_by?: string    // 排序字段: usage, date, updated
  sort_order?: string // 排序方向: asc, desc
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

// ====== 新分类管理API ======

export interface CategoryListResponse {
  data: ScriptCategory[]
  total: number
  page: number
  per_page: number
}

export interface CategoryResponse {
  message: string
  data: ScriptCategory
}

// 获取分类列表
export const getScriptCategoriesNew = (params?: { 
  page?: number; 
  per_page?: number; 
  include_inactive?: boolean;
  parent_id?: number;
}): Promise<CategoryListResponse> => {
  return request.get('/api/v1/scripts/categories', { params })
}

// 获取分类管理视图（包含统计信息）
export const getScriptCategoriesManage = (params?: {
  include_stats?: boolean;
  include_children?: boolean;
}): Promise<{ data: ScriptCategory[] }> => {
  return request.get('/api/v1/scripts/categories/manage', { params })
}

// 获取分类树状结构
export const getScriptCategoriesTree = (): Promise<{ data: ScriptCategory[] }> => {
  return request.get('/api/v1/scripts/categories/tree')
}

// 创建新分类
export const createScriptCategory = (data: {
  name: string;
  description?: string;
  parent_id?: number | null;
  sort_order?: number;
}): Promise<CategoryResponse> => {
  return request.post('/api/v1/scripts/categories', data)
}

// 更新分类
export const updateScriptCategory = (id: number, data: {
  name?: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
}): Promise<CategoryResponse> => {
  return request.put(`/api/v1/scripts/categories/${id}`, data)
}

// 删除分类
export const deleteScriptCategory = (id: number): Promise<{ message: string }> => {
  return request.delete(`/api/v1/scripts/categories/${id}`)
}

// 获取分类统计
export const getScriptCategoriesStats = (): Promise<{
  total_categories: number;
  system_categories: number;
  user_categories: number;
  total_scripts_with_category: number;
  categories_with_scripts: Array<{ id: number; name: string; script_count: number }>
}> => {
  return request.get('/api/v1/scripts/categories/stats')
}

// 初始化默认分类
export const initDefaultScriptCategories = (): Promise<{ 
  message: string; 
  created_count: number; 
  categories: ScriptCategory[] 
}> => {
  return request.post('/api/v1/scripts/categories/init-default')
}