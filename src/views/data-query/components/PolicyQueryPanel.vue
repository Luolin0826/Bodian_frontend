<template>
  <div class="policy-query-panel">
    <!-- 简洁标题 -->
    <div class="panel-header">
      <div class="header-content">
        <div class="title-section">
          <search-outlined class="title-icon" />
          <h3 class="panel-title">网申查询</h3>
        </div>
        <a-button
          v-if="hasActiveFilters"
          type="text"
          size="small"
          @click="handleReset"
          class="reset-btn"
          title="重置所有筛选条件"
        >
          <reload-outlined />
          重置
        </a-button>
      </div>
    </div>

    <!-- 紧凑的两行布局 -->
    <div class="panel-content">
      <div class="content-layout">
        <!-- 第一行：国网单位、南网单位、快捷查询（本科、研究生、录取数） -->
        <div class="row-layout first-row">
          <!-- 国网单位 -->
          <div class="filter-item guowang-item">
            <div class="item-label">
              <thunderbolt-outlined class="label-icon" />
              <span>国网单位</span>
              <span v-if="gwTotalCount" class="count-badge">{{ gwTotalCount }}</span>
            </div>
            <a-select
              v-model:value="selectedFilters.guowang"
              placeholder="选择国网单位"
              :options="mergedGuowangOptions"
              :field-names="{ label: 'unit_name', value: 'unit_id' }"
              allow-clear
              show-search
              size="small"
              :filter-option="filterOption"
              @change="(value: any) => handleFilterChange('guowang', value)"
              class="filter-select"
              :loading="optionsLoading"
            />
          </div>

          <!-- 南网单位 -->
          <div class="filter-item nanwang-item">
            <div class="item-label">
              <fire-outlined class="label-icon" />
              <span>南网单位</span>
              <span v-if="nwTotalCount" class="count-badge">{{ nwTotalCount }}</span>
            </div>
            <a-select
              v-model:value="selectedFilters.nanwang"
              placeholder="选择南网单位"
              :options="mergedNanwangOptions"
              :field-names="{ label: 'unit_name', value: 'unit_id' }"
              allow-clear
              show-search
              size="small"
              :filter-option="filterOption"
              @change="(value: any) => handleFilterChange('nanwang', value)"
              class="filter-select"
              :loading="optionsLoading"
            />
          </div>

          <!-- 快捷查询按钮组 -->
          <div class="action-buttons-group">
            <div class="item-label">
              <rocket-outlined class="label-icon" />
              <span>快捷查询</span>
            </div>
            <div class="action-buttons">
              <a-tooltip title="本科生全国各省基本信息">
                <a-button
                  @click="handleQuickQuery('undergraduate')"
                  :loading="props.quickQueryLoading.undergraduate"
                  class="action-btn undergraduate-btn"
                  size="small"
                >
                  <user-outlined />
                  本科
                </a-button>
              </a-tooltip>

              <a-tooltip title="研究生全国各省基本信息">
                <a-button
                  @click="handleQuickQuery('graduate')"
                  :loading="props.quickQueryLoading.graduate"
                  class="action-btn graduate-btn"
                  size="small"
                >
                  <team-outlined />
                  研究生
                </a-button>
              </a-tooltip>

              <a-tooltip title="各省份录取人数统计">
                <a-button
                  @click="handleQuickQuery('admission_count')"
                  :loading="props.quickQueryLoading.admission_count"
                  class="action-btn admission-btn"
                  size="small"
                >
                  <bar-chart-outlined />
                  录取数
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>

        <!-- 第二行：批次筛选、学校搜索、全部、国网、南网 -->
        <div class="row-layout second-row">
          <!-- 批次筛选 -->
          <div class="filter-item batch-item">
            <div class="item-label">
              <calendar-outlined class="label-icon" />
              <span>批次筛选</span>
            </div>
            <a-select
              v-model:value="selectedBatch"
              placeholder="选择批次"
              allow-clear
              size="small"
              @change="handleBatchChange"
              class="filter-select"
            >
              <a-select-option value="第一批">第一批</a-select-option>
              <a-select-option value="第二批">第二批</a-select-option>
              <a-select-option value="第三批">第三批</a-select-option>
              <a-select-option value="南网批次">南网批次</a-select-option>
            </a-select>
          </div>
          
          <!-- 学校搜索 -->
          <div class="filter-item search-item">
            <div class="item-label">
              <bank-outlined class="label-icon" />
              <span>学校搜索</span>
            </div>
            <a-input
              v-model:value="searchKeyword"
              placeholder="输入学校名称后按回车搜索"
              size="small"
              :loading="props.searchLoading"
              @pressEnter="handleSchoolSearch"
              @input="handleSearchKeywordChange"
              class="search-input simple-input"
            >
              <template #suffix>
                <search-outlined v-if="!props.searchLoading" />
                <loading-outlined v-else class="search-loading-icon" />
              </template>
            </a-input>
          </div>

          <!-- 快捷筛选按钮组 -->
          <div class="filter-buttons-item">
            <div class="item-label">
              <global-outlined class="label-icon" />
              <span>快捷筛选</span>
            </div>
            <a-radio-group 
              v-model:value="quickFilterType" 
              @change="handleQuickFilterChange"
              class="filter-buttons"
              size="small"
            >
              <a-radio-button value="" class="filter-btn all-btn">
                <global-outlined />
                全部
              </a-radio-button>
              <a-radio-button value="guowang" class="filter-btn guowang-btn">
                <thunderbolt-outlined />
                国网
              </a-radio-button>
              <a-radio-button value="nanwang" class="filter-btn nanwang-btn">
                <fire-outlined />
                南网
              </a-radio-button>
            </a-radio-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  SearchOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  FireOutlined,
  CalendarOutlined,
  BankOutlined,
  RocketOutlined,
  GlobalOutlined
} from '@ant-design/icons-vue'
import {
  getFilterOptions,
  type FilterOptions,
  type UnitOption,
  type UnitInfo
} from '@/api/policies'

