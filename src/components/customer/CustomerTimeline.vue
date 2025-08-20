<template>
  <div class="customer-timeline">
    <div class="timeline-header">
      <div class="timeline-title">
        <history-outlined class="timeline-icon" />
        <span>跟进时间线</span>
        <a-badge :count="timelineData?.total_items || 0" class="count-badge" />
      </div>
      <a-button @click="refreshTimeline" :loading="loading" size="small">
        <reload-outlined />
        刷新
      </a-button>
    </div>

    <div v-if="loading" class="timeline-loading">
      <a-spin size="large">
        <template #tip>加载时间线数据...</template>
      </a-spin>
    </div>

    <div v-else-if="!timelineData || timelineData.timeline.length === 0" class="timeline-empty">
      <div class="empty-icon">
        <calendar-outlined />
      </div>
      <h3>暂无跟进记录</h3>
      <p>还没有任何跟进活动，开始第一次跟进吧！</p>
      <a-button type="primary" @click="handleCreateFollowUp">
        <plus-outlined />
        创建跟进
      </a-button>
    </div>

    <div v-else class="timeline-content">
      <a-timeline class="follow-up-timeline">
        <a-timeline-item 
          v-for="item in timelineData.timeline" 
          :key="`${item.type}-${item.id}`"
          :color="getTimelineItemColor(item)"
          class="timeline-item"
        >
          <template #dot>
            <div class="timeline-dot" :class="getTimelineItemClass(item)">
              <component :is="getTimelineIcon(item)" />
            </div>
          </template>

          <div class="timeline-item-content">
            <!-- 跟进记录 -->
            <div v-if="item.type === 'follow_up'" class="follow-up-item">
              <div class="item-header">
                <div class="item-title">
                  <span class="follow-up-type">{{ getFollowUpTypeText(item.title.split(' ')[0]) }}</span>
                  <a-tag 
                    v-if="item.result" 
                    :color="getFollowUpResultColor(item.result)" 
                    size="small"
                    class="result-tag"
                  >
                    {{ getFollowUpResultText(item.result) }}
                  </a-tag>
                </div>
                <div class="item-meta">
                  <span class="item-time">{{ formatDateTime(item.date) }}</span>
                  <span v-if="item.creator_name" class="item-creator">{{ item.creator_name }}</span>
                </div>
              </div>
              
              <div class="item-content">
                <p class="follow-up-content">{{ item.content }}</p>
                
                <div v-if="item.status_change" class="status-change">
                  <span class="change-label">状态变更：</span>
                  <a-tag size="small">{{ item.status_change.before }}</a-tag>
                  <arrow-right-outlined class="change-arrow" />
                  <a-tag :color="getStatusColor(item.status_change.after)" size="small">
                    {{ item.status_change.after }}
                  </a-tag>
                </div>
                
                <div v-if="item.next_follow_date" class="next-follow">
                  <calendar-outlined class="next-follow-icon" />
                  <span class="next-follow-text">下次跟进：{{ formatDate(item.next_follow_date) }}</span>
                </div>
              </div>
            </div>

            <!-- 提醒记录 -->
            <div v-else-if="item.type === 'reminder'" class="reminder-item">
              <div class="item-header">
                <div class="item-title">
                  <span class="reminder-title">跟进提醒</span>
                  <a-tag :color="getPriorityColor(item.title.split(' - ')[1])" size="small">
                    {{ item.title.split(' - ')[1] }}
                  </a-tag>
                  <a-tag 
                    v-if="item.is_completed" 
                    color="green" 
                    size="small"
                  >
                    已完成
                  </a-tag>
                </div>
                <div class="item-meta">
                  <span class="item-time">{{ formatDateTime(item.date) }}</span>
                  <span v-if="item.creator_name" class="item-creator">{{ item.creator_name }}</span>
                </div>
              </div>
              
              <div class="item-content">
                <p class="reminder-content">{{ item.content }}</p>
                
                <div class="reminder-info">
                  <div class="remind-date">
                    <bell-outlined class="remind-icon" />
                    <span>提醒日期：{{ formatDate(item.remind_date) }}</span>
                  </div>
                  
                  <div v-if="item.is_completed && item.completed_at" class="completion-info">
                    <check-circle-outlined class="completion-icon" />
                    <span>完成时间：{{ formatDateTime(item.completed_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { message } from 'ant-design-vue'
import {
  HistoryOutlined,
  ReloadOutlined,
  CalendarOutlined,
  PlusOutlined,
  MessageOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {
  getCustomerTimeline,
  type TimelineItem,
  getFollowUpTypeText,
  getFollowUpResultText,
  getFollowUpResultColor,
  getPriorityColor
} from '@/api/follow-up'

// Props
const props = defineProps<{
  customerId: number
}>()

// Emits
const emit = defineEmits<{
  createFollowUp: []
}>()

// 响应式数据
const loading = ref(false)
const timelineData = ref<any>(null)

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '潜在': 'default',
    '跟进中': 'processing', 
    '已成交': 'success',
    '已流失': 'error'
  }
  return colorMap[status] || 'default'
}

// 获取时间线项目颜色
const getTimelineItemColor = (item: TimelineItem) => {
  if (item.type === 'follow_up') {
    if (item.result === 'deal') return 'green'
    if (item.result === 'not_interested') return 'red'
    if (item.result === 'interested') return 'blue'
    return 'gray'
  } else if (item.type === 'reminder') {
    if (item.is_completed) return 'green'
    
    const remindDate = dayjs(item.remind_date)
    const today = dayjs()
    if (remindDate.isBefore(today, 'day')) return 'red'
    if (remindDate.isSame(today, 'day')) return 'orange'
    return 'blue'
  }
  return 'gray'
}

// 获取时间线项目样式类
const getTimelineItemClass = (item: TimelineItem) => {
  if (item.type === 'follow_up') {
    return 'follow-up-dot'
  } else if (item.type === 'reminder') {
    return item.is_completed ? 'reminder-completed-dot' : 'reminder-pending-dot'
  }
  return 'default-dot'
}

// 获取时间线图标
const getTimelineIcon = (item: TimelineItem) => {
  if (item.type === 'follow_up') {
    return MessageOutlined
  } else if (item.type === 'reminder') {
    return item.is_completed ? CheckCircleOutlined : BellOutlined
  }
  return CalendarOutlined
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD')
}

// 加载时间线数据
const loadTimeline = async () => {
  if (!props.customerId) return
  
  loading.value = true
  try {
    const response = await getCustomerTimeline(props.customerId)
    timelineData.value = response.data
  } catch (error) {
    message.error('加载时间线失败')
  } finally {
    loading.value = false
  }
}

// 刷新时间线
const refreshTimeline = () => {
  loadTimeline()
}

// 创建跟进
const handleCreateFollowUp = () => {
  emit('createFollowUp')
}

// 初始化
onMounted(() => {
  loadTimeline()
})

// 暴露方法给父组件
defineExpose({
  refreshTimeline
})
</script>

<style scoped lang="less">
.customer-timeline {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  
  .timeline-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    
    .timeline-icon {
      color: #1890ff;
    }
    
    .count-badge {
      :deep(.ant-badge-count) {
        background: #1890ff;
      }
    }
  }
}

.timeline-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  
  .empty-icon {
    font-size: 64px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 16px;
  }
  
  p {
    margin: 0 0 24px 0;
    color: #8c8c8c;
    font-size: 14px;
  }
}

