<template>
  <div class="data-query-page data-query-responsive">

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 上半部分：5:5双栏布局 -->
      <div class="top-section">
        <div class="two-column-layout" :class="layoutClass">
          
          <!-- 左栏：网申查询和数据概览 -->
          <div class="left-column query-column responsive-card">
            <!-- 网申查询面板（原筛选器面板 + DataAnalytics的查询功能） -->
            <PolicyQueryPanel
              ref="policyQueryPanelRef"
              :selected-unit-id="selectedUnitId"
              :selected-unit-info="selectedUnitInfo"
              :loading="policyLoading"
              :search-loading="searchLoading"
              :quick-query-loading="quickQueryLoading"
              @unit-selected="handleUnitSelected"
              @unit-cleared="handleUnitCleared"
              @quick-query="handleQuickQuery"
              @batch-change="handleBatchChange"
              @school-search="handleSchoolSearch"
            />

            <!-- 数据概览区域（简化版DataAnalytics） -->
            <div class="data-overview-container">
              <DataAnalytics
                ref="analyticsComponentRef"
                :data="analyticsData"
                :loading="analyticsLoading"
                :unit-id="selectedUnitId"
                :unit-info="selectedUnitInfo"
                :show-empty-state="!selectedUnitId"
                :compact-mode="true"
                @drill-down="handleDrillDown"
                @school-detail="handleSchoolDetail"
                @data-refresh="handleAnalyticsRefresh"
                @batch-change="handleBatchChange"
                @school-search="handleSchoolSearch"
                @global-reset="handleUnitCleared"
                @update-analytics-data="handleUpdateAnalyticsData"
              />
            </div>
          </div>

          <!-- 右栏：省份信息 -->
          <div class="right-column policy-details-column responsive-card">
            <!-- 省份信息组件，监听左侧单位选择 -->
            <ProvinceInfo
              :unit-info="selectedUnitInfo"
              @content-updated="handleProvinceInfoUpdated"
              @loading-change="handleProvinceInfoLoadingChange"
            />
          </div>
          
        </div>
      </div>

      <!-- 快捷查询结果弹窗 -->
      <QuickQueryResults
        :visible="showQuickQueryResults"
        :query-type="currentQueryType"
        :data="quickQueryResultData"
        :loading="quickQueryLoading[currentQueryType]"
        @close="handleCloseQuickQuery"
        @refresh="handleRefreshQuickQuery"
        @data-updated="handleQuickQueryDataUpdated"
      />

      <!-- 下半部分：地市县概览全宽布局 -->
      <div class="bottom-section">
        <div class="regional-overview-full-width">
          <RegionalOverview
            :unit-id="selectedUnitId"
            :unit-info="selectedUnitInfo"
            :show-empty-state="!selectedUnitId"
            @data-loaded="handleRegionalDataLoaded"
            @loading-change="handleRegionalLoadingChange"
          />
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import { useResponsive } from '@/composables/useResponsive'
import { useLayoutStore } from '@/stores/layout'

// 导入新的组件
import PolicyQueryPanel from './components/PolicyQueryPanel.vue'
import RegionalOverview from './components/RegionalOverview.vue'
import DataAnalytics from './components/DataAnalytics.vue'
import QuickQueryResults from './components/QuickQueryResults.vue'
import ProvinceInfo from './components/ProvinceInfo.vue'

// 导入API接口
import { recruitmentAPI } from '@/api/recruitment'
import { quickQueryAPI } from '@/api/quick-query'
import type {
  UnitPolicyResponse,
  RegionalOverviewResponse,
  EarlyBatchResponse,
  RuralGridResponse
} from '@/api/policies'

// 导入组合式函数
import { useDataQueryContent } from '@/composables/useDataQueryContent'

// 导入响应式样式
import './styles/responsive.less'

// 响应式工具
const { isMobile, isTablet, width } = useResponsive()

// Data-Query内容管理
const {
  loadProvinceContent,
  loadSectionContent,
  resetState,
  basicPolicyData,
  earlyBatchData, 
  ruralGridData,
  convertToComponentFormat
} = useDataQueryContent()

