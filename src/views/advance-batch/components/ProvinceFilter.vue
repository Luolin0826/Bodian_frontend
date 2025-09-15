<template>
  <div class="province-filter">
    <div class="filter-header">
      <FilterOutlined />
      <span>提前批信息专栏</span>
    </div>
    
    <div class="filter-content">
      <div class="filter-item">
        <span class="filter-label">选择省份:</span>
        <a-select
          v-model:value="selectedProvince"
          placeholder="全部省份"
          style="width: 200px"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handleProvinceChange"
        >
          <a-select-option value="">全部省份</a-select-option>
          <a-select-option
            v-for="province in provinces"
            :key="province.value"
            :value="province.value"
          >
            {{ province.label }}
          </a-select-option>
        </a-select>
      </div>
      
      <div class="filter-actions">
        <a-button 
          v-if="selectedProvince" 
          size="small" 
          @click="clearFilter"
        >
          <ClearOutlined />
          清空筛选
        </a-button>
        
        <div class="filter-result" v-if="selectedProvince">
          已筛选: <a-tag color="blue">{{ selectedProvince }}</a-tag>
        </div>
        
        <!-- 管理操作按钮 -->
        <div v-if="canManage" class="management-buttons">
          <a-button type="primary" @click="handleManageFeedback" class="manage-btn">
            <MessageOutlined />
            反馈管理
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FilterOutlined, ClearOutlined, MessageOutlined } from '@ant-design/icons-vue'

interface ProvinceOption {
  label: string
  value: string
}

interface Props {
  provinces: ProvinceOption[]
  selected: string
  canManage: boolean
}

interface Emits {
  (e: 'change', province: string): void
  (e: 'manage-feedback'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedProvince = ref(props.selected)

// 监听外部传入的选中值变化
watch(() => props.selected, (newVal) => {
  selectedProvince.value = newVal
})

// 省份选择变化处理
const handleProvinceChange = (value: string) => {
  selectedProvince.value = value
  emit('change', value || '')
}

// 清空筛选
const clearFilter = () => {
  selectedProvince.value = ''
  emit('change', '')
}

// 搜索过滤选项
const filterOption = (input: string, option: any) => {
  return option.children.toLowerCase().includes(input.toLowerCase())
}

// 管理操作处理
const handleManageFeedback = () => {
  emit('manage-feedback')
}
</script>

<style lang="less" scoped>
.province-filter {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;

  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
  }

  .filter-content {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;

    .filter-item {
      display: flex;
      align-items: center;
      gap: 12px;

      .filter-label {
        font-weight: 500;
        color: #666;
        white-space: nowrap;
      }
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .filter-result {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #666;
      }

      .management-buttons {
        display: flex;
        gap: 8px;
        margin-left: auto;

        .ant-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .manage-btn {
          flex-shrink: 0;
        }
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;

      .filter-item {
        justify-content: space-between;

        .ant-select {
          width: auto !important;
          flex: 1;
          min-width: 150px;
        }
      }

      .filter-actions {
        justify-content: space-between;
      }
    }
  }
}

// 响应式调整
@media (max-width: 576px) {
  .province-filter {
    .filter-content {
      padding: 12px 16px;

      .filter-item {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;

        .filter-label {
          font-size: 14px;
        }

        .ant-select {
          width: 100% !important;
        }
      }

      .filter-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;

        .filter-result {
          justify-content: center;
        }
      }
    }
  }
}
</style>