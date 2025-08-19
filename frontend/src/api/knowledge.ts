import request from '@/api/request'

export interface Knowledge {
  id?: number
  type: '电网考试' | '考研' | '校招' | '其他'
  category?: string
  question?: string
  answer?: string
  related_questions?: string
  tags?: string
  view_count?: number
  is_published?: boolean
  created_at?: string
  // 新增字段 - 数据清洗后添加
  unit?: string      // 单位：浙江, 山东, 冀北, 河南, 江苏等
  site?: string      // 站点/地点
  source?: string    // 数据来源：校招信息
  metadata?: any     // 扩展元数据
}

export interface KnowledgeQuery {
  keyword?: string
  type?: string
  category?: string
  unit?: string      // 新增：省份电网筛选
  page?: number
  per_page?: number
  sort_by?: string   // 排序字段
  sort_order?: 'asc' | 'desc'  // 排序方向
}

export interface KnowledgeListResponse {
  data: Knowledge[]
  total: number
  page: number
  per_page: number
}

export interface KnowledgeResponse {
  message: string
  data: Knowledge
}

// 搜索知识库
export const searchKnowledge = (params?: KnowledgeQuery): Promise<KnowledgeListResponse> => {
  return request.get('/api/v1/knowledge/search', { params })
}

// 获取知识类型
export const getKnowledgeTypes = (): Promise<string[]> => {
  return request.get('/api/v1/knowledge/types')
}

// 获取知识分类（根据类型）
export const getKnowledgeCategories = (type?: string): Promise<string[]> => {
  return request.get('/api/v1/knowledge/categories', { params: { type } })
}

// 获取知识详情
export const getKnowledge = (id: number): Promise<Knowledge> => {
  return request.get(`/api/v1/knowledge/${id}`)
}

// 创建知识
export const createKnowledge = (data: Knowledge): Promise<KnowledgeResponse> => {
  return request.post('/api/v1/knowledge', data)
}

// 更新知识
export const updateKnowledge = (id: number, data: Knowledge): Promise<KnowledgeResponse> => {
  return request.put(`/api/v1/knowledge/${id}`, data)
}

// 删除知识
export const deleteKnowledge = (id: number): Promise<{ message: string }> => {
  return request.delete(`/api/v1/knowledge/${id}`)
}

// 获取知识库统计数据
export const getKnowledgeStats = (): Promise<{
  total: number
  popular: number
  categories: number
  recent: number
}> => {
  return request.get('/api/v1/knowledge/stats')
}

// 获取知识类型统计
export const getKnowledgeTypeStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/knowledge/type-stats')
}

// 获取省份电网选项统计
export const getKnowledgeUnitStats = (): Promise<Array<{ value: string; label: string; count: number }>> => {
  return request.get('/api/v1/knowledge/unit-stats')
}

// 获取热门标签
export const getPopularTags = (): Promise<string[]> => {
  return request.get('/api/v1/knowledge/popular-tags')
}

// 获取分类选项（根据类型）
export const getCategoryOptions = (type?: string): Promise<Array<{ value: string; label: string }>> => {
  return request.get('/api/v1/knowledge/category-options', { params: { type } })
}

// 增加浏览次数
export const incrementViewCount = (id: number): Promise<{ message: string }> => {
  return request.post(`/api/v1/knowledge/${id}/view`)
}