<template>
  <div class="station-timeline">
    <div class="timeline-container">
      <div 
        v-for="(station, index) in sortedStations" 
        :key="station.id"
        class="timeline-item"
        :class="{ 'is-past': isPastDate(station.visit_date) }"
      >
        <!-- 时间线节点 -->
        <div class="timeline-node">
          <div class="timeline-dot" :class="getTimelineStatus(station.visit_date)">
            <CalendarOutlined v-if="!isPastDate(station.visit_date)" />
            <CheckOutlined v-else />
          </div>
          <div class="timeline-line" v-if="index < sortedStations.length - 1"></div>
        </div>
        
        <!-- 内容区域 -->
        <div class="timeline-content">
          <div class="station-header">
            <h4 class="station-name">{{ station.university_name }}</h4>
            <div class="station-meta">
              <a-tag :color="getUniversityTypeColor(station.university_type)">
                {{ station.university_type }}
              </a-tag>
              <span class="activity-type">{{ station.activity_type }}</span>
            </div>
          </div>
          
          <div class="station-details">
            <div class="detail-row">
              <ClockCircleOutlined />
              <span class="detail-label">时间:</span>
              <span class="detail-value">
                {{ formatDateTime(station.visit_date, station.visit_time) }}
                <span v-if="station.duration" class="duration">
                  ({{ station.duration }})
                </span>
              </span>
            </div>
            
            <div class="detail-row" v-if="station.venue">
              <EnvironmentOutlined />
              <span class="detail-label">地点:</span>
              <span class="detail-value">{{ station.venue }}</span>
            </div>
            
            <div class="detail-row" v-if="station.expected_participants">
              <TeamOutlined />
              <span class="detail-label">预计参与:</span>
              <span class="detail-value">{{ station.expected_participants }}人</span>
            </div>
            
            <div class="detail-row" v-if="station.contact_person">
              <UserOutlined />
              <span class="detail-label">联系人:</span>
              <span class="detail-value">
                {{ station.contact_person }}
                <span v-if="station.contact_phone" class="contact-phone">
                  ({{ station.contact_phone }})
                </span>
              </span>
            </div>
          </div>
          
          <!-- 注册信息 -->
          <div class="registration-info" v-if="station.registration_required">
            <div class="registration-badge">
              <FormOutlined />
              需要报名
            </div>
            <a-button 
              v-if="station.registration_url && !isPastDate(station.visit_date)"
              type="primary" 
              size="small"
              @click="openRegistration(station.registration_url)"
            >
              立即报名
            </a-button>
          </div>
          
          <!-- 备注信息 -->
          <div class="station-remarks" v-if="station.remarks">
            <InfoCircleOutlined />
            <span>{{ station.remarks }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <a-empty 
      v-if="sortedStations.length === 0"
      description="暂无站点信息"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
  FormOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import type { StationInfo } from '@/api/types/advance-batch'

interface Props {
  stations: StationInfo[]
}

const props = defineProps<Props>()

// 按时间排序的站点列表
const sortedStations = computed(() => {
  return [...props.stations].sort((a, b) => {
    const dateA = new Date(a.visit_date + ' ' + (a.visit_time || '00:00:00'))
    const dateB = new Date(b.visit_date + ' ' + (b.visit_time || '00:00:00'))
    return dateA.getTime() - dateB.getTime()
  })
})

// 判断是否为过去的日期
const isPastDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

// 获取时间线状态
const getTimelineStatus = (dateString: string) => {
  if (isPastDate(dateString)) {
    return 'completed'
  }
  
  const date = new Date(dateString)
  const today = new Date()
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 3) {
    return 'urgent'
  } else if (diffDays <= 7) {
    return 'upcoming'
  }
  
  return 'pending'
}

// 获取院校类型颜色
const getUniversityTypeColor = (type?: string) => {
  if (!type) return 'default'
  
  if (type.includes('985')) return 'red'
  if (type.includes('211')) return 'orange'
  if (type.includes('双一流')) return 'blue'
  if (type.includes('重点')) return 'green'
  
  return 'default'
}

// 格式化日期时间
const formatDateTime = (dateString: string, timeString?: string) => {
  const date = new Date(dateString)
  const dateStr = date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  })
  
  if (timeString) {
    const timeStr = timeString.slice(0, 5) // 去掉秒数
    return `${dateStr} ${timeStr}`
  }
  
  return dateStr
}

// 打开报名链接
const openRegistration = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style lang="less" scoped>
.station-timeline {
  .timeline-container {
    position: relative;
  }

  .timeline-item {
    display: flex;
    margin-bottom: 24px;
    position: relative;

    &:last-child {
      margin-bottom: 0;
    }

    &.is-past {
      opacity: 0.7;

      .timeline-content {
        background: #fafafa;
      }
    }
  }

  .timeline-node {
    position: relative;
    margin-right: 16px;
    flex-shrink: 0;

    .timeline-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      position: relative;
      z-index: 2;

      &.completed {
        background: #52c41a;
      }

      &.urgent {
        background: #ff4d4f;
        animation: pulse 2s infinite;
      }

      &.upcoming {
        background: #fa8c16;
      }

      &.pending {
        background: #1890ff;
      }
    }

    .timeline-line {
      position: absolute;
      left: 50%;
      top: 28px;
      transform: translateX(-50%);
      width: 2px;
      height: 24px;
      background: #e8e8e8;
      z-index: 1;
    }
  }

  .timeline-content {
    flex: 1;
    background: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 16px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 20px;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-right: 8px solid #e8e8e8;
    }

    &::after {
      content: '';
      position: absolute;
      left: -7px;
      top: 20px;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-right: 8px solid white;
    }
  }

  .station-header {
    margin-bottom: 12px;

    .station-name {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 8px 0;
    }

    .station-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .activity-type {
        font-size: 13px;
        color: #666;
        background: #f0f0f0;
        padding: 2px 8px;
        border-radius: 4px;
      }
    }
  }

  .station-details {
    margin-bottom: 12px;

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.4;

      &:last-child {
        margin-bottom: 0;
      }

      .anticon {
        color: #666;
        font-size: 12px;
        flex-shrink: 0;
      }

      .detail-label {
        color: #666;
        min-width: 48px;
        flex-shrink: 0;
      }

      .detail-value {
        color: #1a1a1a;

        .duration {
          color: #666;
          font-size: 12px;
        }

        .contact-phone {
          color: #666;
          font-size: 12px;
        }
      }
    }
  }

  .registration-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 6px;
    margin-bottom: 8px;

    .registration-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #52c41a;
      font-weight: 500;
    }
  }

  .station-remarks {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    color: #666;
    background: #fff7e6;
    padding: 8px;
    border-radius: 4px;
    border-left: 3px solid #faad14;

    .anticon {
      margin-top: 2px;
      flex-shrink: 0;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .station-timeline {
    .timeline-item {
      margin-bottom: 20px;
    }

    .timeline-node {
      margin-right: 12px;

      .timeline-dot {
        width: 24px;
        height: 24px;
        font-size: 11px;
      }

      .timeline-line {
        top: 24px;
        height: 20px;
      }
    }

    .timeline-content {
      padding: 12px;

      &::before,
      &::after {
        top: 16px;
      }
    }

    .station-header .station-meta {
      flex-direction: column;
      align-items: flex-start;
    }

    .registration-info {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
  }
}
</style>