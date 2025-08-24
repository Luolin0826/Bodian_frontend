<template>
  <div class="comparison-tool">
    <!-- 对比头部 -->
    <div class="comparison-header">
      <div class="header-title">
        <diff-outlined class="title-icon" />
        <span class="title-text">政策对比</span>
        <span class="comparison-count">({{ policies.length }}/3)</span>
      </div>
      <div class="header-actions">
        <a-button @click="handleClearAll" size="small" :disabled="policies.length === 0">
          <clear-outlined />
          清空对比
        </a-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="policies.length === 0" class="empty-comparison">
      <a-empty description="暂无对比数据">
        <template #image>
          <diff-outlined class="empty-icon" />
        </template>
        <p>请在政策卡片中选择"对比"添加政策进行对比分析</p>
      </a-empty>
    </div>

    <!-- 对比内容 -->
    <div v-else class="comparison-content">
      <!-- 对比表格视图 -->
      <div class="comparison-table">
        <a-table
          :columns="comparisonColumns"
          :data-source="comparisonData"
          :pagination="false"
          size="small"
          :scroll="{ x: 600 }"
          bordered
        >
          <template #headerCell="{ column }">
            <div class="table-header-cell">
              <span class="header-text">{{ column.title }}</span>
              <a-button
                v-if="column.key !== 'field'"
                type="text"
                size="small"
                danger
                @click="handleRemovePolicy(column.dataIndex)"
              >
                <close-outlined />
              </a-button>
            </div>
          </template>

          <template #bodyCell="{ column, record, text }">
            <!-- 字段名称列 -->
            <template v-if="column.key === 'field'">
              <div class="field-cell">
                <component :is="getFieldIcon(record.field)" class="field-icon" />
                <span class="field-name">{{ record.fieldName }}</span>
              </div>
            </template>
            
            <!-- 数据值列 -->
            <template v-else>
              <div class="value-cell" :class="getValueClass(record.field, text)">
                <component v-if="text && getValueIcon(record.field, text)" :is="getValueIcon(record.field, text)" class="value-icon" />
                <span class="value-text">{{ text || '-' }}</span>
                <div v-if="getValueScore(record.field, text)" class="value-score">
                  {{ getValueScore(record.field, text) }}分
                </div>
              </div>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 对比摘要 -->
      <div class="comparison-summary">
        <div class="summary-header">
          <bar-chart-outlined class="summary-icon" />
          <span class="summary-title">对比摘要</span>
        </div>
        
        <div class="summary-content">
          <!-- 优势分析 -->
          <div class="summary-section">
            <h4 class="section-title">优势分析</h4>
            <div class="advantage-items">
              <div 
                v-for="(policy, index) in policies"
                :key="`advantage-${index}`"
                class="advantage-item"
              >
                <div class="policy-name">
                  {{ policy.province }}{{ policy.city ? ` - ${policy.city}` : '' }}
                </div>
                <div class="advantage-list">
                  <a-tag 
                    v-for="advantage in getAdvantages(policy)"
                    :key="advantage"
                    color="green"
                    size="small"
                  >
                    {{ advantage }}
                  </a-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 推荐结论 -->
          <div class="summary-section">
            <h4 class="section-title">推荐结论</h4>
            <div class="recommendation-result">
              <div class="best-choice">
                <trophy-outlined class="trophy-icon" />
                <span class="choice-text">
                  综合评分最高：
                  <strong>{{ getBestChoice().region }}</strong>
                  ({{ getBestChoice().score }}分)
                </span>
              </div>
              <div class="recommendation-reasons">
                <div class="reasons-title">推荐理由：</div>
                <ul class="reasons-list">
                  <li v-for="reason in getBestChoice().reasons" :key="reason">
                    {{ reason }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出对比报告 -->
      <div class="comparison-actions">
        <a-space>
          <a-button @click="handleExportComparison">
            <export-outlined />
            导出对比报告
          </a-button>
          <a-button type="primary" @click="handleSelectBest">
            <check-outlined />
            选择推荐地区
          </a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  DiffOutlined,
  ClearOutlined,
  CloseOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ExportOutlined,
  CheckOutlined,
  DollarOutlined,
  TeamOutlined,
  BookOutlined,
  IdcardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons-vue'
import type { PolicyInfo } from '@/api/recruitment'

// Props
interface Props {
  policies: PolicyInfo[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits(['remove', 'clear', 'export', 'select'])

// 对比字段配置
const comparisonFields = [
  { field: 'bachelor_salary', fieldName: '本科薪资', category: 'salary' },
  { field: 'master_salary', fieldName: '硕士薪资', category: 'salary' },
  { field: 'bachelor_interview_line', fieldName: '本科面试线', category: 'interview' },
  { field: 'master_interview_line', fieldName: '硕士面试线', category: 'interview' },
  { field: 'stable_score_range', fieldName: '稳定分数范围', category: 'score' },
  { field: 'admission_ratio', fieldName: '录取比例', category: 'ratio' },
  { field: 'cet_requirement', fieldName: '英语要求', category: 'requirement' },
  { field: 'computer_requirement', fieldName: '计算机要求', category: 'requirement' },
  { field: 'household_priority', fieldName: '户口政策', category: 'policy' },
  { field: 'second_choice_available', fieldName: '二志愿支持', category: 'policy' }
]

// 计算属性
const comparisonColumns = computed(() => {
  const columns = [
    {
      title: '对比项目',
      key: 'field',
      dataIndex: 'field',
      width: 120,
      fixed: 'left'
    }
  ]
  
  props.policies.forEach((policy, index) => {
    columns.push({
      title: `${policy.province}${policy.city ? ` - ${policy.city}` : ''}`,
      key: `policy_${index}`,
      dataIndex: `policy_${index}`,
      width: 200
    })
  })
  
  return columns
})

const comparisonData = computed(() => {
  return comparisonFields.map(({ field, fieldName }) => {
    const row: any = {
      field,
      fieldName
    }
    
    props.policies.forEach((policy, index) => {
      row[`policy_${index}`] = getFieldValue(policy, field)
    })
    
    return row
  })
})

// 方法
const getFieldValue = (policy: PolicyInfo, field: string) => {
  switch (field) {
    case 'bachelor_salary':
      return policy.salary_info?.bachelor_salary
    case 'master_salary':
      return policy.salary_info?.master_salary
    case 'bachelor_interview_line':
      return policy.salary_info?.bachelor_interview_line
    case 'master_interview_line':
      return policy.salary_info?.master_interview_line
    case 'stable_score_range':
      return policy.detailed_info?.stable_score_range
    case 'admission_ratio':
      return policy.detailed_info?.admission_ratio
    case 'cet_requirement':
      return policy.basic_requirements?.cet_requirement
    case 'computer_requirement':
      return policy.basic_requirements?.computer_requirement
    case 'household_priority':
      return policy.basic_requirements?.household_priority
    case 'second_choice_available':
      return policy.admission_policies?.second_choice_available
    default:
      return undefined
  }
}

const getFieldIcon = (field: string) => {
  const iconMap: Record<string, any> = {
    'bachelor_salary': DollarOutlined,
    'master_salary': DollarOutlined,
    'bachelor_interview_line': TeamOutlined,
    'master_interview_line': TeamOutlined,
    'stable_score_range': BarChartOutlined,
    'admission_ratio': BarChartOutlined,
    'cet_requirement': BookOutlined,
    'computer_requirement': BookOutlined,
    'household_priority': IdcardOutlined,
    'second_choice_available': FileTextOutlined
  }
  return iconMap[field] || FileTextOutlined
}

const getValueIcon = (field: string, value: string) => {
  if (!value) return null
  
  if (field.includes('policy') || field.includes('available')) {
    if (value.includes('支持') || value.includes('有') || value.includes('优先')) {
      return CheckCircleOutlined
    }
    if (value.includes('不') || value.includes('无')) {
      return CloseCircleOutlined
    }
  }
  
  return null
}

const getValueClass = (field: string, value: string) => {
  if (!value) return 'value-empty'
  
  if (field.includes('salary') && value.includes('000')) {
    const match = value.match(/(\d+)/g)
    if (match && parseInt(match[0]) >= 8) return 'value-excellent'
    if (match && parseInt(match[0]) >= 6) return 'value-good'
  }
  
  if (field.includes('policy') || field.includes('available')) {
    if (value.includes('支持') || value.includes('有') || value.includes('优先')) {
      return 'value-good'
    }
    if (value.includes('不') || value.includes('无')) {
      return 'value-poor'
    }
  }
  
  return 'value-normal'
}

const getValueScore = (field: string, value: string): number | null => {
  if (!value) return null
  
  // 简单的评分逻辑
  if (field.includes('salary')) {
    const match = value.match(/(\d+)/g)
    if (match) {
      const salary = parseInt(match[0])
      return Math.min(100, Math.round(salary / 100))
    }
  }
  
  return null
}

const getAdvantages = (policy: PolicyInfo): string[] => {
  const advantages: string[] = []
  
  if (policy.salary_info?.bachelor_salary?.includes('8')) {
    advantages.push('高薪资')
  }
  
  if (policy.value_info?.is_best_value_city) {
    advantages.push('性价比最佳市')
  }
  
  if (policy.admission_policies?.second_choice_available?.includes('有')) {
    advantages.push('二志愿支持')
  }
  
  if (policy.basic_requirements?.household_priority?.includes('优先')) {
    advantages.push('户口优势')
  }
  
  return advantages
}

const getBestChoice = () => {
  if (props.policies.length === 0) {
    return { region: '', score: 0, reasons: [] }
  }
  
  // 简单的评分算法
  let bestPolicy = props.policies[0]
  let bestScore = 0
  
  props.policies.forEach(policy => {
    let score = 0
    
    // 薪资评分
    if (policy.salary_info?.bachelor_salary?.includes('8')) score += 30
    else if (policy.salary_info?.bachelor_salary?.includes('6')) score += 20
    
    // 性价比评分
    if (policy.value_info?.is_best_value_city) score += 25
    if (policy.value_info?.is_best_value_county) score += 20
    
    // 政策评分
    if (policy.admission_policies?.second_choice_available?.includes('有')) score += 15
    if (policy.basic_requirements?.household_priority?.includes('优先')) score += 10
    
    if (score > bestScore) {
      bestScore = score
      bestPolicy = policy
    }
  })
  
  const region = `${bestPolicy.province}${bestPolicy.city ? ` - ${bestPolicy.city}` : ''}`
  const reasons = getAdvantages(bestPolicy).map(advantage => `具有${advantage}优势`)
  
  return { region, score: bestScore, reasons }
}

const handleRemovePolicy = (dataIndex: string) => {
  const index = parseInt(dataIndex.split('_')[1])
  if (index >= 0 && index < props.policies.length) {
    emit('remove', props.policies[index])
  }
}

const handleClearAll = () => {
  emit('clear')
}

const handleExportComparison = () => {
  emit('export', props.policies)
  message.success('对比报告导出成功')
}

const handleSelectBest = () => {
  const bestChoice = getBestChoice()
  const bestPolicy = props.policies.find(p => 
    `${p.province}${p.city ? ` - ${p.city}` : ''}` === bestChoice.region
  )
  
  if (bestPolicy) {
    emit('select', bestPolicy)
    message.success(`已选择推荐地区：${bestChoice.region}`)
  }
}
</script>

<style scoped lang="less">
.comparison-tool {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

// 对比头部
.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border: 1px solid #91d5ff;
  border-radius: 8px;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1890ff;
    
    .title-icon {
      font-size: 18px;
    }
    
    .comparison-count {
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }
  }
}

// 空状态
.empty-comparison {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  
  .empty-icon {
    font-size: 64px;
    color: #d9d9d9;
  }
  
  p {
    color: #8c8c8c;
    margin-top: 16px;
    text-align: center;
  }
}

// 对比内容
.comparison-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 对比表格
.comparison-table {
  :deep(.ant-table-thead > tr > th) {
    background: #f8fbff;
    border: 1px solid #e6f7ff;
    padding: 8px;
  }
  
  :deep(.ant-table-tbody > tr > td) {
    padding: 8px;
    vertical-align: top;
  }
  
  .table-header-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-text {
      font-weight: 600;
      color: #333;
    }
  }
  
  .field-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .field-icon {
      color: #1890ff;
      font-size: 14px;
    }
    
    .field-name {
      font-weight: 500;
      color: #333;
    }
  }
  
  .value-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .value-icon {
      font-size: 12px;
    }
    
    .value-text {
      font-size: 13px;
    }
    
    .value-score {
      font-size: 11px;
      color: #1890ff;
      font-weight: 500;
    }
    
    &.value-excellent {
      .value-text {
        color: #52c41a;
        font-weight: 600;
      }
    }
    
    &.value-good {
      .value-text {
        color: #1890ff;
        font-weight: 500;
      }
      
      .value-icon {
        color: #52c41a;
      }
    }
    
    &.value-poor {
      .value-text {
        color: #ff4d4f;
      }
      
      .value-icon {
        color: #ff4d4f;
      }
    }
    
    &.value-normal {
      .value-text {
        color: #666;
      }
    }
    
    &.value-empty {
      .value-text {
        color: #d9d9d9;
      }
    }
  }
}

