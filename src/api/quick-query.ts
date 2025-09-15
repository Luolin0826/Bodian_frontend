import request from '@/api/request'

// 快捷查询数据类型定义
export interface QuickQueryUndergraduateInfo {
  id: number
  province: string
  org_type: string
  undergraduate_english: string
  undergraduate_computer: string
  undergraduate_qualification: string
  undergraduate_age: string
  scores: {
    '2025_batch1': string
    '2025_batch2': string
    '2024_batch1': string
    '2024_batch2': string
    '2023_batch1': string
    '2023_batch2': string
  }
  updated_at: string
}

export interface QuickQueryGraduateInfo {
  id: number
  province: string
  org_type: string
  graduate_english: string
  graduate_computer: string
  graduate_qualification: string
  graduate_age: string
  scores: {
    '2025_batch1': string
    '2025_batch2': string
    '2024_batch1': string
    '2024_batch2': string
    '2023_batch1': string
    '2023_batch2': string
  }
  updated_at: string
}

export interface QuickQueryAdmissionStats {
  id: number
  province: string
  org_type: string
  admission_stats: {
    '2025': {
      batch1: number
      batch2: number
    }
    '2024': {
      batch1: number
      batch2: number
    }
    '2023': {
      batch1: number
      batch2: number
    }
  }
  updated_at: string
}

export interface QuickQueryCompleteInfo {
  id: number
  province: string
  org_type: string
  undergraduate: {
    english: string
    computer: string
    qualification: string
    age: string
    scores: {
      '2025_batch1': string
      '2025_batch2': string
      '2024_batch1': string
      '2024_batch2': string
      '2023_batch1': string
      '2023_batch2': string
    }
  }
  graduate: {
    english: string
    computer: string
    qualification: string
    age: string
    scores: {
      '2025_batch1': string
      '2025_batch2': string
      '2024_batch1': string
      '2024_batch2': string
      '2023_batch1': string
      '2023_batch2': string
    }
  }
  admission_stats: {
    '2025': { batch1: number; batch2: number }
    '2024': { batch1: number; batch2: number }
    '2023': { batch1: number; batch2: number }
  }
  updated_at: string
}

export interface ProvinceInfo {
  unit_id: number
  unit_name: string
  org_type: string
  has_data: boolean
  updated_at: string
}