// 主要状态数据
const selectedUnitId = ref<number | null>(null)
const selectedUnitInfo = ref<any>(null)
const analyticsLoading = ref(false)
const searchLoading = ref(false)  // 学校搜索加载状态
const analyticsData = ref<any>(null)

// 快捷查询相关状态
const showQuickQueryResults = ref(false)
const currentQueryType = ref<'undergraduate' | 'graduate' | 'admission_count'>('undergraduate')
const quickQueryResultData = ref<any[]>([])
// 为每个快捷查询按钮单独管理加载状态
const quickQueryLoading = reactive({
  undergraduate: false,
  graduate: false,
  admission_count: false
})

// 组件引用
const analyticsComponentRef = ref<any>(null)
const policyQueryPanelRef = ref<any>(null)

// 各部分加载状态
const policyLoadingStates = reactive({
  unit: false,
  regional: false,
  earlyBatch: false,
  ruralGrid: false
})

// 计算属性
const layoutClass = computed(() => {
  if (width.value < 768) return 'mobile-layout'
  if (width.value < 1024) return 'tablet-layout'
  return 'desktop-layout'
})


// 事件处理方法
const handleUnitSelected = async (unitId: number, unitInfo: any) => {
  console.log('✅ 选择单位:', { unitId, unitInfo })
  
  // 直接设置选中的单位，让各个组件自己处理数据加载
  selectedUnitId.value = unitId
  selectedUnitInfo.value = unitInfo
  
  // 保持DataAnalytics组件的筛选状态，避免清空用户的筛选操作
  const analyticsRef = analyticsComponentRef.value
  const policyQueryRef = policyQueryPanelRef.value
  let preservedFilters: any = null
  
  if (analyticsRef) {
    // 保存当前的筛选状态
    preservedFilters = {
      selectedBatch: analyticsRef.selectedBatch?.value,
      selectedSortBy: analyticsRef.selectedSortBy?.value,
      selectedSortOrder: analyticsRef.selectedSortOrder?.value,
      currentPage: analyticsRef.currentPage?.value,
      searchKeyword: analyticsRef.searchKeyword?.value,
      showSearchResults: analyticsRef.showSearchResults?.value,
      // 同时保存PolicyQueryPanel中的搜索关键词
      policySearchKeyword: policyQueryRef?.searchKeyword?.value || policyQueryRef?.getSearchKeyword?.()
    }
    console.log('💾 保存当前筛选状态:', preservedFilters)
    console.log('📋 组件引用状态:', {
      hasAnalyticsRef: !!analyticsRef,
      hasPolicyQueryRef: !!policyQueryRef,
      analyticsSearchKeyword: analyticsRef?.searchKeyword?.value,
      policySearchKeyword: policyQueryRef?.searchKeyword?.value
    })
  }
  
  // 检测快捷筛选与省份选择的冲突并自动调整
  if (unitInfo && unitInfo.org_type && analyticsRef) {
    const currentQuickFilter = analyticsRef.quickFilterType?.value
    const orgType = unitInfo.org_type
    
    let expectedQuickFilter = null
    if (orgType === '国网省公司' || orgType === '国网直属单位') {
      expectedQuickFilter = 'guowang'
    } else if (orgType === '南网省公司' || orgType === '南网直属单位') {
      expectedQuickFilter = 'nanwang'
    }
    
    if (currentQuickFilter && currentQuickFilter !== expectedQuickFilter) {
      console.log('🔄 检测到快捷筛选冲突，将自动调整:', { 
        current: currentQuickFilter, 
        expected: expectedQuickFilter 
      })
      // 更新快捷筛选状态
      if (preservedFilters) {
        preservedFilters.quickFilterType = expectedQuickFilter
      }
      message.info(`已根据选择的单位自动调整为${expectedQuickFilter === 'guowang' ? '国网' : '南网'}筛选`)
    }
  }
  
  // 清空之前的analytics数据，但会通过watch重新加载时恢复筛选状态
  analyticsData.value = null
  
  // 在下个tick恢复筛选状态
  if (preservedFilters && analyticsRef) {
    setTimeout(() => {
      console.log('🔄 恢复筛选状态:', preservedFilters)
      if (preservedFilters.selectedBatch && analyticsRef.selectedBatch) {
        analyticsRef.selectedBatch.value = preservedFilters.selectedBatch
      }
      if (preservedFilters.selectedSortBy && analyticsRef.selectedSortBy) {
        analyticsRef.selectedSortBy.value = preservedFilters.selectedSortBy
      }
      if (preservedFilters.selectedSortOrder && analyticsRef.selectedSortOrder) {
        analyticsRef.selectedSortOrder.value = preservedFilters.selectedSortOrder
      }
      if (preservedFilters.currentPage && analyticsRef.currentPage) {
        analyticsRef.currentPage.value = preservedFilters.currentPage
      }
      if (preservedFilters.searchKeyword && analyticsRef.searchKeyword) {
        analyticsRef.searchKeyword.value = preservedFilters.searchKeyword
      }
      if (preservedFilters.showSearchResults && analyticsRef.showSearchResults) {
        analyticsRef.showSearchResults.value = preservedFilters.showSearchResults
      }
      if (preservedFilters.quickFilterType && analyticsRef.quickFilterType) {
        analyticsRef.quickFilterType.value = preservedFilters.quickFilterType
      }
      // 恢复PolicyQueryPanel中的搜索关键词
      if (preservedFilters.policySearchKeyword && policyQueryRef?.searchKeyword) {
        // 确保searchKeyword是一个ref对象而不是字符串值
        if (typeof policyQueryRef.searchKeyword === 'object' && 'value' in policyQueryRef.searchKeyword) {
          policyQueryRef.searchKeyword.value = preservedFilters.policySearchKeyword
        } else {
          console.warn('⚠️ policyQueryRef.searchKeyword不是ref对象:', typeof policyQueryRef.searchKeyword, policyQueryRef.searchKeyword)
        }
      }
    }, 100)
  }
}

