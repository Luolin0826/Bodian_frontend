<template>
  <div class="data-analytics">
    <!-- 分析面板头部 - 紧凑样式 -->
    <div class="analytics-header">
      <div class="header-title">
        <bar-chart-outlined class="title-icon" />
        <span class="title-text">数据概览</span>
      </div>
      <div class="header-actions">
        <!-- 重置按钮已移至PolicyQueryPanel统一管理 -->
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" :tip="loadingTip">
        <div class="loading-placeholder"></div>
      </a-spin>
    </div>

    <!-- 分析内容 - 仅概览视图 -->
    <div v-else class="analytics-content compact">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid compact">
        <div class="metric-card">
          <div class="metric-icon">
            <team-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ totalCount }}</div>
            <div class="metric-label">总录取人数</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <trophy-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ keySchoolCount }}</div>
            <div class="metric-label">重点学校录取人数</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <global-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ secondaryUnitsCount }}</div>
            <div class="metric-label">覆盖学校数</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <rise-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ genderRatio }}</div>
            <div class="metric-label">男女比例</div>
          </div>
        </div>
      </div>

      <!-- 学校数据表格 -->
      <div class="schools-table-section">
        <div class="table-header">
          <div class="header-left">
            <h5>学校录取统计</h5>
          </div>
          <div class="table-actions">
            <!-- 表头点击排序已集成，此处移除冗余的排序控制 -->
          </div>
        </div>
        
        <a-table
          :columns="schoolTableColumnsWithSort"
          :data-source="schoolTableData"
          :pagination="{
            ...paginationInfo,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 所学校`,
            size: 'small'
          }"
          @change="handleTableChange"
          size="small"
        >
          <template #emptyText>
            <div class="table-empty-state-enhanced">
              <div class="empty-container">
                <div class="empty-visual">
                  <team-outlined class="empty-icon" />
                </div>
                <div class="empty-content">
                  <h4 class="empty-title">暂无学校录取数据</h4>
                  <p class="empty-description">
                    <span v-if="!props.unitId">请先选择一个单位查看对应的录取统计信息</span>
                    <span v-else-if="selectedBatch">该批次暂无录取数据</span>
                    <span v-else>暂无相关数据，可尝试选择不同的批次或搜索条件</span>
                  </p>
                  <div class="empty-suggestions">
                    <a-tag color="blue" v-if="!props.unitId">
                      <filter-outlined />
                      等待选择单位
                    </a-tag>
                    <a-tag color="green" v-else-if="!selectedBatch">
                      <search-outlined />
                      可选择批次筛选
                    </a-tag>
                  </div>
                  <div class="empty-hint-text">
                    <p>💡 使用上方筛选器可以快速定位数据</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'school_name'">
              <span 
                class="school-name-cell" 
                :class="{ 'search-highlight': record.isSearchResult }"
              >
                {{ record.school_name }}
                <a-tooltip title="电力院校" v-if="record.power_feature === 1">
                  <span class="power-icon">⚡</span>
                </a-tooltip>
              </span>
            </template>
            <template v-if="column.key === 'school_level'">
              <a-tag :color="getSchoolLevelColor(record.school_level)" size="small">
                {{ record.school_level }}
              </a-tag>
            </template>
            <template v-if="column.key === 'recruitment_count'">
              <span class="count-cell">{{ record.recruitment_count }}</span>
            </template>
            <template v-if="column.key === 'percentage'">
              <span class="percentage-cell">{{ record.percentage }}%</span>
            </template>
          </template>
        </a-table>
      </div>

    </div>

    <!-- 洞察建议 -->
    <div class="insights-section" v-if="data?.insights?.length">
      <div class="insights-header">
        <bulb-outlined class="insights-icon" />
        <span class="insights-title">数据洞察</span>
      </div>
      <div class="insights-list">
        <div
          v-for="(insight, index) in data.insights"
          :key="index"
          class="insight-item"
        >
          <check-circle-outlined class="insight-bullet" />
          <span class="insight-text">{{ insight }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  BarChartOutlined,
  TeamOutlined,
  TrophyOutlined,
  GlobalOutlined,
  RiseOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons-vue'
import type { AnalyticsResponse, AdmissionOverviewResponse, SchoolsByBatchResponse } from '@/api/recruitment'
import { recruitmentAPI } from '@/api/recruitment'
import { message } from 'ant-design-vue'

// Props - 支持两种数据结构
interface Props {
  data: AdmissionOverviewResponse['data'] | SchoolsByBatchResponse['data'] | null
  loading?: boolean
  unitId?: number | null
  unitInfo?: any
  showEmptyState?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  unitId: null,
  unitInfo: null,
  showEmptyState: false
})

// Emits
const emit = defineEmits(['drill-down', 'school-detail', 'data-refresh', 'batch-change', 'school-search', 'global-reset', 'update-analytics-data'])

// 响应式数据 - 简化版本
const currentPage = ref(1)
const selectedBatch = ref<string | null>(null)
const selectedSortBy = ref<string>('admission_count') // 默认按录取数量排序
const selectedSortOrder = ref<string | null>(null) // 保存当前的排序方向
const internalLoading = ref(false)
// 快捷筛选相关状态
const quickFilterType = ref<string | null>(null)

// 搜索相关状态
const searchKeyword = ref<string>('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const showSearchResults = ref(false)

// 辅助函数：判断数据结构类型
const isSchoolsByBatchData = computed(() => {
  return props.data && 'schools' in props.data && 'pagination' in props.data
})

// 加载状态提示文本
const loadingTip = computed(() => {
  if (searchLoading.value) {
    return '正在搜索学校...'
  }
  if (showSearchResults.value) {
    return '正在分析搜索结果...'
  }
  return '正在分析数据...'
})

// 计算属性 - 适配新的后端数据结构
const totalCount = computed(() => {
  console.log('🔍 DataAnalytics totalCount - props.data:', props.data)
  console.log('🔍 isSchoolsByBatchData:', isSchoolsByBatchData.value)
  
  if (!props.data) return 0
  
  // 如果是批次学校数据结构
  if (isSchoolsByBatchData.value) {
    const batchData = props.data as SchoolsByBatchResponse['data']
    console.log('✅ totalCount from batch summary:', batchData.summary?.total_admissions)
    return batchData.summary?.total_admissions || 0
  }
  
  // 如果是概览数据结构
  const overviewData = props.data as AdmissionOverviewResponse['data']
  const schoolTypeDist = overviewData.school_type_distribution || []
  const genderDist = overviewData.gender_distribution || []
  
  console.log('📊 school_type_distribution:', schoolTypeDist)
  console.log('📊 gender_distribution:', genderDist)
  
  if (schoolTypeDist.length > 0) {
    const total = schoolTypeDist.reduce((sum: number, item: any) => sum + (item.admission_count || 0), 0)
    console.log('✅ totalCount from schoolType:', total)
    return total
  }
  
  if (genderDist.length > 0) {
    const total = genderDist.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
    console.log('✅ totalCount from gender:', total)
    return total
  }
  
  return 0
})

const keySchoolCount = computed(() => {
  if (!props.data) return 0
  
  let keyCount = 0
  
  if (isSchoolsByBatchData.value) {
    const batchData = props.data as SchoolsByBatchResponse['data']
    
    // 优先从 summary 中获取重点学校统计（如果后端提供）
    if (batchData.summary && batchData.summary.key_schools_count !== undefined) {
      keyCount = batchData.summary.key_schools_count
      console.log('✅ 从summary获取重点学校录取人数:', keyCount)
    } else {
      // 由于后端summary暂时没有提供key_schools_count字段
      // 这里暂时返回0，避免使用不准确的分页数据计算
      // 建议后端在summary中添加key_schools_count字段
      console.log('⚠️ 后端summary暂未提供key_schools_count字段，暂时显示0')
      keyCount = 0
    }
  } else {
    const overviewData = props.data as AdmissionOverviewResponse['data']
    if (overviewData.school_type_distribution) {
      overviewData.school_type_distribution.forEach((item: any) => {
        if (['985工程', '211工程', '双一流'].includes(item.school_type)) {
          keyCount += item.admission_count || 0
        }
      })
    }
  }
  
  return keyCount
})



// 覆盖学校数量
const secondaryUnitsCount = computed(() => {
  if (!props.data) return 0
  
  if (isSchoolsByBatchData.value) {
    const batchData = props.data as SchoolsByBatchResponse['data']
    return batchData.summary?.total_schools || 0
  }
  
  // 概览数据显示top_schools数量
  const overviewData = props.data as AdmissionOverviewResponse['data']
  return overviewData.top_schools?.length || 0
})

// 新增：男女比例
const genderRatio = computed(() => {
  if (!props.data) return '暂无数据'
  
  let male = 0, female = 0
  
  if (isSchoolsByBatchData.value) {
    const batchData = props.data as SchoolsByBatchResponse['data']
    male = batchData.summary?.male_count || 0
    female = batchData.summary?.female_count || 0
  } else {
    const overviewData = props.data as AdmissionOverviewResponse['data']
    if (!overviewData.gender_distribution) return '暂无数据'
    
    overviewData.gender_distribution.forEach((item: any) => {
      if (item.gender === '男') {
        male = item.count
      } else if (item.gender === '女') {
        female = item.count
      }
    })
  }
  
  if (male === 0 && female === 0) return '暂无数据'
  if (female === 0) return '全男'
  if (male === 0) return '全女'
  
  const ratio = Math.round(male / female * 10) / 10
  return `${ratio}:1`
})


// 学校层次优先级映射 - 用于排序
const getSchoolLevelPriority = (level: string): number => {
  // 按学历优先级排序：985工程>211工程>双一流>海外高校>普通本科>科研院所>民办本科>专科院校
  const priorityMap: Record<string, number> = {
    '985工程': 1,     // 最高级
    '211工程': 2,     // 次高级
    '双一流': 3,      // 第三级
    '海外高校': 4,    // 第四级
    '普通本科': 5,    // 第五级
    '科研院所': 6,    // 第六级
    '民办本科': 7,    // 第七级
    '专科院校': 8,    // 第八级
    '独立学院': 9,    // 其他
    '重点大学': 10,   // 其他
    '其他': 99        // 默认最低级
  }
  return priorityMap[level] || 100
}

// 学校表格配置 - 后端排序
const schoolTableColumns = [
  {
    title: '学校名称',
    dataIndex: 'school_name',
    key: 'school_name',
    width: 200,
    ellipsis: true,
    sorter: true, // 启用后端排序
    showSorterTooltip: false
  },
  {
    title: '学校层次',
    dataIndex: 'school_level',
    key: 'school_level',
    width: 90,
    align: 'center' as const,
    sorter: true, // 启用后端排序
    showSorterTooltip: false
  },
  {
    title: '录取人数',
    dataIndex: 'recruitment_count',
    key: 'recruitment_count',
    width: 80,
    align: 'center' as const,
    sorter: true, // 启用后端排序
    showSorterTooltip: false,
    defaultSortOrder: 'descend' as const
  },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    width: 80,
    align: 'center' as const,
    sorter: true, // 启用后端排序
    showSorterTooltip: false
  }
]

// 动态表格配置 - 根据当前排序状态设置表格列
const schoolTableColumnsWithSort = computed(() => {
  return schoolTableColumns.map(column => {
    const newColumn = { ...column }
    
    // 根据当前排序状态设置列的排序状态
    if (column.key && selectedSortBy.value) {
      // 将后端排序字段映射回前端列key
      const backendToFrontendMap: { [key: string]: string } = {
        'university_name': 'school_name',
        'school_level': 'school_level',
        'school_level_desc': 'school_level', // 倒序排序也映射到同一列
        'admission_count': 'recruitment_count',
        'admission_ratio': 'percentage'
      }
      
      const frontendKey = backendToFrontendMap[selectedSortBy.value] || selectedSortBy.value
      
      if (column.key === frontendKey) {
        // 根据实际的后端排序字段设置排序状态
        if (selectedSortBy.value === 'school_level') {
          newColumn.sortOrder = 'descend'  // school_level对应前端的descend（高到低）
        } else if (selectedSortBy.value === 'school_level_desc') {
          newColumn.sortOrder = 'ascend'   // school_level_desc对应前端的ascend（低到高）
        } else if (selectedSortOrder.value) {
          // 其他字段按实际排序方向显示
          newColumn.sortOrder = selectedSortOrder.value === 'ascend' ? 'ascend' : 'descend'
        } else {
          // 默认排序，不显示排序图标
          newColumn.sortOrder = false
        }
      } else {
        newColumn.sortOrder = false
      }
    } else {
      // 没有排序状态时，清除所有列的排序标识
      newColumn.sortOrder = false
    }
    
    return newColumn
  })
})

// 学校统计表格数据 - 支持两种数据结构和搜索结果
const schoolTableData = computed(() => {
  console.log('🔍 schoolTableData - 计算开始:', {
    hasPropsData: !!props.data,
    showSearchResults: showSearchResults.value,
    searchResultsLength: searchResults.value.length,
    isSchoolsByBatchData: isSchoolsByBatchData.value
  })
  
  let tableData: any[] = []
  
  // 如果有搜索结果，优先显示搜索结果（不依赖props.data）
  if (showSearchResults.value && searchResults.value.length > 0) {
    console.log('🔍 schoolTableData - 使用搜索结果:', searchResults.value)
    tableData = searchResults.value.map((school: any) => ({
      school_name: school.university_name,
      school_level: school.school_level,
      recruitment_count: school.admission_count,
      percentage: school.admission_ratio.toFixed(2),
      power_feature: school.power_feature || 0,
      // 标记为搜索结果，用于高亮显示
      isSearchResult: true
    }))
    
    console.log('🔍 schoolTableData - 搜索结果映射完成:', tableData)
    return tableData
  }
  
  // 如果没有props.data且没有搜索结果，返回空
  if (!props.data) return []
  
  console.log('🔍 schoolTableData - isSchoolsByBatchData:', isSchoolsByBatchData.value)
  console.log('🔍 schoolTableData - complete data structure:', props.data)
  
  // 如果是批次学校数据结构
  if (isSchoolsByBatchData.value) {
    const batchData = props.data as SchoolsByBatchResponse['data']
    console.log('🔍 schoolTableData - batch schools:', batchData.schools)
    console.log('🔍 schoolTableData - batch summary:', batchData.summary)
    
    tableData = batchData.schools.map((school: any) => {
      // 计算该学校在总数中的百分比
      const totalAdmissions = batchData.summary?.total_admissions || 1
      const percentage = (school.admission_count / totalAdmissions * 100).toFixed(2)
      
      return {
        school_name: school.university_name,
        school_level: school.school_level,
        recruitment_count: school.admission_count,
        percentage: percentage,
        power_feature: school.power_feature || 0
      }
    })
  } else {
    // 如果是概览数据结构
    const overviewData = props.data as AdmissionOverviewResponse['data']
    if (!overviewData.top_schools) return []
    
    console.log('🔍 schoolTableData - overview top_schools:', overviewData.top_schools)
    
    tableData = overviewData.top_schools.map((school: any) => {
      let percentageValue = 0
      if (typeof school.percentage === 'string') {
        percentageValue = parseFloat(school.percentage) || 0
      } else if (typeof school.percentage === 'number') {
        percentageValue = school.percentage
      }
      
      return {
        school_name: school.university_name,
        school_level: school.school_level,
        recruitment_count: school.admission_count,
        percentage: percentageValue.toFixed(2),
        power_feature: school.power_feature || 0
      }
    })
  }
  
  return tableData
})

// 分页信息 - 优先使用本地状态
const paginationInfo = computed(() => {
  if (!props.data) return { current: currentPage.value, total: 0, pageSize: 30 }
  
  // 如果有搜索结果，显示搜索结果的分页信息
  if (showSearchResults.value && searchResults.value.length > 0) {
    return {
      current: 1,
      total: searchResults.value.length,
      pageSize: searchResults.value.length, // 搜索结果一页显示全部
      showSizeChanger: false,
      showQuickJumper: false
    }
  }
  
  if (isSchoolsByBatchData.value) {
    const batchData = props.data as SchoolsByBatchResponse['data']
    // 对于服务端分页，确保total和dataSource长度的关系正确
    const currentDataLength = batchData.schools?.length || 0
    const totalRecords = batchData.pagination?.total || 0
    
    return {
      current: currentPage.value, // 使用本地状态确保一致性
      total: totalRecords,
      pageSize: 50, // 修改为50条每页
      // 添加服务端分页标识，告知Ant Design这是服务端分页
      showSizeChanger: false,
      showQuickJumper: totalRecords > 50
    }
  }
  
  // 概览数据没有分页，显示固定的前10条
  const overviewData = props.data as AdmissionOverviewResponse['data']
  const topSchoolsLength = overviewData.top_schools?.length || 0
  return {
    current: 1,
    total: topSchoolsLength,
    pageSize: topSchoolsLength, // 对于概览数据，pageSize等于数据长度，避免分页
    showSizeChanger: false,
    showQuickJumper: false
  }
})


// 学校表格相关方法 - 统一处理分页、排序、筛选事件
const handleTableChange = async (pagination: any, filters: any, sorter: any) => {
  console.log('🔄 表格变化:', { 
    pagination, 
    filters, 
    sorter,
    unitId: props.unitId,
    selectedBatch: selectedBatch.value,
    currentSortBy: selectedSortBy.value,
    currentSortOrder: selectedSortOrder.value,
    isSchoolsByBatchData: isSchoolsByBatchData.value,
    showSearchResults: showSearchResults.value
  })
  
  // 如果当前显示的是搜索结果，使用前端排序
  if (showSearchResults.value && searchResults.value.length > 0) {
    console.log('🔍 搜索结果状态下的表格变化，使用前端排序')
    
    if (sorter && sorter.order) {
      const sortedResults = [...searchResults.value].sort((a: any, b: any) => {
        let aValue, bValue
        
        switch (sorter.columnKey) {
          case 'school_name':
            aValue = a.university_name || ''
            bValue = b.university_name || ''
            break
          case 'school_level':
            // 对于学校层次，使用优先级进行排序以确保正确的层次顺序
            aValue = getSchoolLevelPriority(a.school_level || '')
            bValue = getSchoolLevelPriority(b.school_level || '')
            break
          case 'recruitment_count':
            aValue = a.admission_count || 0
            bValue = b.admission_count || 0
            break
          case 'percentage':
            aValue = a.admission_ratio || 0
            bValue = b.admission_ratio || 0
            break
          default:
            aValue = a.admission_count || 0
            bValue = b.admission_count || 0
        }
        
        if (sorter.order === 'ascend') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })
      
      searchResults.value = sortedResults
    }
    
    return // 搜索结果状态下不需要向服务器发送请求
  }
  
  // 更新当前页
  currentPage.value = pagination.current
  
  // 处理排序变化（包括清除排序）
  if (sorter && sorter.columnKey) {
    if (sorter.order) {
      // 有排序方向，应用排序
      let sortBy = 'admission_count' // 默认排序
      if (sorter.columnKey === 'school_name') {
        sortBy = 'university_name'
      } else if (sorter.columnKey === 'school_level') {
        // 学校层次排序：ascend=从低到高层次，descend=从高到低层次（默认）
        sortBy = sorter.order === 'ascend' ? 'school_level_desc' : 'school_level'
      } else if (sorter.columnKey === 'recruitment_count') {
        sortBy = 'admission_count'
      } else if (sorter.columnKey === 'percentage') {
        sortBy = 'admission_ratio' // 使用后端新支持的占比排序参数
      }
      
      // 更新本地排序状态
      selectedSortBy.value = sortBy
      selectedSortOrder.value = sorter.order // 保存排序方向
      
      console.log('🔄 发送排序请求:', {
        unitId: props.unitId,
        batch: selectedBatch.value,
        sortBy: sortBy,
        page: pagination.current,
        sortOrder: sorter.order
      })
      
      // 发送排序请求 - 只要有单位ID、快捷筛选，或批次发生变化（包括清空），就发送排序请求
      if (props.unitId || quickFilterType.value || selectedBatch.value !== undefined) {
        try {
          emit('batch-change', {
            unitId: props.unitId,
            batch: selectedBatch.value, // 可以为null，表示所有批次
            quickFilter: quickFilterType.value, // 添加快捷筛选参数
            sortBy: sortBy,
            page: pagination.current,
            limit: 50, // 修改为50，与分页配置保持一致
            sortOrder: sorter.order // 'ascend' 或 'descend'
          })
          return // 等待新数据加载，不再执行下面的分页逻辑
        } catch (error) {
          console.error('❌ 排序加载失败:', error)
        }
      }
    } else {
      // 没有排序方向，清除排序
      console.log('🔄 清除排序，恢复默认状态')
      
      // 清除本地排序状态
      selectedSortBy.value = 'admission_count'
      selectedSortOrder.value = null
      
      // 发送清除排序请求 - 只要有单位ID、快捷筛选，或批次发生变化（包括清空），就发送请求
      if (props.unitId || quickFilterType.value || selectedBatch.value !== undefined) {
        try {
          emit('batch-change', {
            unitId: props.unitId,
            batch: selectedBatch.value,
            quickFilter: quickFilterType.value,
            sortBy: 'admission_count', // 恢复默认排序
            page: 1, // 重置到第一页
            limit: 50,
            sortOrder: 'desc' // 默认降序
          })
          return
        } catch (error) {
          console.error('❌ 清除排序失败:', error)
        }
      }
    }
  } else {
    console.log('🔄 发送分页请求:', {
      unitId: props.unitId,
      batch: selectedBatch.value,
      sortBy: selectedSortBy.value,
      sortOrder: selectedSortOrder.value,
      page: pagination.current,
      '当前保存的排序状态': {
        selectedSortBy: selectedSortBy.value,
        selectedSortOrder: selectedSortOrder.value
      }
    })
    
    // 纯分页变化（保持当前排序状态） - 只要有单位ID、快捷筛选，或批次发生变化（包括清空），就发送分页请求
    if (props.unitId || quickFilterType.value || selectedBatch.value !== undefined) {
      try {
        const requestParams: any = {
          unitId: props.unitId,
          batch: selectedBatch.value, // 可以为null，表示所有批次
          quickFilter: quickFilterType.value, // 添加快捷筛选参数
          sortBy: selectedSortBy.value,
          page: pagination.current,
          limit: 50, // 修改为50，与分页配置保持一致
          sortOrder: selectedSortOrder.value // 总是传递排序方向，即使为null
        }
        
        emit('batch-change', requestParams)
      } catch (error) {
        console.error('❌ 分页加载失败:', error)
      }
    }
  }
}

// 保留原有的handlePageChange方法以备不时之需
const handlePageChange = async (page: number) => {
  handleTableChange({ current: page }, {}, {})
}


// 加载学校数据的方法
const loadSchoolData = async (page: number = 1) => {
  if (!props.unitId) return
  
  console.log('加载学校数据', { 
    unitId: props.unitId, 
    batch: selectedBatch.value, 
    page 
  })
}

// 批次筛选变化处理
const handleBatchChange = async (batchValue: string | null) => {
  console.log('批次筛选变化:', batchValue)
  selectedBatch.value = batchValue
  
  // 批次变化时重置分页到第一页，但保持排序状态
  currentPage.value = 1
  
  // 如果当前有搜索关键词，则重新执行搜索以应用新的批次筛选
  if (searchKeyword.value.trim()) {
    console.log('📊 批次变化且有搜索关键词，重新执行联立搜索')
    performSchoolSearch(searchKeyword.value.trim())
    return // 搜索会处理数据加载，不需要再执行下面的batch-change
  }
  
  // 如果没有搜索关键词，清空搜索结果状态并执行正常的批次筛选
  showSearchResults.value = false
  searchResults.value = []
  
  // 触发事件，让父组件处理数据刷新
  const requestParams: any = {
    unitId: props.unitId,
    batch: batchValue,
    quickFilter: quickFilterType.value, // 添加快捷筛选参数
    sortBy: selectedSortBy.value,
    page: 1, // 重置到第一页
    limit: 50, // 修改为50，与分页配置保持一致
    sortOrder: selectedSortOrder.value // 总是传递排序方向，即使为null
  }
  
  emit('batch-change', requestParams)
}

// 快捷筛选方法
const handleQuickFilter = (filterType: 'guowang' | 'nanwang') => {
  console.log('快捷筛选:', filterType)
  
  // 切换快捷筛选状态
  if (quickFilterType.value === filterType) {
    // 如果已经选中，则取消选择
    quickFilterType.value = null
    message.info('已清除快捷筛选')
  } else {
    quickFilterType.value = filterType
    const filterName = filterType === 'guowang' ? '国网' : '南网'
    message.success(`已启用${filterName}快捷筛选`)
  }
  
  // 重置分页
  currentPage.value = 1
  
  // 如果当前有搜索关键词，重新执行搜索以应用快捷筛选
  if (searchKeyword.value.trim()) {
    console.log('📊 快捷筛选变化且有搜索关键词，重新执行联立搜索')
    performSchoolSearch(searchKeyword.value.trim())
    return
  }
  
  // 没有搜索关键词时，触发数据刷新
  const requestParams: any = {
    unitId: props.unitId,
    batch: selectedBatch.value,
    quickFilter: quickFilterType.value, // 添加快捷筛选参数
    sortBy: selectedSortBy.value,
    page: 1,
    limit: 50,
    sortOrder: selectedSortOrder.value
  }
  
  emit('batch-change', requestParams)
}

// 刷新数据
const handleRefresh = async () => {
  console.log('刷新数据:', { 
    unitId: props.unitId, 
    batch: selectedBatch.value, 
    sortBy: selectedSortBy.value,
    sortOrder: selectedSortOrder.value 
  })
  
  // 触发事件，让父组件处理数据刷新
  const requestParams: any = {
    unitId: props.unitId,
    batch: selectedBatch.value,
    quickFilter: quickFilterType.value, // 添加快捷筛选参数
    sortBy: selectedSortBy.value,
    page: currentPage.value,
    limit: 50, // 修改为50，与分页配置保持一致
    sortOrder: selectedSortOrder.value // 总是传递排序方向，即使为null
  }
  
  emit('batch-change', requestParams)
}

// 排序相关方法
const handleSortChange = (value: string) => {
  selectedSortBy.value = value
  console.log('🔄 排序方式变更:', value)
  
  // 触发数据重新加载
  const requestParams: any = {
    unitId: props.unitId,
    batch: selectedBatch.value,
    quickFilter: quickFilterType.value,
    sortBy: value,
    page: currentPage.value,
    limit: 50,
    sortOrder: selectedSortOrder.value
  }
  
  emit('batch-change', requestParams)
}

const toggleSortOrder = () => {
  selectedSortOrder.value = selectedSortOrder.value === 'desc' ? 'asc' : 'desc'
  console.log('🔄 排序顺序变更:', selectedSortOrder.value)
  
  // 触发数据重新加载
  const requestParams: any = {
    unitId: props.unitId,
    batch: selectedBatch.value,
    quickFilter: quickFilterType.value,
    sortBy: selectedSortBy.value,
    page: currentPage.value,
    limit: 50,
    sortOrder: selectedSortOrder.value
  }
  
  emit('batch-change', requestParams)
}

// 重置筛选条件（内部使用）
const handleReset = async () => {
  console.log('🔄 重置所有筛选条件')
  
  // 先清空搜索状态（但不触发重新加载）
  searchKeyword.value = ''
  searchResults.value = []
  showSearchResults.value = false
  searchLoading.value = false
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  
  // 重置所有筛选状态
  selectedBatch.value = null
  quickFilterType.value = null
  selectedSortBy.value = 'admission_count'
  selectedSortOrder.value = null
  currentPage.value = 1
  
  // 重置时不自动重新加载数据，等待外部传入新数据
  // 注释掉自动重新加载逻辑，避免在全局重置时触发不必要的API请求
  /*
  if (props.unitId) {
    const requestParams: any = {
      unitId: props.unitId,
      batch: null,
      quickFilter: null,
      sortBy: 'admission_count',
      page: 1,
      limit: 50,
      sortOrder: null
    }
    
    emit('batch-change', requestParams)
  }
  */
  
  console.log('✅ 重置完成，等待外部传入新数据')
}

// 全局重置（触发父组件的全局重置）
const handleGlobalReset = () => {
  console.log('🔄 触发全局重置')
  // 通知父组件进行全局重置，包括清空单位选择
  emit('global-reset')
}

// 学校搜索相关方法
let searchTimeout: NodeJS.Timeout | null = null

// 处理搜索输入，使用防抖
const handleSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const value = target.value?.trim()
  
  console.log('🔍 搜索输入:', { value, unitId: props.unitId, quickFilter: quickFilterType.value })
  
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // 如果搜索关键词为空，清空搜索结果
  if (!value) {
    clearSearch()
    return
  }
  
  // 防抖搜索，300ms后执行
  searchTimeout = setTimeout(() => {
    performSchoolSearch(value)
  }, 300)
}

// 执行学校搜索
const performSchoolSearch = async (keyword: string) => {
  console.log('🔍 开始执行搜索:', { keyword, unitId: props.unitId, quickFilter: quickFilterType.value })
  
  if (!keyword) {
    console.log('❌ 搜索关键词为空')
    return
  }
  
  // 搜索需要至少有单位ID或快捷筛选条件
  if (!props.unitId && !quickFilterType.value) {
    console.log('❌ 没有单位ID且没有快捷筛选')
    message.warning('请先选择单位或使用快捷筛选，再进行学校搜索')
    return
  }
  
  try {
    searchLoading.value = true
    
    const searchParams: any = {
      school_name: keyword
    }
    
    // 如果有单位ID，添加到参数中
    if (props.unitId) {
      searchParams.unit_id = props.unitId
    }
    
    // 如果选择了批次，加入批次参数实现联立搜索
    if (selectedBatch.value) {
      searchParams.batch_type = selectedBatch.value
    }
    
    // 如果启用了快捷筛选，加入快捷筛选参数
    if (quickFilterType.value) {
      searchParams.quick_filter = quickFilterType.value
    }
    
    // 打印搜索参数以便调试
    const searchDescriptions = []
    if (selectedBatch.value) searchDescriptions.push(`批次: ${selectedBatch.value}`)
    if (quickFilterType.value) searchDescriptions.push(`快捷筛选: ${quickFilterType.value === 'guowang' ? '国网' : '南网'}`)
    searchDescriptions.push(`学校名称: ${keyword}`)
    
    console.log(`🔍 执行联立搜索 (${searchDescriptions.join(' + ')})`, searchParams)
    
    // 发送搜索事件给父组件
    emit('school-search', searchParams)
    
  } catch (error) {
    console.error('❌ 学校搜索失败:', error)
    message.error('搜索学校失败，请重试')
  } finally {
    searchLoading.value = false
  }
}

// 处理搜索结果 - 支持完整响应对象或仅学校数组
const handleSearchResults = (results: any[] | { schools: any[], summary?: any, pagination?: any }) => {
  // 判断传入的是完整响应对象还是仅学校数组
  if (Array.isArray(results)) {
    // 如果是数组，按旧逻辑处理
    searchResults.value = results
    showSearchResults.value = results.length > 0
    console.log('🔍 收到搜索结果(数组):', results)
    console.log('🔍 设置搜索状态:', {
      searchResultsLength: results.length,
      showSearchResults: showSearchResults.value,
      searchResultsValue: searchResults.value
    })
  } else if (results && results.schools) {
    // 如果是完整响应对象，提取学校数组并更新props数据
    searchResults.value = results.schools
    showSearchResults.value = results.schools.length > 0
    
    // 将完整响应数据设置为props.data，这样totalCount等计算属性才能正确工作
    // 通过emit通知父组件更新数据
    emit('update-analytics-data', results)
    
    console.log('🔍 收到搜索结果(完整对象):', results)
    console.log('🔍 设置搜索状态:', {
      searchResultsLength: results.schools.length,
      showSearchResults: showSearchResults.value,
      searchResultsValue: searchResults.value,
      hasSummary: !!results.summary
    })
  }
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
  showSearchResults.value = false
  searchLoading.value = false
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  
  // 清空搜索后，如果有批次选择，重新加载该批次的数据
  if (selectedBatch.value && props.unitId) {
    console.log('🔄 清空搜索后重新加载批次数据:', selectedBatch.value)
    const requestParams: any = {
      unitId: props.unitId,
      batch: selectedBatch.value,
      quickFilter: quickFilterType.value, // 添加快捷筛选参数
      sortBy: selectedSortBy.value,
      page: 1,
      limit: 50,
      sortOrder: selectedSortOrder.value
    }
    emit('batch-change', requestParams)
  }
}

// 根据单位ID和批次加载数据的内部方法
const loadAnalyticsData = async (unitId: number | null, batch: string | null = null) => {
  if (!unitId) return
  
  try {
    internalLoading.value = true
    
    // 调用Analytics API获取数据
    const data = await recruitmentAPI.getAdmissionOverview({
      unit_id: unitId,
      batch_type: batch
    })
    
    console.log('✅ Analytics数据加载成功:', data)
    
    // 这里可能需要转换数据格式以适配现有的组件结构
    // 具体实现取决于后端API的返回格式
    
  } catch (error) {
    console.error('❌ Analytics数据加载失败:', error)
    message.error('加载数据失败，请重试')
  } finally {
    internalLoading.value = false
  }
}

// 判断是否有数据可以展示 - 用于控制重置按钮显示
const hasDataToDisplay = computed(() => {
  return !!(props.data && (totalCount.value > 0 || schoolTableData.value.length > 0))
})

// 工具方法：获取学校层次颜色
const getSchoolLevelColor = (level: string) => {
  // 按学历优先级设置颜色：985工程>211工程>双一流>海外高校>普通本科>科研院所>民办本科>专科院校
  const colorMap: Record<string, string> = {
    '985工程': 'red',        // 最高级：红色
    '211工程': 'volcano',    // 次高级：火山红
    '双一流': 'orange',      // 第三级：橙色
    '海外高校': 'gold',      // 第四级：金色
    '普通本科': 'lime',      // 第五级：柠檬绿
    '科研院所': 'green',     // 第六级：绿色
    '民办本科': 'cyan',      // 第七级：青色
    '专科院校': 'blue',      // 第八级：蓝色
    '独立学院': 'geekblue',  // 其他：蓝紫色
    '重点大学': 'purple',    // 其他：紫色
    '其他': 'default'        // 默认：灰色
  }
  return colorMap[level] || 'default'
}

// 方法
const getSchoolTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '985': 'red',
    '211': 'blue',
    '双一流': 'green',
    '普通本科': 'orange',
    '其他': 'default'
  }
  return colorMap[type] || 'default'
}


// 监听单位ID变化
watch(() => props.unitId, (newUnitId, oldUnitId) => {
  if (newUnitId !== oldUnitId) {
    // 当单位改变时，清空批次筛选和重置分页，重置排序状态
    selectedBatch.value = null
    currentPage.value = 1
    selectedSortBy.value = 'admission_count'
    selectedSortOrder.value = null
    
    // 清空学校搜索状态
    clearSearch()
    
    console.log('单位ID变化:', { old: oldUnitId, new: newUnitId })
  }
})

// 监听单位信息变化，自动设置快捷筛选状态
watch(() => props.unitInfo, (newUnitInfo) => {
  if (newUnitInfo && newUnitInfo.org_type) {
    const orgType = newUnitInfo.org_type
    console.log('🔄 单位信息变化，自动设置快捷筛选:', { orgType })
    
    if (orgType === '国网省公司' || orgType === '国网直属单位') {
      if (quickFilterType.value !== 'guowang') {
        quickFilterType.value = 'guowang'
        console.log('✅ 自动激活国网快捷筛选')
      }
    } else if (orgType === '南网省公司' || orgType === '南网直属单位') {
      if (quickFilterType.value !== 'nanwang') {
        quickFilterType.value = 'nanwang'
        console.log('✅ 自动激活南网快捷筛选')
      }
    }
  } else if (!newUnitInfo) {
    // 清空单位时，检查是否应该保持快捷筛选状态
    console.log('🧹 单位信息清空')
  }
}, { deep: true })

// 监听数据变化，同步分页状态
watch(() => props.data, (newData) => {
  if (newData && isSchoolsByBatchData.value) {
    const batchData = newData as SchoolsByBatchResponse['data']
    // 只在新数据的页码与当前页码不同且当前页码为1时更新（避免无限循环）
    if (batchData.pagination?.page && batchData.pagination.page !== currentPage.value) {
      console.log('同步分页状态:', { 
        backendPage: batchData.pagination.page, 
        currentLocalPage: currentPage.value 
      })
      currentPage.value = batchData.pagination.page
    }
  }
}, { deep: true })

// 暴露给父组件的方法和状态
defineExpose({
  handleSearchResults,
  clearSearch,
  handleReset,
  handleGlobalReset,
  quickFilterType,
  selectedBatch,
  selectedSortBy,
  selectedSortOrder,
  currentPage,
  searchKeyword,
  showSearchResults
})
</script>

<style scoped lang="less">
.data-analytics {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

// 头部 - 紧凑样式
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    
    .title-icon {
      color: #1890ff;
      font-size: 14px;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .batch-filter {
      .batch-select {
        min-width: 100px;

        :deep(.ant-select-selector) {
          height: 28px;
          line-height: 26px;
        }
      }
    }

    .reset-btn {
      color: #666;
      height: 28px;
      width: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: #ff4d4f;
        background: #fff2f0;
      }

      &:focus {
        color: #ff4d4f;
      }
    }

    .refresh-btn {
      color: #666;
      height: 28px;
      width: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: #1890ff;
        background: #f0f9ff;
      }

      &:focus {
        color: #1890ff;
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    
    .header-title {
      font-size: 13px;
      gap: 4px;
    }

    .header-actions {
      justify-content: flex-end;
      gap: 6px;

      .batch-filter .batch-select {
        min-width: 80px;
      }
    }
  }
}

// 加载状态
.loading-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  
  .loading-placeholder {
    width: 100%;
    height: 300px;
  }
}

// 分析内容 - 紧凑版本
.analytics-content {
  flex: 1;
  padding: 6px;
  overflow-y: auto;
  
  &.compact {
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 指标网格 - 紧凑版本
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  &.compact {
    gap: 4px;
    margin-bottom: 4px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    
    &.compact {
      gap: 4px;
    }
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #d6f4ff;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.15);
  }
  
  .metric-icon {
    width: 28px;
    height: 28px;
    background: #1890ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    flex-shrink: 0;
  }
  
  .metric-info {
    flex: 1;
    min-width: 0;
    
    .metric-value {
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
      line-height: 1.2;
    }
    
    .metric-label {
      font-size: 11px;
      color: #666;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  @media (max-width: 768px) {
    padding: 8px;
    gap: 6px;
    
    .metric-icon {
      width: 24px;
      height: 24px;
      font-size: 12px;
    }
    
    .metric-info {
      .metric-value {
        font-size: 14px;
      }
      
      .metric-label {
        font-size: 10px;
      }
    }
  }
}

// 图表容器
.charts-container {
  display: grid;
  gap: 16px;
  
  // 紧凑版本 - 左右排列
  &.compact {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 6px;
    }
  }
  
  // 垂直版本 - 上下排列
  &.vertical {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.chart-wrapper {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  
  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  h5 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: #333;
  }
  
  .help-icon {
    color: #8c8c8c;
    cursor: help;
    font-size: 12px;
  }
}

.chart-container {
  height: 200px;
  
  &.compact {
    height: 120px;
  }
  
  &.large {
    height: 400px;
  }
  
  @media (max-width: 768px) {
    height: 150px;
    
    &.compact {
      height: 100px;
    }
  }
}

// 统计表格
.stats-table {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .count-cell {
    font-weight: 600;
    color: #1890ff;
  }
  
  .percentage-cell {
    font-weight: 500;
    color: #52c41a;
  }
}

// 趋势和对比容器
.trend-container,
.comparison-container {
  .trend-chart-wrapper,
  .comparison-chart-wrapper {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
  }
}

// 洞察建议
.insights-section {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%);
  border: 1px solid #d9f7be;
  border-radius: 8px;
  
  .insights-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .insights-icon {
      color: #faad14;
      font-size: 16px;
    }
    
    .insights-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .insights-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #666;
      
      .insight-bullet {
        color: #52c41a;
        font-size: 12px;
        margin-top: 2px;
        flex-shrink: 0;
      }
      
      .insight-text {
        flex: 1;
        line-height: 1.4;
      }
    }
  }
}

// 学校表格样式
.schools-table-section,
.units-table-section {
  margin-top: 12px;
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .header-left {
      h5 {
        margin: 0;
        font-size: 12px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .table-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: flex-end;
      
      .sort-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .sort-select {
          min-width: 120px;
          
          :deep(.ant-select-selector) {
            height: 32px;
            border-radius: 4px;
            font-size: 12px;
          }
        }
        
        .sort-order-btn {
          height: 32px;
          padding: 0 12px;
          border-radius: 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.3s;
          
          &:hover {
            background: #f0f9ff;
            border-color: #1890ff;
            color: #1890ff;
          }
          
          .anticon {
            font-size: 12px;
          }
        }
      }
    }
  
  :deep(.ant-table) {
    .clickable-row {
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
    
    .ant-table-tbody > tr > td {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .ant-table-thead > tr > th {
      padding: 6px 8px;
      font-size: 12px;
      font-weight: 600;
      background: #fafafa;
      
      &.ant-table-column-has-sorters {
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
      }
      
      .ant-table-column-sorters {
        padding: 0;
      }
      
      .ant-table-column-sorter {
        color: #bfbfbf;
      }
      .ant-table-column-sorter.active {
        color: #1890ff;
      }
    }
    
    .school-name-cell {
      font-weight: 500;
      color: #1890ff;
      
      &:hover {
        color: #40a9ff;
        text-decoration: underline;
      }
      
      &.search-highlight {
        color: inherit;
        font-weight: normal;
      }
      
      .power-icon {
        margin-left: 4px;
        color: #faad14;
        font-size: 12px;
        transition: all 0.2s ease;
        
        &:hover {
          color: #ffc53d;
          transform: scale(1.1);
        }
      }
    }
    
    .unit-name-cell {
      font-weight: 500;
      color: #1890ff;
    }
    
    .count-cell {
      font-weight: 600;
      color: #333;
    }
    
    .percentage-cell {
      color: #666;
      font-size: 11px;
    }
    
    .ant-tag {
      margin: 0;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      line-height: 1.2;
    }
    
    .ant-btn-link {
      padding: 0;
      height: auto;
      font-size: 11px;
      color: #1890ff;
    }
  }
  
  :deep(.ant-pagination) {
    margin-top: 8px;
    text-align: center;
    
    .ant-pagination-item,
    .ant-pagination-prev,
    .ant-pagination-next {
      min-width: 24px;
      height: 24px;
      line-height: 22px;
      font-size: 12px;
    }
    
    .ant-pagination-total-text {
      font-size: 11px;
      color: #666;
    }
    
    .ant-pagination-options {
      .ant-pagination-options-quick-jumper {
        font-size: 12px;
        
        input {
          width: 40px;
          height: 24px;
          padding: 2px 4px;
          font-size: 12px;
        }
      }
    }
  }
}

// 增强的表格空状态样式
.table-empty-state-enhanced {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 450px; // 调整最小高度到450px
  padding: 50px 20px;
  
  .empty-container {
    max-width: 400px;
    text-align: center;
    
    .empty-visual {
      margin-bottom: 24px;
      
      .empty-icon {
        font-size: 64px;
        color: #d9d9d9;
        display: block;
        margin: 0 auto;
        transition: all 0.3s ease;
        
        &:hover {
          color: #bfbfbf;
          transform: scale(1.05);
        }
      }
    }
    
    .empty-content {
      .empty-title {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
        color: #595959;
        line-height: 1.4;
      }
      
      .empty-description {
        margin: 0 0 20px 0;
        font-size: 14px;
        color: #8c8c8c;
        line-height: 1.6;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .empty-suggestions {
        margin-bottom: 20px;
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
        
        .ant-tag {
          margin: 0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          
          .anticon {
            font-size: 12px;
          }
        }
      }
      
      .empty-hint-text {
        p {
          margin: 0;
          font-size: 13px;
          color: #bfbfbf;
          font-style: italic;
          
          &:hover {
            color: #1890ff;
          }
        }
      }
    }
  }
  
  // 响应式适配
  @media (max-width: 768px) {
    min-height: 350px;
    padding: 40px 16px;
    
    .empty-container {
      .empty-visual .empty-icon {
        font-size: 48px;
      }
      
      .empty-content {
        .empty-title {
          font-size: 16px;
        }
        
        .empty-description {
          font-size: 13px;
        }
      }
    }
  }
}
}

</style>