.timeline-content {
  flex: 1;
  overflow-y: auto;
  
  .follow-up-timeline {
    :deep(.ant-timeline-item) {
      padding-bottom: 24px;
      
      &:last-child {
        padding-bottom: 0;
      }
    }
    
    :deep(.ant-timeline-item-tail) {
      border-left: 2px solid #f0f0f0;
    }
  }
}

.timeline-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  
  &.follow-up-dot {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  }
  
  &.reminder-completed-dot {
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  }
  
  &.reminder-pending-dot {
    background: linear-gradient(135deg, #fa8c16 0%, #ffc069 100%);
  }
  
  &.default-dot {
    background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
  }
}

.timeline-item-content {
  margin-left: 16px;
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .item-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      
      .follow-up-type,
      .reminder-title {
        font-weight: 500;
        font-size: 14px;
        color: #1890ff;
      }
    }
    
    .item-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      
      .item-time {
        font-size: 12px;
        color: #8c8c8c;
      }
      
      .item-creator {
        font-size: 11px;
        color: #bfbfbf;
      }
    }
  }
  
  .item-content {
    padding-left: 12px;
    border-left: 3px solid #f0f0f0;
  }
}

// 跟进记录样式
.follow-up-item {
  .follow-up-content {
    margin: 0 0 12px 0;
    line-height: 1.5;
    color: #333;
  }
  
  .status-change {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    
    .change-label {
      color: #666;
    }
    
    .change-arrow {
      color: #1890ff;
    }
  }
  
  .next-follow {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #52c41a;
    
    .next-follow-icon {
      font-size: 14px;
    }
  }
}

// 提醒记录样式
.reminder-item {
  .reminder-content {
    margin: 0 0 12px 0;
    line-height: 1.5;
    color: #333;
  }
  
  .reminder-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .remind-date,
    .completion-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      
      .remind-icon {
        color: #fa8c16;
      }
      
      .completion-icon {
        color: #52c41a;
      }
    }
    
    .remind-date {
      color: #fa8c16;
    }
    
    .completion-info {
      color: #52c41a;
    }
  }
}

@media (max-width: 768px) {
  .timeline-item-content {
    margin-left: 8px;
    
    .item-header {
      flex-direction: column;
      gap: 8px;
      
      .item-meta {
        align-items: flex-start;
      }
    }
  }
  
  .timeline-dot {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>