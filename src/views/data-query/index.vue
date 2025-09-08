<template>
  <div class="data-query-page data-query-responsive">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 上半部分：双栏布局 -->
      <div class="top-section">
        <div class="two-column-layout" :class="layoutClass">
          
          <!-- 左栏：网申政策栏 -->
          <div class="left-column policy-column responsive-card">
            <!-- 筛选器面板 -->
            <PolicyQueryPanel
              :selected-unit-id="selectedUnitId"
              :selected-unit-info="selectedUnitInfo"
              :loading="policyLoading"
              @unit-selected="handleUnitSelected"
              @unit-cleared="handleUnitCleared"
            />

            <!-- 政策详情展示区域 -->
            <div class="policy-details-container">
              <!-- 基本信息板块 -->
              <UnitPolicyDisplay
                :unit-id="selectedUnitId"
                :unit-info="selectedUnitInfo"
                :show-empty-state="!selectedUnitId"
                @policy-loaded="handlePolicyLoaded"
                @loading-change="handlePolicyLoadingChange"
              />

              <!-- 提前批和农网板块 - 一行两列布局，自动展开 -->
              <div class="special-sections-row">
                <div class="batch-section">
                  <EarlyBatchInfo
                    :unit-id="selectedUnitId"
                    :unit-info="selectedUnitInfo"
                    :default-expanded="true"
                    :show-empty-state="!selectedUnitId"
                    @data-loaded="handleEarlyBatchDataLoaded"
                    @loading-change="handleEarlyBatchLoadingChange"
                    @expanded-change="handleEarlyBatchExpandedChange"
                  />
                </div>

                <div class="rural-section">
                  <RuralGridInfo
                    :unit-id="selectedUnitId"
                    :unit-info="selectedUnitInfo"
                    :default-expanded="true"
                    :show-empty-state="!selectedUnitId"
                    @data-loaded="handleRuralGridDataLoaded"
                    @loading-change="handleRuralGridLoadingChange"
                    @expanded-change="handleRuralGridExpandedChange"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 右栏：学校录取情况 -->
          <div class="right-column analytics-column responsive-card">
            <DataAnalytics
              ref="analyticsComponentRef"
              :data="analyticsData"
              :loading="analyticsLoading"
              :unit-id="selectedUnitId"
              :unit-info="selectedUnitInfo"
              :show-empty-state="!selectedUnitId"
              @drill-down="handleDrillDown"
              @school-detail="handleSchoolDetail"
              @data-refresh="handleAnalyticsRefresh"
              @batch-change="handleBatchChange"
              @school-search="handleSchoolSearch"
            />
          </div>
          
        </div>
      </div>

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
import { useResponsive } from '@/composables/useResponsive'
import { useLayoutStore } from '@/stores/layout'

// 导入新的组件
import PolicyQueryPanel from './components/PolicyQueryPanel.vue'
import UnitPolicyDisplay from './components/UnitPolicyDisplay.vue'
import RegionalOverview from './components/RegionalOverview.vue'
import EarlyBatchInfo from './components/EarlyBatchInfo.vue'
import RuralGridInfo from './components/RuralGridInfo.vue'
import DataAnalytics from './components/DataAnalytics.vue'

// 导入API接口
import { recruitmentAPI } from '@/api/recruitment'
import type {
  UnitPolicyResponse,
  RegionalOverviewResponse,
  EarlyBatchResponse,
  RuralGridResponse
} from '@/api/policies'

// 导入响应式样式
import './styles/responsive.less'

// 响应式工具
const { isMobile, isTablet, width } = useResponsive()

// 主要状态数据
const selectedUnitId = ref<number | null>(null)
const selectedUnitInfo = ref<any>(null)
const analyticsLoading = ref(false)
const analyticsData = ref<any>(null)

// 组件引用
const analyticsComponentRef = ref<any>(null)

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
const handleUnitSelected = (unitId: number, unitInfo: any) => {
  selectedUnitId.value = unitId
  selectedUnitInfo.value = unitInfo
  console.log('✅ 选择单位:', { unitId, unitInfo })
  
  // 清空之前的analytics数据，等待新的数据加载
  analyticsData.value = null
}

const handleUnitCleared = () => {
  selectedUnitId.value = null
  selectedUnitInfo.value = null
  analyticsData.value = null
  console.log('🧹 清空单位选择')
}

// 政策数据加载事件处理
const handlePolicyLoaded = (data: UnitPolicyResponse['data']) => {
  console.log('📋 政策信息加载完成:', data)
}

const handlePolicyLoadingChange = (loading: boolean) => {
  policyLoadingStates.unit = loading
}

const handleRegionalDataLoaded = (data: RegionalOverviewResponse['data']) => {
  console.log('🌍 地市县数据加载完成:', data)
}

const handleRegionalLoadingChange = (loading: boolean) => {
  policyLoadingStates.regional = loading
}

const handleEarlyBatchDataLoaded = (data: EarlyBatchResponse['data']) => {
  console.log('🕐 提前批数据加载完成:', data)
}

const handleEarlyBatchLoadingChange = (loading: boolean) => {
  policyLoadingStates.earlyBatch = loading
}

const handleEarlyBatchExpandedChange = (expanded: boolean) => {
  console.log('🕐 提前批展开状态:', expanded)
}

const handleRuralGridDataLoaded = (data: RuralGridResponse['data']) => {
  console.log('⚡ 农网数据加载完成:', data)
}

