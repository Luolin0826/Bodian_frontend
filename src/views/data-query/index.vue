<template>
  <div class="data-query-page">
    <!-- 页面头部统计 -->
    <div class="stats-header">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalRecords }}</div>
          <div class="stat-label">总录取记录</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.provinces }}</div>
          <div class="stat-label">覆盖省份</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.policyRules }}</div>
          <div class="stat-label">政策规则</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.lastUpdate }}</div>
          <div class="stat-label">数据更新</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-content" :bordered="false">
      <!-- 查询面板 -->
      <QueryPanel
        v-model:query="queryParams"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
        @update:query="handleQueryUpdate"
      />


      <!-- 内容布局 - 左1/3数据概览，右2/3政策查询 -->
      <div class="content-layout" :class="layoutClass">
        <!-- 左侧：数据分析概览 (1/3) -->
        <div class="analytics-section">
          <DataAnalytics
            :data="analyticsData"
            :loading="analyticsLoading"
            @drill-down="handleDrillDown"
            @school-detail="handleSchoolDetail"
          />
        </div>

        <!-- 右侧：政策查询 (2/3) -->
        <div class="results-section">
          <div class="section-header">
            <h3>政策查询 <a-badge :count="searchResults.length" class="result-count" /></h3>
            <div class="view-controls">
              <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
                <a-radio-button value="list">
                  <unordered-list-outlined />
                  列表
                </a-radio-button>
                <a-radio-button value="card">
                  <appstore-outlined />
                  卡片
                </a-radio-button>
              </a-radio-group>
            </div>
          </div>
          
          <div class="results-container">
            <a-spin :spinning="loading" tip="正在查询...">
              <div v-if="searchResults.length === 0 && !loading" class="empty-state">
                <a-empty description="暂无查询结果">
                  <template #image>
                    <search-outlined class="empty-icon" />
                  </template>
                  <div class="empty-suggestions">
                    <p>暂未找到匹配的结果，建议您：</p>
                    <ul>
                      <li>💡 尝试选择更大的地理范围（如只选省份）</li>
                      <li>🎯 尝试选择不同的公司类型或批次</li>
                      <li>🔍 尝试搜索不同的学校名称</li>
                      <li>📚 调整学历层次要求</li>
                    </ul>
                  </div>
                </a-empty>
              </div>
              
              <div v-else class="results-list" :class="`view-${viewMode}`">
                <PolicyCard
                  v-for="policy in searchResults"
                  :key="`${policy.province}-${policy.city}-${policy.company}`"
                  :policy="policy"
                  :view-mode="viewMode"
                  :selected-education-level="getSelectedEducationLevel()"
                  @detail="handleViewDetail"
                />
              </div>
            </a-spin>
          </div>
        </div>
      </div>

    </a-card>

    <!-- 政策详情弹窗 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="政策详情"
      :width="1200"
      :footer="null"
      class="policy-detail-modal"
    >
      <PolicyDetail
        v-if="selectedPolicy"
        :policy="selectedPolicy"
        :selected-education-level="getSelectedEducationLevel()"
      />
    </a-modal>

    <!-- 学校详情弹窗 -->
    <a-modal
      v-model:open="schoolDetailVisible"
      :title="`学校详情 - ${selectedSchool?.school_name || ''}`"
      :width="900"
      :footer="null"
      class="school-detail-modal"
    >
      <div v-if="selectedSchool" class="school-detail-content">
        <a-spin :spinning="schoolDetailLoading" tip="正在加载学校详细信息...">
          <div class="school-info-grid">
            <div class="info-item">
              <label>学校名称：</label>
              <span>{{ selectedSchool.school_name }}</span>
            </div>
            <div class="info-item">
              <label>学校类型：</label>
              <a-tag :color="getSchoolTypeColor(selectedSchool.school_type)">
                {{ selectedSchool.school_type }}
              </a-tag>
            </div>
            <div class="info-item">
              <label>学校层次：</label>
              <a-tag :color="getSchoolLevelColor(selectedSchool.school_level)">
                {{ selectedSchool.school_level }}
              </a-tag>
            </div>
            <div class="info-item">
              <label>总录取人数：</label>
              <span class="highlight-number">{{ selectedSchool.total_recruitment_count || 0 }}</span>
            </div>
          </div>
          
          <div v-if="schoolDetailData" class="detail-sections">
            <div class="detail-section">
              <h4>性别分布</h4>
              <div class="gender-stats">
                <div class="gender-item">
                  <span class="gender-label">男性：</span>
                  <span class="gender-count">{{ schoolDetailData.gender_distribution?.男?.count || 0 }}人</span>
                  <span class="gender-percentage">({{ schoolDetailData.gender_distribution?.男?.percentage || 0 }}%)</span>
                </div>
                <div class="gender-item">
                  <span class="gender-label">女性：</span>
                  <span class="gender-count">{{ schoolDetailData.gender_distribution?.女?.count || 0 }}人</span>
                  <span class="gender-percentage">({{ schoolDetailData.gender_distribution?.女?.percentage || 0 }}%)</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>批次分布</h4>
              <div class="batch-stats">
                <div v-for="batch in schoolDetailData.batch_distribution" :key="batch.batch" class="batch-item">
                  <span class="batch-name">{{ batch.batch }}：</span>
                  <span class="batch-count">{{ batch.count }}人</span>
                  <span class="batch-percentage">({{ batch.percentage }}%)</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>地区分布</h4>
              <div class="region-stats">
                <div v-for="region in schoolDetailData.regional_distribution?.slice(0, 10)" :key="region.region" class="region-item">
                  <span class="region-name">{{ region.unit_name }}：</span>
                  <span class="region-count">{{ region.count }}人</span>
                </div>
              </div>
            </div>
          </div>
        </a-spin>
      </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined
} from '@ant-design/icons-vue'
import {
  getDistrictPolicies,
  getAnalytics,
  getLayeredQuery,
  getDetailedPolicy,
  type PolicyInfo,
  type DistrictPolicyQuery,
  type AnalyticsResponse
} from '@/api/recruitment'
import QueryPanel from './components/QueryPanel.vue'
import PolicyCard from './components/PolicyCard.vue'
import DataAnalytics from './components/DataAnalytics.vue'
import PolicyDetail from './components/PolicyDetail.vue'
import RecordsList from './components/RecordsList.vue'
import { useResponsive } from '@/composables/useResponsive'

