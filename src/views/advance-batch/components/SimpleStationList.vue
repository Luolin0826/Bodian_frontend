<template>
  <div class="simple-station-list">
    <a-table
      :dataSource="stations"
      :columns="columns"
      :pagination="false"
      size="small"
      :scroll="{ x: 800 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'university_name'">
          <div class="university-cell">
            <span class="university-name">{{ record.university_name }}</span>
            <a-tag 
              v-if="record.university_type" 
              :color="getUniversityTypeColor(record.university_type)"
              size="small"
            >
              {{ record.university_type }}
            </a-tag>
          </div>
        </template>
        
        <template v-if="column.key === 'visit_info'">
          <div class="visit-info">
            <div class="visit-date">{{ formatDate(record.visit_date) }}</div>
            <div v-if="record.visit_time" class="visit-time">{{ record.visit_time.slice(0, 5) }}</div>
          </div>
        </template>
        
        <template v-if="column.key === 'venue'">
          <div class="venue-info">
            <div class="venue-name">{{ record.venue || '待定' }}</div>
            <div v-if="record.address" class="venue-address">{{ record.address }}</div>
          </div>
        </template>
        
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.visit_date)">
            {{ getStatusText(record.visit_date) }}
          </a-tag>
        </template>
        
        <template v-if="column.key === 'registration'">
          <div v-if="record.registration_required">
            <a-button 
              v-if="record.registration_url && !isPastDate(record.visit_date)"
              type="link" 
              size="small"
              @click="openRegistration(record.registration_url)"
            >
              立即报名
            </a-button>
            <span v-else-if="isPastDate(record.visit_date)" class="disabled-text">已结束</span>
            <span v-else class="disabled-text">待开放</span>
          </div>
          <span v-else class="disabled-text">无需报名</span>
        </template>
        
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button 
              type="text" 
              size="small"
              @click="$emit('view-detail', record)"
            >
              查看
            </a-button>
            <a-button 
              type="text" 
              size="small"
              @click="$emit('edit', record)"
            >
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这个站点吗？"
              @confirm="$emit('delete', record)"
            >
              <a-button type="text" size="small" danger>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 空状态 -->
    <a-empty 
      v-if="stations.length === 0"
      description="暂无站点信息"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Empty } from 'ant-design-vue'
import type { StationInfo } from '@/api/types/advance-batch'

interface Props {
  stations: StationInfo[]
  showActions?: boolean
}

interface Emits {
  (e: 'view-detail', station: StationInfo): void
  (e: 'edit', station: StationInfo): void
  (e: 'delete', station: StationInfo): void
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<Emits>()

// 表格列配置
const columns = computed(() => {
  const baseColumns = [
    {
      title: '院校信息',
      key: 'university_name',
      width: 200,
      fixed: 'left'
    },
    {
      title: '访问时间',
      key: 'visit_info',
      width: 120
    },
    {
      title: '地点',
      key: 'venue',
      width: 180
    },
    {
      title: '状态',
      key: 'status',
      width: 80
    },
    {
      title: '报名',
      key: 'registration',
      width: 100
    }
  ]
  
  if (props.showActions) {
    baseColumns.push({
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right'
    } as any)
  }
  
  return baseColumns
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  })
}

// 判断是否为过去的日期
const isPastDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

// 获取状态颜色
const getStatusColor = (dateString: string) => {
  if (isPastDate(dateString)) {
    return 'default'
  }
  
  const date = new Date(dateString)
  const today = new Date()
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 3) return 'error'
  if (diffDays <= 7) return 'warning'
  return 'processing'
}

// 获取状态文本
const getStatusText = (dateString: string) => {
  if (isPastDate(dateString)) {
    return '已结束'
  }
  
  const date = new Date(dateString)
  const today = new Date()
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays <= 3) return '即将开始'
  if (diffDays <= 7) return '本周'
  return '未来'
}

// 获取院校类型颜色
const getUniversityTypeColor = (type: string) => {
  if (type.includes('985')) return 'red'
  if (type.includes('211')) return 'orange'
  if (type.includes('双一流')) return 'blue'
  if (type.includes('重点')) return 'green'
  return 'default'
}

// 打开报名链接
const openRegistration = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style lang="less" scoped>
.simple-station-list {
  .university-cell {
    .university-name {
      display: block;
      font-weight: 500;
      margin-bottom: 4px;
    }
  }

  .visit-info {
    .visit-date {
      font-weight: 500;
      color: #1a1a1a;
    }
    
    .visit-time {
      font-size: 12px;
      color: #666;
    }
  }

  .venue-info {
    .venue-name {
      font-weight: 500;
      margin-bottom: 2px;
    }
    
    .venue-address {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }
  }

  .disabled-text {
    color: #999;
    font-size: 12px;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 12px;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
  }
}

@media (max-width: 768px) {
  .simple-station-list {
    :deep(.ant-table) {
      font-size: 12px;
    }
    
    :deep(.ant-table-tbody > tr > td) {
      padding: 6px 8px;
    }
  }
}
</style>