const handleUnitCleared = () => {
  console.log('🧹 执行全局重置')
  
  // 重置单位选择
  selectedUnitId.value = null
  selectedUnitInfo.value = null
  analyticsData.value = null
  
  // 重置快捷查询结果
  showQuickQueryResults.value = false
  quickQueryResultData.value = []
  console.log('🧹 重置快捷查询结果')
  
  // 重置数据查询内容状态
  resetState()
  console.log('🧹 重置数据查询内容状态')
  
  // 重置DataAnalytics组件的所有筛选状态
  const analyticsRef = analyticsComponentRef.value
  if (analyticsRef && analyticsRef.handleReset) {
    analyticsRef.handleReset()
    console.log('🧹 同步重置DataAnalytics组件状态')
  }
  
  console.log('✅ 全局重置完成')
}

// 省份信息事件处理
const handleProvinceInfoUpdated = async () => {
  console.log('📝 检测到省份信息更新')
  // 这里可以添加需要在内容更新后执行的逻辑
}

const handleProvinceInfoLoadingChange = (loading: boolean) => {
  policyLoadingStates.unit = loading
}

const handleRegionalDataLoaded = (data: RegionalOverviewResponse['data']) => {
  console.log('🌍 地市县数据加载完成:', data)
}

const handleRegionalLoadingChange = (loading: boolean) => {
  policyLoadingStates.regional = loading
}

// 旧的事件处理方法已移除，由统一内容管理组件处理


// DataAnalytics组件事件处理
const handleDrillDown = (params: any) => {
  console.log('📊 图表钻取:', params)
}

const handleSchoolDetail = (schoolInfo: any) => {
  console.log('🏫 查看学校详情:', schoolInfo)
}

const handleAnalyticsRefresh = async () => {
  console.log('🔄 刷新分析数据')
  // 可以在这里重新加载analytics数据
}

// 处理DataAnalytics组件请求更新分析数据
const handleUpdateAnalyticsData = (data: any) => {
  console.log('📊 更新分析数据:', data)
  analyticsData.value = data
}

