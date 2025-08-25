<template>
  <div 
    class="policy-card" 
    :class="`view-${viewMode}`"
    @click="handleCardClick"
  >
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="region-info">
        <div class="region-title">
          <environment-outlined class="location-icon" />
          <span class="location-text">
            {{ policy.province }}
            <span v-if="policy.city"> - {{ policy.city }}</span>
            <span v-if="policy.company"> - {{ policy.company }}</span>
          </span>
          <!-- 备注消息图标 -->
          <a-tooltip v-if="policy.field_notes?.length" placement="top">
            <template #title>
              <div v-for="note in policy.field_notes" :key="note.field_name" class="note-item">
                <strong>{{ note.field_name }}:</strong> {{ note.note_content }}
              </div>
            </template>
            <message-outlined class="notes-icon" />
          </a-tooltip>
        </div>
        <div class="region-tags">
          <a-tag v-if="policy.company_type" :color="policy.company_type === '国网' ? 'blue' : 'green'" size="small">
            {{ policy.company_type }}
          </a-tag>
          <a-tag v-if="policy.batch" color="purple" size="small">
            {{ policy.batch }}
          </a-tag>
          <a-tag v-if="policy.is_cost_effective" color="gold" size="small">
            <star-outlined />
            性价比推荐
          </a-tag>
        </div>
      </div>
      
      <div class="card-actions">
        <template v-if="viewMode === 'list'">
          <a-button type="primary" size="small" @click.stop="handleViewDetail">
            <eye-outlined />
            查看详情
          </a-button>
          <a-dropdown :trigger="['click']">
            <a-button type="text" size="small" @click.stop>
              <more-outlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="export" @click="handleExport">
                  <export-outlined />
                  导出数据
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
        <template v-else>
          <a-dropdown :trigger="['click']">
            <a-button type="text" size="small" @click.stop>
              <more-outlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="detail" @click="handleViewDetail">
                  <eye-outlined />
                  查看详情
                </a-menu-item>
                <a-menu-item key="export" @click="handleExport">
                  <export-outlined />
                  导出数据
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 基本要求 -->
      <div class="content-section" v-if="policy.basic_requirements">
        <div class="section-header">
          <idcard-outlined class="section-icon" />
          <span class="section-title">基本要求</span>
        </div>
        <div class="requirement-items">
          <div 
            v-for="(value, key) in filteredBasicRequirements"
            :key="key"
            class="requirement-item"
          >
            <span class="requirement-label">{{ getRequirementLabel(String(key)) }}:</span>
            <span class="requirement-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 薪资待遇 -->
      <div class="content-section" v-if="policy.salary_info">
        <div class="section-header">
          <dollar-outlined class="section-icon" />
          <span class="section-title">薪资待遇</span>
        </div>
        <div class="salary-grid">
          <div v-if="policy.salary_info.bachelor_salary" class="salary-item">
            <div class="salary-label">本科薪资</div>
            <div class="salary-value primary">{{ policy.salary_info.bachelor_salary }}</div>
          </div>
          <div v-if="policy.salary_info.master_salary" class="salary-item">
            <div class="salary-label">硕士薪资</div>
            <div class="salary-value primary">{{ policy.salary_info.master_salary }}</div>
          </div>
          <div v-if="policy.salary_info.bachelor_interview_line" class="salary-item">
            <div class="salary-label">本科面试线</div>
            <div class="salary-value secondary">{{ policy.salary_info.bachelor_interview_line }}</div>
          </div>
          <div v-if="policy.salary_info.master_interview_line" class="salary-item">
            <div class="salary-label">硕士面试线</div>
            <div class="salary-value secondary">{{ policy.salary_info.master_interview_line }}</div>
          </div>
          <!-- 本科综合分 -->
          <div v-if="policy.salary_info.bachelor_comprehensive_score" class="salary-item">
            <div class="salary-label">本科综合分</div>
            <div class="salary-value highlight">{{ policy.salary_info.bachelor_comprehensive_score }}</div>
          </div>
        </div>
      </div>

      <!-- 网申政策信息 -->
      <div class="content-section" v-if="shouldShowApplicationPolicy">
        <div class="section-header">
          <info-circle-outlined class="section-icon" />
          <span class="section-title">网申政策</span>
        </div>
        <div class="detail-preview">
          <div class="detail-item application-status">
            <check-circle-outlined class="detail-icon success" />
            <span class="detail-text">{{ getApplicationPolicyValue() }}</span>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  EnvironmentOutlined,
  StarOutlined,
  MoreOutlined,
  EyeOutlined,
  ExportOutlined,
  IdcardOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
import type { PolicyInfo } from '@/api/recruitment'

// Props
interface Props {
  policy: PolicyInfo
  viewMode?: 'card' | 'list'
  selectedEducationLevel?: 'bachelor' | 'master' | null
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'card',
  selectedEducationLevel: null
})

// Emits
const emit = defineEmits(['detail', 'export'])

// 计算属性
const filteredBasicRequirements = computed(() => {
  const req = props.policy.basic_requirements
  if (!req) return {}
  
  // 过滤掉空值
  return Object.fromEntries(
    Object.entries(req).filter(([_, value]) => value && value.trim())
  )
})


// 方法

// 是否显示网申政策
const shouldShowApplicationPolicy = computed(() => {
  // 只有在有学历层次选择且有对应数据时才显示
  return !!(props.selectedEducationLevel && (props.policy as any).education_level_info)
})

// 获取网申政策值
const getApplicationPolicyValue = () => {
  const value = (props.policy as any).education_level_info?.education_value
  return value || '未知'
}

