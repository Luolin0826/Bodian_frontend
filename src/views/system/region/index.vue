<template>
  <div class="system-region-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <global-outlined class="title-icon" />
            区域管理
          </h1>
          <p class="page-description">管理系统中的省市县三级行政区划</p>
        </div>
        <div class="header-right">
          <a-space>
            <a-button type="primary" @click="handleAdd">
              <plus-outlined />
              新增区域
            </a-button>
            <a-button @click="handleRefresh" :loading="refreshLoading">
              <reload-outlined />
              刷新
            </a-button>
            <a-dropdown>
              <a-button>
                <more-outlined />
                更多操作
              </a-button>
              <template #overlay>
                <a-menu @click="handleMoreAction">
                  <a-menu-item key="import">
                    <import-outlined />
                    批量导入
                  </a-menu-item>
                  <a-menu-item key="export">
                    <export-outlined />
                    导出数据
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="stats">
                    <bar-chart-outlined />
                    统计报表
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <a-row :gutter="16">
        <a-col :xs="24" :sm="12" :md="6">
          <a-card size="small" class="stat-card">
            <a-statistic
              title="省份数量"
              :value="stats.provinces"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <global-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-card size="small" class="stat-card">
            <a-statistic
              title="城市数量"
              :value="stats.cities"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <cluster-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-card size="small" class="stat-card">
            <a-statistic
              title="区县数量"
              :value="stats.companies"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <bank-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <a-card size="small" class="stat-card">
            <a-statistic
              title="已配置政策"
              :value="stats.configured"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <file-text-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-card size="small" title="筛选条件">
        <a-form layout="inline" :model="filterForm" @finish="handleFilter">
          <a-form-item label="区域层级" name="region_level">
            <a-select
              v-model:value="filterForm.region_level"
              placeholder="请选择层级"
              allow-clear
              style="width: 120px"
              @change="handleFilterChange"
            >
              <a-select-option value="province">省级</a-select-option>
              <a-select-option value="city">市级</a-select-option>
              <a-select-option value="company">区县级</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="区域名称" name="region_name">
            <a-input
              v-model:value="filterForm.region_name"
              placeholder="请输入区域名称"
              allow-clear
              style="width: 200px"
              @change="handleFilterChange"
            />
          </a-form-item>
          
          <a-form-item label="政策状态" name="has_policy">
            <a-select
              v-model:value="filterForm.has_policy"
              placeholder="政策状态"
              allow-clear
              style="width: 120px"
              @change="handleFilterChange"
            >
              <a-select-option :value="true">已配置</a-select-option>
              <a-select-option :value="false">未配置</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item>
            <a-space>
              <a-button type="primary" html-type="submit">
                <search-outlined />
                查询
              </a-button>
              <a-button @click="handleResetFilter">
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>
    </div>

    <!-- 区域管理主体内容 -->
    <div class="main-content">
      <RegionManager
        ref="regionManagerRef"
        :filters="appliedFilters"
        @region-selected="handleRegionSelected"
        @stats-updated="handleStatsUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import RegionManager from '@/views/data-query/components/RegionManager.vue'