// 响应式工具
const { isMobile, isTablet } = useResponsive()

// 响应式数据
const loading = ref(false)
const analyticsLoading = ref(false)
const viewMode = ref<'list' | 'card'>('card')
const detailModalVisible = ref(false)

// 学校详情相关
const schoolDetailVisible = ref(false)
const schoolDetailLoading = ref(false)
const selectedSchool = ref<any>(null)
const schoolDetailData = ref<any>(null)

// 查询参数
const queryParams = reactive<DistrictPolicyQuery>({
  company_type: undefined,
  batch: undefined,
  province: undefined,
  city: undefined,
  county: undefined,
  school_name: undefined,
  bachelor_level: undefined,
  master_level: undefined
})

// 数据状态
const searchResults = ref<PolicyInfo[]>([])
const analyticsData = ref<AnalyticsResponse | null>(null)
const selectedPolicy = ref<PolicyInfo | null>(null)
const recordsData = ref<any[]>([])
const paginationData = ref({
  current_page: 1,
  total_pages: 1,
  has_next: false,
  has_prev: false,
  total: 0
})


// 统计数据
const stats = reactive({
  totalRecords: 1900,
  provinces: 15,
  policyRules: 29,
  lastUpdate: '今天'
})

// 计算属性
const layoutClass = computed(() => {
  if (isMobile.value) return 'mobile-layout'
  if (isTablet.value) return 'tablet-layout'
  return 'desktop-layout'
})

