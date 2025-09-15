// 提前批信息相关类型定义

// 批次概览信息
export interface AdvanceBatchOverview {
  batch_info: {
    id: number
    batch_year: number
    batch_name: string
    start_date: string
    end_date: string
    description?: string
    application_deadline?: string
    exam_date?: string
    interview_start_date?: string
    result_date?: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  university_count: number
  province_count: number
  station_count: number
  feedback_count: number
}

// 院校信息
export interface UniversityInfo {
  id: number
  university_id?: number
  university_name: string
  university_code: string
  employment_website: string
  career_center_name?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  office_hours?: string
  remarks?: string
  is_active: boolean
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T
  total: number
  page: number
  size: number
  pages: number
}

// 院校信息响应
export interface UniversitiesResponse {
  universities: UniversityInfo[]
  total: number
  page: number
  size: number
  pages: number
}

// 省份提前批信息
export interface ProvinceAdvanceBatch {
  id: number
  batch_id: number
  province: string
  secondary_unit_id?: number
  secondary_unit_name?: string
  recruitment_count?: number
  male_count?: number
  female_count?: number
  schedule_start?: string
  schedule_end?: string
  registration_deadline?: string
  notice_title?: string
  notice_content?: string
  notice_url?: string
  notice_publish_date?: string
  salary_description?: string
  welfare_description?: string
  education_requirement?: string
  major_requirement?: string
  age_requirement?: string
  other_requirements?: string
  sort_order?: number
  is_active: boolean
  stations?: StationInfo[]
  feedback_count?: number
  featured_feedback_count?: number
}

// 省份信息响应
export interface ProvincesResponse {
  provinces: ProvinceAdvanceBatch[]
}

// 站点信息
export interface StationInfo {
  id: number
  province_plan_id: number
  province?: string
  university_id?: number
  university_name: string
  university_type?: string
  visit_date: string
  visit_time?: string
  end_time?: string
  duration?: string
  venue?: string
  address?: string
  building?: string
  room?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  activity_type?: string
  expected_participants?: number
  registration_required?: boolean
  registration_url?: string
  remarks?: string
  sort_order?: number
  is_active: boolean
  // 站点公告字段
  notice_title?: string
  notice_content?: string
  notice_url?: string
  notice_publish_date?: string
  notice_priority?: string
  status?: string
  // 站点反馈字段（新增）
  feedback_count?: number
  feedback?: FeedbackInfo[]
}

// 站点信息响应
export interface StationsResponse {
  stations: StationInfo[]
}

// 反馈信息
export interface FeedbackInfo {
  id: number
  province_plan_id?: number
  station_id?: number
  feedback_type: string
  title: string
  content: string
  summary?: string
  tags?: string[]
  difficulty_level?: string
  applicable_batch?: string
  author?: string
  author_background?: string
  submission_year?: number
  likes_count?: number
  views_count?: number
  shares_count?: number
  is_featured?: boolean
  is_verified?: boolean
  is_pinned?: boolean
  is_favorited?: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// 集成化反馈信息
export interface IntegratedFeedbackInfo extends FeedbackInfo {
  province_name?: string      // 省份名称（文本字段）
  station_name_text?: string  // 站点名称（文本字段）
  recruitment_requirements?: string  // 招聘要求
  announcement_url?: string   // 公告链接
  // 兼容前端使用的字段名
  province?: string
  station_name?: string
}

// 反馈信息响应
export interface FeedbackResponse {
  feedback: FeedbackInfo[]
  total: number
  page: number
  size: number
  pages: number
}

// 集成化反馈响应
export interface IntegratedFeedbackResponse {
  feedback: IntegratedFeedbackInfo[]
  total: number
  page: number
  size: number
  pages: number
}

// 反馈类型统计
export interface FeedbackTypeStats {
  type: string
  count: number
}

// 反馈类型响应
export interface FeedbackTypesResponse {
  feedback_types: FeedbackTypeStats[]
}

// API请求参数类型

// 获取院校信息参数
export interface GetUniversitiesParams {
  page?: number
  size?: number
  keyword?: string
}

// 搜索院校参数
export interface SearchUniversitiesParams {
  keyword: string
}

// 获取省份信息参数
export interface GetProvincesParams {
  batch_id?: number
  province?: string
}

// 获取站点信息参数
export interface GetStationsParams {
  province_plan_id?: number
  province?: string
  university_name?: string
}

// 获取反馈信息参数
export interface GetFeedbackParams {
  province_plan_id?: number
  station_id?: number
  feedback_type?: string
  featured?: boolean
  verified?: boolean
  page?: number
  size?: number
}

// 反馈评价参数
export interface RateFeedbackParams {
  rating_type: 'like' | 'dislike' | 'helpful' | 'not_helpful'
}

// 创建省份参数
export interface CreateProvinceParams {
  province: string
  batch_id?: number
  secondary_unit_name?: string
  recruitment_count?: number
  other_requirements?: string
  notice_url?: string
  notice_title?: string
  notice_content?: string
}

// 创建集成化反馈参数
export interface CreateIntegratedFeedbackParams {
  feedback_type: string
  title: string
  content: string
  province_name: string
  station_name_text: string
  recruitment_requirements?: string
  announcement_url?: string
  author?: string
  author_background?: string
}

// API响应基础结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// 健康检查响应
export interface HealthCheckResponse {
  code: number
  message: string
  service: string
  version: string
}