// 学校搜索事件处理
const handleSchoolSearch = async (searchParams: { unit_id?: number, batch_type?: string, school_name: string, quick_filter?: string }) => {
  console.log('🔍 执行学校搜索:', searchParams)
  
  // 设置搜索加载状态
  searchLoading.value = true
  
  try {
    // 处理批次参数，优先使用batch_code
    const processedParams = { ...searchParams }
    
    if (processedParams.batch_type) {
      // 导入批次映射配置
      const { batchTypeMapping } = await import('@/api/recruitment')
      const batchCode = batchTypeMapping[processedParams.batch_type as keyof typeof batchTypeMapping]
      
      if (batchCode) {
        processedParams.batch_code = batchCode
        delete processedParams.batch_type
      }
      
      console.log('🔄 学校搜索批次参数转换:', {
        original: searchParams.batch_type,
        batchCode: batchCode || 'not_found',
        finalParams: processedParams
      })
    }
    
    // 调用统一学校查询API
    const { getSchoolsUnified } = await import('@/api/recruitment')
    const response = await getSchoolsUnified(processedParams)
    
    console.log('🔍 学校搜索结果:', response)
    
    // 将搜索结果传递给DataAnalytics组件 - 传递完整响应数据以包含summary
    const analyticsRef = analyticsComponentRef.value
    if (analyticsRef) {
      analyticsRef.handleSearchResults(response)  // 传递完整响应而不是仅schools
      // 同步搜索关键词到DataAnalytics组件，以便状态保存时能够获取到
      if (analyticsRef.searchKeyword && typeof analyticsRef.searchKeyword === 'object' && 'value' in analyticsRef.searchKeyword) {
        analyticsRef.searchKeyword.value = searchParams.school_name
      }
    }
    
    // 显示搜索结果统计
    if (response.schools && response.schools.length > 0) {
      message.success(`找到 ${response.schools.length} 所匹配的学校`)
    } else {
      message.info('未找到匹配的学校')
    }
    
  } catch (error) {
    console.error('❌ 学校搜索失败:', error)
    message.error('搜索学校失败，请重试')
    
    // 清空搜索结果
    const analyticsRef = analyticsComponentRef.value
    if (analyticsRef) {
      analyticsRef.handleSearchResults([])
    }
  } finally {
    // 清除搜索加载状态
    searchLoading.value = false
  }
}


// 快捷查询处理
const handleQuickQuery = async (queryType: 'undergraduate' | 'graduate' | 'admission_count') => {
  console.log('🚀 处理快捷查询:', queryType)
  
  try {
    // 只为当前查询类型设置加载状态
    quickQueryLoading[queryType] = true
    currentQueryType.value = queryType
    
    // 构建快捷查询API参数
    const apiParams = {
      page: 1,
      limit: 100 // 获取更多数据以展示完整信息
    }
    
    let response: any
    
    // 根据查询类型调用对应的API
    switch (queryType) {
      case 'undergraduate':
        response = await quickQueryAPI.getUndergraduate(apiParams)
        break
      case 'graduate':
        response = await quickQueryAPI.getGraduate(apiParams)
        break
      case 'admission_count':
        response = await quickQueryAPI.getAdmissionStats(apiParams)
        break
    }
    
    console.log('📊 快捷查询API参数:', apiParams)
    console.log('✅ 快捷查询数据加载成功:', response)
    
    // 设置快捷查询结果数据
    if (response && response.data) {
      quickQueryResultData.value = response.data
      showQuickQueryResults.value = true
    } else {
      quickQueryResultData.value = []
      showQuickQueryResults.value = false
    }
    
    // 显示成功消息
    const queryTypeNames = {
      undergraduate: '本科生全国各省基本信息',
      graduate: '研究生全国各省基本信息',
      admission_count: '各省份录取人数统计'
    }
    
    message.success(`${queryTypeNames[queryType]}加载完成`)
    
  } catch (error) {
    console.error('❌ 快捷查询失败:', error)
    message.error('快捷查询失败，请重试')
    quickQueryResultData.value = []
    showQuickQueryResults.value = false
  } finally {
    // 只清除当前查询类型的加载状态
    quickQueryLoading[queryType] = false
  }
}

