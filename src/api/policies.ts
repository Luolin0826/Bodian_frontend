import request from '@/api/request'

// 政策相关数据类型定义
export interface FilterOptions {
  gw_provinces: UnitOption[]          // 国网省公司
  gw_direct_units: UnitOption[]       // 国网直属单位
  nw_provinces: UnitOption[]          // 南网省公司  
  nw_direct_units: UnitOption[]       // 南网直属单位
  provincial_industry: UnitOption[]   // 省属产业
  total_units: number                 // 总单位数
  categories: {                       // 分类统计
    gw_provinces_count: number
    gw_direct_units_count: number
    nw_provinces_count: number
    nw_direct_units_count: number
    provincial_industry_count: number
  }
}

export interface UnitOption {
  unit_id: number
  unit_name: string
  unit_code: string
  org_type?: string
  sort_order?: number             // 排序顺序（新增）
}

export interface UnitInfo {
  unit_id: number
  unit_name: string
  org_type: string
  salary_range?: string
  estimated_score_range?: string
}

export interface PolicyField {
  display_name: string
  value: any
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean'
}

export interface PolicyInfo {
  recruitment_count?: PolicyField
  unwritten_rules?: PolicyField
  english_requirement?: PolicyField
  computer_requirement?: PolicyField
  age_requirement?: PolicyField
  second_choice_available?: PolicyField
  household_priority?: PolicyField
  major_consistency?: PolicyField
  written_test_score?: PolicyField
  detailed_admission_rules?: PolicyField
  comprehensive_score?: PolicyField
  position_selection_method?: PolicyField
  non_first_choice_pass?: PolicyField
  campus_recruit_then_first_batch?: PolicyField
  certificate_probability?: PolicyField
  cost_effective_cities?: PolicyField
  cost_effective_counties?: PolicyField
  written_test_difficulty?: PolicyField
  qualification_review?: PolicyField
  three_way_agreement?: PolicyField
  admission_ratio?: PolicyField
  bachelor_admission_to_city?: PolicyField
  [key: string]: PolicyField | undefined
}

export interface UnitDetailsResponse {
  success: boolean
  data: {
    unit_info: UnitInfo
    policy_info: PolicyInfo
    city_details?: CityDetail[]
  }
}

export interface CityDetail {
  city: string
  company?: string
  data_level: string
  bachelor_salary: number | null
  master_salary: number | null
  bachelor_score?: number | null
  master_score?: number | null
  bachelor_interview_line?: string | null
  master_interview_line?: string | null
  is_best_value_city?: string
  is_best_value_county?: string
}

export interface RegionalItem {
  unit_id: number
  city: string
  county?: string
  apply_status: string
  bachelor_salary?: number | null
  master_salary?: number | null
  bachelor_score?: number | null
  master_score?: number | null
  data_level?: string
}

export interface RegionalOverviewResponse {
  success: boolean
  data: {
    org_type: string
    total_count: number
    regional_overview: RegionalItem[]
  }
}

export interface EarlyBatchInfo {
  schedule_arrangement?: PolicyField
  education_requirement?: PolicyField
  written_test_content?: PolicyField
  chase_station_ability?: PolicyField
  admission_factors?: PolicyField
  unit_admission_status?: PolicyField
  difficulty_ranking?: PolicyField
  early_vs_regular_quality?: PolicyField
  [key: string]: PolicyField | undefined
}

export interface EarlyBatchResponse {
  success: boolean
  data: {
    early_batch_info: EarlyBatchInfo
    has_data: boolean
  }
}

export interface RuralGridInfo {
  salary_benefits?: PolicyField
  exam_time?: PolicyField
  age_requirement?: PolicyField
  application_status?: PolicyField
  online_assessment?: PolicyField
  personality_test?: PolicyField
  qualification_review?: PolicyField
  written_test_content?: PolicyField
  [key: string]: PolicyField | undefined
}

export interface RuralGridResponse {
  success: boolean
  data: {
    rural_grid_info: RuralGridInfo
    has_data: boolean
  }
}

export interface DisplayFieldConfig {
  field_name: string
  display_name: string
  field_type: string
  display_order: number
  field_description?: string
  is_required?: boolean
  is_editable?: boolean
}