// 方法定义
const handleSearch = async () => {
  // 检查是否有有意义的查询条件（包括公司类型选择）
  const hasCondition = queryParams.company_type ||
                      queryParams.province || 
                      queryParams.city || 
                      queryParams.county || 
                      queryParams.school_name ||
                      queryParams.batch ||
                      queryParams.bachelor_level || 
                      queryParams.master_level

  console.log('主页面查询参数:', queryParams)
  console.log('是否有查询条件:', hasCondition)

  // 至少需要一个查询条件
  if (!hasCondition) {
    message.warning('请选择至少一个筛选条件进行查询')
    return
  }

  loading.value = true
  try {
    // 构建请求参数，将中文学历层次转换为英文字段名
    const requestParams = {
      ...queryParams,
      page: 1,
      limit: 50  // 初始加载50条记录
    }
    
    // 处理学历层次参数 - 同时支持本科和硕士查询
    const hasEducationLevels = !!(queryParams.bachelor_level || queryParams.master_level)
    
    if (hasEducationLevels) {
      // 如果同时选择了本科和硕士，需要分别查询两次
      if (queryParams.bachelor_level && queryParams.master_level) {
        console.log('🎓 同时查询本科和硕士层次数据')
        
        // TODO: 这里应该实现并行查询两个层次的逻辑
        // 目前先提示用户选择单一层次
        message.warning('当前版本请选择单一学历层次进行查询。同时查询多个层次功能正在开发中...')
        loading.value = false
        return
      }
      
      // 处理单一学历层次
      let selectedLevel = queryParams.bachelor_level || queryParams.master_level
      let selectedField = convertEducationLevelToEnglish(selectedLevel!)
      
      if (selectedField) {
        requestParams.education_level = selectedField
        // 移除 education_value，这应该是后端返回的数据
        
        const levelType = queryParams.bachelor_level ? '本科' : '硕士'
        console.log(`📚 ${levelType}层次映射:`, selectedLevel, '=>', selectedField)
        console.log('📚 最终学历层次参数:', {
          education_level: requestParams.education_level
        })
      }
    }
    
    // 移除中文字段
    delete requestParams.bachelor_level
    delete requestParams.master_level
    
    console.log('转换后的查询参数:', requestParams)
    
    // 🔥 使用新的分层查询逻辑
    const layeredResponse = await getLayeredQuery(requestParams)

    console.log('分层查询结果:', layeredResponse)
    console.log('查询层级:', layeredResponse.query_level)

    // 处理数据概览 - 使用API适配层返回的data_analysis结构
    if (layeredResponse.data_analysis) {
      analyticsData.value = {
        analysis_type: 'comprehensive',
        group_by: ['province', 'gender', 'school_type'],
        filters: queryParams,
        analytics: {
          total_count: layeredResponse.data_analysis.total_count || 0,
          grouped_stats: [
            { name: '性别分布', data: layeredResponse.data_analysis.gender_distribution },
            { name: '学校类型分布', data: layeredResponse.data_analysis.university_level_distribution }
          ],
          company_analysis: layeredResponse.data_analysis.company_distribution,
          // 直接传递后端结构用于兼容
          gender_distribution: layeredResponse.data_analysis.gender_distribution,
          school_type_distribution: layeredResponse.data_analysis.university_level_distribution,
          university_level_distribution: layeredResponse.data_analysis.university_level_distribution,
          detailed_statistics: layeredResponse.data_analysis.detailed_statistics,
          // 添加school_statistics数据
          school_statistics: layeredResponse.data_analysis.school_statistics,
          // 添加unit_statistics数据  
          unit_statistics: layeredResponse.data_analysis.unit_statistics
        }
      }

      // 更新学校统计数据
      recordsData.value = layeredResponse.data_analysis.school_statistics?.schools || []
      
      // 更新分页信息
      if (layeredResponse.data_analysis.pagination) {
        paginationData.value = {
          current_page: layeredResponse.data_analysis.pagination.current_page,
          total_pages: layeredResponse.data_analysis.pagination.total_pages,
          has_next: layeredResponse.data_analysis.pagination.has_next,
          has_prev: layeredResponse.data_analysis.pagination.has_prev,
          total: layeredResponse.data_analysis.pagination.total
        }
      }
    }

    // 处理政策查询 - 使用API适配层返回的结构
    console.log('🔍 政策数据检查:')
    console.log('layeredResponse.policy_info:', layeredResponse.policy_info)
    console.log('layeredResponse.policy_analysis:', layeredResponse.policy_analysis)
    
    if (layeredResponse.policy_info?.available || layeredResponse.policy_analysis?.policies?.length) {
      const policies = layeredResponse.policy_info?.policies || layeredResponse.policy_analysis?.policies || []
      
      console.log('获取到的政策数据:', policies)
      console.log('政策数据长度:', policies.length)
      
      searchResults.value = policies.map((policy: any) => {
        const hasEducationLevel = !!(queryParams.bachelor_level || queryParams.master_level)
        const currentLevel = queryParams.bachelor_level ? 'bachelor' : (queryParams.master_level ? 'master' : 'all')
        
        // 获取具体学历层次的政策数据 - 适配实际API返回结构
        const location = policy.location || {}
        const salaryInfo = policy.salary_info || {}
        const schoolRequirements = policy.school_requirements || {}
        const basicRequirements = policy.basic_requirements || {}
        const interviewInfo = policy.interview_info || {}
        
        // 添加教育水平政策值处理
        const educationLevelInfo = {
          education_level: policy.education_level || null,
          education_value: policy.education_value || null,
          field_name: policy.field_name || null
        }

        return {
          id: `${location.province}-${location.city || ''}-${location.district || ''}-${currentLevel}`,
          province: location.province,
          city: location.city,
          company: location.district || location.city,
          company_type: queryParams.company_type,
          batch: queryParams.batch,
          data_level: policy.data_level || (hasEducationLevel ? 3 : 2),
          region_type: 2,
          region_type_name: hasEducationLevel ? `${currentLevel === 'bachelor' ? '本科' : '硕士'}网申政策` : '网申政策',
          
          // 🎯 基本要求 - 根据学历层次显示
          basic_requirements: {
            cet_requirement: basicRequirements?.cet_requirement || '四级',
            computer_requirement: '计算机二级',
            overage_allowed: '应届毕业生',
            household_priority: '不限',
            non_first_choice_pass: '接受调剂'
          },

          // 🎯 薪资待遇 - 显示对应学历层次
          salary_info: {
            bachelor_salary: salaryInfo?.bachelor_salary,
            master_salary: salaryInfo?.master_salary,
            bachelor_interview_line: interviewInfo?.bachelor_interview_line,
            master_interview_line: interviewInfo?.master_interview_line
          },

          // 🎯 详细信息
          detailed_info: {
            stable_score_range: interviewInfo?.bachelor_interview_line || interviewInfo?.master_interview_line,
            admission_ratio: policy.additional_info?.admission_ratio,
            application_status: '能过网申'
          },

          // 🎯 学历要求 - 根据学校要求显示
          education_requirements: {
            bachelor: {
              '985': schoolRequirements?.bachelor_985 || '能过网申',
              '211': schoolRequirements?.bachelor_211 || '能过网申'
            },
            master: {
              '985': schoolRequirements?.master_985 || '本科211能过网审',
              '211': schoolRequirements?.master_211 || '本科211能过网申'
            }
          },

          // 🎯 性价比标记
          is_cost_effective: false,
          cost_effective_reason: '',

          // 🎯 备注信息
          field_notes: [
            {
              field_name: '数据层级',
              note_content: policy.data_level || '市级汇总',
              note_type: 'info'
            },
            {
              field_name: '政策ID',
              note_content: `政策编号: ${policy.policy_id}`,
              note_type: 'info'
            }
          ],

          // 🎓 教育水平政策信息
          education_level_info: educationLevelInfo,

          // 🚀 原始政策数据
          raw_policy: policy
        }
      })
    } else {
      // 没有政策数据或仅数据概览，清空政策结果
      searchResults.value = []
      console.log('未找到政策数据，仅显示数据概览')
    }

    // 显示查询结果提示
    const dataCount = layeredResponse.data_analysis?.total_count || 0
    const policyCount = (layeredResponse.policy_info?.policies?.length || 0) + (layeredResponse.policy_analysis?.policies?.length || 0)
    
    if (layeredResponse.query_level) {
      if (dataCount > 0 || policyCount > 0) {
        const messages = []
        if (dataCount > 0) {
          messages.push(`数据概览：${dataCount} 条`)
        }
        if (policyCount > 0) {
          messages.push(`网申政策：${policyCount} 条`)
        }
        message.success(`🎯 查询成功！${messages.join('，')}`)
      } else {
        message.warning('未查询到相关数据，请尝试调整查询条件')
      }
    }
  } catch (error) {
    console.error('查询失败:', error)
    message.error('查询失败，请重试')
    searchResults.value = []
    analyticsData.value = null
  } finally {
    loading.value = false
  }
}

