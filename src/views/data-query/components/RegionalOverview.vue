<template>
  <div class="regional-overview">
    <div class="overview-section">
      <div class="section-header">
        <h4 class="section-title">
          <environment-outlined class="section-icon" />
          地市县情况概览
        </h4>
        <div class="section-actions">
          <!-- 批量编辑模式切换 -->
          <a-tooltip v-if="isSuperAdmin" :title="isEditMode ? '退出编辑模式' : '进入批量编辑模式'">
            <a-button
              type="text"
              size="small"
              @click="toggleEditMode"
              :class="{ 'edit-mode-active': isEditMode }"
              class="edit-mode-btn"
            >
              <edit-outlined v-if="!isEditMode" />
              <close-outlined v-else />
            </a-button>
          </a-tooltip>
          
          <!-- 保存所有更改 -->
          <a-tooltip v-if="isEditMode && hasChanges" :title="`一次性保存所有修改的 ${Object.keys(editingRows).length} 行数据`">
            <a-button
              type="primary"
              size="small"
              @click="saveAllChanges"
              :loading="saving"
              class="save-all-btn enhanced-save-btn"
            >
              <save-outlined />
              批量保存 ({{ Object.keys(editingRows).length }})
              <span v-if="saving" class="saving-progress">处理中...</span>
            </a-button>
          </a-tooltip>
          
          <a-tooltip title="刷新数据">
            <a-button
              type="text"
              size="small"
              @click="handleRefresh"
              :loading="loading"
              class="refresh-btn"
            >
              <reload-outlined />
            </a-button>
          </a-tooltip>
        </div>
      </div>

      <!-- 批量保存进度提示 -->
      <div v-if="batchSaveProgress.show" class="batch-save-progress">
        <div class="progress-container">
          <div class="progress-info">
            <span class="progress-icon">⏳</span>
            <span class="progress-text">{{ batchSaveProgress.message }}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${(batchSaveProgress.current / batchSaveProgress.total) * 100}%` }"
            ></div>
          </div>
          <span class="progress-count">{{ batchSaveProgress.current }}/{{ batchSaveProgress.total }}</span>
        </div>
      </div>

      <!-- 统计摘要 -->
      <div v-if="overviewData" class="summary-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <team-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overviewData.total_count }}</div>
              <div class="stat-label">覆盖区域</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <bank-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overviewData.org_type }}</div>
              <div class="stat-label">单位类型</div>
            </div>
          </div>
        </div>
        
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载地市县信息...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>

      <!-- 地市县列表 -->
      <div v-else-if="regionalList.length > 0" class="regional-table">
        <a-table
          :columns="tableColumns"
          :data-source="regionalList"
          :pagination="tablePagination"
          size="small"
          :scroll="{ x: 'max-content' }"
          @change="handleTableChange"
          :row-key="record => `${record.city}-${record.county || 'all'}`"
        >
          <template #bodyCell="{ column, record, index }">
            <!-- 序号列 -->
            <template v-if="column.key === 'index'">
              {{ index + 1 + (currentPage - 1) * pageSize }}
            </template>
            
            <!-- 操作列 -->
            <template v-if="column.key === 'actions'">
              <div class="row-actions">
                <!-- 编辑模式：显示操作控件 -->
                <div class="edit-controls">
                  <!-- 性价比设置 -->
                  <div class="value-switches">
                    <a-checkbox
                      v-model:checked="getEditingRecord(record).is_best_value_city"
                      @change="updateBestValueCity(record, $event.target.checked)"
                      size="small"
                    >
                      <span class="switch-label">性价比城市</span>
                    </a-checkbox>
                    <a-checkbox
                      v-if="record.county"
                      v-model:checked="getEditingRecord(record).is_best_value_county"
                      @change="updateBestValueCounty(record, $event.target.checked)"
                      size="small"
                    >
                      <span class="switch-label">性价比区县</span>
                    </a-checkbox>
                  </div>
                  
                  <!-- 保存按钮 -->
                  <a-tooltip title="保存此行">
                    <a-button
                      type="text"
                      size="small"
                      @click="saveRow(record, index)"
                      :loading="savingRows[getRowKey(record)]"
                      class="save-row-btn"
                    >
                      <check-outlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
            </template>            
            <!-- 县区 -->
            <template v-if="column.key === 'county'">
              <div class="county-cell">
                <div class="county-info">
                  <span class="county-name">{{ record.county || '全市' }}</span>
                  
                  <!-- 性价比标记显示 -->
                  <div class="county-tags" v-if="record.is_best_value_city || record.is_best_value_county">
                    <a-tag v-if="record.is_best_value_city" color="green" size="small">
                      <star-filled />
                      高性价比城市
                    </a-tag>
                    <a-tag v-if="record.is_best_value_county" color="blue" size="small">
                      <star-filled />
                      高性价比区县
                    </a-tag>
                  </div>
                </div>
              </div>
            </template>
            
            <!-- 薪资字段 -->
            <template v-if="['bachelor_salary', 'master_salary'].includes(column.key)">
              <a-input-number
                v-if="isEditMode"
                :value="getEditingRecord(record)[column.key]"
                @change="(value) => updateFieldValue(record, column.key, value)"
                size="small"
                :min="0"
                :max="999"
                style="width: 55px; font-size: 11px;"
                placeholder="万"
              />
              <span v-else class="salary-value" :class="{ 
                'bachelor': column.key === 'bachelor_salary',
                'master': column.key === 'master_salary',
                'no-data': !record[column.key] 
              }">
                {{ record[column.key] ? record[column.key] + '万' : '-' }}
              </span>
            </template>
            
            <!-- 分数线字段 -->
            <template v-if="['bachelor_score', 'master_score', 'bachelor_interview_score', 'master_interview_score'].includes(column.key)">
              <a-input-number
                v-if="isEditMode"
                :value="getEditingRecord(record)[column.key]"
                @change="(value) => updateFieldValue(record, column.key, value)"
                size="small"
                :min="0"
                :max="100"
                style="width: 55px; font-size: 11px;"
                placeholder="分"
              />
              <span v-else class="score-value" :class="{ 
                'bachelor': column.key.includes('bachelor'),
                'master': column.key.includes('master'),
                'no-data': record[column.key] === null || record[column.key] === undefined
              }">
                {{ record[column.key] !== null && record[column.key] !== undefined ? record[column.key] : '-' }}
              </span>
            </template>
            
            <!-- 教育字段列 - 动态处理16个教育字段 -->
            <template v-if="[...bachelorEducations, ...masterEducations].some(edu => edu.key === column.key)">
              <div v-if="isEditMode" class="education-field-edit">
                <a-input
                  :value="getEditingRecord(record)[column.key]"
                  size="small"
                  style="width: 55px; font-size: 11px; padding: 0 4px;"
                  placeholder="网申"
                  @change="(e) => updateEducationStatus(record, column.key, e.target.value)"
                />
              </div>
              <div v-else class="education-field-display">
                <span class="education-status-text" :title="record[column.key] || '待更新'">
                  {{ (record[column.key] || '待更新').slice(0, 2) }}
                </span>
              </div>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <a-empty description="暂无地市县信息">
          <template #image>
            <environment-outlined class="empty-icon" />
          </template>
          <p class="empty-hint">请先选择一个单位查看对应的地市县情况</p>
        </a-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message, Select, Tag, InputNumber } from 'ant-design-vue'
import {
  EnvironmentOutlined,
  DownloadOutlined,
  ReloadOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  TrophyOutlined,
  CrownOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckOutlined,
  StarFilled,
  StarOutlined,
  MoreOutlined
} from '@ant-design/icons-vue'
import {
  getUnitDetails,
  sectionEditingAPI,
  policySectionsAPI,
  type RegionalOverviewResponse,
  type RegionalItem
} from '@/api/policies'

// Props
interface Props {
  unitId?: number | null
  unitInfo?: any
  showEmptyState?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unitId: null,
  unitInfo: null,
  showEmptyState: false
})

// Emits
const emit = defineEmits<{
  'data-loaded': [data: RegionalOverviewResponse['data']]
  'loading-change': [loading: boolean]
}>()

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const overviewData = ref<RegionalOverviewResponse['data'] | null>(null)
const regionalList = ref<RegionalItem[]>([])
const currentPage = ref(1)
const pageSize = ref(50)

// 地级市过滤器相关
const cityFilters = ref<Array<{text: string, value: string}>>([])
const cityFilterCache = new Set<string>()

// 批量保存进度状态
const batchSaveProgress = ref({
  show: false,
  current: 0,
  total: 0,
  message: ''
})

// 用户权限检查
const isSuperAdmin = ref(true) // 临时设为true以便测试，实际项目中应该从用户状态或store中获取

// 编辑相关状态
const isEditMode = ref(false)
const editingRows = ref<Record<string, any>>({})
const savingRows = ref<Record<string, boolean>>({})
const saving = ref(false)

// 学历状态选项定义
const statusOptions = [
  { value: '能过网申', label: '能过', icon: '✅', color: 'success' },
  { value: '看情况', label: '看情况', icon: '⚠️', color: 'warning' },
  { value: '不能过网申', label: '不过', icon: '❌', color: 'error' },
  { value: '优先考虑', label: '优先', icon: '💡', color: 'processing' },
  { value: '待更新', label: '待更新', icon: '❓', color: 'default' }
]

// 本科学历字段定义
const bachelorEducations = [
  { key: 'bachelor_985', label: '985本科', shortLabel: '985' },
  { key: 'bachelor_211', label: '211本科', shortLabel: '211' },
  { key: 'bachelor_provincial_double_first', label: '省内双一流本科', shortLabel: '省双一流' },
  { key: 'bachelor_external_double_first', label: '省外双一流本科', shortLabel: '外双一流' },
  { key: 'bachelor_provincial_non_double', label: '省内双非一本', shortLabel: '省双非' },
  { key: 'bachelor_external_non_double', label: '省外双非一本', shortLabel: '外双非' },
  { key: 'bachelor_provincial_second', label: '省内二本', shortLabel: '省二本' },
  { key: 'bachelor_external_second', label: '省外二本', shortLabel: '外二本' },
  { key: 'bachelor_private', label: '民办本科', shortLabel: '民办' },
  { key: 'bachelor_upgrade', label: '专升本', shortLabel: '专升本' },
  { key: 'bachelor_college', label: '专科', shortLabel: '专科' }
]

// 硕士学历字段定义
const masterEducations = [
  { key: 'master_985', label: '985硕士', shortLabel: '985' },
  { key: 'master_211', label: '211硕士', shortLabel: '211' },
  { key: 'master_provincial_double_first', label: '省内双一流硕士', shortLabel: '省双一流' },
  { key: 'master_external_double_first', label: '省外双一流硕士', shortLabel: '外双一流' },
  { key: 'master_provincial_non_double', label: '省内双非硕士', shortLabel: '省双非' },
  { key: 'master_external_non_double', label: '省外双非硕士', shortLabel: '外双非' }
]

// 表格列定义 - 计算属性，根据编辑模式动态调整
const tableColumns = computed(() => {
  const baseColumns = [
    {
      title: '序号',
      key: 'index',
      width: 50,
      fixed: 'left' as const,
      align: 'center' as const
    },
    {
      title: '地级市',
      key: 'city',
      dataIndex: 'city',
      width: 90,
      fixed: 'left' as const,
      align: 'center' as const,
      filters: cityFilters.value,
      onFilter: (value: string, record: any) => record.city === value,
      filterMultiple: true
    },
    {
      title: '县区',
      key: 'county',
      dataIndex: 'county',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const
    },
    {
      title: '网申情况',
      children: [
        {
          title: '本科学历',
          children: bachelorEducations.map(edu => ({
            title: edu.shortLabel || edu.label.replace(/本科$/, ''),
            key: edu.key,
            dataIndex: edu.key,
            width: 60,
            align: 'center' as const
          }))
        },
        {
          title: '硕士学历',
          children: masterEducations.map(edu => ({
            title: edu.shortLabel || edu.label.replace(/硕士$/, ''),
            key: edu.key,
            dataIndex: edu.key,
            width: 60,
            align: 'center' as const
          }))
        }
      ]
    },
    {
      title: '分数线',
      children: [
        {
          title: '本科',
          children: [
            {
              title: '综合',
              key: 'bachelor_score',
              dataIndex: 'bachelor_score',
              width: 70,
              align: 'center' as const
            },
            {
              title: '面试',
              key: 'bachelor_interview_score',
              dataIndex: 'bachelor_interview_score',
              width: 70,
              align: 'center' as const
            }
          ]
        },
        {
          title: '硕士',
          children: [
            {
              title: '面试',
              key: 'master_interview_score',
              dataIndex: 'master_interview_score',
              width: 70,
              align: 'center' as const
            }
          ]
        }
      ]
    },
    {
      title: '待遇',
      children: [
        {
          title: '本科',
          key: 'bachelor_salary',
          dataIndex: 'bachelor_salary',
          width: 70,
          align: 'center' as const
        },
        {
          title: '硕士',
          key: 'master_salary', 
          dataIndex: 'master_salary',
          width: 70,
          align: 'center' as const
        }
      ]
    }
  ]
  
  // 只在编辑模式下添加操作列
  if (isEditMode.value) {
    baseColumns.push({
      title: '操作',
      key: 'actions',
      width: 110,
      fixed: 'right' as const,
      align: 'center' as const
    })
  }
  
  return baseColumns
})

// 表格分页配置
const tablePagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: regionalList.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 个地区`,
  pageSizeOptions: ['20', '50', '100', '200'],
  size: 'small' as const
}))

