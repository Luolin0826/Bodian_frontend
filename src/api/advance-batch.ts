import request from './request'
import type {
  ApiResponse,
  HealthCheckResponse,
  AdvanceBatchOverview,
  UniversitiesResponse,
  GetUniversitiesParams,
  SearchUniversitiesParams,
  ProvincesResponse,
  GetProvincesParams,
  StationsResponse,
  GetStationsParams,
  FeedbackResponse,
  GetFeedbackParams,
  FeedbackTypesResponse,
  RateFeedbackParams
} from './types/advance-batch'

// API基础路径
const API_BASE = '/api/v1/advance-batch'

/**
 * 提前批信息API服务
 */
export const advanceBatchApi = {
  
  /**
   * 健康检查
   */
  health(): Promise<HealthCheckResponse> {
    return request.get(`${API_BASE}/health`)
  },

  /**
   * 获取概览信息
   */
  getOverview(): Promise<ApiResponse<AdvanceBatchOverview>> {
    return request.get(`${API_BASE}/overview`)
  },

  /**
   * 获取院校信息列表
   */
  getUniversities(params?: GetUniversitiesParams): Promise<ApiResponse<UniversitiesResponse>> {
    return request.get(`${API_BASE}/universities`, { params })
  },

  /**
   * 搜索院校
   */
  searchUniversities(params: SearchUniversitiesParams): Promise<ApiResponse<UniversitiesResponse>> {
    return request.get(`${API_BASE}/universities/search`, { params })
  },

  /**
   * 获取省份信息
   */
  getProvinces(params?: GetProvincesParams): Promise<ApiResponse<ProvincesResponse>> {
    return request.get(`${API_BASE}/provinces`, { params })
  },

  /**
   * 获取省份列表（简化版）
   */
  getProvincesList(): Promise<ApiResponse<{ provinces: string[] }>> {
    return request.get(`${API_BASE}/provinces/list`)
  },

  /**
   * 获取站点信息
   */
  getStations(params?: GetStationsParams): Promise<ApiResponse<StationsResponse>> {
    return request.get(`${API_BASE}/stations`, { params })
  },

  /**
   * 获取反馈信息
   */
  getFeedback(params?: GetFeedbackParams): Promise<ApiResponse<FeedbackResponse>> {
    return request.get(`${API_BASE}/feedback`, { params })
  },

  /**
   * 获取集成化反馈列表
   */
  getIntegratedFeedback(params?: { page?: number; size?: number; province?: string }): Promise<ApiResponse<any>> {
    return request.get(`${API_BASE}/feedback/integrated`, { params })
  },

  /**
   * 搜索反馈
   */
  searchFeedback(params: { keyword?: string; province_name?: string; page?: number; size?: number }): Promise<ApiResponse<any>> {
    return request.get(`${API_BASE}/feedback/search`, { params })
  },

  /**
   * 获取站点特定反馈
   */
  getStationFeedback(stationId: number, params?: { page?: number; size?: number }): Promise<ApiResponse<any>> {
    return request.get(`${API_BASE}/stations/${stationId}/feedback`, { params })
  },

  /**
   * 获取反馈类型统计
   */
  getFeedbackTypes(): Promise<ApiResponse<FeedbackTypesResponse>> {
    return request.get(`${API_BASE}/feedback/types`)
  },

  /**
   * 按省份筛选详细信息
   */
  filterByProvince(province: string, batchId?: number): Promise<ApiResponse<any>> {
    const params = batchId ? { batch_id: batchId } : undefined
    return request.get(`${API_BASE}/filter-by-province/${encodeURIComponent(province)}`, { params })
  },

  /**
   * 增加反馈浏览数
   */
  viewFeedback(feedbackId: number): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/feedback/${feedbackId}/view`)
  },

  /**
   * 评价反馈
   */
  rateFeedback(feedbackId: number, params: RateFeedbackParams): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/feedback/${feedbackId}/rate`, params)
  },

  // 管理员接口（需要JWT认证）

  /**
   * 管理员获取所有提前批信息
   */
  adminGetBatch(): Promise<ApiResponse<any>> {
    return request.get(`${API_BASE}/admin/batch`)
  },

  /**
   * 新增院校
   */
  createUniversity(data: any): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/admin/universities`, data)
  },

  /**
   * 编辑院校
   */
  updateUniversity(id: number, data: any): Promise<ApiResponse<any>> {
    return request.put(`${API_BASE}/admin/universities/${id}`, data)
  },

  /**
   * 删除院校
   */
  deleteUniversity(id: number): Promise<ApiResponse<any>> {
    return request.delete(`${API_BASE}/admin/universities/${id}`)
  },

  /**
   * 置顶/取消置顶反馈
   */
  toggleFeedbackPin(feedbackId: number): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/admin/feedback/${feedbackId}/pin`)
  },

  /**
   * 收藏/取消收藏反馈
   */
  toggleFeedbackFavorite(feedbackId: number): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/feedback/${feedbackId}/favorite`)
  },

  /**
   * 编辑省份公告信息
   */
  updateProvinceAnnouncement(provinceId: number, data: any): Promise<ApiResponse<any>> {
    return request.put(`${API_BASE}/admin/provinces/${provinceId}/announcement`, data)
  },

  /**
   * 创建省份
   */
  createProvince(data: any): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/admin/provinces`, data)
  },

  /**
   * 更新省份信息
   */
  updateProvince(id: number, data: any): Promise<ApiResponse<any>> {
    return request.put(`${API_BASE}/admin/provinces/${id}`, data)
  },

  /**
   * 删除省份
   */
  deleteProvince(id: number): Promise<ApiResponse<any>> {
    return request.delete(`${API_BASE}/admin/provinces/${id}`)
  },

  // 站点管理接口

  /**
   * 创建站点
   */
  createStation(data: any): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/admin/stations`, data)
  },

  /**
   * 更新站点
   */
  updateStation(id: number, data: any): Promise<ApiResponse<any>> {
    return request.put(`${API_BASE}/admin/stations/${id}`, data)
  },

  /**
   * 删除站点
   */
  deleteStation(id: number): Promise<ApiResponse<any>> {
    return request.delete(`${API_BASE}/admin/stations/${id}`)
  },

  // 反馈管理接口

  /**
   * 创建反馈
   */
  createFeedback(data: any): Promise<ApiResponse<any>> {
    return request.post(`${API_BASE}/admin/feedback`, data)
  },

  /**
   * 更新反馈
   */
  updateFeedback(id: number, data: any): Promise<ApiResponse<any>> {
    return request.put(`${API_BASE}/admin/feedback/${id}`, data)
  },

  /**
   * 删除反馈
   */
  deleteFeedback(id: number): Promise<ApiResponse<any>> {
    return request.delete(`${API_BASE}/admin/feedback/${id}`)
  }
}

export default advanceBatchApi