const handleQueryUpdate = (newQuery: DistrictPolicyQuery) => {
  console.log('收到查询参数更新:', newQuery)
  console.log('学历层次参数:', {
    bachelor_level: newQuery.bachelor_level,
    master_level: newQuery.master_level
  })
  
  // 只更新参数，不自动触发查询
  Object.assign(queryParams, newQuery)
  
  console.log('更新后的queryParams:', queryParams)
  
  // 清空之前的查询结果，避免显示过期数据
  if (searchResults.value.length > 0) {
    searchResults.value = []
    analyticsData.value = null
  }
}

const handleReset = () => {
  Object.assign(queryParams, {
    company_type: undefined,
    batch: undefined,
    province: undefined,
    city: undefined,
    county: undefined,
    school_name: undefined,
    bachelor_level: undefined,
    master_level: undefined
  })
  searchResults.value = []
  analyticsData.value = null
  recordsData.value = []
  paginationData.value = {
    current_page: 1,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    total: 0
  }
}

const handlePageChange = async (page: number, pageSize?: number) => {
  // 更新查询参数中的分页信息
  queryParams.page = page
  queryParams.limit = pageSize || 50
  
  // 重新执行搜索
  await handleSearch()
}



const handleViewDetail = (policy: PolicyInfo) => {
  // 设置选中的政策并打开详情模态框
  selectedPolicy.value = policy
  detailModalVisible.value = true
  console.log('📋 查看政策详情:', policy)
}



