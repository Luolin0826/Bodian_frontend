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
  answer: string  // 保持兼容，作为主回复/默认回复
  keywords?: string
  usage_count?: number
  effectiveness?: number
  is_active?: boolean
  is_pinned?: boolean
  is_favorited?: boolean
  is_pending_revision?: boolean  // 新增：是否标记为待修改
  created_at?: string
  // 新分类系统字段
  project_category_id?: number | null // 项目分类ID
  category_id?: number | null
  category_info?: ScriptCategory  // 关联的分类信息
  // v2.0新分类体系字段
  primary_category?: 'power_grid' | 'electrical_exam' | 'product_intro' | 'marketing' | 'faq' | 'learning_guidance' | 'study_planning' // 主分类
  secondary_category?: 'application_guide' | 'review_planning' | 'consultation' | string // 子分类
  // 一问多答功能字段
  answers?: string[]  // 多回复数组（最多5个）
  answer_count?: number  // 回复数量
  recommended_answer_index?: number  // 推荐回复索引（0-4）
}

export interface ScriptQuery {
  keyword?: string
  category?: string
  // 新分类系统筛选参数
  category_id?: number | string | null  // 新分类系统筛选，支持单个ID或多个ID的逗号分隔字符串
  // v2.0新分类体系筛选参数
  primary_category?: string   // 主分类筛选
  secondary_category?: string // 子分类筛选
  // 分页参数
  page?: number
  per_page?: number
  // 排序参数
  sort_by?: string    // 排序字段: usage, date, updated
  sort_order?: string // 排序方向: asc, desc
  // 待修改话术筛选
  pending_revision?: boolean  // 筛选待修改话术
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
export const getScriptCategoriesTree = (params?: { include_stats?: boolean }): Promise<{ data: ScriptCategory[] }> => {
  return request.get('/api/v1/scripts/categories/tree', { params })
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

// 项目分类相关接口
export interface ProjectCategory {
  id: number   // ID字段为必需，用于动态分类系统
  value: string
  label: string
  count: number
  description?: string
}

// 获取项目分类列表
export const getProjectCategories = (): Promise<{code: number; data: ProjectCategory[]}> => {
  return request.get('/api/v1/scripts/project-categories')
}

// 批量排序API接口
export interface CategorySortItem {
  id: number
  sort_order: number
}

export interface BatchSortRequest {
  categories: CategorySortItem[]
}

// 批量更新分类排序
export const batchSortCategories = (data: BatchSortRequest): Promise<{ 
  message: string; 
  updated_count: number 
}> => {
  return request.post('/api/v1/scripts/categories/batch-sort', data)
}

// ====== 待修改话术相关API ======

// 标记话术为待修改
export const markScriptPending = (id: number): Promise<{
  code: number;
  message: string;
  data: {
    script_id: number;
    is_pending_revision: boolean;
    marked_at: string;
  }
}> => {
  return request.post(`/api/v1/scripts/${id}/mark-pending`)
}

// 取消待修改标记
export const unmarkScriptPending = (id: number): Promise<{ 
  code: number;
  message: string 
}> => {
  return request.delete(`/api/v1/scripts/${id}/mark-pending`)
}

// 获取用户待修改话术列表
export const getUserPendingScripts = (params?: { page?: number; per_page?: number }): Promise<ScriptListResponse> => {
  return request.get('/api/v1/scripts/pending', { params })
}

// ====== 一问多答功能API ======

// 为指定问题添加新回复
export const addScriptAnswer = (id: number, answer: string): Promise<{
  code: number;
  message: string;
  data: {
    script_id: number;
    answer_index: number;
    answer_count: number;
  }
}> => {
  return request.post(`/api/v1/scripts/${id}/answers`, { answer })
}

// 更新指定索引的回复
export const updateScriptAnswer = (id: number, index: number, answer: string): Promise<{
  code: number;
  message: string;
  data: {
    script_id: number;
    answer_index: number;
    updated_answer: string;
  }
}> => {
  return request.put(`/api/v1/scripts/${id}/answers/${index}`, { answer })
}

// 删除指定索引的回复
export const deleteScriptAnswer = (id: number, index: number): Promise<{
  code: number;
  message: string;
  data: {
    script_id: number;
    deleted_index: number;
    answer_count: number;
  }
}> => {
  return request.delete(`/api/v1/scripts/${id}/answers/${index}`)
}

// 设置推荐回复
export const setRecommendedAnswer = (id: number, index: number): Promise<{
  code: number;
  message: string;
  data: {
    script_id: number;
    recommended_answer_index: number;
  }
}> => {
  return request.put(`/api/v1/scripts/${id}/recommend/${index}`)
}