const handleBatchChange = async (params: { unitId: number | null, batch: string | null, sortBy?: string, page?: number, limit?: number, sortOrder?: string, quickFilter?: string }) => {
  console.log('📊 批次变更:', params)
  
  // 检查是否当前有学校搜索状态，如果有则优先执行学校搜索
  const analyticsRef = analyticsComponentRef.value
  const policyQueryRef = policyQueryPanelRef.value
  
  console.log('🔍 父组件引用检查:', {
    hasAnalyticsRef: !!analyticsRef,
    hasPolicyQueryRef: !!policyQueryRef,
    policyQueryRefKeys: policyQueryRef ? Object.keys(policyQueryRef) : null,
    policySearchKeywordObj: policyQueryRef?.searchKeyword,
    policySearchKeyword: policyQueryRef?.searchKeyword?.value || policyQueryRef?.getSearchKeyword?.(),
    analyticsSearchKeyword: analyticsRef?.searchKeyword?.value
  })
  
  if (analyticsRef && policyQueryRef) {
    const isShowingSearchResults = analyticsRef.showSearchResults?.value
    const analyticsSearchKeyword = analyticsRef.searchKeyword?.value
    const policySearchKeyword = policyQueryRef.searchKeyword?.value || policyQueryRef.getSearchKeyword?.()
    const effectiveSearchKeyword = policySearchKeyword || analyticsSearchKeyword
    
    console.log('🔍 批次变更时检查搜索状态:', {
      isShowingSearchResults,
      analyticsSearchKeyword,
      policySearchKeyword,
      effectiveSearchKeyword,
      hasSearchKeyword: !!effectiveSearchKeyword?.trim()
    })
    
    // 如果有搜索关键词，重新执行学校搜索而不是常规筛选（不依赖showSearchResults状态）
    if (effectiveSearchKeyword?.trim()) {
      console.log('🔄 检测到搜索状态，批次变更时重新执行学校搜索')
      
      const searchParams: any = {
        school_name: effectiveSearchKeyword.trim()
      }
      
      // 添加单位ID参数
      if (params.unitId) {
        searchParams.unit_id = params.unitId
      }
      
      // 添加批次参数
      if (params.batch) {
        searchParams.batch_type = params.batch
      }
      
      // 添加快捷筛选参数
      if (params.quickFilter) {
        searchParams.quick_filter = params.quickFilter
      }
      
      await handleSchoolSearch(searchParams)
      return // 执行学校搜索后直接返回，不执行后续的常规筛选逻辑
    }
  }
  
  // 只要有单位ID、快捷筛选，或者批次发生了变化（包括清空），就发送筛选请求
  if (params.unitId || params.quickFilter || params.batch !== undefined) {
    try {
      analyticsLoading.value = true
      
      // 构建API参数
      const apiParams: any = {
        sort_by: params.sortBy || 'admission_count', // 添加排序参数
        page: params.page || 1,
        limit: params.limit || 50 // 修改为50，与前端分页配置保持一致
      }
      
      // 如果有单位ID，添加到参数中
      if (params.unitId) {
        apiParams.unit_id = params.unitId
      }
      
      // 如果有批次，优先使用batch_code格式
      if (params.batch) {
        // 导入批次映射配置
        const { batchTypeMapping } = await import('@/api/recruitment')
        const batchCode = batchTypeMapping[params.batch as keyof typeof batchTypeMapping]
        
        if (batchCode) {
          apiParams.batch_code = batchCode
        } else {
          // 向后兼容：如果没有找到对应的batch_code，使用原始的batch_type
          apiParams.batch_type = params.batch
        }
        
        console.log('🔄 批次参数转换:', {
          original: params.batch,
          batchCode: batchCode || 'not_found',
          finalParams: batchCode ? { batch_code: batchCode } : { batch_type: params.batch }
        })
      }
      
      // 如果有排序顺序，添加到参数中
      if (params.sortOrder) {
        apiParams.sort_order = params.sortOrder === 'ascend' ? 'asc' : 'desc'
      }
      
      // 如果有快捷筛选，添加到参数中
      if (params.quickFilter) {
        apiParams.quick_filter = params.quickFilter
      }
      
      // 调用统一API获取特定批次的学校录取统计
      const { getSchoolsUnified } = await import('@/api/recruitment')
      const data = await getSchoolsUnified(apiParams)
      
      analyticsData.value = data
      console.log('✅ 批次数据加载成功:', data)
    } catch (error) {
      console.error('❌ 批次数据加载失败:', error)
      message.error('加载批次数据失败，请重试')
    } finally {
      analyticsLoading.value = false
    }
  }
}