const handleDrillDown = (params: any) => {
  // 处理图表钻取事件
  console.log('钻取参数:', params)
}

// 处理学校详情查看
const handleSchoolDetail = async (schoolInfo: any) => {
  try {
    selectedSchool.value = schoolInfo
    schoolDetailVisible.value = true
    schoolDetailLoading.value = true
    
    // 调用后端接口获取学校详细信息
    // TODO: 使用实际的 /api/v1/analytics/university/{university_id} 接口
    const response = await fetch(`/api/v1/analytics/university/${schoolInfo.university_id}`)
    if (response.ok) {
      schoolDetailData.value = await response.json()
    } else {
      message.warning('获取学校详情失败，请稍后重试')
      schoolDetailData.value = null
    }
  } catch (error) {
    console.error('获取学校详情出错:', error)
    message.error('获取学校详情时出现错误')
    schoolDetailData.value = null
  } finally {
    schoolDetailLoading.value = false
  }
}

// 工具方法：获取学校类型颜色
const getSchoolTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '理工类': 'blue',
    '综合类': 'green', 
    '财经类': 'orange',
    '师范类': 'purple',
    '医药类': 'red',
    '农林类': 'lime',
    '政法类': 'cyan',
    '艺术类': 'magenta',
    '体育类': 'gold',
    '民族类': 'volcano',
    '语言类': 'geekblue',
    '其他': 'default'
  }
  return colorMap[type] || 'default'
}

// 工具方法：获取学校层次颜色
const getSchoolLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '985工程': 'red',
    '211工程': 'orange', 
    '双一流': 'gold',
    '重点大学': 'blue',
    '普通本科': 'green',
    '专科院校': 'cyan',
    '其他': 'default'
  }
  return colorMap[level] || 'default'
}

// 学历层次中英文映射
const educationLevelMapping = {
  // 本科层次映射
  '985本': 'bachelor_985',
  '211本': 'bachelor_211',
  '省内双一流本': 'bachelor_provincial_double_first',
  '省外双一流本': 'bachelor_external_double_first',
  '省内双非一本': 'bachelor_provincial_non_double',
  '省外双非一本': 'bachelor_external_non_double',
  '省内二本': 'bachelor_provincial_second',
  '省外二本': 'bachelor_external_second',
  '民办本': 'bachelor_private',
  '专升本': 'bachelor_upgrade',
  '专科': 'bachelor_college',
  
  // 硕士层次映射
  '985硕': 'master_985',
  '211硕': 'master_211',
  '省内双一流硕': 'master_provincial_double_first',
  '省外双一流硕': 'master_external_double_first',
  '省内双非硕': 'master_provincial_non_double',
  '省外双非硕': 'master_external_non_double'
}

// 获取当前选中的学历层次
const getSelectedEducationLevel = () => {
  if (queryParams.bachelor_level) return 'bachelor'
  if (queryParams.master_level) return 'master'
  return null
}

