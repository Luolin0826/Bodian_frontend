<template>
  <div class="province-card">
    <!-- 省份标题和信息 -->
    <div class="province-header">
      <div class="province-left">
        <h3 class="province-title">
          <span class="province-name">
            <EnvironmentOutlined />
            {{ province.province }}
          </span>
        </h3>
        <div class="province-stats">
          <a 
            v-if="getAnnouncementUrl()"
            :href="getAnnouncementUrl()"
            target="_blank"
            class="recruitment-announcement"
          >
            <SoundOutlined />
            招聘公告
          </a>
          <span v-else class="no-announcement">
            <SoundOutlined />
            暂无招聘公告
          </span>
        </div>
      </div>
      <div class="province-right" v-if="getRecruitmentRequirements()">
        <div class="recruitment-requirements" @click="handleRequirementsPreview">
          <div class="requirements-content">
            {{ truncateText(getRecruitmentRequirements(), 100) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 站点和反馈列表 - 横向布局 -->
    <div class="content-section">
      <div 
        v-for="station in province.stations" 
        :key="station.id" 
        class="station-row"
      >
        <!-- 左侧：站点信息 -->
        <div class="station-info-column">
          <div class="station-name">
            <BankOutlined />
            {{ station.university_name }}
          </div>
        </div>

        <!-- 右侧：学员反馈 -->
        <div class="feedback-column">
          <div class="feedback-header" v-if="station.feedback && station.feedback.length > 0">
            <CommentOutlined />
            学员反馈 ({{ station.feedback.length }})
          </div>
          
          <!-- 反馈网格布局 -->
          <div class="feedback-grid" v-if="station.feedback && station.feedback.length > 0">
            <div 
              v-for="feedback in station.feedback"
              :key="feedback.id"
              class="feedback-card"
              @click="handleViewFeedback(feedback, station.university_name)"
            >
              <div class="feedback-content">{{ truncateText(feedback.content, 120) }}</div>
            </div>
          </div>
          
          <!-- 没有反馈时的占位 -->
          <div class="no-feedback" v-else>
            <span class="no-feedback-text">暂无反馈</span>
          </div>
        </div>
      </div>

      <!-- 没有站点时的占位 -->
      <a-empty 
        v-if="!province.stations || province.stations.length === 0"
        description="暂无站点信息"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
      />
    </div>

    <!-- 招聘要求预览模态框 -->
    <a-modal
      v-model:open="requirementsPreviewVisible"
      title="招聘要求详情"
      width="600px"
      :footer="null"
      class="detail-modal-compact requirements-preview-modal"
    >
      <div class="script-detail-enhanced">
        <div class="answer-section-enhanced">
          <div class="section-header">
            <FileTextOutlined />
            <span class="section-title">{{ province.province }}招聘要求</span>
          </div>
          <div class="section-content-enhanced answer-content">
            {{ getRecruitmentRequirements() }}
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 反馈预览模态框 -->
    <a-modal
      v-model:open="feedbackPreviewVisible"
      title="学员反馈详情"
      width="600px"
      :footer="null"
      class="detail-modal-compact feedback-preview-modal"
    >
      <div v-if="selectedFeedback" class="script-detail-enhanced">
        <!-- 反馈来源信息 -->
        <div class="question-section-enhanced">
          <div class="section-header">
            <EnvironmentOutlined />
            <span class="section-title">反馈来源</span>
          </div>
          <div class="section-content-enhanced question-content">
            {{ (selectedFeedback as any)?.contextProvinceName || (selectedFeedback as any)?.province_name || props.province.province }} - {{ (selectedFeedback as any)?.contextStationName || (selectedFeedback as any)?.station_name_text || '未知站点' }}
          </div>
        </div>
        
        <!-- 反馈内容 -->
        <div class="answer-section-enhanced">
          <div class="section-header">
            <CommentOutlined />
            <span class="section-title">反馈内容</span>
          </div>
          <div class="section-content-enhanced answer-content">
            {{ selectedFeedback.content }}
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  EnvironmentOutlined,
  BankOutlined,
  CommentOutlined,
  SoundOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { advanceBatchApi } from '@/api/advance-batch' // 仍需要用于 viewFeedback API
import type { ProvinceAdvanceBatch, FeedbackInfo } from '@/api/types/advance-batch'

interface Props {
  province: ProvinceAdvanceBatch
}


const props = defineProps<Props>()

// 不再需要单独的反馈数据，直接使用省份数据中的 feedback

// 招聘要求预览相关状态
const requirementsPreviewVisible = ref(false)

// 反馈预览相关状态
const feedbackPreviewVisible = ref(false)
const selectedFeedback = ref<FeedbackInfo | null>(null)


// 不再需要按站点分组，直接使用站点数据中的 feedback 字段

// 从新的数据结构中获取招聘要求
const getRecruitmentRequirements = () => {
  // 首先尝试从省份数据中获取
  if (props.province.other_requirements) {
    return props.province.other_requirements
  }
  if (props.province.education_requirement) {
    return props.province.education_requirement
  }
  
  // 如果省份数据中没有，从站点的反馈中获取
  for (const station of props.province.stations || []) {
    for (const feedback of station.feedback || []) {
      if (feedback.recruitment_requirements) {
        return feedback.recruitment_requirements
      }
    }
  }
  
  return ''
}

// 从新的数据结构中获取公告链接
const getAnnouncementUrl = () => {
  // 首先尝试从省份数据中获取
  if (props.province.notice_url) {
    return props.province.notice_url
  }
  
  // 如果省份数据中没有，从站点的反馈中获取
  for (const station of props.province.stations || []) {
    for (const feedback of station.feedback || []) {
      if (feedback.announcement_url) {
        return feedback.announcement_url
      }
    }
  }
  
  return ''
}

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 不再需要单独获取反馈，数据已包含在省份信息中



// 招聘要求预览
const handleRequirementsPreview = () => {
  requirementsPreviewVisible.value = true
}

// 查看反馈详情
const handleViewFeedback = (feedback: FeedbackInfo, stationName?: string) => {
  // 为反馈对象添加上下文信息
  selectedFeedback.value = {
    ...feedback,
    contextProvinceName: props.province.province,
    contextStationName: stationName
  }
  feedbackPreviewVisible.value = true
  // 记录浏览数
  advanceBatchApi.viewFeedback(feedback.id)
}


// 格式化内容（处理换行等）
const formatContent = (content: string) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}


// 不再需要 onMounted 获取反馈数据
</script>

<style lang="less" scoped>
.province-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .province-header {
    padding: 24px;
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f9ff 100%);
    border-bottom: 2px solid #e6f7ff;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;

    .province-left {
      flex: 0 0 auto;
      
      .province-title {
        margin: 0 0 16px 0;
        font-size: 20px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 16px;

        .province-name {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1a1a1a;
          padding: 4px 8px;
        }
      }

      .province-stats {
        .recruitment-announcement {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #1890ff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 12px;
          background: rgba(24, 144, 255, 0.1);
          border-radius: 20px;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(24, 144, 255, 0.2);
            text-decoration: none;
          }
        }

        .no-announcement {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #999;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 20px;
        }
      }
    }

    .province-right {
      flex: 1;
      
      .recruitment-requirements {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e6f7ff;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: #91d5ff;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
        }
        
        .requirements-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-weight: 600;
          color: #1565c0;
          margin-bottom: 8px;
          font-size: 14px;
          
          .preview-icon {
            color: #1890ff;
            font-size: 12px;
            opacity: 0.7;
            transition: opacity 0.2s ease;
          }
        }
        
        &:hover .preview-icon {
          opacity: 1;
        }
        
        .requirements-content {
          color: #333;
          line-height: 1.6;
          font-size: 13px;
        }
      }
    }
  }

  .content-section {
    padding: 16px;

    .station-row {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      padding: 20px;
      border: 1px solid #e8e8e8;
      border-radius: 10px;
      background: #f9f9f9;
      transition: all 0.2s ease;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        background: #f0f9ff;
        border-color: #91d5ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);
      }

      .station-info-column {
        flex: 0 0 200px;
        display: flex;
        align-items: center;
        padding-right: 20px;
        border-right: 2px solid #e8e8e8;

        .station-name {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

      }

      .feedback-column {
        flex: 1;
        min-width: 0;

        .feedback-header {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .feedback-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;

          .feedback-card {
            background: white;
            border: 1px solid #e8e8e8;
            border-radius: 6px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              border-color: #1890ff;
              box-shadow: 0 2px 6px rgba(24, 144, 255, 0.15);
            }

            .feedback-content {
              color: #666;
              line-height: 1.5;
              font-size: 13px;
              padding: 8px 0;
            }
          }
        }

        .no-feedback {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80px;
          background: white;
          border: 1px dashed #d9d9d9;
          border-radius: 6px;
          
          .no-feedback-text {
            color: #999;
            font-size: 13px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .province-card {
    .province-header {
      padding: 16px;
      flex-direction: column;
      gap: 16px;

      .province-left {
        .province-title {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    }

    .content-section {
      padding: 12px;

      .station-row {
        flex-direction: column;
        gap: 16px;

        .station-info-column {
          flex: none;
        }

        .feedback-column {
          .feedback-grid {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
}

// 紧凑的详情模态框
.detail-modal-compact {
  :deep(.ant-modal-body) {
    padding: 16px;
  }
}

// 增强版话术详情样式
.script-detail-enhanced {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .question-section-enhanced,
  .answer-section-enhanced {
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      
      .anticon {
        font-size: 16px;
        color: #1890ff;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #1890ff;
      }
    }
    
    .section-content-enhanced {
      font-size: 16px;
      line-height: 1.8;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e6f7ff;
      
      &.question-content {
        background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
        color: #1565c0;
        font-style: italic;
      }
      
      &.answer-content {
        background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
        color: #333;
        font-weight: 500;
      }
    }
  }

  .action-section {
    display: flex;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
  }
}

</style>