// 监听整体政策加载状态
const policyLoading = computed(() => {
  return Object.values(policyLoadingStates).some(loading => loading)
})

// 监听单位选择变化，更新analytics数据
watch(
  () => selectedUnitId.value,
  async (newUnitId) => {
    if (newUnitId) {
      // 延迟请求，等待筛选状态恢复完成，然后通过batch-change事件发送带有完整条件的请求
      setTimeout(async () => {
        console.log('🔄 单位选择后，延迟发送带有完整筛选条件的请求')
        
        const analyticsRef = analyticsComponentRef.value
        const policyQueryRef = policyQueryPanelRef.value
        if (analyticsRef) {
          // 获取当前的筛选状态
          const currentBatch = analyticsRef.selectedBatch?.value
          const currentQuickFilter = analyticsRef.quickFilterType?.value
          const currentSortBy = analyticsRef.selectedSortBy?.value
          const currentSortOrder = analyticsRef.selectedSortOrder?.value
          const currentSearchKeyword = analyticsRef.searchKeyword?.value
          const isShowingSearchResults = analyticsRef.showSearchResults?.value
          // 获取PolicyQueryPanel中的搜索关键词
          const policySearchKeyword = policyQueryRef?.searchKeyword?.value || policyQueryRef?.getSearchKeyword?.()
          // 确定有效的搜索关键词
          const effectiveSearchKeyword = policySearchKeyword || currentSearchKeyword
          
          console.log('🔍 单位选择后当前筛选状态:', {
            batch: currentBatch,
            quickFilter: currentQuickFilter,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
            analyticsSearchKeyword: currentSearchKeyword,
            policySearchKeyword: policySearchKeyword,
            effectiveSearchKeyword: effectiveSearchKeyword,
            showSearchResults: isShowingSearchResults,
            hasEffectiveSearchKeyword: !!effectiveSearchKeyword?.trim()
          })
          
          // 如果有搜索关键词，重新执行学校搜索（不依赖showSearchResults状态）
          if (effectiveSearchKeyword?.trim()) {
            console.log('🔄 检测到搜索状态，重新执行学校搜索，包含新的单位ID')
            
            const searchParams: any = {
              school_name: effectiveSearchKeyword.trim(),
              unit_id: newUnitId
            }
            
            // 添加批次参数
            if (currentBatch) {
              searchParams.batch_type = currentBatch
            }
            
            // 添加快捷筛选参数
            if (currentQuickFilter) {
              searchParams.quick_filter = currentQuickFilter
            }
            
            await handleSchoolSearch(searchParams)
          } else {
            // 如果没有快捷筛选，根据单位信息自动推断
            let inferredQuickFilter = currentQuickFilter
            if (!inferredQuickFilter && selectedUnitInfo.value?.org_type) {
              const orgType = selectedUnitInfo.value.org_type
              if (orgType === '国网省公司' || orgType === '国网直属单位') {
                inferredQuickFilter = 'guowang'
                console.log('🔄 自动推断快捷筛选: guowang')
              } else if (orgType === '南网省公司' || orgType === '南网直属单位') {
                inferredQuickFilter = 'nanwang'
                console.log('🔄 自动推断快捷筛选: nanwang')
              }
            }
            
            // 通过handleBatchChange发送带有完整条件的请求
            await handleBatchChange({
              unitId: newUnitId,
              batch: currentBatch,
              quickFilter: inferredQuickFilter,
              sortBy: currentSortBy,
              sortOrder: currentSortOrder,
              page: 1,
              limit: 50
            })
          }
        } else {
          // 如果没有analytics组件引用，发送基本请求
          try {
            analyticsLoading.value = true
            
            const analyticsParams = {
              unit_id: newUnitId,
              page: 1,
              limit: 50
            }
            
            const { getSchoolsUnified } = await import('@/api/recruitment')
            const data = await getSchoolsUnified(analyticsParams)
            analyticsData.value = data
            
            console.log('✅ Analytics基本数据加载成功:', data)
          } catch (error) {
            console.error('❌ Analytics数据加载失败:', error)
            message.error('加载数据分析失败，请重试')
          } finally {
            analyticsLoading.value = false
          }
        }
      }, 300) // 增加延迟时间，确保DataAnalytics组件的快捷筛选状态设置完成
    } else {
      analyticsData.value = null
    }
  },
  { immediate: false }
)