// API响应类型
export interface QuickQueryResponse<T> {
  success: boolean
  data: T[]
  message: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SingleQuickQueryResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface ProvincesResponse {
  success: boolean
  data: ProvinceInfo[]
}

// 查询参数类型
export interface QuickQueryParams {
  province?: string
  page?: number
  limit?: number
  year?: string
  batch?: string
}

// 数据管理参数类型
export interface QuickQueryCreateData {
  unit_id: number
  undergraduate_english?: string
  undergraduate_computer?: string
  undergraduate_qualification?: string
  undergraduate_age?: string
  undergrad_2025_batch1_score?: string
  undergrad_2025_batch2_score?: string
  undergrad_2024_batch1_score?: string
  undergrad_2024_batch2_score?: string
  undergrad_2023_batch1_score?: string
  undergrad_2023_batch2_score?: string
  graduate_english?: string
  graduate_computer?: string
  graduate_qualification?: string
  graduate_age?: string
  grad_2025_batch1_score?: string
  grad_2025_batch2_score?: string
  grad_2024_batch1_score?: string
  grad_2024_batch2_score?: string
  grad_2023_batch1_score?: string
  grad_2023_batch2_score?: string
  admission_2025_batch1_count?: number
  admission_2025_batch2_count?: number
  admission_2024_batch1_count?: number
  admission_2024_batch2_count?: number
  admission_2023_batch1_count?: number
  admission_2023_batch2_count?: number
}

export interface QuickQueryUpdateData extends Partial<QuickQueryCreateData> {}

export interface BatchCreateData {
  items: QuickQueryCreateData[]
}

export interface BatchUpdateItem {
  id: number
  fields: QuickQueryUpdateData
}

export interface BatchUpdateData {
  updates: BatchUpdateItem[]
}

export interface BatchDeleteData {
  ids: number[]
}

// API接口实现
export const quickQueryAPI = {
  // 本科信息查询
  getUndergraduate(params?: QuickQueryParams): Promise<QuickQueryResponse<QuickQueryUndergraduateInfo>> {
    return request.get('/api/v1/quick-query/undergraduate', { params })
  },

  getUndergraduateByProvince(province: string): Promise<SingleQuickQueryResponse<QuickQueryUndergraduateInfo>> {
    return request.get(`/api/v1/quick-query/undergraduate/${encodeURIComponent(province)}`)
  },

  // 研究生信息查询
  getGraduate(params?: QuickQueryParams): Promise<QuickQueryResponse<QuickQueryGraduateInfo>> {
    return request.get('/api/v1/quick-query/graduate', { params })
  },

  getGraduateByProvince(province: string): Promise<SingleQuickQueryResponse<QuickQueryGraduateInfo>> {
    return request.get(`/api/v1/quick-query/graduate/${encodeURIComponent(province)}`)
  },

  // 录取统计查询
  getAdmissionStats(params?: QuickQueryParams): Promise<QuickQueryResponse<QuickQueryAdmissionStats>> {
    return request.get('/api/v1/quick-query/admission-stats', { params })
  },

  getAdmissionStatsByProvince(province: string): Promise<SingleQuickQueryResponse<QuickQueryAdmissionStats>> {
    return request.get(`/api/v1/quick-query/admission-stats/${encodeURIComponent(province)}`)
  },

  // 综合信息查询
  getComplete(params?: QuickQueryParams): Promise<QuickQueryResponse<QuickQueryCompleteInfo>> {
    return request.get('/api/v1/quick-query/complete', { params })
  },

  getCompleteByProvince(province: string): Promise<SingleQuickQueryResponse<QuickQueryCompleteInfo>> {
    return request.get(`/api/v1/quick-query/complete/${encodeURIComponent(province)}`)
  },

  // 省份管理
  getProvinces(): Promise<ProvincesResponse> {
    return request.get('/api/v1/quick-query/provinces')
  },

  getProvincesWithData(): Promise<ProvincesResponse> {
    return request.get('/api/v1/quick-query/provinces/with-data')
  },

  // 数据管理接口 (需要认证)
  createData(data: QuickQueryCreateData): Promise<{ success: boolean; data: { id: number; unit_id: number; created_at: string }; message: string }> {
    return request.post('/api/v1/quick-query/data', data)
  },

  updateData(id: number, data: QuickQueryUpdateData, type?: 'undergraduate' | 'graduate'): Promise<{ success: boolean; data: { id: number; updated_at: string }; message: string }> {
    const url = `/api/v1/quick-query/data/${id}${type ? `?type=${type}` : ''}`
    console.log('📡 API updateData 请求:', { id, type, url })
    return request.put(url, data)
  },

  deleteData(id: number): Promise<{ success: boolean; message: string }> {
    return request.delete(`/api/v1/quick-query/data/${id}`)
  },

  getData(id: number): Promise<SingleQuickQueryResponse<QuickQueryCompleteInfo>> {
    return request.get(`/api/v1/quick-query/data/${id}`)
  },

  // 批量操作接口
  batchCreate(data: BatchCreateData): Promise<{ success: boolean; data: { created_count: number; created_ids: number[] }; message: string }> {
    return request.post('/api/v1/quick-query/data/batch', data)
  },

  batchUpdate(data: BatchUpdateData, type?: 'undergraduate' | 'graduate'): Promise<{ success: boolean; data: { updated_count: number; updated_ids: number[] }; message: string }> {
    const url = `/api/v1/quick-query/data/batch${type ? `?type=${type}` : ''}`
    console.log('📡 API batchUpdate 请求:', { type, url, updatesCount: data.updates.length })
    return request.put(url, data)
  },

  batchDelete(data: BatchDeleteData): Promise<{ success: boolean; data: { deleted_count: number; deleted_ids: number[] }; message: string }> {
    return request.delete('/api/v1/quick-query/data/batch', { data })
  },

  // 数据导入导出接口
  importExcel(file: File, sheetName?: string): Promise<{ success: boolean; data: { imported_count: number; failed_count: number; errors: string[] }; message: string }> {
    const formData = new FormData()
    formData.append('file', file)
    if (sheetName) {
      formData.append('sheet_name', sheetName)
    }
    return request.post('/api/v1/quick-query/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  exportExcel(params?: { province?: string; format?: string }): Promise<Blob> {
    return request.get('/api/v1/quick-query/export/excel', { 
      params,
      responseType: 'blob'
    })
  },

  downloadTemplate(): Promise<Blob> {
    return request.get('/api/v1/quick-query/template/excel', {
      responseType: 'blob'
    })
  }
}

export default quickQueryAPI