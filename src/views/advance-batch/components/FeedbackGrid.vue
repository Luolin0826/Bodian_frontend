<template>
  <div class="feedback-grid">
    <div class="feedback-container">
      <FeedbackCard
        v-for="feedback in displayedFeedbacks"
        :key="feedback.id"
        :feedback="feedback"
        @view-detail="$emit('view-detail', $event)"
        @toggle-favorite="$emit('toggle-favorite', $event)"
        @toggle-pin="$emit('toggle-pin', $event)"
        @rate="$emit('rate', $event)"
      />
    </div>
    
    <!-- 查看更多按钮 -->
    <div class="load-more" v-if="feedbacks.length > maxDisplay">
      <a-button 
        type="link" 
        @click="showMore = !showMore"
      >
        {{ showMore ? '收起' : `查看全部 ${feedbacks.length} 条反馈` }}
        <DownOutlined v-if="!showMore" />
        <UpOutlined v-else />
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
import { computed, ref } from 'vue'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import FeedbackCard from './FeedbackCard.vue'
import type { FeedbackInfo } from '@/api/types/advance-batch'

interface Props {
  feedbacks: FeedbackInfo[]
  maxDisplay?: number
}

interface Emits {
  (e: 'view-detail', feedback: FeedbackInfo): void
  (e: 'toggle-favorite', feedback: FeedbackInfo): void
  (e: 'toggle-pin', feedback: FeedbackInfo): void
  (e: 'rate', payload: { feedback: FeedbackInfo; type: 'like' | 'dislike' }): void
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 6
})

const emit = defineEmits<Emits>()

const showMore = ref(false)

// 显示的反馈列表
const displayedFeedbacks = computed(() => {
  if (showMore.value || props.feedbacks.length <= props.maxDisplay) {
    return props.feedbacks
  }
  return props.feedbacks.slice(0, props.maxDisplay)
})
</script>

<style lang="less" scoped>
.feedback-grid {
  .feedback-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .load-more {
    margin-top: 16px;
    text-align: center;
    border-top: 1px solid #f0f0f0;
    padding-top: 16px;
  }
}
</style>