export interface DisplayConfigResponse {
  success: boolean
  data: {
    category: string
    fields: DisplayFieldConfig[]
  }
}

// 政策API接口函数

/**
 * 获取筛选选项（4个互斥选择）
 */
export function getFilterOptions(): Promise<FilterOptions> {
  return request.get('/api/v1/policy-sections/filter-options').then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取筛选选项失败')
  })
}

/**
 * 获取单位详细政策信息
 */
export function getUnitDetails(unitId: number): Promise<UnitDetailsResponse['data']> {
  return request.get('/api/v1/policies/unit-details', {
    params: { unit_id: unitId }
  }).then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取单位详情失败')
  })
}

/**
 * 获取地市县概览信息
 */
export function getRegionalOverview(unitId: number): Promise<RegionalOverviewResponse['data']> {
  return request.get('/api/v1/policies/regional-overview', {
    params: { unit_id: unitId }
  }).then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取地市县概览失败')
  })
}

/**
 * 获取提前批信息
 */
export function getEarlyBatchInfo(unitId: number): Promise<EarlyBatchResponse['data']> {
  return request.get('/api/v1/policies/early-batch', {
    params: { unit_id: unitId }
  }).then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取提前批信息失败')
  })
}

/**
 * 获取农网信息
 */
export function getRuralGridInfo(unitId: number): Promise<RuralGridResponse['data']> {
  return request.get('/api/v1/policies/rural-grid', {
    params: { unit_id: unitId }
  }).then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取农网信息失败')
  })
}

/**
 * 获取字段配置信息（用于动态显示）
 */
export function getDisplayConfig(category: string): Promise<DisplayConfigResponse['data']> {
  return request.get('/api/v1/policies/display-config', {
    params: { category }
  }).then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取显示配置失败')
  })
}

/**
 * 获取政策API健康状态
 */
export function getPolicyHealth(): Promise<any> {
  return request.get('/api/v1/policies/health').then((response: any) => {
    return response
  })
}

/**
 * 获取省级政策基本信息（province_policies表数据）
 */
export function getProvincePolicies(regionId: number): Promise<any> {
  return request.get('/api/v1/policies/province-policies', {
    params: { region_id: regionId }
  }).then((response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || '获取省级政策信息失败')
  })
}

// 批量树数据响应接口
export interface BatchTreeNode {
  id: string
  region_id: number
  label: string
  level: 'province' | 'city' | 'company'
  province?: string
  city?: string
  company?: string
  region_code?: string
  is_municipality?: boolean
  sort_order?: number
  policy_status?: {
    has_policy: boolean
    created_at?: string | null
    updated_at?: string | null
  }
  children?: BatchTreeNode[]
}

export interface BatchTreeResponse {
  tree_data: BatchTreeNode[]
  stats: {
    total_provinces: number
    total_cities: number
    total_companies: number
    total_nodes: number
    provinces_with_policy?: number
    companies_with_policy?: number
    province_policy_coverage?: number
    company_policy_coverage?: number
  }
  total_requests_saved: string
  data_freshness: string
  performance_improvement: string
}

// ========== 政策管理系统API ==========

/**
 * 政策管理API接口
 */
