<template>
  <div class="feedback-card" @click="handleCardClick">
    <!-- 置顶和收藏角标 -->
    <div class="feedback-badges" v-if="feedback.is_featured || feedback.is_pinned || feedback.is_favorited">
      <div class="badge-item pinned" v-if="feedback.is_pinned">
        <PushpinOutlined />
        置顶
      </div>
      <div class="badge-item featured" v-if="feedback.is_featured">
        <StarOutlined />
        精选
      </div>
      <div class="badge-item favorited" v-if="feedback.is_favorited">
        <HeartFilled />
        收藏
      </div>
    </div>

    <!-- 反馈类型标签 -->
    <div class="feedback-type">
      <a-tag :color="getTypeColor(feedback.feedback_type)">
        {{ feedback.feedback_type }}
      </a-tag>
      <div class="feedback-meta">
        <span v-if="feedback.difficulty_level" class="difficulty">
          {{ feedback.difficulty_level }}
        </span>
        <span v-if="feedback.is_verified" class="verified">
          <CheckCircleOutlined />
          已验证
        </span>
      </div>
    </div>

    <!-- 反馈标题 -->
    <h4 class="feedback-title" :title="feedback.title">
      {{ feedback.title }}
    </h4>

    <!-- 反馈内容预览 -->
    <div class="feedback-content">
      <p class="content-preview" :title="feedback.content">
        {{ truncateText(feedback.summary || feedback.content, 100) }}
      </p>
    </div>

    <!-- 作者信息 -->
    <div class="feedback-author" v-if="feedback.author">
      <UserOutlined />
      <span class="author-name">{{ feedback.author }}</span>
      <span v-if="feedback.author_background" class="author-bg">
        ({{ feedback.author_background }})
      </span>
    </div>

    <!-- 统计信息 -->
    <div class="feedback-stats">
      <div class="stat-item">
        <EyeOutlined />
        <span>{{ feedback.views_count || 0 }}</span>
      </div>
      <div class="stat-item">
        <LikeOutlined />
        <span>{{ feedback.likes_count || 0 }}</span>
      </div>
      <div v-if="feedback.shares_count" class="stat-item">
        <ShareAltOutlined />
        <span>{{ feedback.shares_count }}</span>
      </div>
      <div class="stat-item time">
        <ClockCircleOutlined />
        <span>{{ formatDate(feedback.created_at) }}</span>
      </div>
    </div>

    <!-- 标签列表 -->
    <div class="feedback-tags" v-if="feedback.tags && feedback.tags.length > 0">
      <a-tag
        v-for="tag in feedback.tags.slice(0, 3)"
        :key="tag"
        size="small"
        color="processing"
      >
        {{ tag }}
      </a-tag>
      <span v-if="feedback.tags.length > 3" class="more-tags">
        +{{ feedback.tags.length - 3 }}
      </span>
    </div>

    <!-- 操作按钮 -->
    <div class="feedback-actions" @click.stop>
      <a-tooltip title="查看详情">
        <a-button 
          type="text" 
          size="small" 
          @click="$emit('view-detail', feedback)"
        >
          <EyeOutlined />
        </a-button>
      </a-tooltip>

      <a-tooltip :title="feedback.is_favorited ? '取消收藏' : '收藏'">
        <a-button 
          type="text" 
          size="small"
          :class="{ 'is-favorited': feedback.is_favorited }"
          @click="$emit('toggle-favorite', feedback)"
        >
          <HeartOutlined v-if="!feedback.is_favorited" />
          <HeartFilled v-else />
        </a-button>
      </a-tooltip>

      <a-tooltip title="点赞">
        <a-button 
          type="text" 
          size="small"
          @click="$emit('rate', { feedback, type: 'like' })"
        >
          <LikeOutlined />
        </a-button>
      </a-tooltip>

      <!-- 置顶按钮（管理员权限） -->
      <a-tooltip v-if="hasPermission('pin')" :title="feedback.is_pinned ? '取消置顶' : '置顶'">
        <a-button 
          type="text" 
          size="small"
          :class="{ 'is-pinned': feedback.is_pinned }"
          @click="$emit('toggle-pin', feedback)"
        >
          <PushpinOutlined />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PushpinOutlined,
  StarOutlined,
  HeartFilled,
  HeartOutlined,
  CheckCircleOutlined,
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import type { FeedbackInfo } from '@/api/types/advance-batch'

interface Props {
  feedback: FeedbackInfo
}

interface Emits {
  (e: 'view-detail', feedback: FeedbackInfo): void
  (e: 'toggle-favorite', feedback: FeedbackInfo): void
  (e: 'toggle-pin', feedback: FeedbackInfo): void
  (e: 'rate', payload: { feedback: FeedbackInfo; type: 'like' | 'dislike' }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  
  return date.toLocaleDateString('zh-CN')
}

// 检查权限
const hasPermission = (action: string) => {
  // 这里应该根据用户权限来判断
  // 目前简单返回 false，实际应该从用户状态或权限系统获取
  return false
}

// 处理卡片点击
const handleCardClick = () => {
  emit('view-detail', props.feedback)
}
</script>

<style lang="less" scoped>
.feedback-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    transform: translateY(-2px);
  }

  .feedback-badges {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .badge-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 11px;
      color: white;
      border-radius: 0 8px 0 8px;

      &.pinned {
        background: #fa541c;
      }

      &.featured {
        background: #faad14;
      }

      &.favorited {
        background: #eb2f96;
      }
    }
  }

  .feedback-type {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .feedback-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;

      .difficulty {
        color: #666;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .verified {
        color: #52c41a;
        display: flex;
        align-items: center;
        gap: 2px;
      }
    }
  }

  .feedback-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .feedback-content {
    margin-bottom: 12px;

    .content-preview {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .feedback-author {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #666;

    .author-name {
      color: #1a1a1a;
      font-weight: 500;
    }

    .author-bg {
      color: #999;
    }
  }

  .feedback-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #666;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;

      &.time {
        margin-left: auto;
      }
    }
  }

  .feedback-tags {
    margin-bottom: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;

    .more-tags {
      font-size: 11px;
      color: #999;
    }
  }

  .feedback-actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    border-top: 1px solid #f0f0f0;
    padding-top: 8px;
    margin-top: 8px;

    .ant-btn {
      display: flex;
      align-items: center;
      justify-content: center;

      &.is-favorited {
        color: #eb2f96;
      }

      &.is-pinned {
        color: #fa541c;
      }

      &:hover {
        color: #1890ff;
      }
    }
  }
}

@media (max-width: 768px) {
  .feedback-card {
    padding: 12px;

    .feedback-stats {
      flex-wrap: wrap;
      gap: 8px;

      .stat-item.time {
        margin-left: 0;
        order: -1;
        width: 100%;
      }
    }

    .feedback-actions {
      justify-content: space-around;
    }
  }
}
</style>