// 快捷查询相关事件处理函数
const handleCloseQuickQuery = () => {
  showQuickQueryResults.value = false
  quickQueryResultData.value = []
  console.log('🚫 关闭快捷查询结果')
}

const handleRefreshQuickQuery = async (queryType: string) => {
  console.log('🔄 刷新快捷查询:', queryType)
  await handleQuickQuery(queryType as 'undergraduate' | 'graduate' | 'admission_count')
}

const handleQuickQueryDataUpdated = (data: any[]) => {
  quickQueryResultData.value = data
  console.log('📝 快捷查询数据已更新:', data)
}


</script>

<style scoped lang="less">
@import './styles/responsive.less';

.data-query-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  min-width: 0; // 防止flex子元素溢出
  overflow-x: hidden; // 防止水平滚动

  @media (max-width: 768px) {
    padding: 6px;
    gap: 4px;
  }
}

// 页面工具栏
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  margin-bottom: 8px;

  .toolbar-title {
    h2 {
      margin: 0;
      color: #1890ff;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    
    .toolbar-title h2 {
      font-size: 16px;
    }
  }
}

// 主内容区域
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  min-width: 0; // 防止flex子元素溢出
  box-sizing: border-box;
  gap: 16px;
  
  // 移动端不受侧边栏影响
  @media (max-width: 768px) {
    margin-left: 0 !important;
    width: 100% !important;
  }
}

// 上半部分：双栏布局区域
.top-section {
  width: 100%;
  min-width: 0;
}

// 5:5两栏布局
.two-column-layout {
  display: grid;
  gap: 12px;
  width: 100%;
  min-width: 0;
  align-items: start;
  
  &.desktop-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); // 5:5布局
    
    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }
  
  &.tablet-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  
  &.mobile-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
  }
}


// 下半部分：地市县概览全宽布局
.bottom-section {
  width: 100%;
  margin-top: 16px;
  
  .regional-overview-full-width {
    width: 100%;
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }
}

// 左栏：网申查询和数据概览
.left-column.query-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
  height: fit-content;
  
  .data-overview-container {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    min-width: 0;
    overflow: hidden;
  }
}

// 右栏：省份信息
.right-column.policy-details-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  height: fit-content;
  
  // 确保省份信息组件填满容器
  :deep(.province-info) {
    height: 100%;
    min-height: 600px; // 增加30%：600px * 1.3 = 780px
    display: flex;
    flex-direction: column;
  }
}


// 响应式优化
@media (max-width: 768px) {
  .two-column-layout.mobile-layout {
    .left-column {
      order: 1;
    }

    .right-column {
      order: 2;
      margin-top: 8px;
    }
  }
  
  .data-query-page {
    padding: 6px;
  }
}

// 中等屏幕优化
@media (max-width: 1200px) and (min-width: 769px) {
  .two-column-layout.desktop-layout {
    gap: 6px;
    
    .left-column,
    .right-column {
      :deep(.ant-table-wrapper) {
        .ant-table {
          font-size: 12px;
          
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 8px 12px;
          }
        }
      }
    }
  }
}

// 移动端优化 - 只对真正的移动设备应用单列布局
@media (max-width: 768px) {
  .two-column-layout {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto auto;
    gap: 12px;
    
    .left-column {
      order: 1;
    }
    
    .right-column {
      order: 2;
    }
  }
}
</style>