const getRequirementLabel = (key: string) => {
  const labelMap: Record<string, string> = {
    'cet_requirement': '英语要求',
    'computer_requirement': '计算机要求',
    'overage_allowed': '年龄要求',
    'household_priority': '户口要求',
    'non_first_choice_pass': '调剂政策'
  }
  return labelMap[key] || key
}

const handleCardClick = () => {
  // 仅在卡片模式下支持点击查看详情，列表模式使用专门的按钮
  if (props.viewMode === 'card') {
    handleViewDetail()
  }
}


const handleViewDetail = () => {
  emit('detail', props.policy)
}

const handleExport = () => {
  emit('export', props.policy)
}
</script>

<style scoped lang="less">
.policy-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    transform: translateY(-2px);
  }
  
  &.view-list {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 4px;
    cursor: default;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
    }
    
    .card-header {
      border: none;
      padding: 0;
      margin: 0;
      background: none;
      flex-shrink: 0;
      width: 200px;
      margin-right: 16px;
      
      .region-title {
        font-size: 14px;
        margin-bottom: 4px;
      }
    }
    
    .card-content {
      flex: 1;
      padding: 0;
      
      .content-section {
        margin-bottom: 0;
        display: inline-block;
        margin-right: 16px;
        
        .section-header {
          margin-bottom: 2px;
          
          .section-title {
            font-size: 12px;
          }
        }
      }
    }
    
    .card-actions {
      flex-shrink: 0;
      width: 120px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }
  
  &.view-card {
    cursor: pointer;
  }
}

// 卡片头部
.card-header {
  padding: 8px 10px;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%);
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: -8px -8px 6px -8px;
  
  .region-info {
    flex: 1;
    
    .region-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
      
      .location-icon {
        color: #1890ff;
        font-size: 14px;
      }
      
      .location-text {
        line-height: 1.2;
        flex: 1;
      }
      
      .notes-icon {
        color: #faad14;
        font-size: 14px;
        cursor: pointer;
        margin-left: 8px;
        
        &:hover {
          color: #fa8c16;
        }
      }
    }
    
    .region-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
  
  .card-actions {
    display: flex;
    gap: 4px;
    margin-left: 12px;
    
    .active {
      color: #1890ff;
      background: #f0f9ff;
    }
  }
}

// 卡片内容
.card-content {
  padding: 8px 12px;
  
  .content-section {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      
      .section-icon {
        color: #52c41a;
        font-size: 14px;
      }
      
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
    }
  }
}

// 基本要求
.requirement-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .requirement-item {
    display: flex;
    font-size: 11px;
    
    .requirement-label {
      color: #666;
      min-width: 80px;
      flex-shrink: 0;
    }
    
    .requirement-value {
      color: #333;
      flex: 1;
    }
  }
}

// 薪资网格
.salary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  
  .salary-item {
    text-align: center;
    padding: 6px;
    background: #fafafa;
    border-radius: 4px;
    
    .salary-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 2px;
    }
    
    .salary-value {
      font-size: 13px;
      font-weight: 600;
      
      &.primary {
        color: #1890ff;
      }
      
      &.secondary {
        color: #52c41a;
      }
      
      &.highlight {
        color: #fa8c16;
        background: linear-gradient(135deg, #fff7e6 0%, #fef3e2 100%);
        border-radius: 3px;
        padding: 2px 4px;
      }
    }
  }
}

// 详细信息预览
.detail-preview {
  .detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
    
    .detail-icon {
      color: #1890ff;
      font-size: 11px;
      
      &.success {
        color: #52c41a;
      }
    }
    
    &.application-status {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      padding: 4px 8px;
      margin-bottom: 8px;
      
      .detail-text {
        color: #52c41a;
        font-weight: 600;
      }
    }
  }
}

// 学历要求紧凑样式
.education-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

// 网申政策值样式
.application-policy-value {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e8e8e8;
  
  .policy-value-item {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .policy-icon {
      color: #52c41a;
      font-size: 12px;
    }
    
    .policy-text {
      font-size: 12px;
      font-weight: 600;
      color: #52c41a;
    }
  }
}

// 卡片底部 - 简化
.card-footer {
  padding: 10px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  
  .footer-hint {
    width: 100%;
    text-align: center;
    
    .hint-text {
      font-size: 12px;
      color: #999;
    }
  }
}

// 列表视图优化
.view-list {
  .card-content {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .content-section {
      margin-bottom: 0;
      margin-right: 0;
      
      .section-header {
        display: none; // 隐藏图标和标题，节省空间
      }
    }
    
    .salary-grid {
      display: flex;
      gap: 8px;
      
      .salary-item {
        padding: 2px 6px;
        min-width: 70px;
        
        .salary-label {
          font-size: 10px;
          margin-bottom: 1px;
        }
        
        .salary-value {
          font-size: 11px;
        }
      }
    }
    
    .requirement-items {
      display: flex;
      gap: 12px;
      
      .requirement-item {
        font-size: 10px;
        flex-direction: row;
        white-space: nowrap;
        
        .requirement-label {
          min-width: 60px;
          margin-right: 4px;
        }
      }
    }
    
    .detail-preview {
      .detail-item {
        &.application-status {
          padding: 2px 6px;
          margin-bottom: 0;
          
          .detail-text {
            font-size: 10px;
          }
        }
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .policy-card {
    &.view-list {
      flex-direction: column;
      align-items: stretch;
      
      .card-header,
      .card-content,
      .card-footer {
        width: 100%;
        margin: 0;
      }
      
      .card-header {
        margin-bottom: 12px;
      }
      
      .card-footer {
        margin-top: 12px;
      }
    }
  }
  
  .card-header {
    .region-title {
      font-size: 14px;
    }
  }
  
  .salary-grid {
    grid-template-columns: 1fr;
  }
}
</style>