// 将中文学历层次转换为英文字段名
const convertEducationLevelToEnglish = (chineseLevel: string) => {
  return educationLevelMapping[chineseLevel as keyof typeof educationLevelMapping] || null
}



// 生命周期
onMounted(async () => {
  // 如果有默认查询条件，执行查询
  if (queryParams.province) {
    await handleSearch()
  }
})

// 响应式布局监听
watch([isMobile, isTablet], () => {
  // 保持列表视图为默认
  viewMode.value = 'list'
})
</script>

<style scoped lang="less">
.data-query-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;

  @media (max-width: 768px) {
    padding: 8px;
    gap: 6px;
  }
}

// 统计头部 - 超紧凑样式
.stats-header {
  margin-bottom: 6px;

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
  }

  .stat-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border: 1px solid #d6f4ff;
    border-radius: 6px;
    padding: 8px 12px;
    text-align: center;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }

    .stat-number {
      font-size: 18px;
      font-weight: 600;
      color: #1890ff;
      line-height: 1.2;

      @media (max-width: 768px) {
        font-size: 16px;
      }
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 2px;

      @media (max-width: 768px) {
        font-size: 11px;
      }
    }
  }
}

// 主内容区域
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.ant-card-body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
  }
}

// 内容布局 - 全宽数据分析
.content-layout {
  flex: 1;
  margin-top: 6px;

  &.full-width {
    display: block;
    width: 100%;
  }

  // 保持兼容旧布局（如果需要）
  &.desktop-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;  // 左1/3，右2/3
    gap: 12px;
  }

  &.tablet-layout {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
  }

  &.mobile-layout {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
  }
}

// 结果区域
.results-section {
  display: flex;
  flex-direction: column;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;

    h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .result-count {
      :deep(.ant-badge-count) {
        background: #52c41a;
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
  }

  .results-container {
    flex: 1;
    min-height: 400px;
  }

  .results-list {
    display: grid;
    gap: 12px;

    &.view-card {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    &.view-list {
      grid-template-columns: 1fr;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;

  .empty-icon {
    font-size: 64px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }

  .empty-suggestions {
    margin-top: 16px;
    text-align: left;
    max-width: 400px;
    
    p {
      color: #666;
      margin-bottom: 12px;
      font-weight: 500;
      text-align: center;
    }
    
    ul {
      list-style: none;
      padding: 0;
      margin: 0 0 16px 0;
      
      li {
        color: #8c8c8c;
        padding: 6px 0;
        font-size: 14px;
        line-height: 1.5;
        
        &:hover {
          color: #1890ff;
        }
      }
    }
  }
}


// 分析区域
.analytics-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;

  &.full-width {
    width: 100%;
  }
}


// 模态框和抽屉样式
.policy-detail-modal {
  :deep(.ant-modal-body) {
    padding: 0;
  }
}

// 学校详情弹窗样式
.school-detail-modal {
  .school-detail-content {
    .school-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        label {
          font-weight: 600;
          color: #666;
          min-width: 80px;
        }
        
        .highlight-number {
          font-size: 18px;
          font-weight: 600;
          color: #1890ff;
        }
      }
    }
    
    .detail-sections {
      .detail-section {
        margin-bottom: 20px;
        
        h4 {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 6px;
        }
        
        .gender-stats,
        .batch-stats,
        .region-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .gender-item,
        .batch-item,
        .region-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: #f0f9ff;
          border-radius: 6px;
          border-left: 3px solid #1890ff;
          
          .gender-label,
          .batch-name,
          .region-name {
            font-weight: 500;
            color: #333;
          }
          
          .gender-count,
          .batch-count,
          .region-count {
            font-weight: 600;
            color: #1890ff;
          }
          
          .gender-percentage,
          .batch-percentage {
            color: #666;
            font-size: 12px;
          }
        }
        
        .region-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          
          .region-item {
            background: #f6ffed;
            border-left-color: #52c41a;
          }
        }
      }
    }
  }
  
  :deep(.ant-modal-body) {
    padding: 16px;
    max-height: 600px;
    overflow-y: auto;
  }
}

// 响应式优化
@media (max-width: 768px) {
  .content-layout.mobile-layout {
    .results-section {
      order: 1;
    }

    .analytics-section {
      order: 2;
      margin-top: 16px;
    }
  }
}
</style>