import { policyManagementAPI } from '@/api/policies'
import {
  GlobalOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  ImportOutlined,
  ExportOutlined,
  BarChartOutlined,
  ClusterOutlined,
  BankOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 响应式数据
const regionManagerRef = ref()
const refreshLoading = ref(false)

// 统计数据
const stats = reactive({
  provinces: 0,
  cities: 0,
  companies: 0,
  configured: 0
})

// 筛选表单
const filterForm = reactive({
  region_level: undefined,
  region_name: '',
  has_policy: undefined
})

// 应用的筛选条件
const appliedFilters = ref({ ...filterForm })

// 方法
const loadStats = async () => {
  try {
    const response = await policyManagementAPI.getRegionStats()
    const statsData = response.data || response
    
    // 根据后端返回的数据结构转换为前端需要的格式
    const transformedStats = {
      provinces: statsData.region_stats?.find(s => s.region_level === 'province')?.count || statsData.summary?.total_provinces || 0,
      cities: statsData.region_stats?.find(s => s.region_level === 'city')?.count || statsData.summary?.total_cities || 0,
      companies: statsData.region_stats?.find(s => s.region_level === 'company')?.count || statsData.summary?.total_companies || 0,
      configured: (statsData.summary?.total_province_policies || 0) + (statsData.summary?.total_company_policies || 0)
    }
    
    Object.assign(stats, transformedStats)
    console.log('✅ 统计数据加载完成:', transformedStats)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleAdd = () => {
  // 委托给RegionManager组件处理
  if (regionManagerRef.value) {
    regionManagerRef.value.handleAdd()
  }
}

const handleRefresh = async () => {
  try {
    refreshLoading.value = true
    
    // 刷新统计数据
    await loadStats()
    
    // 刷新表格数据
    if (regionManagerRef.value) {
      await regionManagerRef.value.loadRegionList()
    }
    
    message.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    message.error('刷新失败')
  } finally {
    refreshLoading.value = false
  }
}

const handleMoreAction = ({ key }: { key: string }) => {
  switch (key) {
    case 'import':
      message.info('批量导入功能开发中...')
      break
    case 'export':
      handleExport()
      break
    case 'stats':
      message.info('统计报表功能开发中...')
      break
  }
}

const handleExport = async () => {
  try {
    message.loading('正在导出数据...', 2)
    // 这里可以调用导出API
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟导出
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  }
}

const handleFilterChange = () => {
  // 实时筛选，可以加个防抖
  nextTick(() => {
    handleFilter()
  })
}

const handleFilter = () => {
  // 应用筛选条件
  appliedFilters.value = { ...filterForm }
  console.log('🔍 应用筛选条件:', appliedFilters.value)
}

const handleResetFilter = () => {
  // 重置筛选条件
  Object.assign(filterForm, {
    region_level: undefined,
    region_name: '',
    has_policy: undefined
  })
  appliedFilters.value = { ...filterForm }
  console.log('🔍 重置筛选条件:', appliedFilters.value)
}

const handleRegionSelected = (region: any) => {
  // 当在区域管理器中选中区域时，可以跳转到政策管理页面
  console.log('选中区域:', region)
  
  // 可选择跳转到政策编辑页面
  const regionName = region.region_name || region.province || region.city || region.company || '未知区域'
  const shouldNavigate = confirm(`是否跳转到 "${regionName}" 的政策管理页面？`)
  if (shouldNavigate) {
    router.push({
      name: 'PolicyManagement',
      query: { regionId: region.region_id }
    })
  }
}

const handleStatsUpdated = (newStats: any) => {
  // 如果从RegionManager传来的统计数据也需要转换格式
  if (newStats && typeof newStats === 'object') {
    const transformedStats = {
      provinces: newStats.region_stats?.find((s: any) => s.region_level === 'province')?.count || newStats.provinces || stats.provinces,
      cities: newStats.region_stats?.find((s: any) => s.region_level === 'city')?.count || newStats.cities || stats.cities,
      companies: newStats.region_stats?.find((s: any) => s.region_level === 'company')?.count || newStats.companies || stats.companies,
      configured: ((newStats.summary?.total_province_policies || 0) + (newStats.summary?.total_company_policies || 0)) || newStats.configured || stats.configured
    }
    Object.assign(stats, transformedStats)
  }
}

// 生命周期
onMounted(() => {
  loadStats()
})
</script>

<style scoped lang="less">
.system-region-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  
  .page-header {
    background: white;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        .page-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 12px;
          
          .title-icon {
            color: #1890ff;
            font-size: 28px;
          }
        }
        
        .page-description {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }
    }
  }
  
  .stats-section {
    margin-bottom: 16px;
    
    .stat-card {
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
    }
  }
  
  .filter-section {
    margin-bottom: 16px;
    
    .ant-card {
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      
      :deep(.ant-card-head) {
        border-bottom: 1px solid #f0f0f0;
        padding: 0 16px;
        
        .ant-card-head-title {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          padding: 12px 0;
        }
      }
      
      :deep(.ant-card-body) {
        padding: 16px;
      }
    }
    
    .ant-form {
      :deep(.ant-form-item) {
        margin-bottom: 8px;
      }
    }
  }
  
  .main-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
    
    :deep(.region-manager) {
      height: auto;
      
      .manager-toolbar {
        display: none; // 隐藏RegionManager自己的工具栏，使用页面级工具栏
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .system-region-page {
    padding: 16px;
    
    .page-header {
      padding: 16px;
      
      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
        
        .header-left {
          .page-title {
            font-size: 20px;
          }
        }
        
        .header-right {
          :deep(.ant-space) {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }
    
    .filter-section {
      .ant-form {
        :deep(.ant-form-item) {
          width: 100%;
          margin-bottom: 12px;
          
          .ant-form-item-control {
            width: 100%;
            
            .ant-form-item-control-input {
              width: 100%;
              
              input, .ant-select {
                width: 100% !important;
              }
            }
          }
        }
      }
    }
  }
}
</style>