// Props
interface Props {
  selectedUnitId?: number | null
  selectedUnitInfo?: UnitInfo | null
  loading?: boolean
  searchLoading?: boolean
  quickQueryLoading?: {
    undergraduate: boolean
    graduate: boolean
    admission_count: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  selectedUnitId: null,
  selectedUnitInfo: null,
  loading: false,
  searchLoading: false,
  quickQueryLoading: () => ({
    undergraduate: false,
    graduate: false,
    admission_count: false
  })
})

// Emits
const emit = defineEmits<{
  'unit-selected': [unitId: number, unitInfo: UnitOption]
  'unit-cleared': []
  'quick-query': [queryType: 'undergraduate' | 'graduate' | 'admission_count']
  'batch-change': [params: { unitId: number | null, batch: string | null, sortBy?: string, page?: number, limit?: number, sortOrder?: string, quickFilter?: string }]
  'school-search': [params: { unit_id?: number, batch_type?: string, school_name: string, quick_filter?: string }]
}>()

// 响应式数据
const optionsLoading = ref(false)
const filterOptions = reactive({
  gw_provinces: [] as UnitOption[],
  gw_direct_units: [] as UnitOption[],
  nw_provinces: [] as UnitOption[],
  nw_direct_units: [] as UnitOption[],
  provincial_industry: [] as UnitOption[],
  total_units: 0,
  categories: {
    gw_provinces_count: 0,
    gw_direct_units_count: 0,
    nw_provinces_count: 0,
    nw_direct_units_count: 0,
    provincial_industry_count: 0
  }
})

const selectedFilters = reactive({
  guowang: null as number | null,
  nanwang: null as number | null
})

// 快捷查询加载状态由父组件管理，通过props传入

// 新增高级查询功能的响应式状态
const selectedBatch = ref<string | null>(null)
const searchKeyword = ref('')
const quickFilterType = ref<string>('')

// 计算属性
const selectedUnitId = computed(() => {
  return selectedFilters.guowang || selectedFilters.nanwang
})

const hasActiveFilters = computed(() => {
  return selectedFilters.guowang !== null || 
         selectedFilters.nanwang !== null ||
         selectedBatch.value !== null ||
         searchKeyword.value.trim() !== '' ||
         quickFilterType.value !== ''
})