const handleRuralGridLoadingChange = (loading: boolean) => {
  policyLoadingStates.ruralGrid = loading
}

const handleRuralGridExpandedChange = (expanded: boolean) => {
  console.log('⚡ 农网展开状态:', expanded)
}

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

// 学校搜索事件处理
const handleSchoolSearch = async (searchParams: { unit_id: number, batch_type?: string, school_name: string }) => {
  console.log('🔍 执行学校搜索:', searchParams)
  
  try {
    // 调用学校检查API
    const response = await recruitmentAPI.checkSchoolAdmission(searchParams)
    
    console.log('🔍 学校搜索结果:', response)
    
    // 将搜索结果传递给DataAnalytics组件
    const analyticsRef = analyticsComponentRef.value
    if (analyticsRef) {
      analyticsRef.handleSearchResults(response.data.schools)
    }
    
    // 显示搜索结果统计
    if (response.data.schools && response.data.schools.length > 0) {
      message.success(`找到 ${response.data.schools.length} 所匹配的学校`)
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
  }
}


const handleBatchChange = async (params: { unitId: number | null, batch: string | null, sortBy?: string, page?: number, limit?: number, sortOrder?: string }) => {
  console.log('📊 批次变更:', params)
  
  if (params.unitId && params.batch) {
    try {
      analyticsLoading.value = true
      
      // 构建API参数
      const apiParams: any = {
        unit_id: params.unitId,
        batch_type: params.batch, // 注意这里使用batch_type
        sort_by: params.sortBy || 'admission_count', // 添加排序参数
        page: params.page || 1,
        limit: params.limit || 50 // 修改为50，与前端分页配置保持一致
      }
      
      // 如果有排序顺序，添加到参数中
      if (params.sortOrder) {
        apiParams.sort_order = params.sortOrder === 'ascend' ? 'asc' : 'desc'
      }
      
      // 调用后端API获取特定批次的学校录取统计
      const data = await recruitmentAPI.getSchoolsByBatch(apiParams)
      
      analyticsData.value = data
      console.log('✅ 批次数据加载成功:', data)
    } catch (error) {
      console.error('❌ 批次数据加载失败:', error)
      message.error('加载批次数据失败，请重试')
    } finally {
      analyticsLoading.value = false
    }
  } else if (!params.batch) {
    // 如果清空批次选择，使用schools-by-batch获取所有学校数据（支持排序）
    try {
      analyticsLoading.value = true
      
      // 构建API参数 - 不传batch_type获取所有批次数据
      const apiParams: any = {
        unit_id: params.unitId!,
        page: params.page || 1,
        limit: params.limit || 50 // 修改为50，与前端分页配置保持一致
      }
      
      // 如果有排序参数，添加到API调用中
      if (params.sortBy) {
        apiParams.sort_by = params.sortBy
      }
      if (params.sortOrder) {
        apiParams.sort_order = params.sortOrder === 'ascend' ? 'asc' : 'desc'
      }
      
      const data = await recruitmentAPI.getSchoolsByBatch(apiParams)
      analyticsData.value = data
      
      console.log('✅ 重新加载学校数据成功:', data)
    } catch (error) {
      console.error('❌ 重新加载学校数据失败:', error)
      message.error('加载数据失败，请重试')
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
      try {
        analyticsLoading.value = true
        
        // 获取默认的学校录取情况数据 - 使用getSchoolsByBatch获取更多数据
        const analyticsParams = {
          unit_id: newUnitId,
          page: 1,
          limit: 50 // 修改为50，与前端分页配置保持一致
          // 不传batch_type参数，获取所有批次的学校
        }
        
        const data = await recruitmentAPI.getSchoolsByBatch(analyticsParams)
        analyticsData.value = data
        
        console.log('✅ Analytics数据加载成功:', data)
      } catch (error) {
        console.error('❌ Analytics数据加载失败:', error)
        message.error('加载数据分析失败，请重试')
      } finally {
        analyticsLoading.value = false
      }
    } else {
      analyticsData.value = null
    }
  },
  { immediate: false }
)

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

// 新的左右两栏布局
.two-column-layout {
  display: grid;
  gap: 12px;
  width: 100%;
  min-width: 0;
  align-items: start; // 顶部对齐，避免强制等高
  
  &.desktop-layout {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    
    @media (max-width: 1400px) {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    
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

// 左栏：政策栏
.left-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0; // 防止内容溢出
  overflow: hidden;
  height: fit-content; // 自适应内容高度
  
  .policy-details-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    
    .special-sections-row {
      display: grid;
      gap: 8px;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: stretch; // 确保两列高度一致
      
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
      
      .batch-section,
      .rural-section {
        display: flex;
        flex-direction: column;
        min-height: 350px; // 设置最小高度确保一致性
        min-width: 0; // 防止溢出
        
        // 确保子组件填满容器
        :deep(.early-batch-info),
        :deep(.rural-grid-info) {
          height: 100%;
          display: flex;
          flex-direction: column;
          
          .info-section {
            height: 100%;
            display: flex;
            flex-direction: column;
            
            .section-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              
              .batch-info-grid,
              .grid-info-layout {
                flex: 1;
                display: grid;
                align-content: start;
              }
            }
          }
        }
      }
    }
  }
}

// 右栏：分析栏
.right-column {
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  min-width: 0; // 防止内容溢出
  overflow: hidden;
  height: fit-content; // 自适应内容高度
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