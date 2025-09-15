<template>
  <div class="simple-feedback-list">
    <div class="feedback-header" v-if="showHeader">
      <span class="feedback-count">共 {{ feedbacks.length }} 条反馈</span>
      <div class="feedback-actions">
        <a-button type="primary" size="small" @click="$emit('add')">
          <PlusOutlined />
          添加反馈
        </a-button>
      </div>
    </div>

    <div class="feedback-items">
      <div 
        v-for="feedback in displayedFeedbacks" 
        :key="feedback.id"
        class="feedback-item"
        :class="{ 'is-featured': feedback.is_featured, 'is-pinned': feedback.is_pinned }"
      >
        <!-- 反馈头部信息 -->
        <div class="feedback-header-info">
          <div class="feedback-left">
            <div class="feedback-title">
              <span>{{ feedback.title }}</span>
              <div class="feedback-badges">
                <a-tag v-if="feedback.is_pinned" color="orange" size="small">置顶</a-tag>
                <a-tag v-if="feedback.is_featured" color="blue" size="small">精选</a-tag>
                <a-tag v-if="feedback.is_verified" color="green" size="small">已验证</a-tag>
              </div>
            </div>
            <div class="feedback-meta">
              <a-tag :color="getTypeColor(feedback.feedback_type)" size="small">
                {{ feedback.feedback_type }}
              </a-tag>
              <span v-if="feedback.author" class="author">{{ feedback.author }}</span>
              <span class="date">{{ formatDate(feedback.created_at) }}</span>
              <span v-if="associatedStation" class="station-info">
                关联站点: {{ associatedStation.university_name }}
              </span>
            </div>
          </div>
          <div class="feedback-stats">
            <span class="stat-item">
              <EyeOutlined />
              {{ feedback.views_count || 0 }}
            </span>
            <span class="stat-item">
              <LikeOutlined />
              {{ feedback.likes_count || 0 }}
            </span>
          </div>
        </div>

        <!-- 反馈内容预览 -->
        <div class="feedback-content" v-if="!feedback.summary && feedback.content">
          <p>{{ truncateText(feedback.content, 120) }}</p>
        </div>
        <div class="feedback-summary" v-else-if="feedback.summary">
          <p>{{ feedback.summary }}</p>
        </div>

        <!-- 标签列表 -->
        <div class="feedback-tags" v-if="feedback.tags && feedback.tags.length > 0">
          <a-tag
            v-for="tag in feedback.tags.slice(0, 4)"
            :key="tag"
            size="small"
            color="processing"
          >
            {{ tag }}
          </a-tag>
          <span v-if="feedback.tags.length > 4" class="more-tags">
            +{{ feedback.tags.length - 4 }}
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="feedback-actions" v-if="showActions">
          <a-space size="small">
            <a-button type="text" size="small" @click="$emit('view-detail', feedback)">
              查看详情
            </a-button>
            <a-button 
              type="text" 
              size="small"
              :class="{ 'is-favorited': feedback.is_favorited }"
              @click="$emit('toggle-favorite', feedback)"
            >
              <HeartOutlined v-if="!feedback.is_favorited" />
              <HeartFilled v-else />
            </a-button>
            <a-button type="text" size="small" @click="$emit('edit', feedback)">
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除这条反馈吗？"
              @confirm="$emit('delete', feedback)"
            >
              <a-button type="text" size="small" danger>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div class="load-more" v-if="canLoadMore">
      <a-button @click="loadMore" :loading="loading">
        加载更多
      </a-button>
    </div>

    <!-- 空状态 -->
    <a-empty 
      v-if="feedbacks.length === 0"
      description="暂无反馈信息"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  PlusOutlined,
  EyeOutlined, 
  LikeOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import type { FeedbackInfo, StationInfo } from '@/api/types/advance-batch'

interface Props {
  feedbacks: FeedbackInfo[]
  stations?: StationInfo[]
  showHeader?: boolean
  showActions?: boolean
  pageSize?: number
  loading?: boolean
}

interface Emits {
  (e: 'add'): void
  (e: 'view-detail', feedback: FeedbackInfo): void
  (e: 'edit', feedback: FeedbackInfo): void
  (e: 'delete', feedback: FeedbackInfo): void
  (e: 'toggle-favorite', feedback: FeedbackInfo): void
  (e: 'load-more'): void
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showActions: true,
  pageSize: 10,
  loading: false
})

const emit = defineEmits<Emits>()

const currentPage = ref(1)

// 当前显示的反馈列表
const displayedFeedbacks = computed(() => {
  const endIndex = currentPage.value * props.pageSize
  return props.feedbacks.slice(0, endIndex)
})

// 是否可以加载更多
const canLoadMore = computed(() => {
  return displayedFeedbacks.value.length < props.feedbacks.length
})

// 加载更多
const loadMore = () => {
  currentPage.value++
  emit('load-more')
}

// 根据station_id获取关联站点信息
const getAssociatedStation = (stationId?: number) => {
  if (!stationId || !props.stations) return null
  return props.stations.find(station => station.id === stationId)
}

// 获取反馈类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '经验分享': 'blue',
    '注意事项': 'orange',
    '面试技巧': 'green',
    '笔试经验': 'purple',
    '政策解读': 'red',
    '生活指南': 'cyan',
    '其他': 'default'
  }
  return colorMap[type] || 'default'
}

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// 为每个反馈计算关联站点信息
const associatedStation = computed(() => {
  return (feedback: FeedbackInfo) => getAssociatedStation(feedback.station_id)
})
</script>

<style lang="less" scoped>
.simple-feedback-list {
  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;

    .feedback-count {
      font-weight: 500;
      color: #666;
    }
  }

  .feedback-items {
    .feedback-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        border-color: #d9d9d9;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      &.is-featured {
        background: linear-gradient(90deg, #e6f7ff 0%, transparent 100%);
        border-left: 3px solid #1890ff;
      }

      &.is-pinned {
        background: linear-gradient(90deg, #fff7e6 0%, transparent 100%);
        border-left: 3px solid #fa8c16;
      }

      .feedback-header-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .feedback-left {
          flex: 1;

          .feedback-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            > span {
              font-size: 15px;
              font-weight: 600;
              color: #1a1a1a;
            }

            .feedback-badges {
              display: flex;
              gap: 4px;
            }
          }

          .feedback-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #666;

            .author {
              color: #1890ff;
              font-weight: 500;
            }

            .station-info {
              color: #52c41a;
              font-weight: 500;
            }
          }
        }

        .feedback-stats {
          display: flex;
          gap: 12px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #666;
          }
        }
      }

      .feedback-content,
      .feedback-summary {
        margin-bottom: 12px;

        p {
          margin: 0;
          line-height: 1.6;
          color: #666;
        }
      }

      .feedback-tags {
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;

        .more-tags {
          font-size: 12px;
          color: #999;
        }
      }

      .feedback-actions {
        border-top: 1px solid #f0f0f0;
        padding-top: 8px;

        .is-favorited {
          color: #eb2f96;
        }
      }
    }
  }

  .load-more {
    text-align: center;
    margin: 16px 0;
  }

  @media (max-width: 768px) {
    .feedback-header {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .feedback-items .feedback-item {
      padding: 12px;

      .feedback-header-info {
        flex-direction: column;
        gap: 8px;
      }

      .feedback-meta {
        flex-wrap: wrap;
      }
    }
  }
}
</style>