// 合并的国网选项（省公司 → 直属单位 → 省属产业）
const mergedGuowangOptions = computed(() => {
  const provinces = filterOptions.gw_provinces.map(item => ({
    ...item,
    unit_name: `${item.unit_name} (省公司)`,
    category: 'provinces'
  }))
  const direct = filterOptions.gw_direct_units.map(item => ({
    ...item,
    unit_name: `${item.unit_name} (直属单位)`,
    category: 'direct'
  }))
  const industry = filterOptions.provincial_industry.map(item => ({
    ...item,
    unit_name: `${item.unit_name} (省属产业)`,
    category: 'industry'
  }))
  return [...provinces, ...direct, ...industry]
})

// 合并的南网选项（省公司 → 直属单位）
const mergedNanwangOptions = computed(() => {
  const provinces = filterOptions.nw_provinces.map(item => ({
    ...item,
    unit_name: `${item.unit_name} (省公司)`,
    category: 'provinces'
  }))
  const direct = filterOptions.nw_direct_units.map(item => ({
    ...item,
    unit_name: `${item.unit_name} (直属单位)`,
    category: 'direct'
  }))
  return [...provinces, ...direct]
})

// 统计计算
const gwTotalCount = computed(() => {
  return filterOptions.categories.gw_provinces_count + 
         filterOptions.categories.gw_direct_units_count + 
         filterOptions.categories.provincial_industry_count
})

const nwTotalCount = computed(() => {
  return filterOptions.categories.nw_provinces_count + filterOptions.categories.nw_direct_units_count
})

// 方法
const filterOption = (input: string, option: any) => {
  const label = option.unit_name || option.label || ''
  return label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}


const handleFilterChange = (filterType: string, unitId: number | null) => {
  console.log('筛选器变化:', { filterType, unitId })
  
  if (unitId) {
    // 清空其他筛选器（互斥逻辑）
    Object.keys(selectedFilters).forEach(key => {
      if (key !== filterType) {
        selectedFilters[key as keyof typeof selectedFilters] = null
      }
    })

    // 找到选中的单位信息
    let selectedUnit: UnitOption | null = null
    
    if (filterType === 'guowang') {
      // 在合并的国网选项中查找
      selectedUnit = [
        ...filterOptions.gw_provinces,
        ...filterOptions.gw_direct_units,
        ...filterOptions.provincial_industry
      ].find(unit => unit.unit_id === unitId) || null
    } else if (filterType === 'nanwang') {
      // 在合并的南网选项中查找
      selectedUnit = [
        ...filterOptions.nw_provinces,
        ...filterOptions.nw_direct_units
      ].find(unit => unit.unit_id === unitId) || null
    }

    if (selectedUnit) {
      emit('unit-selected', unitId, selectedUnit)
    }
  } else {
    // 清空选择
    emit('unit-cleared')
  }
}

const handleReset = () => {
  // 重置单位选择
  Object.keys(selectedFilters).forEach(key => {
    selectedFilters[key as keyof typeof selectedFilters] = null
  })
  
  // 重置批次筛选
  selectedBatch.value = null
  
  // 重置学校搜索
  searchKeyword.value = ''
  
  // 重置快捷筛选
  quickFilterType.value = ''
  
  // 触发单位清除事件
  emit('unit-cleared')
  
  console.log('🔄 已重置所有筛选条件')
  message.success('已重置所有筛选条件')
}

// 快捷查询处理 - 加载状态由父组件管理
const handleQuickQuery = (queryType: 'undergraduate' | 'graduate' | 'admission_count') => {
  console.log('🚀 执行快捷查询:', queryType)
  
  // 触发快捷查询事件，由父组件处理实际的API调用和加载状态
  emit('quick-query', queryType)
  
  // 显示提示消息
  const queryTypeNames = {
    undergraduate: '本科生全国各省基本信息',
    graduate: '研究生全国各省基本信息', 
    admission_count: '各省份录取人数统计'
  }
  
  message.success(`正在加载${queryTypeNames[queryType]}...`)
}

