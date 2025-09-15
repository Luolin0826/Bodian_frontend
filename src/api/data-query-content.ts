import request from '@/api/request'

// Data-Query内容相关数据类型定义
export interface DataQueryContent {
  id: number
  unit_id: number
  section: '基本政策信息' | '提前批' | '农网'
  title: string
  content: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  province?: string
}

export interface ProvinceContentSummary {
  province: string
  unit_id: number
  unit_name: string
  content_count: number
  basic_count: number
  advance_count: number
  rural_count: number
}

export interface ContentByProvinceResponse {
  success: boolean
  data: {
    province: string
    content: {
      '基本政策信息'?: DataQueryContent[]
      '提前批'?: DataQueryContent[]
      '农网'?: DataQueryContent[]
    }
    total_items: number
  }
}

export interface ContentListResponse {
  success: boolean
  data: {
    contents: DataQueryContent[]
    total_count: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface CreateContentRequest {
  unit_id: number
  section: '基本政策信息' | '提前批' | '农网'
  title: string
  content: string
  display_order?: number
}

export interface CreateContentResponse {
  success: boolean
  content_id: number
  message: string
  unit_info: {
    unit_id: number
    unit_name: string
  }
}

export interface UpdateContentRequest {
  title?: string
  content?: string
  display_order?: number
  is_active?: boolean
}

export interface HealthCheckResponse {
  success: boolean
  data: {
    database: string
    provinces_with_content: number
    total_content_count: number
    section_counts: {
      '基本政策信息': number
      '提前批': number
      '农网': number
    }
    latest_update: string
  }
}

// Data-Query内容管理API
export const dataQueryContentAPI = {
  
  /**
   * 获取健康状况
   */
  async getHealth(): Promise<HealthCheckResponse['data']> {
    const response = await request.get<HealthCheckResponse>('/api/v1/data-query-content/health')
    return response.data
  },

  /**
   * 获取有内容的省份列表
   */
  async getProvincesList(): Promise<ProvinceContentSummary[]> {
    const response = await request.get('/api/v1/data-query-content/provinces')
    return response.data.data
  },

  /**
   * 按省份获取内容（前端主要使用的接口）
   * @param province 省份名称
   * @param section 可选的专栏筛选
   */
  async getContentByProvince(province: string, section?: string): Promise<ContentByProvinceResponse['data']> {
    const params = section ? { section } : {}
    const response = await request.get<ContentByProvinceResponse>(
      `/api/v1/data-query-content/by-province/${encodeURIComponent(province)}`,
      { params }
    )
    return response.data
  },

  /**
   * 按单位ID获取内容
   * @param unitId 单位ID
   * @param section 可选的专栏筛选
   */
  async getContentByUnitId(unitId: number, section?: string): Promise<DataQueryContent[]> {
    const params = section ? { section } : {}
    const response = await request.get(
      `/api/v1/data-query-content/by-unit/${unitId}`,
      { params }
    )
    return response.data.data
  },

  /**
   * 获取内容列表（支持分页和筛选）
   */
  async getContentList(params?: {
    unit_id?: number
    section?: string
    page?: number
    limit?: number
    search?: string
  }): Promise<ContentListResponse['data']> {
    const response = await request.get<ContentListResponse>('/api/v1/data-query-content/', { params })
    return response.data
  },

  /**
   * 创建新内容
   */
  async createContent(data: CreateContentRequest): Promise<CreateContentResponse> {
    const response = await request.post<CreateContentResponse>('/api/v1/data-query-content/', data)
    return response
  },

  /**
   * 更新内容
   */
  async updateContent(contentId: number, data: UpdateContentRequest): Promise<{ success: boolean; message: string }> {
    const response = await request.put(`/api/v1/data-query-content/${contentId}`, data)
    return response
  },

  /**
   * 删除内容
   */
  async deleteContent(contentId: number): Promise<{ success: boolean; message: string }> {
    const response = await request.delete(`/api/v1/data-query-content/${contentId}`)
    return response
  }
}

// 便捷函数：获取指定省份的所有内容（一次请求）
export async function getProvinceAllContent(province: string): Promise<{
  '基本政策信息': DataQueryContent[]
  '提前批': DataQueryContent[]
  '农网': DataQueryContent[]
}> {
  try {
    const data = await dataQueryContentAPI.getContentByProvince(province)
    return {
      '基本政策信息': data.content['基本政策信息'] || [],
      '提前批': data.content['提前批'] || [],
      '农网': data.content['农网'] || []
    }
  } catch (error) {
    console.error(`获取${province}所有内容失败:`, error)
    return {
      '基本政策信息': [],
      '提前批': [],
      '农网': []
    }
  }
}

// 便捷函数：获取指定省份和专栏的内容
export async function getProvinceContent(province: string, section: '基本政策信息' | '提前批' | '农网'): Promise<DataQueryContent[]> {
  try {
    const data = await dataQueryContentAPI.getContentByProvince(province, section)
    return data.content[section] || []
  } catch (error) {
    console.error(`获取${province}${section}内容失败:`, error)
    return []
  }
}

// 便捷函数：获取指定单位的所有内容（按专栏分组）
export async function getUnitAllContent(unitId: number): Promise<{
  '基本政策信息': DataQueryContent[]
  '提前批': DataQueryContent[]
  '农网': DataQueryContent[]
}> {
  try {
    const allContent = await dataQueryContentAPI.getContentByUnitId(unitId)
    
    const grouped = {
      '基本政策信息': [] as DataQueryContent[],
      '提前批': [] as DataQueryContent[],
      '农网': [] as DataQueryContent[]
    }
    
    allContent.forEach(item => {
      if (item.section in grouped) {
        grouped[item.section].push(item)
      }
    })
    
    // 按display_order排序
    Object.keys(grouped).forEach(key => {
      grouped[key as keyof typeof grouped].sort((a, b) => a.display_order - b.display_order)
    })
    
    return grouped
  } catch (error) {
    console.error(`获取单位${unitId}全部内容失败:`, error)
    return {
      '基本政策信息': [],
      '提前批': [],
      '农网': []
    }
  }
}

// 便捷函数：将unit_id转换为province
export async function getProvinceByUnitId(unitId: number): Promise<string | null> {
  try {
    // 可以通过现有的getUnitDetails函数或者直接从secondary_units获取
    // 这里假设我们有一个获取单位信息的接口
    const unitInfo = await request.get(`/api/v1/secondary-units/${unitId}`)
    return unitInfo.data?.unit_name || null
  } catch (error) {
    console.error(`获取单位${unitId}省份信息失败:`, error)
    return null
  }
}