export const policyManagementAPI = {
  /**
   * 批量获取完整的省市县三级树结构数据（性能优化版本）
   * 替代原来的懒加载方式，从50+个请求减少到1个请求
   */
  getBatchTreeData(includePolicy: boolean = true): Promise<BatchTreeResponse> {
    return request.get('/api/v1/policy-management/tree-data', {
      params: { include_policy_status: includePolicy }
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取批量树数据失败')
    })
  },

  /**
   * 获取行政区划数据
   */
  getRegions(params?: {
    region_level?: 'province' | 'city' | 'company'
    parent_id?: number
    province?: string
    city?: string
    region_name?: string
    has_policy?: boolean
    page?: number
    limit?: number
  }): Promise<{
    data: any[]
    total: number
    page: number
    limit: number
    has_more: boolean
    total_pages: number
  }> {
    return request.get('/api/v1/policy-management/regions', { params }).then((response: any) => {
      if (response.success) {
        return {
          data: response.data?.regions || [],
          total: response.data?.total || 0,
          page: response.data?.page || 1,
          limit: response.data?.limit || 20,
          has_more: response.data?.has_more || false,
          total_pages: response.data?.total_pages || 1
        }
      }
      throw new Error(response.message || '获取区划数据失败')
    })
  },

  /**
   * 获取行政区划树形结构
   */
  getRegionTree(params?: { province?: string }): Promise<any> {
    return request.get('/api/v1/policy-management/regions/tree', { params }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取区划树失败')
    })
  },

  /**
   * 获取省级政策列表
   */
  getProvincePolicies(params?: {
    region_id?: number
    province?: string
    page?: number
    limit?: number
  }): Promise<any> {
    return request.get('/api/v1/policy-management/province-policies', { params }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取省级政策失败')
    })
  },

  /**
   * 获取单个省级政策
   */
  getProvincePolicy(regionId: number): Promise<any> {
    return request.get(`/api/v1/policy-management/province-policies/${regionId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取省级政策失败')
    })
  },

  /**
   * 创建省级政策
   */
  createProvincePolicy(data: any): Promise<any> {
    return request.post('/api/v1/policy-management/province-policies', data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '创建省级政策失败')
    })
  },

  /**
   * 更新省级政策
   */
  updateProvincePolicy(regionId: number, data: any): Promise<any> {
    return request.put(`/api/v1/policy-management/province-policies/${regionId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新省级政策失败')
    })
  },

  /**
   * 删除省级政策
   */
  deleteProvincePolicy(regionId: number): Promise<any> {
    return request.delete(`/api/v1/policy-management/province-policies/${regionId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '删除省级政策失败')
    })
  },

  /**
   * 获取公司级政策列表
   */
  getCompanyPolicies(params?: {
    region_id?: number
    province?: string
    city?: string
    page?: number
    limit?: number
  }): Promise<any> {
    return request.get('/api/v1/policy-management/company-policies', { params }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取公司政策失败')
    })
  },

  /**
   * 获取单个公司级政策
   */
  getCompanyPolicy(regionId: number): Promise<any> {
    return request.get(`/api/v1/policy-management/company-policies/${regionId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取公司政策失败')
    })
  },

  /**
   * 创建公司级政策
   */
  createCompanyPolicy(data: any): Promise<any> {
    return request.post('/api/v1/policy-management/company-policies', data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '创建公司政策失败')
    })
  },

  /**
   * 更新公司级政策
   */
  updateCompanyPolicy(regionId: number, data: any): Promise<any> {
    return request.put(`/api/v1/policy-management/company-policies/${regionId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新公司政策失败')
    })
  },

  /**
   * 通过region_id更新公司级政策（新的后端API适配）
   */
  updateCompanyPolicyByRegion(regionId: number, data: any): Promise<any> {
    return request.put(`/api/v1/policy-management/company-policies/by-region/${regionId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新公司政策失败')
    })
  },

  /**
   * 删除公司级政策
   */
  deleteCompanyPolicy(regionId: number): Promise<any> {
    return request.delete(`/api/v1/policy-management/company-policies/${regionId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '删除公司政策失败')
    })
  },

  /**
   * 批量导入政策数据
   */
  importPolicies(formData: FormData): Promise<any> {
    return request.post('/api/v1/policy-management/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '导入政策失败')
    })
  },

  /**
   * 导出政策数据
   */
  exportPolicies(params?: {
    region_level?: 'province' | 'company'
    province?: string
    format?: 'xlsx' | 'csv'
  }): Promise<any> {
    return request.get('/api/v1/policy-management/export', { 
      params,
      responseType: 'blob'
    }).then((response: any) => {
      return { data: response }
    })
  },

  /**
   * 复制政策配置
   */
  copyPolicy(params: {
    source_region_id: number
    target_region_id: number
    policy_type: 'province' | 'company'
  }): Promise<any> {
    return request.post('/api/v1/policy-management/copy-policy', params).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '复制政策失败')
    })
  },

  /**
   * 获取政策管理系统健康状态
   */
  getHealth(): Promise<any> {
    return request.get('/api/v1/policy-management/health').then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取系统状态失败')
    })
  },

  /**
   * 获取政策统计信息
   */
  getStats(): Promise<any> {
    return request.get('/api/v1/policy-management/stats').then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取统计信息失败')
    })
  },

  /**
   * 获取指定区域的所有政策（改进的层级API）
   */
  getRegionPolicies(regionId: number): Promise<any> {
    return request.get(`/api/v1/policy-management/regions/${regionId}/policies`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取区域政策失败')
    })
  },

  /**
   * 批量获取多个区域的政策
   */
  getBatchRegionPolicies(regionIds: number[]): Promise<any[]> {
    const promises = regionIds.map(id => 
      this.getRegionPolicies(id).catch(error => ({
        region_id: id,
        error: error.message,
        policies: null
      }))
    )
    return Promise.all(promises)
  },

  // ========== 区域管理API ==========

  /**
   * 创建新区域
   */
  createRegion(data: {
    region_name: string
    region_level: 'province' | 'city' | 'company'
    parent_id?: number
    region_code?: string
    province?: string
    city?: string
    company?: string
  }): Promise<any> {
    return request.post('/api/v1/policy-management/regions', data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '创建区域失败')
    })
  },

  /**
   * 更新区域信息
   */
  updateRegion(regionId: number, data: {
    region_name?: string
    region_code?: string
    province?: string
    city?: string
    company?: string
  }): Promise<any> {
    return request.put(`/api/v1/policy-management/regions/${regionId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新区域失败')
    })
  },

  /**
   * 删除区域
   */
  deleteRegion(regionId: number, options?: {
    force?: boolean // 强制删除，包括子区域
    migrate_to?: number // 将政策数据迁移到指定区域
  }): Promise<any> {
    return request.delete(`/api/v1/policy-management/regions/${regionId}`, { 
      data: options 
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '删除区域失败')
    })
  },

  /**
   * 批量删除区域
   */
  batchDeleteRegions(regionIds: number[], options?: {
    force?: boolean
    migrate_to?: number
  }): Promise<any> {
    return request.post('/api/v1/policy-management/regions/batch-delete', {
      region_ids: regionIds,
      ...options
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '批量删除区域失败')
    })
  },

  /**
   * 获取区域详细信息
   */
  getRegionDetail(regionId: number): Promise<any> {
    return request.get(`/api/v1/policy-management/regions/${regionId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取区域详情失败')
    })
  },

  /**
   * 检查区域是否可删除（是否有关联的政策数据）
   */
  checkRegionDeletable(regionId: number): Promise<{
    deletable: boolean
    reason?: string
    policy_count?: number
    child_count?: number
  }> {
    return request.get(`/api/v1/policy-management/regions/${regionId}/check-deletable`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '检查删除条件失败')
    })
  },

  /**
   * 移动区域到新的父级
   */
  moveRegion(regionId: number, newParentId: number): Promise<any> {
    return request.put(`/api/v1/policy-management/regions/${regionId}/move`, {
      new_parent_id: newParentId
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '移动区域失败')
    })
  },

  /**
   * 获取区域的子级统计信息
   */
  getRegionStats(regionId?: number): Promise<{
    region_stats: Array<{
      region_level: string
      count: number
      active_count: number
    }>
    summary: {
      total_provinces: number
      total_cities: number  
      total_companies: number
      total_province_policies: number
      total_company_policies: number
    }
    coverage_stats: Array<any>
    policy_stats: Array<any>
    province_stats: Array<any>
  }> {
    const params = regionId ? { region_id: regionId } : {}
    return request.get('/api/v1/policy-management/regions/stats', { params }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取区域统计失败')
    })
  }
}

// ========== 板块编辑API ==========

/**
 * 板块编辑API接口
 */
export const sectionEditingAPI = {
  /**
   * 获取基本政策信息
   */
  getBasicPolicy(unitId: number): Promise<any> {
    return request.get(`/api/v1/section-editing/basic/${unitId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取基本政策信息失败')
    })
  },

  /**
   * 更新基本政策信息
   */
  updateBasicPolicy(unitId: number, data: any): Promise<any> {
    return request.put(`/api/v1/section-editing/basic/${unitId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新基本政策信息失败')
    })
  },

  /**
   * 更新提前批板块
   */
  updateEarlyBatch(unitId: number, data: any): Promise<any> {
    return request.put(`/api/v1/section-editing/early-batch/${unitId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新提前批板块失败')
    })
  },

  /**
   * 更新农网板块
   */
  updateRuralGrid(unitId: number, data: any): Promise<any> {
    return request.put(`/api/v1/section-editing/rural-grid/${unitId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新农网板块失败')
    })
  },

  /**
   * 更新地市县概览
   */
  updateRegionalOverview(unitId: number, data: any): Promise<any> {
    return request.put(`/api/v1/section-editing/regional/${unitId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新地市县概览失败')
    })
  },
  
  /**
   * 批量更新地市县概览
   */
  updateRegionalOverviewBatch(unitId: number, data: {
    updates: Array<{
      city: string
      county?: string
      data: any
    }>
  }): Promise<{
    success: boolean
    message: string
    results: Array<{
      city: string
      county?: string
      success: boolean
      error?: string
      region_id?: number  // 新增：后端返回的区域ID，便于调试
    }>
    total_updated: number
    total_failed: number
  }> {
    return request.put(`/api/v1/section-editing/regional/batch/${unitId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '批量更新地市县概览失败')
    })
  }
}

// ========== 自定义字段API ==========

/**
 * 自定义字段管理API
 */
export const customFieldsAPI = {
  /**
   * 获取自定义字段列表
   */
  getCustomFields(params?: {
    section?: 'basic' | 'early_batch' | 'rural_grid' | 'regional'
    province?: string
    is_active?: boolean
  }): Promise<any> {
    return request.get('/api/v1/custom-fields/', { params }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取自定义字段失败')
    })
  },

  /**
   * 创建自定义字段
   */
  createCustomField(data: {
    field_name: string
    display_name: string
    field_type: string
    section: string
    province?: string
    is_required?: boolean
    display_order?: number
    field_options?: any
    validation_rules?: any
  }): Promise<any> {
    return request.post('/api/v1/custom-fields/', data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '创建自定义字段失败')
    })
  },

  /**
   * 更新自定义字段
   */
  updateCustomField(fieldId: number, data: any): Promise<any> {
    return request.put(`/api/v1/custom-fields/${fieldId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新自定义字段失败')
    })
  },

  /**
   * 删除自定义字段
   */
  deleteCustomField(fieldId: number): Promise<any> {
    return request.delete(`/api/v1/custom-fields/${fieldId}`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '删除自定义字段失败')
    })
  },

  /**
   * 获取用于管理的字段列表（包括隐藏字段）
   */
  getFieldsForManagement(section: string, province?: string): Promise<any> {
    const params = province ? { province } : undefined
    return request.get(`/api/v1/custom-fields/manage/${section}`, { params }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取管理字段列表失败')
    })
  },

  /**
   * 切换字段可见性
   */
  toggleFieldVisibility(fieldId: number, isVisible: boolean): Promise<{ message: string; success: boolean }> {
    return request.put(`/api/v1/custom-fields/${fieldId}/visibility`, {
      is_visible: isVisible
    }).then((response: any) => {
      if (response.success) {
        return response // 返回整个response，包含message字段
      }
      throw new Error(response.message || '切换字段可见性失败')
    })
  },

  /**
   * 批量更新字段显示顺序
   */
  batchUpdateFieldOrder(fieldOrders: { field_id: number; display_order: number }[]): Promise<any> {
    return request.put('/api/v1/custom-fields/batch-update-order', {
      field_orders: fieldOrders
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '批量更新字段顺序失败')
    })
  },

  /**
   * 获取单位的自定义字段值（支持合并接口）
   */
  getCustomFieldValues(unitId: number, section?: string, province?: string, includeDefinitions?: boolean): Promise<any> {
    const params: any = {}
    if (section) params.section = section
    if (province) params.province = province
    if (includeDefinitions) params.include_definitions = 'true'
    
    return request.get(`/api/v1/custom-fields/values/${unitId}`, { 
      params: Object.keys(params).length > 0 ? params : undefined 
    }).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取自定义字段值失败')
    })
  },

  /**
   * 更新单位的自定义字段值
   */
  updateCustomFieldValues(unitId: number, data: {
    section: string
    field_values: Record<string, any>
  }): Promise<any> {
    return request.put(`/api/v1/custom-fields/values/${unitId}`, data).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新自定义字段值失败')
    })
  },

  /**
   * 获取字段统计信息
   */
  getFieldStatistics(): Promise<any> {
    return request.get('/api/v1/custom-fields/statistics').then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取字段统计信息失败')
    })
  },

  /**
   * 获取省份列表（包含字段统计）
   */
  getProvinces(): Promise<{
    total_provinces: number
    provinces: Array<{
      province: string
      field_count: number
    }>
  }> {
    return request.get('/api/v1/custom-fields/provinces').then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取省份列表失败')
    })
  }
}

