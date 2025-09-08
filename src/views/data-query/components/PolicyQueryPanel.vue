<template>
  <div class="policy-query-panel">
    <!-- 筛选器标题 -->
    <div class="panel-header">
      <h3 class="panel-title">
        <filter-outlined class="title-icon" />
        网申政策查询
      </h3>
      <a-button
        v-if="selectedUnitId"
        type="text"
        size="small"
        @click="handleReset"
        class="reset-btn"
      >
        <reload-outlined />
        重置
      </a-button>
    </div>

    <!-- 4个互斥筛选器 -->
    <div class="filter-section">
      <div class="filter-grid">
        <!-- 国网省公司 -->
        <div class="filter-item">
          <label class="filter-label" for="gw-province-select">
            国网省公司
            <span v-if="filterOptions.categories.gw_provinces_count" class="count-badge">
              {{ filterOptions.categories.gw_provinces_count }}
            </span>
          </label>
          <a-select
            id="gw-province-select"
            v-model:value="selectedFilters.gw_province"
            placeholder="选择省份"
            :options="filterOptions.gw_provinces"
            :field-names="{ label: 'unit_name', value: 'unit_id' }"
            allow-clear
            show-search
            :filter-option="filterOption"
            @change="(value: any) => handleFilterChange('gw_province', value)"
            class="filter-select"
            :loading="optionsLoading"
          />
        </div>

        <!-- 国网直属单位 -->
        <div class="filter-item">
          <label class="filter-label" for="gw-direct-select">
            国网直属单位
            <span v-if="filterOptions.categories.gw_direct_units_count" class="count-badge">
              {{ filterOptions.categories.gw_direct_units_count }}
            </span>
          </label>
          <a-select
            id="gw-direct-select"
            v-model:value="selectedFilters.gw_direct"
            placeholder="选择直属单位"
            :options="filterOptions.gw_direct_units"
            :field-names="{ label: 'unit_name', value: 'unit_id' }"
            allow-clear
            show-search
            :filter-option="filterOption"
            @change="(value: any) => handleFilterChange('gw_direct', value)"
            class="filter-select"
            :loading="optionsLoading"
          />
        </div>

        <!-- 南网省公司 -->
        <div class="filter-item">
          <label class="filter-label" for="nw-province-select">
            南网省公司
            <span v-if="filterOptions.categories.nw_provinces_count" class="count-badge">
              {{ filterOptions.categories.nw_provinces_count }}
            </span>
          </label>
          <a-select
            id="nw-province-select"
            v-model:value="selectedFilters.nw_province"
            placeholder="选择省份"
            :options="filterOptions.nw_provinces"
            :field-names="{ label: 'unit_name', value: 'unit_id' }"
            allow-clear
            show-search
            :filter-option="filterOption"
            @change="(value: any) => handleFilterChange('nw_province', value)"
            class="filter-select"
            :loading="optionsLoading"
          />
        </div>

        <!-- 南网直属单位 -->
        <div class="filter-item">
          <label class="filter-label" for="nw-direct-select">
            南网直属单位
            <span v-if="filterOptions.categories.nw_direct_units_count" class="count-badge">
              {{ filterOptions.categories.nw_direct_units_count }}
            </span>
          </label>
          <a-select
            id="nw-direct-select"
            v-model:value="selectedFilters.nw_direct"
            placeholder="选择直属单位"
            :options="filterOptions.nw_direct_units"
            :field-names="{ label: 'unit_name', value: 'unit_id' }"
            allow-clear
            show-search
            :filter-option="filterOption"
            @change="(value: any) => handleFilterChange('nw_direct', value)"
            class="filter-select"
            :loading="optionsLoading"
          />
        </div>
      </div>
    </div>


    <!-- 选择提示 -->
    <div v-if="!selectedUnitInfo" class="selection-hint">
      <div class="hint-content">
        <search-outlined class="hint-icon" />
        <p class="hint-text">请从上方4个选项中选择一个单位，查看对应的网申政策信息</p>
        <div class="hint-tips">
          <p>💡 国网省公司：各省电力公司</p>
          <p>🏢 国网直属单位：总部直属机构</p>
          <p>🌐 南网省公司：南方电网各省公司</p>
          <p>⚡ 南网直属单位：南网直属机构</p>
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
  SearchOutlined
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
}

const props = withDefaults(defineProps<Props>(), {
  selectedUnitId: null,
  selectedUnitInfo: null,
  loading: false
})

// Emits
const emit = defineEmits<{
  'unit-selected': [unitId: number, unitInfo: UnitOption]
  'unit-cleared': []
}>()

// 响应式数据
const optionsLoading = ref(false)
const filterOptions = reactive({
  gw_provinces: [] as UnitOption[],
  gw_direct_units: [] as UnitOption[],
  nw_provinces: [] as UnitOption[],
  nw_direct_units: [] as UnitOption[],
  total_units: 0,
  categories: {
    gw_provinces_count: 0,
    gw_direct_units_count: 0,
    nw_provinces_count: 0,
    nw_direct_units_count: 0
  }
})

