import request from '@/api/request'

// 基础数据类型定义
export interface BaseRequirements {
  cet_requirement?: string
  computer_requirement?: string
  overage_allowed?: string
  household_priority?: string
  non_first_choice_pass?: string
}

export interface DetailedInfo {
  detailed_rules?: string
  unwritten_rules?: string
  stable_score_range?: string
  single_cert_probability?: string
  admission_ratio?: string
  application_status?: string
}

export interface EducationRequirements {
  bachelor?: {
    '985'?: string
    '211'?: string
  }
  master?: {
    '985'?: string
    '211'?: string
  }
}

export interface SalaryInfo {
  bachelor_salary?: string
  master_salary?: string
  bachelor_interview_line?: string
  master_interview_line?: string
  bachelor_comprehensive_score?: string
}

export interface AdmissionPolicies {
  first_batch_fail_second_batch?: string
  second_choice_available?: string
  position_selection_method?: string
  early_batch_difference?: string
  campus_recruit_then_first_batch?: string
}

export interface ValueInfo {
  is_best_value_city?: boolean
  is_best_value_county?: boolean
}

export interface InterviewInfo {
  bachelor_comprehensive_score?: string | number
  master_interview_line?: string | number
}

export interface EducationLevelInfo {
  education_value?: string
}

export interface FieldNote {
  field_name: string
  note_content: string
  note_type: string
}

// 政策信息接口
export interface PolicyInfo {
  id: number
  province: string
  city?: string
  company?: string
  company_type?: string         // 公司类型：国网|南网
  batch?: string               // 批次：一批|二批|三批
  data_level: number
  region_type: number
  region_type_name: string
  basic_requirements: BaseRequirements
  detailed_info: DetailedInfo
  education_requirements: EducationRequirements
  salary_info: SalaryInfo
  admission_policies: AdmissionPolicies
  value_info: ValueInfo
  field_notes: FieldNote[]
  is_cost_effective?: boolean   // 是否性价比推荐
  cost_effective_reason?: string // 性价比推荐原因
  interview_info?: InterviewInfo  // 面试信息
  education_level_info?: EducationLevelInfo  // 学历层次信息
}

// 查询参数接口
export interface DistrictPolicyQuery {
  company_type?: string        // 公司类型：国网|南网
  batch?: string              // 批次：一批|二批|三批
  province?: string           // 省份
  city?: string              // 城市
  county?: string            // 区县/单位
  school_name?: string       // 学校名称
  bachelor_level?: string    // 本科层次（中文）
  master_level?: string      // 硕士层次（中文）
  education_level?: string   // 学历层次（英文字段名）
  page?: number               // 页码
  limit?: number              // 每页数量
}

export interface SchoolLevelQuery {
  school_levels?: string[]
  provinces?: string[]
  cities?: string[]
  education_level?: 'bachelor' | 'master'
}

export interface AnalyticsQuery {
  analysis_type?: 'comprehensive' | 'school' | 'regional' | 'trend'
  group_by?: string[]
  filters?: {
    provinces?: string[]
    school_types?: string[]
    years?: number[]
  }
}

// 响应数据接口
export interface DistrictPolicyResponse {
  query_params: DistrictPolicyQuery
  policies: PolicyInfo[]
  summary: {
    total_records: number
    by_level: Record<string, number>
    by_region_type: Record<string, number>
  }
  // 扩展字段以支持新的后端数据结构
  data_analysis?: {
    total_count?: number
    total_records?: number
    gender_distribution?: Record<string, number>
    school_type_distribution?: Record<string, number>
    company_distribution?: Array<{ company: string, count: number }>
    detailed_statistics?: Array<any>
    // 添加分页信息
    pagination?: {
      current_page: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
      total: number
    }
    // 添加更多统计信息字段
    batch_distribution?: any
    university_level_distribution?: Record<string, number>
    school_statistics?: any
    // 新增二级单位统计数据结构
    unit_statistics?: {
      available: boolean
      covered_units: number
      total_units: number
      units: Array<{
        unit_name: string
        region: string
        recruitment_count: number
        percentage: number
      }>
    }
  }
  policy_analysis?: {
    policies?: PolicyInfo[]
    total_policies?: number
    error?: string
  }
  policy_info?: {
    available: boolean
    data_source: string
    policies: Array<any>
    total_policies: number
  }
}