// 对比摘要
.comparison-summary {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  
  .summary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    
    .summary-icon {
      color: #52c41a;
      font-size: 16px;
    }
    
    .summary-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .summary-content {
    .summary-section {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }
    }
  }
  
  .advantage-items {
    .advantage-item {
      margin-bottom: 12px;
      
      .policy-name {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        margin-bottom: 6px;
      }
      
      .advantage-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  }
  
  .recommendation-result {
    .best-choice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%);
      border: 1px solid #d9f7be;
      border-radius: 6px;
      margin-bottom: 12px;
      
      .trophy-icon {
        color: #faad14;
        font-size: 16px;
      }
      
      .choice-text {
        color: #333;
        
        strong {
          color: #52c41a;
        }
      }
    }
    
    .recommendation-reasons {
      .reasons-title {
        font-size: 13px;
        font-weight: 500;
        color: #666;
        margin-bottom: 8px;
      }
      
      .reasons-list {
        margin: 0;
        padding-left: 20px;
        
        li {
          color: #666;
          font-size: 12px;
          margin-bottom: 4px;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}

// 对比操作
.comparison-actions {
  display: flex;
  justify-content: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

// 响应式优化
@media (max-width: 768px) {
  .comparison-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .table-header-cell {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  :deep(.ant-table) {
    font-size: 12px;
  }
}
</style>