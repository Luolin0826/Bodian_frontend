<template>
  <div class="records-list">
    <!-- 表格头部 -->
    <div class="table-header">
      <h4>录取数据详情</h4>
      <div class="table-controls">
        <a-space>
          <!-- 分页信息 -->
          <span class="pagination-info">
            共 {{ total }} 条记录，当前第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
        </a-space>
      </div>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="records"
      :loading="loading"
      :pagination="false"
      size="small"
      :scroll="{ y: 400 }"
      row-key="id"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- 序号 -->
        <template v-if="column.key === 'index'">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </template>

        <!-- 姓名 (脱敏) -->
        <template v-if="column.key === 'name'">
          <span class="name-cell">{{ record.name }}</span>
        </template>

        <!-- 性别 -->
        <template v-if="column.key === 'gender'">
          <a-tag :color="record.gender === '男' ? 'blue' : 'pink'">
            {{ record.gender }}
          </a-tag>
        </template>

        <!-- 学校信息 -->
        <template v-if="column.key === 'university'">
          <div class="university-cell">
            <div class="university-name">{{ record.university?.name }}</div>
            <div class="university-meta">
              <a-tag 
                v-if="record.university?.level" 
                :color="getUniversityLevelColor(record.university.level)"
                size="small"
              >
                {{ record.university.level }}
              </a-tag>
              <a-tag 
                v-if="record.university?.type" 
                color="default"
                size="small"
              >
                {{ record.university.type }}
              </a-tag>
            </div>
          </div>
        </template>

        <!-- 二级单位 -->
        <template v-if="column.key === 'secondary_unit'">
          <div class="unit-cell">
            <div class="unit-name">{{ record.secondary_unit?.name }}</div>
            <div class="unit-region">{{ record.secondary_unit?.region }}</div>
          </div>
        </template>

        <!-- 批次 -->
        <template v-if="column.key === 'batch'">
          <a-tag :color="getBatchColor(record.batch)">
            {{ record.batch }}
          </a-tag>
        </template>

        <!-- 联系方式 (脱敏) -->
        <template v-if="column.key === 'phone'">
          <span class="phone-cell">{{ record.phone }}</span>
        </template>
      </template>
    </a-table>

    <!-- 分页控件 -->
    <div class="pagination-wrapper">
      <a-pagination
        v-model:current="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        :show-quick-jumper="true"
        :show-total="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`"
        size="small"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
interface Props {
  records: any[]
  loading?: boolean
  pagination?: {
    current_page: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
    total: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  records: () => [],
  pagination: () => ({
    current_page: 1,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    total: 0
  })
})

// Emits
const emit = defineEmits(['page-change'])

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(50)

// 计算属性
const total = computed(() => props.pagination?.total || 0)
const totalPages = computed(() => props.pagination?.total_pages || 1)

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center'
  },
  {
    title: '姓名',
    key: 'name',
    width: 80,
    ellipsis: true
  },
  {
    title: '性别',
    key: 'gender',
    width: 60,
    align: 'center'
  },
  {
    title: '学校信息',
    key: 'university',
    width: 200,
    ellipsis: true
  },
  {
    title: '二级单位',
    key: 'secondary_unit',
    width: 120
  },
  {
    title: '批次',
    key: 'batch',
    width: 80,
    align: 'center'
  },
  {
    title: '联系方式',
    key: 'phone',
    width: 120
  }
]

// 工具方法
const getUniversityLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '985工程': 'red',
    '211工程': 'orange',
    '双一流': 'gold',
    '重点大学': 'blue',
    '普通本科': 'green',
    '专科院校': 'cyan',
    '海外高校': 'purple',
    '科研院所': 'magenta',
    '独立学院': 'lime'
  }
  return colorMap[level] || 'default'
}

const getBatchColor = (batch: string) => {
  const colorMap: Record<string, string> = {
    '第一批': 'red',
    '第二批': 'orange',
    '第三批': 'blue'
  }
  return colorMap[batch] || 'default'
}

// 分页处理
const handlePageChange = (page: number, size: number) => {
  currentPage.value = page
  pageSize.value = size
  emit('page-change', page, size)
}

// 监听分页变化
watch(() => props.pagination?.current_page, (newPage) => {
  if (newPage && newPage !== currentPage.value) {
    currentPage.value = newPage
  }
}, { immediate: true })
</script>

<style scoped lang="less">
.records-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .pagination-info {
    font-size: 12px;
    color: #666;
  }
}

// 表格单元格样式
.name-cell {
  font-weight: 500;
  color: #333;
}

.university-cell {
  .university-name {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }

  .university-meta {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
}

.unit-cell {
  .unit-name {
    font-weight: 500;
    color: #333;
    margin-bottom: 2px;
  }

  .unit-region {
    font-size: 11px;
    color: #999;
  }
}

.phone-cell {
  font-family: monospace;
  color: #666;
}

// 分页控件
.pagination-wrapper {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

// 响应式优化
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .university-cell {
    .university-name {
      font-size: 12px;
    }
  }
}
</style>