const loadFilterOptions = async () => {
  try {
    optionsLoading.value = true
    const options = await getFilterOptions()
    
    // 更新筛选选项
    Object.assign(filterOptions, options)
    
    console.log('✅ 筛选选项加载成功:', options)
    console.log(`📊 筛选统计: 共${options.total_units}个单位 | 国网省公司:${options.categories.gw_provinces_count} | 国网直属:${options.categories.gw_direct_units_count} | 省属产业:${options.categories.provincial_industry_count} | 南网省公司:${options.categories.nw_provinces_count} | 南网直属:${options.categories.nw_direct_units_count}`)
  } catch (error) {
    console.error('❌ 加载筛选选项失败:', error)
    message.error('加载筛选选项失败，请刷新重试')
    
    // 提供默认的空选项
    filterOptions.gw_provinces = []
    filterOptions.gw_direct_units = []
    filterOptions.nw_provinces = []
    filterOptions.nw_direct_units = []
    filterOptions.provincial_industry = []
  } finally {
    optionsLoading.value = false
  }
}

// 监听外部单位ID变化，同步内部状态
watch(() => props.selectedUnitId, (newUnitId) => {
  if (!newUnitId) {
    // 清空所有筛选器
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key as keyof typeof selectedFilters] = null
    })
    return
  }
  
  // 查找该单位ID对应的筛选器类型
  let foundFilterType: string | null = null
  
  const isGuowangUnit = [
    ...filterOptions.gw_provinces,
    ...filterOptions.gw_direct_units,
    ...filterOptions.provincial_industry
  ].some(unit => unit.unit_id === newUnitId)
  
  const isNanwangUnit = [
    ...filterOptions.nw_provinces,
    ...filterOptions.nw_direct_units
  ].some(unit => unit.unit_id === newUnitId)
  
  if (isGuowangUnit) {
    foundFilterType = 'guowang'
  } else if (isNanwangUnit) {
    foundFilterType = 'nanwang'
  }
  
  if (foundFilterType) {
    // 清空其他筛选器，设置当前筛选器
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key as keyof typeof selectedFilters] = 
        key === foundFilterType ? newUnitId : null
    })
  }
}, { immediate: true })

// 新增高级查询功能的事件处理函数
const handleBatchChange = (batch: string | null) => {
  selectedBatch.value = batch
  console.log('📊 批次筛选变更:', batch)
  console.log('📊 当前搜索关键词:', searchKeyword.value)
  console.log('📊 当前选择单位:', selectedUnitId.value)
  
  emit('batch-change', {
    unitId: selectedUnitId.value,
    batch: batch,
    quickFilter: quickFilterType.value || undefined
  })
}

const handleSchoolSearch = () => {
  if (!searchKeyword.value.trim()) {
    message.warning('请输入学校名称')
    return
  }
  
  console.log('🔍 学校搜索:', searchKeyword.value)
  
  const searchParams: any = {
    school_name: searchKeyword.value.trim()
  }
  
  // 添加单位ID参数
  if (selectedUnitId.value) {
    searchParams.unit_id = selectedUnitId.value
  }
  
  // 添加批次参数
  if (selectedBatch.value) {
    searchParams.batch_type = selectedBatch.value
  }
  
  // 添加快捷筛选参数
  if (quickFilterType.value) {
    searchParams.quick_filter = quickFilterType.value
  }
  
  emit('school-search', searchParams)
}

// 处理学校搜索关键词变化
const handleSearchKeywordChange = () => {
  console.log('📝 学校搜索关键词变化:', searchKeyword.value)
  
  // 通知父组件搜索关键词发生了变化，但不立即执行搜索
  // 这样父组件在其他操作时可以检测到有搜索关键词
}

const handleQuickFilterChange = (e: any) => {
  const filterValue = e.target.value
  quickFilterType.value = filterValue
  console.log('🎯 快捷筛选变更:', filterValue)
  
  // 清空其他筛选器（快捷筛选与单位筛选互斥）
  if (filterValue) {
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key as keyof typeof selectedFilters] = null
    })
    emit('unit-cleared')
  }
  
  // 触发批次变更事件，应用快捷筛选
  emit('batch-change', {
    unitId: selectedUnitId.value,
    batch: selectedBatch.value,
    quickFilter: filterValue || undefined
  })
}

// 监听搜索关键词变化
watch(searchKeyword, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    console.log('🔄 PolicyQueryPanel - 搜索关键词变化:', { 
      from: oldValue, 
      to: newValue,
      hasValue: !!newValue?.trim()
    })
  }
})

// 生命周期
onMounted(() => {
  loadFilterOptions()
})