export interface SchoolLevelResponse {
  query_params: SchoolLevelQuery
  admission_matrix: Record<string, {
    province: string
    city: string
    company: string
    data_level: number
    region_type: number
    admission_status: Record<string, string>
  }>
  summary_stats: Record<string, Record<string, number>>
  regional_analysis: Record<string, Record<string, Record<string, number>>>
}

export interface AnalyticsResponse {
  analysis_type: string
  group_by: string[]
  filters: any
  analytics: {
    total_count?: number
    grouped_stats?: any[]
    batch_distribution?: any[]
    top_schools?: any[]
    school_type_analysis?: any[]
    province_analysis?: any[]
    company_analysis?: any[]
    // 新增字段以兼容后端数据结构
    gender_distribution?: any
    school_type_distribution?: any
    university_level_distribution?: any
    detailed_statistics?: Array<any>
    company_distribution?: any
    // 学校统计数据
    school_statistics?: {
      schools?: Array<{
        school_name: string
        school_type: string
        school_level: string
        recruitment_count: number
        percentage: number
      }>
    }
    // 二级单位统计数据
    unit_statistics?: {
      available: boolean
      covered_units: number
      total_units?: number
      units: Array<{
        unit_name: string
        region: string
        recruitment_count: number
        percentage: number
      }>
    }
  }
  insights?: string[]
}

export interface BestValueResponse {
  region_level: string
  best_value_cities: PolicyInfo[]
  best_value_counties: PolicyInfo[]
  comprehensive_ranking: (PolicyInfo & {
    value_tags: ValueInfo
    recruitment_data: {
      total_recruitment: number
      key_school_recruitment: number
      key_school_ratio: number
    }
  })[]
}