const selectedFilters = reactive({
  gw_province: null as number | null,
  gw_direct: null as number | null,
  nw_province: null as number | null,
  nw_direct: null as number | null
})

// 计算属性
const selectedUnitId = computed(() => {
  return selectedFilters.gw_province ||
         selectedFilters.gw_direct ||
         selectedFilters.nw_province ||
         selectedFilters.nw_direct
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
    
    switch (filterType) {
      case 'gw_province':
        selectedUnit = filterOptions.gw_provinces.find(unit => unit.unit_id === unitId) || null
        break
      case 'gw_direct':
        selectedUnit = filterOptions.gw_direct_units.find(unit => unit.unit_id === unitId) || null
        break
      case 'nw_province':
        selectedUnit = filterOptions.nw_provinces.find(unit => unit.unit_id === unitId) || null
        break
      case 'nw_direct':
        selectedUnit = filterOptions.nw_direct_units.find(unit => unit.unit_id === unitId) || null
        break
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
  Object.keys(selectedFilters).forEach(key => {
    selectedFilters[key as keyof typeof selectedFilters] = null
  })
  emit('unit-cleared')
}

const loadFilterOptions = async () => {
  try {
    optionsLoading.value = true
    const options = await getFilterOptions()
    
    // 更新筛选选项
    Object.assign(filterOptions, options)
    
    console.log('✅ 筛选选项加载成功:', options)
    console.log(`📊 筛选统计: 共${options.total_units}个单位 | 国网省公司:${options.categories.gw_provinces_count} | 国网直属:${options.categories.gw_direct_units_count} | 南网省公司:${options.categories.nw_provinces_count} | 南网直属:${options.categories.nw_direct_units_count}`)
  } catch (error) {
    console.error('❌ 加载筛选选项失败:', error)
    message.error('加载筛选选项失败，请刷新重试')
    
    // 提供默认的空选项
    filterOptions.gw_provinces = []
    filterOptions.gw_direct_units = []
    filterOptions.nw_provinces = []
    filterOptions.nw_direct_units = []
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
  
  if (filterOptions.gw_provinces.some(unit => unit.unit_id === newUnitId)) {
    foundFilterType = 'gw_province'
  } else if (filterOptions.gw_direct_units.some(unit => unit.unit_id === newUnitId)) {
    foundFilterType = 'gw_direct'
  } else if (filterOptions.nw_provinces.some(unit => unit.unit_id === newUnitId)) {
    foundFilterType = 'nw_province'
  } else if (filterOptions.nw_direct_units.some(unit => unit.unit_id === newUnitId)) {
    foundFilterType = 'nw_direct'
  }
  
  if (foundFilterType) {
    // 清空其他筛选器，设置当前筛选器
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key as keyof typeof selectedFilters] = 
        key === foundFilterType ? newUnitId : null
    })
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  loadFilterOptions()
})
</script>

<style scoped lang="less">
.policy-query-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

// 面板头部
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;

    .title-icon {
      color: #1890ff;
      font-size: 16px;
    }
  }

  .reset-btn {
    color: #666;
    
    &:hover {
      color: #1890ff;
    }
  }
}

// 筛选器区域
.filter-section {
  .filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    
    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .filter-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      display: flex;
      align-items: center;
      gap: 6px;
      
      .count-badge {
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        color: #52c41a;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
      }
    }

    .filter-select {
      width: 100%;
      
      :deep(.ant-select-selector) {
        min-height: 36px;
        border-radius: 6px;
        
        &:hover {
          border-color: #1890ff;
        }
      }
      
      &.ant-select-focused :deep(.ant-select-selector) {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }
  }
}


// 选择提示
.selection-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  min-height: 200px;
  
  .hint-content {
    text-align: center;
    max-width: 300px;
    
    .hint-icon {
      font-size: 48px;
      color: #d9d9d9;
      margin-bottom: 16px;
    }
    
    .hint-text {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    .hint-tips {
      text-align: left;
      background: #fafafa;
      border-radius: 6px;
      padding: 12px;
      
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

// 响应式适配
@media (max-width: 768px) {
  .policy-query-panel {
    padding: 16px;
  }
  
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    .panel-title {
      font-size: 14px;
    }
  }
  
  .filter-section .filter-grid {
    gap: 12px;
    
    .filter-item {
      gap: 6px;
      
      .filter-label {
        font-size: 13px;
      }
    }
  }
  
  
  .selection-hint .hint-content {
    .hint-icon {
      font-size: 36px;
    }
    
    .hint-text {
      font-size: 13px;
    }
    
    .hint-tips {
      padding: 8px;
      
      p {
        font-size: 11px;
      }
    }
  }
}
</style>