// 计算属性
const hasChanges = computed(() => {
  return Object.keys(editingRows.value).length > 0
})

// 方法
const getApplyStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    '网申通过率高': 'green',
    '网申通过率中等': 'orange',
    '网申通过率低': 'red',
    '建议重点关注': 'blue',
    '竞争激烈': 'volcano',
    '相对容易': 'cyan'
  }
  return colorMap[status] || 'default'
}

const getEducationRequirementColor = (requirement: string): string => {
  const reqLower = requirement.toLowerCase()
  if (reqLower.includes('能过') || reqLower.includes('可以') || reqLower.includes('允许') || reqLower.includes('1')) {
    return 'green'
  } else if (reqLower.includes('不') || reqLower.includes('无法') || reqLower.includes('0')) {
    return 'red'
  } else if (reqLower.includes('困难') || reqLower.includes('很难')) {
    return 'orange'
  }
  return 'default'
}

const handleTableChange = (pagination: any, filters: any, sorter: any) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
  
  console.log('表格变化:', { pagination, filters, sorter })
}

const handleRefresh = async () => {
  if (props.unitId) {
    await loadRegionalData(props.unitId)
  }
}

const handleExport = async () => {
  try {
    exportLoading.value = true
    
    // 构造导出数据
    const exportData = regionalList.value.map(item => ({
      '地级市': item.city,
      '县区': item.county || '全市',
      '网申具体情况': item.apply_status,
      '本科薪资': (item.bachelor_salary || '-') + '万',
      '硕士薪资': (item.master_salary || '-') + '万',
      '本科分数': (item.bachelor_score || '-') + (item.bachelor_score ? '分' : ''),
      '硕士分数': (item.master_score || '-') + (item.master_score ? '分' : '')
    }))
    
    // 创建CSV内容
    const csvContent = [
      // 表头
      Object.keys(exportData[0] || {}).join(','),
      // 数据行
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    // 下载文件
    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `地市县概览_${overviewData.value?.org_type || '数据'}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

// 更新地级市过滤器选项
const updateCityFilters = () => {
  // 清空缓存
  cityFilterCache.clear()
  
  // 从当前数据中提取所有唯一的地级市
  regionalList.value.forEach(item => {
    if (item.city && item.city.trim()) {
      cityFilterCache.add(item.city.trim())
    }
  })
  
  // 转换为过滤器选项格式并排序
  const sortedCities = Array.from(cityFilterCache).sort()
  cityFilters.value = sortedCities.map(city => ({
    text: city,
    value: city
  }))
  
  console.log('🔍 更新地级市过滤器:', {
    '原始数据量': regionalList.value.length,
    '唯一地级市数量': cityFilters.value.length,
    '地级市列表': sortedCities
  })
}

const loadRegionalData = async (unitId: number) => {
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 使用新版区域概览API
    const response = await policySectionsAPI.getRegionalOverviewNew(unitId)
    
    // 处理区域数据
    const regionalBreakdown = response.regional_breakdown || []
    
    regionalList.value = regionalBreakdown.map(item => ({
      unit_id: unitId,
      city: item.city,
      county: item.county,
      apply_status: '网申通过率中等，看重综合素质', // 默认值
      bachelor_salary: item.salary?.bachelor && item.salary.bachelor !== '0' ? parseFloat(item.salary.bachelor) : null,
      master_salary: item.salary?.master && item.salary.master !== '0' ? parseFloat(item.salary.master) : null,
      bachelor_score: item.score_lines?.bachelor_comprehensive !== undefined && item.score_lines.bachelor_comprehensive !== null && item.score_lines.bachelor_comprehensive !== '' ? parseFloat(item.score_lines.bachelor_comprehensive) : null,
      master_score: item.score_lines?.master_interview !== undefined && item.score_lines.master_interview !== null && item.score_lines.master_interview !== '' ? parseFloat(item.score_lines.master_interview) : null,
      data_level: item.is_best_value_city || item.is_best_value_county ? '高性价比' : '普通',
      bachelor_education_req: item.education_requirements?.bachelor || '985',
      master_education_req: item.education_requirements?.master || '985硕士',
      is_best_value_city: item.is_best_value_city,
      is_best_value_county: item.is_best_value_county,
      bachelor_interview_score: item.score_lines?.bachelor_interview !== undefined && item.score_lines.bachelor_interview !== null && item.score_lines.bachelor_interview !== '' ? parseFloat(item.score_lines.bachelor_interview) : null,
      master_interview_score: item.score_lines?.master_interview !== undefined && item.score_lines.master_interview !== null && item.score_lines.master_interview !== '' ? parseFloat(item.score_lines.master_interview) : null,
      
      // 从新的 detailed_education_status 字段获取学历网申情况
      bachelor_985: item.detailed_education_status?.bachelor?.bachelor_985 || '待更新',
      bachelor_211: item.detailed_education_status?.bachelor?.bachelor_211 || '待更新',
      bachelor_provincial_double_first: item.detailed_education_status?.bachelor?.bachelor_provincial_double_first || '待更新',
      bachelor_external_double_first: item.detailed_education_status?.bachelor?.bachelor_external_double_first || '待更新',
      bachelor_provincial_non_double: item.detailed_education_status?.bachelor?.bachelor_provincial_non_double || '待更新',
      bachelor_external_non_double: item.detailed_education_status?.bachelor?.bachelor_external_non_double || '待更新',
      bachelor_provincial_second: item.detailed_education_status?.bachelor?.bachelor_provincial_second || '待更新',
      bachelor_external_second: item.detailed_education_status?.bachelor?.bachelor_external_second || '待更新',
      bachelor_private: item.detailed_education_status?.bachelor?.bachelor_private || '待更新',
      bachelor_upgrade: item.detailed_education_status?.bachelor?.bachelor_upgrade || '待更新',
      bachelor_college: item.detailed_education_status?.bachelor?.bachelor_college || '待更新',
      
      // 硕士学历网申情况字段
      master_985: item.detailed_education_status?.master?.master_985 || '待更新',
      master_211: item.detailed_education_status?.master?.master_211 || '待更新',
      master_provincial_double_first: item.detailed_education_status?.master?.master_provincial_double_first || '待更新',
      master_external_double_first: item.detailed_education_status?.master?.master_external_double_first || '待更新',
      master_provincial_non_double: item.detailed_education_status?.master?.master_provincial_non_double || '待更新',
      master_external_non_double: item.detailed_education_status?.master?.master_external_non_double || '待更新'
    }))
    
    // 构造概览数据
    overviewData.value = {
      org_type: response.org_type || '未知类型',
      total_count: response.total_count || regionalBreakdown.length,
      regional_overview: regionalList.value,
      unit_overview: response.unit_overview
    }
    
    // 重置分页
    currentPage.value = 1
    
    // 更新地级市过滤器选项
    updateCityFilters()
    
    emit('data-loaded', overviewData.value)
    console.log('✅ 地市县概览加载成功:', overviewData.value)
  } catch (error) {
    console.error('❌ 加载地市县概览失败:', error)
    message.error('加载地市县概览失败，请重试')
    overviewData.value = null
    regionalList.value = []
    cityFilters.value = [] // 清空过滤器
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

// 编辑相关方法
const getRowKey = (record: RegionalItem): string => {
  return `${record.city}-${record.county || 'all'}`
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    // 退出编辑模式，清空所有编辑状态
    editingRows.value = {}
    savingRows.value = {}
    isEditMode.value = false
  } else {
    // 进入编辑模式，但不预先初始化所有行
    // 只有当用户实际修改时才添加到editingRows中
    isEditMode.value = true
    // 清空之前可能存在的编辑状态
    editingRows.value = {}
    savingRows.value = {}
  }
}


const editRow = (record: RegionalItem, index: number) => {
  const rowKey = getRowKey(record)
  // 初始化编辑数据
  editingRows.value[rowKey] = { ...record }
  console.log(`开始编辑行: ${record.city} - ${record.county || '全市'}`)
}

const cancelEditRow = (record: RegionalItem) => {
  const rowKey = getRowKey(record)
  delete editingRows.value[rowKey]
  delete savingRows.value[rowKey]
  console.log(`取消编辑行: ${record.city} - ${record.county || '全市'}`)
}

const saveRow = async (record: RegionalItem, index: number) => {
  const rowKey = getRowKey(record)
  const editData = editingRows.value[rowKey]
  
  if (!editData || !props.unitId) {
    message.error('缺少编辑数据或单位ID')
    return
  }
  
  try {
    savingRows.value[rowKey] = true
    
    // 准备保存数据
    const saveData = {
      city: editData.city,
      county: editData.county,
      apply_status: editData.apply_status,
      bachelor_salary: editData.bachelor_salary,
      master_salary: editData.master_salary,
      bachelor_score: editData.bachelor_score,
      master_score: editData.master_score,
      bachelor_education_req: editData.bachelor_education_req,
      master_education_req: editData.master_education_req,
      
      // 性价比标记
      is_best_value_city: editData.is_best_value_city,
      is_best_value_county: editData.is_best_value_county,
      
      // 本科学历网申情况
      bachelor_985: editData.bachelor_985,
      bachelor_211: editData.bachelor_211,
      bachelor_provincial_double_first: editData.bachelor_provincial_double_first,
      bachelor_external_double_first: editData.bachelor_external_double_first,
      bachelor_provincial_non_double: editData.bachelor_provincial_non_double,
      bachelor_external_non_double: editData.bachelor_external_non_double,
      bachelor_provincial_second: editData.bachelor_provincial_second,
      bachelor_external_second: editData.bachelor_external_second,
      bachelor_private: editData.bachelor_private,
      bachelor_upgrade: editData.bachelor_upgrade,
      bachelor_college: editData.bachelor_college,
      
      // 硕士学历网申情况
      master_985: editData.master_985,
      master_211: editData.master_211,
      master_provincial_double_first: editData.master_provincial_double_first,
      master_external_double_first: editData.master_external_double_first,
      master_provincial_non_double: editData.master_provincial_non_double,
      master_external_non_double: editData.master_external_non_double
    }
    
    console.log(`保存地市县数据:`, saveData)
    
    // 调用API保存数据
    await sectionEditingAPI.updateRegionalOverview(props.unitId, saveData)
    
    // 更新表格数据
    regionalList.value[index] = { ...editData }
    
    // 清除该行的编辑状态
    delete editingRows.value[rowKey]
    
    // 如果所有行都保存完毕，自动退出编辑模式
    if (Object.keys(editingRows.value).length === 0) {
      isEditMode.value = false
      message.success(`所有更改已保存，已退出编辑模式`)
    } else {
      message.success(`${record.city} - ${record.county || '全市'} 保存成功`)
    }
    
    console.log(`行保存成功: ${record.city} - ${record.county || '全市'}`)
  } catch (error) {
    console.error('保存行数据失败:', error)
    message.error('保存失败，请重试')
  } finally {
    delete savingRows.value[rowKey]
  }
}

const saveAllChanges = async () => {
  if (!props.unitId || Object.keys(editingRows.value).length === 0) {
    message.warning('没有可保存的更改')
    return
  }
  
  try {
    saving.value = true
    
    // 初始化进度提示
    batchSaveProgress.value = {
      show: true,
      current: 0,
      total: Object.keys(editingRows.value).length,
      message: '正在准备批量保存...'
    }
    
    // 构建批量更新的数据结构
    const updates = Object.keys(editingRows.value).map(rowKey => {
      const editData = editingRows.value[rowKey]
      return {
        city: editData.city,
        county: editData.county,
        data: {
          apply_status: editData.apply_status,
          bachelor_salary: editData.bachelor_salary,
          master_salary: editData.master_salary,
          bachelor_score: editData.bachelor_score,
          master_score: editData.master_score,
          bachelor_education_req: editData.bachelor_education_req,
          master_education_req: editData.master_education_req,
          bachelor_interview_score: editData.bachelor_interview_score,
          master_interview_score: editData.master_interview_score,
          
          // 性价比标记
          is_best_value_city: editData.is_best_value_city,
          is_best_value_county: editData.is_best_value_county,
          
          // 本科学历网申情况
          bachelor_985: editData.bachelor_985,
          bachelor_211: editData.bachelor_211,
          bachelor_provincial_double_first: editData.bachelor_provincial_double_first,
          bachelor_external_double_first: editData.bachelor_external_double_first,
          bachelor_provincial_non_double: editData.bachelor_provincial_non_double,
          bachelor_external_non_double: editData.bachelor_external_non_double,
          bachelor_provincial_second: editData.bachelor_provincial_second,
          bachelor_external_second: editData.bachelor_external_second,
          bachelor_private: editData.bachelor_private,
          bachelor_upgrade: editData.bachelor_upgrade,
          bachelor_college: editData.bachelor_college,
          
          // 硕士学历网申情况
          master_985: editData.master_985,
          master_211: editData.master_211,
          master_provincial_double_first: editData.master_provincial_double_first,
          master_external_double_first: editData.master_external_double_first,
          master_provincial_non_double: editData.master_provincial_non_double,
          master_external_non_double: editData.master_external_non_double
        }
      }
    })
    
    const batchData = { updates }
    const savedCount = updates.length
    
    console.log(`开始批量保存 ${savedCount} 条记录:`, batchData)
    
    // 更新进度提示
    batchSaveProgress.value.message = `正在批量保存 ${savedCount} 条记录...`
    batchSaveProgress.value.current = 0
    
    // 尝试使用批量API
    try {
      const result = await sectionEditingAPI.updateRegionalOverviewBatch(props.unitId, batchData)
      
      // 更新进度 - 批量API完成
      batchSaveProgress.value.current = savedCount
      batchSaveProgress.value.message = '批量保存完成，正在更新界面...'
      
      console.log('批量保存结果:', result)
      
      // 更新表格数据
      Object.keys(editingRows.value).forEach(rowKey => {
        const editData = editingRows.value[rowKey]
        const index = regionalList.value.findIndex(item => getRowKey(item) === rowKey)
        if (index !== -1) {
          regionalList.value[index] = { ...editData }
        }
      })
      
      // 清除所有编辑状态
      editingRows.value = {}
      savingRows.value = {}
      
      // 退出编辑模式
      isEditMode.value = false
      
      // 显示详细的保存结果
      if (result.total_failed === 0) {
        message.success(`✅ 批量保存成功！已保存 ${result.total_updated} 条记录，已退出编辑模式`)
      } else {
        message.warning(`⚠️ 部分保存成功：${result.total_updated} 条成功，${result.total_failed} 条失败，已退出编辑模式`)
      }
      
    } catch (batchError) {
      console.warn('批量API失败，回退到逐个保存:', batchError)
      
      // 更新进度提示 - 切换到兼容模式
      batchSaveProgress.value.message = '正在使用兼容模式逐个保存...'
      batchSaveProgress.value.current = 0
      
      // 回退到原有的逐个保存逻辑，带进度更新
      const savePromises = updates.map(async (update, index) => {
        const saveData = {
          city: update.city,
          county: update.county,
          ...update.data
        }
        
        try {
          const result = await sectionEditingAPI.updateRegionalOverview(props.unitId!, saveData)
          // 更新进度
          batchSaveProgress.value.current = index + 1
          batchSaveProgress.value.message = `正在保存第 ${index + 1} 行数据 (${update.city} - ${update.county || '全市'})`
          return result
        } catch (error) {
          console.error(`保存失败 ${update.city} - ${update.county || '全市'}:`, error)
          throw error
        }
      })
      
      await Promise.all(savePromises)
      
      // 更新表格数据
      Object.keys(editingRows.value).forEach(rowKey => {
        const editData = editingRows.value[rowKey]
        const index = regionalList.value.findIndex(item => getRowKey(item) === rowKey)
        if (index !== -1) {
          regionalList.value[index] = { ...editData }
        }
      })
      
      // 清除所有编辑状态
      editingRows.value = {}
      savingRows.value = {}
      
      // 退出编辑模式
      isEditMode.value = false
      
      message.success(`成功保存 ${savedCount} 条记录（使用兼容模式），已退出编辑模式`)
    }
    
    console.log('所有更改保存成功，已退出编辑模式')
    
  } catch (error) {
    console.error('批量保存失败:', error)
    message.error('批量保存失败，请重试')
  } finally {
    saving.value = false
    // 隐藏进度提示
    setTimeout(() => {
      batchSaveProgress.value.show = false
    }, 1000) // 1秒后隐藏，让用户能看到完成状态
  }
}

// 学历状态处理方法
const getStatusIcon = (status: string): string => {
  const statusOption = statusOptions.find(option => option.value === status)
  return statusOption ? statusOption.icon : '❓'
}

const getEditingStatus = (record: any, eduKey: string): string => {
  const rowKey = getRowKey(record)
  return editingRows.value[rowKey]?.[eduKey] || '待更新'
}

const updateEducationStatus = (record: any, eduKey: string, status: string) => {
  const editingRecord = addToEditingRows(record)
  editingRecord[eduKey] = status
  console.log(`更新学历状态: ${record.city} - ${eduKey} = ${status}`)
}

// 通用字段值更新方法
const updateFieldValue = (record: RegionalItem, fieldKey: string, value: any) => {
  const editingRecord = addToEditingRows(record)
  editingRecord[fieldKey] = value
  console.log(`更新字段值: ${record.city} - ${fieldKey} = ${value}`)
}

// 获取编辑中的记录，用于显示当前值
const getEditingRecord = (record: RegionalItem) => {
  const rowKey = getRowKey(record)
  return editingRows.value[rowKey] || record
}

// 添加或更新编辑行（只在有实际更改时调用）
const addToEditingRows = (record: RegionalItem) => {
  const rowKey = getRowKey(record)
  if (!editingRows.value[rowKey]) {
    editingRows.value[rowKey] = { ...record }
  }
  return editingRows.value[rowKey]
}

// 性价比城市/区县更新方法
const updateBestValueCity = (record: RegionalItem, checked: boolean) => {
  const editingRecord = addToEditingRows(record)
  editingRecord.is_best_value_city = checked
  console.log(`更新性价比城市状态: ${record.city} = ${checked}`)
}

const updateBestValueCounty = (record: RegionalItem, checked: boolean) => {
  const editingRecord = addToEditingRows(record)
  editingRecord.is_best_value_county = checked
  console.log(`更新性价比区县状态: ${record.county} = ${checked}`)
}

// 保留旧的切换方法以保持兼容性
const toggleBestValueCity = (record: RegionalItem) => {
  const rowKey = getRowKey(record)
  if (editingRows.value[rowKey]) {
    editingRows.value[rowKey].is_best_value_city = !editingRows.value[rowKey].is_best_value_city
    console.log(`切换性价比城市状态: ${record.city} = ${editingRows.value[rowKey].is_best_value_city}`)
  }
}

const toggleBestValueCounty = (record: RegionalItem) => {
  const rowKey = getRowKey(record)
  if (editingRows.value[rowKey] && record.county) {
    editingRows.value[rowKey].is_best_value_county = !editingRows.value[rowKey].is_best_value_county
    console.log(`切换性价比区县状态: ${record.county} = ${editingRows.value[rowKey].is_best_value_county}`)
  }
}

// 简化的方法，不再需要复杂的模板应用功能

// 监听单位ID变化
watch(() => props.unitId, (newUnitId) => {
  if (newUnitId) {
    loadRegionalData(newUnitId)
  } else {
    overviewData.value = null
    regionalList.value = []
    cityFilters.value = [] // 清空过滤器
    editingRows.value = {}
    savingRows.value = {}
    isEditMode.value = false
  }
}, { immediate: true })
</script>

<style scoped lang="less">
.regional-overview {
  .overview-section {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }

  // 区域头部
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;

    .section-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;

      .section-icon {
        color: #1890ff;
        font-size: 14px;
      }
    }

    .section-actions {
      display: flex;
      gap: 4px;

      .edit-mode-btn,
      .save-all-btn,
      .export-btn,
      .refresh-btn {
        color: #666;

        &:hover {
          color: #1890ff;
        }
      }
      
      .edit-mode-btn {
        &.edit-mode-active {
          color: #1890ff;
          background-color: #e6f7ff;
        }
        
        &:hover {
          color: #1890ff;
        }
      }
      
      .save-all-btn {
        &:hover {
          color: #52c41a;
        }
        
        &.enhanced-save-btn {
          background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
          border-color: #52c41a;
          box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
          font-weight: 600;
          
          &:hover {
            background: linear-gradient(135deg, #73d13d 0%, #95de64 100%);
            border-color: #73d13d;
            box-shadow: 0 4px 8px rgba(82, 196, 26, 0.3);
            transform: translateY(-1px);
          }
          
          &:active {
            transform: translateY(0);
          }
          
          .saving-progress {
            font-size: 10px;
            margin-left: 4px;
            opacity: 0.8;
            animation: pulse 1.5s ease-in-out infinite;
          }
        }
      }
    }
  }

  // 批量保存进度提示
  .batch-save-progress {
    padding: 12px 20px;
    background: linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%);
    border-bottom: 1px solid #b7eb8f;
    
    .progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .progress-info {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .progress-icon {
          font-size: 16px;
          animation: spin 1s linear infinite;
        }
        
        .progress-text {
          font-size: 14px;
          font-weight: 500;
          color: #1890ff;
        }
      }
      
      .progress-bar {
        flex: 1;
        height: 6px;
        background: #f0f0f0;
        border-radius: 3px;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      }
      
      .progress-count {
        font-size: 12px;
        color: #666;
        font-weight: 500;
        min-width: 50px;
        text-align: right;
      }
    }
  }

  // 统计摘要
  .summary-stats {
    padding: 16px 20px;
    background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
    border-bottom: 1px solid #f0f0f0;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 6px;
        border: 1px solid #e6f7ff;

        .stat-icon {
          width: 32px;
          height: 32px;
          background: #1890ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          flex-shrink: 0;
        }

        .stat-info {
          .stat-value {
            font-size: 16px;
            font-weight: 600;
            color: #1890ff;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
          }
        }
      }
    }
  }

  // 加载状态
  .loading-container {
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: center;

    .loading-placeholder {
      width: 100%;
      height: 200px;
    }
  }

  // 表格区域
  .regional-table {
    padding: 20px;

    :deep(.ant-table) {
      .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 600;
        color: #262626;
        font-size: 13px;
      }

      .ant-table-tbody > tr {
        &:hover {
          background-color: #f5f5f5;
        }
      }

      .ant-table-tbody > tr > td {
        font-size: 13px;
        padding: 8px 12px;
        
        // 为主要分组的第一列添加左边框分隔线
        &:nth-child(4), // 网申情况-本科学历第一列
        &:nth-child(15), // 分数线第一列  
        &:nth-child(18), // 待遇第一列
        &:nth-child(20) { // 操作列
          border-left: 2px solid #e6f7ff;
        }
      }
      
      // 表头也添加相同的分隔线
      .ant-table-thead > tr > th {
        &:nth-child(4), // 网申情况
        &:nth-child(15), // 分数线  
        &:nth-child(18), // 待遇
        &:nth-child(20) { // 操作
          border-left: 2px solid #d9d9d9;
        }
      }
    }

    .salary-value {
      font-weight: 600;
      
      &.bachelor {
        color: #52c41a;
      }
      
      &.master {
        color: #1890ff;
      }
      
      &.no-data {
        color: #d9d9d9;
        font-style: italic;
        font-weight: normal;
      }
    }

    .score-value {
      font-weight: 600;
      
      &.bachelor {
        color: #fa8c16;
      }
      
      &.master {
        color: #722ed1;
      }
      
      &.no-data {
        color: #d9d9d9;
        font-style: italic;
        font-weight: normal;
      }
    }
    
    .education-tag {
      font-size: 10px;
      padding: 2px 6px;
      margin: 0;
    }
    
    // 县区信息单元格
    .county-cell {
      .county-info {
        .county-name {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .county-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
      }
    }
    
    // 行操作按钮
    .row-actions {
      display: flex;
      gap: 4px;
      align-items: center;
      
      .edit-controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
        width: 100%;
        
        .value-switches {
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .ant-checkbox-wrapper {
            margin: 0;
            font-size: 11px;
            
            .switch-label {
              color: #666;
              font-size: 10px;
              white-space: nowrap;
            }
          }
        }
        
        .save-row-btn {
          color: #666;
          width: 20px;
          height: 20px;
          font-size: 12px;
          margin-top: 2px;
          align-self: center;
          
          &:hover {
            color: #52c41a;
          }
        }
      }
      
      .edit-row-btn,
      .cancel-row-btn,
      .more-actions-btn {
        color: #666;
        width: 20px;
        height: 20px;
        font-size: 12px;
        
        &:hover {
          color: #1890ff;
        }
      }
      
      .cancel-row-btn {
        &:hover {
          color: #ff4d4f;
        }
      }
      
      .no-permission {
        color: #d9d9d9;
        font-size: 12px;
      }
      
      .edit-hint {
        color: #999;
        font-size: 11px;
        white-space: nowrap;
      }
    }
  }

  // 空状态
  .empty-state {
    padding: 40px;
    text-align: center;

    .empty-icon {
      font-size: 48px;
      color: #d9d9d9;
      margin-bottom: 16px;
    }

    .empty-hint {
      font-size: 13px;
      color: #999;
      margin: 0;
    }
  }
}

// 动画定义
@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式适配
@media (max-width: 768px) {
  .regional-overview {
    .section-header {
      padding: 12px 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .section-title {
        font-size: 14px;
      }

      .section-actions {
        align-self: flex-end;
      }
    }

    .summary-stats {
      padding: 12px 16px;

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;

        .stat-item {
          padding: 10px;

          .stat-icon {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .stat-info {
            .stat-value {
              font-size: 14px;
            }

            .stat-label {
              font-size: 11px;
            }
          }
        }
      }
    }

    .regional-table {
      padding: 16px;

      :deep(.ant-table) {
        .ant-table-thead > tr > th,
        .ant-table-tbody > tr > td {
          font-size: 12px;
          padding: 6px 8px;
        }
      }

      .salary-value,
      .score-value {
        font-size: 11px;
      }
      
      .row-actions {
        .edit-row-btn,
        .save-row-btn,
        .cancel-row-btn,
        .more-actions-btn {
          width: 16px;
          height: 16px;
          font-size: 10px;
        }
      }
    }
  }
}

// 简化的教育字段样式
.education-field-edit {
  .ant-input {
    min-width: 55px; // 进一步减小宽度
    width: 55px; // 固定宽度，防止编辑时扩展
    font-size: 11px; // 减小字体
    padding: 0 4px; // 减小内边距
  }
}

.education-field-display {
  display: flex;
  justify-content: center;
  align-items: center;
  
  .education-status-text {
    font-size: 12px;
    display: inline-block;
    text-align: center;
    cursor: help;
    color: #666;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    
    &:hover {
      color: #1890ff;
      transition: color 0.2s ease;
    }
  }
  
  .ant-tag {
    margin: 0;
    font-size: 11px;
  }
}
</style>