// 暴露给父组件的方法和状态
defineExpose({
  searchKeyword,
  getSearchKeyword: () => searchKeyword.value
})
</script>

<style scoped lang="less">
.policy-query-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
}

// 简洁的标题设计
.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title-section {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .title-icon {
        color: #1890ff;
        font-size: 18px;
      }
      
      .panel-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .reset-btn {
      color: #666;
      font-size: 13px;
      
      &:hover {
        color: #1890ff;
      }
      
      .anticon {
        margin-right: 4px;
      }
    }
  }
}

// 紧凑的主内容区域
.panel-content {
  padding: 20px;
  
  .content-layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

// 行布局样式 - 第一行和第二行保持相同比例
.row-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  align-items: end;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  // 第一行特殊处理
  &.first-row {
    .action-buttons-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .item-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #666;
        min-height: 20px;
        
        .label-icon {
          font-size: 14px;
          color: #fa8c16;
        }
      }
      
      .action-buttons {
        display: flex;
        gap: 8px;
        
        .action-btn {
          flex: 1;
          height: 32px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.3s ease;
          border: none;
          
          .anticon {
            font-size: 12px;
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          &.undergraduate-btn {
            background: #1890ff;
            color: white;
            
            &:hover {
              background: #40a9ff;
            }
          }
          
          &.graduate-btn {
            background: #52c41a;
            color: white;
            
            &:hover {
              background: #73d13d;
            }
          }
          
          &.admission-btn {
            background: #fa8c16;
            color: white;
            
            &:hover {
              background: #ffa940;
            }
          }
        }
      }
    }
  }
  
  // 第二行特殊处理 - 确保组件对齐和一致性
  &.second-row {
    .filter-item,
    .filter-buttons-item {
      .item-label {
        min-height: 20px; // 确保与第一行标签高度一致
        margin-bottom: 8px;
      }
    }
    
    // 确保学校搜索框样式一致
    .search-item {
      .search-input {
        width: 100%;
      }
    }
  }
}