// ========== 统一政策板块API (新架构) ==========

/**
 * 统一政策板块API - 新的统一接口
 * 提供标准化的政策数据管理功能
 */
export const policySectionsAPI = {
  
  /**
   * 健康检查
   */
  healthCheck(): Promise<any> {
    return request.get('/api/v1/policy-sections/health')
  },

  /**
   * 获取基本政策信息
   */
  getBasicPolicy(unitId: number): Promise<{
    basic_policy_info: Record<string, {
      value: any
      display_name: string
      type: string
      priority: number
      data_source: string
    }>
    updated_at: string
    version: number
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/basic`)
  },

  /**
   * 更新基本政策信息
   */
  updateBasicPolicy(unitId: number, data: Record<string, any>): Promise<{
    message: string
    updated_at: string
    version: number
  }> {
    return request.put(`/api/v1/policy-sections/${unitId}/basic`, data)
  },

  /**
   * 获取提前批政策信息
   */
  getEarlyBatchPolicy(unitId: number): Promise<{
    early_batch_info: Record<string, {
      value: any
      display_name: string
      type: string
      priority: number
      data_source: string
    }>
    updated_at: string
    version: number
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/early-batch`)
  },

  /**
   * 更新提前批政策信息
   */
  updateEarlyBatchPolicy(unitId: number, data: Record<string, any>): Promise<{
    message: string
    updated_at: string
    version: number
  }> {
    return request.put(`/api/v1/policy-sections/${unitId}/early-batch`, data)
  },

  /**
   * 获取农网政策信息
   */
  getRuralGridPolicy(unitId: number): Promise<{
    rural_grid_info: Record<string, {
      value: any
      display_name: string
      type: string
      priority: number
      data_source: string
    }>
    updated_at: string
    version: number
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/rural-grid`)
  },

  /**
   * 更新农网政策信息
   */
  updateRuralGridPolicy(unitId: number, data: Record<string, any>): Promise<{
    message: string
    updated_at: string
    version: number
  }> {
    return request.put(`/api/v1/policy-sections/${unitId}/rural-grid`, data)
  },

  /**
   * 获取区域概览信息
   */
  getRegionalOverview(unitId: number): Promise<{
    regional_info: Record<string, {
      value: any
      display_name: string
      type: string
      priority: number
      data_source: string
    }>
    updated_at: string
    version: number
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/regional`)
  },

  /**
   * 更新区域概览信息
   */
  updateRegionalOverview(unitId: number, data: Record<string, any>): Promise<{
    message: string
    updated_at: string
    version: number
  }> {
    return request.put(`/api/v1/policy-sections/${unitId}/regional`, data)
  },

  /**
   * 获取单位详细信息（新版API）
   */
  getUnitDetailsNew(unitId: number): Promise<{
    unit_info: any
    policy_info: any
    city_details: any[]
    data_sources: string[]
    total_fields: number
    has_policy_data: boolean
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/unit-details`)
  },

  /**
   * 获取区域概览信息（新版API）  
   */
  getRegionalOverviewNew(unitId: number): Promise<{
    org_type: string
    unit_overview: any
    regional_breakdown: any[]
    total_count: number
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/regional-overview`).then((response: any) => {
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取区域概览失败')
    })
  },

  /**
   * 获取所有板块信息
   */
  getAllSections(unitId: number): Promise<{
    unit_id: number
    sections: {
      basic: {
        section_data: Record<string, any>
        version: number
        total_fields: number
      }
      early_batch: {
        section_data: Record<string, any>
        version: number
        total_fields: number
      }
      rural_grid: {
        section_data: Record<string, any>
        version: number
        total_fields: number
      }
      regional: {
        section_data: Record<string, any>
        version: number
        total_fields: number
      }
    }
    total_sections: number
    data_source: string
  }> {
    return request.get(`/api/v1/policy-sections/${unitId}/all`)
  }
}