// API方法
export const recruitmentAPI = {
  // 8字段筛选主接口 - 使用新的data-search接口
  async getDistrictPolicies(params: DistrictPolicyQuery): Promise<DistrictPolicyResponse> {
    // 参数映射：适配前端字段到后端字段
    const mappedParams = {
      company: params.company_type,           // company_type → company
      secondary_unit: params.province,        // province → secondary_unit (二级单位)
      city: params.city,
      county: params.county,
      university_name: params.school_name,    // school_name → university_name
      batch: params.batch,
      bachelor_level: params.bachelor_level,
      master_level: params.master_level,
      // 学历层次参数 - 只传递字段名，让后端查询对应的值
      education_level: params.education_level,
      page: params.page || 1,
      limit: params.limit || 50
    }

    // 清理undefined值
    const cleanParams = Object.fromEntries(
      Object.entries(mappedParams).filter(([_, value]) => value !== undefined && value !== null)
    )

    const response = await request.post('/api/v1/data-search/search', cleanParams)
    
    console.log('API响应数据:', response) // 调试日志
    console.log('🔍 API适配 - unit_statistics原始数据:', (response as any).unit_statistics)
    console.log('🔍 API适配 - policy_info原始数据:', (response as any).policy_info)
    
    // 确定查询级别
    const hasPolicy = (response as any).policy_info?.available && (response as any).policy_info?.policies?.length > 0
    const queryLevel = hasPolicy ? 'policy_included' : 'data_overview'
    console.log('🔍 API适配 - 查询级别判断:', { hasPolicy, queryLevel, available: (response as any).policy_info?.available, policyCount: (response as any).policy_info?.policies?.length })
    
    // 适配响应数据到前端期望的格式
    const adaptedResponse = {
      query_level: queryLevel,
      query_params: params,
      policies: [], // 暂时为空，主要使用data_analysis
      summary: {
        total_records: (response as any).total_records || 0,
        by_level: (response as any).statistics?.university_level_distribution || {},
        by_region_type: {}
      },
      data_analysis: {
        total_count: (response as any).total_records,
        total_records: (response as any).total_records,
        gender_distribution: (response as any).statistics?.gender_distribution || {},
        school_type_distribution: (response as any).statistics?.university_level_distribution || {},
        company_distribution: Object.entries((response as any).statistics?.company_distribution || {}).map(([company, count]) => ({ company, count: count as number })),
        detailed_statistics: (response as any).school_statistics?.schools || [], // 使用学校统计数据
        // 添加分页信息
        pagination: {
          current_page: (response as any).pagination?.page || 1,
          total_pages: (response as any).pagination?.total_pages || 1,
          has_next: (response as any).pagination?.has_next || false,
          has_prev: (response as any).pagination?.has_prev || false,
          total: (response as any).pagination?.total || 0
        },
        // 添加更多统计信息
        batch_distribution: (response as any).filters_applied,
        university_level_distribution: (response as any).statistics?.university_level_distribution || {},
        school_statistics: (response as any).school_statistics || {},
        // 添加新的二级单位统计数据
        unit_statistics: (() => {
          const unitStats = (response as any).unit_statistics || {
            available: false,
            covered_units: 0,
            total_units: 0,
            units: []
          }
          console.log('🔍 API适配 - 映射后的unit_statistics:', unitStats)
          return unitStats
        })()
      },
      policy_analysis: {
        policies: (response as any).policy_info?.policies || [],
        total_policies: (response as any).policy_info?.total_policies || 0
      },
      // 直接暴露policy_info以便前端访问
      policy_info: (response as any).policy_info,
      
      // 添加调试信息
      debug_policy_info: (response as any).policy_info
    }
    
    console.log('🔍 API适配 - 最终返回结构:', { 
      query_level: adaptedResponse.query_level, 
      has_policy_info: !!adaptedResponse.policy_info,
      policy_analysis_count: adaptedResponse.policy_analysis?.policies?.length 
    })
    
    return adaptedResponse
  },

  // 按学校层次查询录取情况
  async getAdmissionBySchoolLevel(params: SchoolLevelQuery): Promise<SchoolLevelResponse> {
    return request.get('/api/v1/recruitment/school-level', { params })
  },

  // 录取情况数据分析
  async getAnalytics(params: AnalyticsQuery): Promise<AnalyticsResponse> {
    return request.get('/api/v1/recruitment/analytics', { params })
  },

  // 性价比地区查询
  async getBestValueRegions(region_level: 'city' | 'county' | 'all' = 'all'): Promise<BestValueResponse> {
    return request.get('/api/v1/recruitment/best-value', { 
      params: { region_level } 
    })
  },

  // 获取可用查询选项
  async getAvailableOptions(): Promise<{
    provinces: string[]
    cities: Record<string, string[]>
    school_levels: string[]
    company_types: string[]
  }> {
    return request.get('/api/v1/recruitment/options')
  },

  // 级联查询接口 - 使用新的统一接口
  // 获取省份列表
  async getProvinces(): Promise<{
    level: string
    data_source: string
    options: Array<{
      name: string
      count: number
    }>
  }> {
    const response = await request.get('/api/v1/data-search/locations/cascade')
    // 适配后端返回的数据结构
    return {
      level: response.level,
      data_source: response.source, // source -> data_source
      options: response.data // data -> options
    }
  },

  // 根据省份获取城市列表
  async getCitiesByProvince(province: string): Promise<{
    level: string
    province: string
    data_source: string
    options: Array<{
      name: string
      count: number
    }>
  }> {
    const response = await request.get('/api/v1/data-search/locations/cascade', {
      params: { level: 'city', province }
    })
    // 适配后端返回的数据结构
    return {
      level: response.level,
      province: response.province,
      data_source: response.source, // source -> data_source
      options: response.data // data -> options
    }
  },

  // 根据省份和城市获取区县列表
  async getDistrictsByProvinceAndCity(province: string, city: string): Promise<{
    level: string
    province: string
    city: string
    data_source: string
    options: Array<{
      name: string
      count: number
    }>
  }> {
    const response = await request.get('/api/v1/data-search/locations/cascade', {
      params: { level: 'district', province, city }
    })
    // 适配后端返回的数据结构
    return {
      level: response.level,
      province: response.province,
      city: response.city,
      data_source: response.source, // source -> data_source
      options: response.data // data -> options
    }
  },

  // 兼容性方法 - 根据省份获取单位/区县列表
  async getCompaniesByProvince(province: string, city?: string): Promise<{
    province: string
    city: string | null
    companies: string[]
    count: number
  }> {
    if (city) {
      const response = await this.getDistrictsByProvinceAndCity(province, city)
      return {
        province,
        city,
        companies: response.options.map(opt => opt.name),
        count: response.options.length
      }
    } else {
      const response = await this.getCitiesByProvince(province)
      return {
        province,
        city: null,
        companies: response.options.map(opt => opt.name),
        count: response.options.length
      }
    }
  },

  // 兼容性方法 - 根据省份和城市获取具体单位列表
  async getCompaniesByProvinceAndCity(province: string, city: string): Promise<{
    province: string
    city: string
    companies: string[]
    count: number
  }> {
    const response = await this.getDistrictsByProvinceAndCity(province, city)
    return {
      province,
      city,
      companies: response.options.map(opt => opt.name),
      count: response.options.length
    }
  },

  // 学校名称模糊搜索 - 临时使用本地数据，等待后端接口
  async searchSchools(query: string, limit: number = 10): Promise<{
    query: string
    total_schools: number
    schools: Array<{
      school_name: string
      school_type: string
      school_level: string
      recruitment_count: number
    }>
  }> {
    try {
      const response = await request.get('/api/v1/data-search/schools/search', { 
        params: { query, limit } 
      })
      
      // 适配后端返回的数据结构
      return {
        query: response.query,
        total_schools: response.total_found, // total_found -> total_schools
        schools: (response.data || []).map((school: any) => ({
          school_name: school.name, // name -> school_name
          school_type: school.type,
          school_level: school.level,
          recruitment_count: school.total_recruitment // total_recruitment -> recruitment_count
        }))
      }
    } catch (error) {
      console.warn('学校搜索接口暂不可用，使用本地模拟数据')
      
      // 提供常见学校的模拟数据
      const mockSchools = [
        { school_name: '华北电力大学(北京)', school_type: '理工类', school_level: '211工程', recruitment_count: 120 },
        { school_name: '华北电力大学(保定)', school_type: '理工类', school_level: '211工程', recruitment_count: 95 },
        { school_name: '华东电力大学', school_type: '理工类', school_level: '211工程', recruitment_count: 78 },
        { school_name: '东北电力大学', school_type: '理工类', school_level: '普通本科', recruitment_count: 65 },
        { school_name: '三峡大学', school_type: '理工类', school_level: '普通本科', recruitment_count: 45 },
        { school_name: '华南理工大学', school_type: '理工类', school_level: '985工程', recruitment_count: 89 },
        { school_name: '重庆理工大学', school_type: '理工类', school_level: '普通本科', recruitment_count: 32 },
        { school_name: '理工大学', school_type: '理工类', school_level: '普通本科', recruitment_count: 28 },
        { school_name: '华东交通大学', school_type: '理工类', school_level: '普通本科', recruitment_count: 76 },
        { school_name: '华东理工大学', school_type: '理工类', school_level: '211工程', recruitment_count: 67 }
      ]
      
      // 模拟搜索：按关键词过滤
      const filteredSchools = mockSchools.filter(school => 
        school.school_name.includes(query)
      ).slice(0, limit)
      
      return {
        query,
        total_schools: filteredSchools.length,
        schools: filteredSchools
      }
    }
  },

  // 性价比推荐算法
  async getCostEffectiveRecommendations(params?: {
    limit?: number
    region_type?: 'city' | 'county' | 'all'
  }): Promise<{
    algorithm_version: string
    total_analyzed: number
    recommendations: Array<{
      province: string
      city?: string
      company?: string
      cost_effectiveness_score: number
      recommendation_reasons: string[]
      recruitment_count: number
      bachelor_salary?: string
      data_level: string
    }>
    evaluation_criteria: {
      factors: string[]
      scoring_method: string
    }
  }> {
    return request.get('/api/v1/recruitment/cost-effective-recommendations', { params })
  },

  // 详细分页统计接口
  async getDetailedStatistics(params: DistrictPolicyQuery & {
    page?: number
    limit?: number
  }): Promise<{
    data_analysis: {
      total_records: number
      gender_distribution: Record<string, number>
      school_type_distribution: Record<string, number>
      company_distribution: Array<{ company: string, count: number }>
    }
    detailed_statistics: Array<{
      name: string
      gender: string
      school: string
      school_type: string
      province: string
    }>
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
    }
  }> {
    return request.get('/api/v1/recruitment/detailed-statistics', { params })
  },

  // 根据公司类型获取二级单位列表
  async getSecondaryUnits(company_type: string): Promise<{
    company_type: string
    secondary_units: Array<{
      unit_name: string
      region: string
      recruitment_count: number
    }>
    count: number
  }> {
    const response = await request.get('/api/v1/data-search/secondary-units', { 
      params: { company_type } 
    })
    
    // 适配后端返回的数据结构
    const units = (response as any).data || []
    return {
      company_type,
      secondary_units: units,
      count: units.length
    }
  },

  // 分层查询接口 - 根据参数完整度返回不同层级的数据
  async getLayeredQuery(params: DistrictPolicyQuery): Promise<{
    query_level: 'data_overview' | 'policy_included' | 'detailed_policy'
    data_analysis?: any
    policies?: Array<{
      province: string
      city?: string
      county?: string
      education_level?: string
      policy_summary: {
        cet_requirement?: string
        interview_score?: string
        salary_info?: string
        application_status?: string
      }
      full_policy?: any // 完整政策信息（仅在detailed_policy级别返回）
    }>
  }> {
    // 判断查询层级 - 修正判断逻辑，有公司和地理信息就可以查询政策
    const hasCompany = !!params.company_type
    const hasLocationInfo = !!(params.province && params.city) // 有省份和城市就够了
    const hasEducationLevel = !!(params.bachelor_level || params.master_level)
    
    console.log('🔍 getLayeredQuery 判断条件:', { hasCompany, hasLocationInfo, hasEducationLevel, params })

    let queryLevel: 'data_overview' | 'policy_included' | 'detailed_policy'
    
    if (hasCompany && hasLocationInfo) {
      queryLevel = 'policy_included'  // 有公司和地理信息就查询政策
    } else if (hasCompany) {
      queryLevel = 'data_overview'    // 只有公司信息，显示数据概览
    } else {
      queryLevel = 'data_overview'    // 默认数据概览
    }
    
    console.log('🔍 getLayeredQuery 最终级别:', queryLevel)

    // 根据层级调用不同的接口
    switch (queryLevel) {
      case 'data_overview':
        const overviewResponse = await recruitmentAPI.getDistrictPolicies(params)
        return {
          query_level: 'data_overview',
          data_analysis: overviewResponse.data_analysis
        }
      
      case 'policy_included':
        // 直接使用已经修改好的 getDistrictPolicies 函数
        const policyResponse = await recruitmentAPI.getDistrictPolicies(params)
        console.log('🔍 getLayeredQuery policy_included 响应:', policyResponse)
        
        // 直接返回完整的响应结构，包含政策信息
        return policyResponse
      
      default:
        const defaultResponse = await recruitmentAPI.getDistrictPolicies(params)
        return {
          query_level: 'data_overview',
          data_analysis: defaultResponse.data_analysis
        }
    }
  },

  // 详细政策查询接口 - 返回省市区县完整合并的政策
  async getDetailedPolicy(province: string, city?: string, company?: string): Promise<{
    province: string
    city?: string
    company?: string
    data: any[]
    total_records: number
  }> {
    return request.get('/api/v1/data-search/policies/detail', {
      params: { province, city, company }
    })
  },

  // 用户行为记录（如需要）
  async logUserQuery(params: {
    user_id?: string
    query_type: string
    query_params: any
    result_count: number
  }): Promise<void> {
    return request.post('/api/v1/recruitment/log', params)
  }
}

// 导出具体方法以便直接使用
export const {
  getDistrictPolicies,
  getAdmissionBySchoolLevel,
  getAnalytics,
  getBestValueRegions,
  getAvailableOptions,
  getProvinces,
  getCitiesByProvince,
  getDistrictsByProvinceAndCity,
  getCompaniesByProvince,
  getCompaniesByProvinceAndCity,
  searchSchools,
  getCostEffectiveRecommendations,
  getDetailedStatistics,
  getSecondaryUnits,
  getLayeredQuery,
  getDetailedPolicy,
  logUserQuery
} = recruitmentAPI