// 通用项目样式
.filter-item,
.action-item,
.filter-buttons-item,
.action-buttons-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .item-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    min-height: 20px;
    
    .label-icon {
      font-size: 14px;
      color: #999;
    }
    
    .count-badge {
      background: #f0f0f0;
      color: #666;
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 8px;
      font-weight: 600;
      margin-left: auto;
    }
  }
  
  // 统一所有输入框样式
  .filter-select,
  .search-input {
    height: 32px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .filter-select {
    :deep(.ant-select-selector) {
      height: 32px !important;
      line-height: 30px !important;
      padding: 0 11px !important;
      border-radius: 6px !important;
      border: 1px solid #d9d9d9 !important;
      font-size: 13px !important;
      box-sizing: border-box !important;
      
      &:hover {
        border-color: #40a9ff !important;
      }
    }
    
    &.ant-select-focused :deep(.ant-select-selector) {
      border-color: #1890ff !important;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
    }
  }
  
  // 简化的搜索输入框，避免双层效果
  .search-input.simple-input {
    :deep(.ant-input) {
      height: 32px !important;
      line-height: 30px !important;
      padding: 4px 11px !important;
      border-radius: 6px !important;
      border: 1px solid #d9d9d9 !important;
      font-size: 13px !important;
      box-sizing: border-box !important;
      background: white !important;
      
      &:hover {
        border-color: #40a9ff !important;
      }
      
      &:focus {
        border-color: #1890ff !important;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
      }
      
      &::placeholder {
        color: #bfbfbf;
        font-size: 12px;
      }
    }
    
    // 确保没有额外的包装器样式
    :deep(.ant-input-affix-wrapper) {
      display: none !important;
    }
    
    // 重置任何可能的双层样式
    &::before,
    &::after {
      display: none !important;
    }
  }
  
  .filter-buttons {
    display: flex;
    width: 100%;
    
    :deep(.ant-radio-button-wrapper) {
      flex: 1;
      height: 32px;
      border-radius: 0;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.3s ease;
      
      &:first-child {
        border-radius: 6px 0 0 6px;
      }
      
      &:last-child {
        border-radius: 0 6px 6px 0;
      }
      
      .anticon {
        font-size: 12px;
      }
      
      &:hover {
        transform: translateY(-1px);
        z-index: 2;
      }
      
      &.ant-radio-button-wrapper-checked {
        z-index: 3;
        
        &.all-btn {
          background: #722ed1;
          border-color: #722ed1;
          color: white;
        }
        
        &.guowang-btn {
          background: #1890ff;
          border-color: #1890ff;
          color: white;
        }
        
        &.nanwang-btn {
          background: #52c41a;
          border-color: #52c41a;
          color: white;
        }
      }
    }
  }
  
  // 不同类型的特殊样式
  &.guowang-item .item-label {
    .label-icon { color: #1890ff; }
    .count-badge { background: #e6f7ff; color: #1890ff; }
  }
  
  &.nanwang-item .item-label {
    .label-icon { color: #52c41a; }
    .count-badge { background: #f6ffed; color: #52c41a; }
  }
  
  &.batch-item .item-label .label-icon {
    color: #722ed1;
  }
  
  &.search-item .item-label .label-icon {
    color: #fa8c16;
  }
}


  


// 选择提示
.selection-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  min-height: 120px;
  
  .hint-content {
    text-align: center;
    max-width: 300px;
    
    
    .hint-text {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    
    .hint-tips {
      text-align: left;
      background: #fafafa;
      border-radius: 6px;
      padding: 8px;
      
      p {
        margin: 0;
        font-size: 12px;
        color: #888;
        line-height: 1.5;
        margin-bottom: 4px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .policy-query-panel {
    border-radius: 12px;
    
    .panel-header {
      padding: 20px;
      
      .header-left .title-wrapper {
        gap: 12px;
        
        .title-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          
          .title-icon {
            font-size: 20px;
          }
        }
        
        .title-content {
          .panel-title {
            font-size: 20px;
          }
          
          .panel-subtitle {
            font-size: 12px;
          }
        }
      }
      
      .header-right .reset-btn {
        height: 36px;
        padding: 0 16px;
        border-radius: 18px;
        font-size: 13px;
      }
    }
    
    .panel-content {
      padding: 24px 20px 20px;
      
      .section-title .title-line {
        font-size: 14px;
        gap: 8px;
        
        .title-icon {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          font-size: 12px;
        }
      }
    }
  }
  
  .filters-section {
    margin-bottom: 24px;
    
    .filters-grid {
      .filter-card {
        padding: 16px;
        border-radius: 12px;
        
        .card-header {
          margin-bottom: 12px;
          gap: 10px;
          
          .card-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            font-size: 16px;
          }
          
          .card-title span {
            font-size: 14px;
          }
          
          .count-badge {
            padding: 3px 8px;
            font-size: 11px;
          }
        }
        
        .card-select {
          height: 40px;
          
          :deep(.ant-select-selector) {
            height: 40px !important;
            border-radius: 10px !important;
            font-size: 13px;
          }
        }
        
        .card-search {
          height: 40px;
          
          :deep(.ant-input-group-wrapper) {
            .ant-input {
              height: 40px;
              border-radius: 10px 0 0 10px;
              font-size: 13px;
            }
            
            .ant-input-search-button {
              height: 40px;
              border-radius: 0 10px 10px 0;
            }
          }
        }
      }
    }
  }
  
  .actions-section .actions-content {
    .quick-queries .queries-buttons {
      gap: 8px;
      
      .query-btn {
        height: 48px;
        padding: 0 16px;
        border-radius: 12px;
        font-size: 13px;
        
        .anticon {
          font-size: 16px;
        }
      }
    }
    
    .quick-filters .filters-buttons .filter-radio-group {
      :deep(.ant-radio-button-wrapper) {
        height: 44px;
        border-radius: 10px;
        font-size: 13px;
        
        .anticon {
          font-size: 14px;
        }
      }
    }
  }
}

// 动画和特效
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.policy-query-panel {
  animation: slideInUp 0.6s ease-out;
}

.filter-card {
  animation: slideInUp 0.6s ease-out;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
}

.query-btn {
  &:hover {
    animation: pulse 2s infinite;
  }
}

.panel-header .title-icon-bg {
  animation: float 3s ease-in-out infinite;
}

// 加载状态美化
.ant-select-loading {
  :deep(.ant-select-selector) {
    background: linear-gradient(90deg, #f0f0f0 25%, rgba(240, 240, 240, 0.5) 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

</style>