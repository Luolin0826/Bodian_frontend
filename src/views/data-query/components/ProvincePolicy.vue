<template>
  <div class="province-policy-editor">
    <!-- 表单头部 -->
    <div class="form-header">
      <h3 class="form-title">
        <environment-outlined class="title-icon" />
        {{ region?.province || '省级政策编辑' }}
      </h3>
      <div class="form-actions">
        <a-button type="text" @click="handleReset" :disabled="!hasChanges">
          <undo-outlined />
          重置
        </a-button>
        <a-button type="text" @click="handlePreview">
          <eye-outlined />
          预览
        </a-button>
      </div>
    </div>

    <!-- 表单内容 -->
    <div class="form-content">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @valuesChange="handleFormChange"
        class="province-form"
      >
        <!-- 基础要求类 -->
        <div class="form-section">
          <h4 class="section-title">
            <safety-certificate-outlined class="section-icon" />
            基础要求
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="英语等级要求" 
              name="cet_requirement"
              :tooltip="'如：四级、六级、不限等'"
            >
              <a-select 
                v-model:value="formData.cet_requirement"
                placeholder="请选择英语等级要求"
                allow-clear
              >
                <a-select-option value="不限">不限</a-select-option>
                <a-select-option value="四级">四级</a-select-option>
                <a-select-option value="六级">六级</a-select-option>
                <a-select-option value="四级优先">四级优先</a-select-option>
                <a-select-option value="六级优先">六级优先</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item 
              label="计算机要求" 
              name="computer_requirement"
              :tooltip="'如：二级、三级、不限等'"
            >
              <a-select 
                v-model:value="formData.computer_requirement"
                placeholder="请选择计算机要求"
                allow-clear
              >
                <a-select-option value="不限">不限</a-select-option>
                <a-select-option value="二级">二级</a-select-option>
                <a-select-option value="三级">三级</a-select-option>
                <a-select-option value="二级优先">二级优先</a-select-option>
                <a-select-option value="三级优先">三级优先</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item 
              label="超龄是否允许" 
              name="overage_allowed"
              :tooltip="'应届生年龄限制相关规定'"
            >
              <a-radio-group v-model:value="formData.overage_allowed">
                <a-radio value="是">是</a-radio>
                <a-radio value="否">否</a-radio>
                <a-radio value="视情况而定">视情况而定</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item 
              label="是否非常看重户籍" 
              name="household_priority"
              :tooltip="'户籍对录取的影响程度'"
            >
              <a-radio-group v-model:value="formData.household_priority">
                <a-radio value="是">是</a-radio>
                <a-radio value="否">否</a-radio>
                <a-radio value="略有影响">略有影响</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>

        <!-- 专业相关 -->
        <div class="form-section">
          <h4 class="section-title">
            <book-outlined class="section-icon" />
            专业要求
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="本硕专业不一致可否通过网申" 
              name="major_mismatch_allowed"
              class="full-width"
            >
              <a-radio-group v-model:value="formData.major_mismatch_allowed">
                <a-radio value="可以">可以</a-radio>
                <a-radio value="不可以">不可以</a-radio>
                <a-radio value="视具体情况">视具体情况</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>

        <!-- 录取规则类 -->
        <div class="form-section">
          <h4 class="section-title">
            <file-text-outlined class="section-icon" />
            录取规则
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="非第一志愿是否通过网申" 
              name="non_first_choice_pass"
            >
              <a-radio-group v-model:value="formData.non_first_choice_pass">
                <a-radio value="是">是</a-radio>
                <a-radio value="否">否</a-radio>
                <a-radio value="很难">很难</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item 
              label="是否有二次志愿填报" 
              name="second_choice_available"
            >
              <a-radio-group v-model:value="formData.second_choice_available">
                <a-radio value="是">是</a-radio>
                <a-radio value="否">否</a-radio>
                <a-radio value="部分地区有">部分地区有</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item 
              label="一批进面没录取可以正常报考二批吗" 
              name="first_batch_fail_second_batch"
            >
              <a-radio-group v-model:value="formData.first_batch_fail_second_batch">
                <a-radio value="可以">可以</a-radio>
                <a-radio value="不可以">不可以</a-radio>
                <a-radio value="有限制">有限制</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item 
              label="延毕休学影响网申吗" 
              name="deferred_graduation_impact"
            >
              <a-radio-group v-model:value="formData.deferred_graduation_impact">
                <a-radio value="有影响">有影响</a-radio>
                <a-radio value="无影响">无影响</a-radio>
                <a-radio value="视情况而定">视情况而定</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item 
              label="校招给了地方但是不满意是否还可以参加一批" 
              name="campus_recruit_then_first_batch"
            >
              <a-radio-group v-model:value="formData.campus_recruit_then_first_batch">
                <a-radio value="可以">可以</a-radio>
                <a-radio value="不可以">不可以</a-radio>
                <a-radio value="需要放弃校招">需要放弃校招</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item 
              label="具体选岗方式" 
              name="position_selection_method"
              class="full-width"
            >
              <a-textarea 
                v-model:value="formData.position_selection_method"
                placeholder="请描述具体的选岗方式和流程"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 分数和录取 -->
        <div class="form-section">
          <h4 class="section-title">
            <calculator-outlined class="section-icon" />
            分数要求
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="综合成绩多少分稳一点" 
              name="stable_score_range"
            >
              <a-input 
                v-model:value="formData.stable_score_range"
                placeholder="如：75+、70-80分等"
              />
            </a-form-item>

            <a-form-item 
              label="报录比" 
              name="admission_ratio"
            >
              <a-input 
                v-model:value="formData.admission_ratio"
                placeholder="如：3:1、5:1等"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 证书和概率 -->
        <div class="form-section">
          <h4 class="section-title">
            <trophy-outlined class="section-icon" />
            证书要求
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="有一个证书网申概率" 
              name="single_cert_probability"
              class="full-width"
            >
              <a-textarea 
                v-model:value="formData.single_cert_probability"
                placeholder="请描述有证书对网申成功率的影响"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 特殊情况 -->
        <div class="form-section">
          <h4 class="section-title">
            <question-circle-outlined class="section-icon" />
            特殊情况
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="提前批岗位和一二批岗位质量有什么差异" 
              name="early_batch_difference"
              class="full-width"
            >
              <a-textarea 
                v-model:value="formData.early_batch_difference"
                placeholder="请描述提前批与一二批岗位的差异"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 详细规则 -->
        <div class="form-section">
          <h4 class="section-title">
            <file-protect-outlined class="section-icon" />
            详细信息
          </h4>
          <div class="form-grid">
            <a-form-item 
              label="详细录取规则" 
              name="detailed_rules"
              class="full-width"
            >
              <a-textarea 
                v-model:value="formData.detailed_rules"
                placeholder="请详细描述录取规则和流程"
                :rows="4"
                show-count
                :maxlength="1000"
              />
            </a-form-item>

            <a-form-item 
              label="网申不成文规定" 
              name="unwritten_rules"
              class="full-width"
            >
              <a-textarea 
                v-model:value="formData.unwritten_rules"
                placeholder="请描述网申过程中的隐性要求和潜规则"
                :rows="4"
                show-count
                :maxlength="1000"
              />
            </a-form-item>
          </div>
        </div>
      </a-form>
    </div>

    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      title="政策预览"
      width="800px"
      :footer="null"
    >
      <div class="preview-content">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item 
            v-for="(value, key) in formData" 
            :key="key"
            :label="getFieldLabel(key)"
            :span="isFullWidthField(key) ? 2 : 1"
          >
            <span v-if="value" class="preview-value">{{ value }}</span>
            <span v-else class="empty-value">未设置</span>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  EnvironmentOutlined,
  UndoOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  FileProtectOutlined
} from '@ant-design/icons-vue'

// 类型定义
interface Region {
  region_id: number
  province?: string
  city?: string
  company?: string
  region_level: 'province' | 'city' | 'company'
  region_code: string
}

interface PolicyData {
  [key: string]: any
}

// Props
interface Props {
  region?: Region | null
  policyData?: PolicyData
}

const props = withDefaults(defineProps<Props>(), {
  region: null,
  policyData: () => ({})
})

// Emits
const emit = defineEmits<{
  'policy-changed': [data: PolicyData]
  'form-valid': [valid: boolean]
}>()

// 响应式数据
const formRef = ref<FormInstance>()
const previewVisible = ref(false)
const originalData = ref<PolicyData>({})

// 表单数据
const formData = reactive<PolicyData>({
  cet_requirement: '',
  computer_requirement: '',
  overage_allowed: '',
  household_priority: '',
  major_mismatch_allowed: '',
  non_first_choice_pass: '',
  second_choice_available: '',
  first_batch_fail_second_batch: '',
  deferred_graduation_impact: '',
  campus_recruit_then_first_batch: '',
  position_selection_method: '',
  stable_score_range: '',
  admission_ratio: '',
  single_cert_probability: '',
  early_batch_difference: '',
  detailed_rules: '',
  unwritten_rules: ''
})

// 表单验证规则
const formRules: Record<string, Rule[]> = {
  admission_ratio: [
    { pattern: /^\d+:\d+$|^[\d\.]+-[\d\.]+:\d+$/, message: '请输入正确的比例格式，如：3:1', trigger: 'blur' }
  ]
}

// 字段标签映射
const fieldLabels: Record<string, string> = {
  cet_requirement: '英语等级要求',
  computer_requirement: '计算机要求',
  overage_allowed: '超龄是否允许',
  household_priority: '是否非常看重户籍',
  major_mismatch_allowed: '本硕专业不一致可否通过网申',
  non_first_choice_pass: '非第一志愿是否通过网申',
  second_choice_available: '是否有二次志愿填报',
  first_batch_fail_second_batch: '一批进面没录取可以正常报考二批吗',
  deferred_graduation_impact: '延毕休学影响网申吗',
  campus_recruit_then_first_batch: '校招给了地方但是不满意是否还可以参加一批',
  position_selection_method: '具体选岗方式',
  stable_score_range: '综合成绩多少分稳一点',
  admission_ratio: '报录比',
  single_cert_probability: '有一个证书网申概率',
  early_batch_difference: '提前批岗位和一二批岗位质量有什么差异',
  detailed_rules: '详细录取规则',
  unwritten_rules: '网申不成文规定'
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData) !== JSON.stringify(originalData.value)
})

// 方法
const getFieldLabel = (fieldName: string): string => {
  return fieldLabels[fieldName] || fieldName
}

const isFullWidthField = (fieldName: string): boolean => {
  const fullWidthFields = [
    'major_mismatch_allowed',
    'position_selection_method',
    'single_cert_probability',
    'early_batch_difference',
    'detailed_rules',
    'unwritten_rules'
  ]
  return fullWidthFields.includes(fieldName)
}

const handleFormChange = () => {
  nextTick(() => {
    // 验证表单
    formRef.value?.validate()
      .then(() => {
        emit('form-valid', true)
      })
      .catch(() => {
        emit('form-valid', false)
      })
    
    // 发出数据变更事件
    emit('policy-changed', { ...formData })
  })
}

const handleReset = () => {
  Object.assign(formData, originalData.value)
  message.info('已重置为原始数据')
}

const handlePreview = () => {
  previewVisible.value = true
}

// 控制初始化状态，避免在数据加载时触发不必要的事件
let isInitializing = false

// 监听政策数据变化
watch(() => props.policyData, (newData) => {
  if (newData) {
    isInitializing = true
    
    // 保存原始数据用于重置
    originalData.value = { ...newData }
    
    // 更新表单数据
    Object.assign(formData, newData)
    
    // 延迟重置初始化标志，确保DOM更新完成
    nextTick(() => {
      isInitializing = false
    })
  }
}, { immediate: true, deep: true })

// 监听表单数据变化，实时触发policy-changed事件
watch(formData, (newFormData) => {
  if (!isInitializing) {
    emit('policy-changed', { ...newFormData })
  }
}, { deep: true })

// 监听区域变化
watch(() => props.region, (newRegion) => {
  if (newRegion && newRegion.region_level === 'province') {
    // 重置表单数据
    Object.keys(formData).forEach(key => {
      formData[key] = ''
    })
  }
})
</script>

<style scoped lang="less">
.province-policy-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    
    .form-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
      
      .title-icon {
        color: #1890ff;
        font-size: 16px;
      }
    }
    
    .form-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .form-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    
    .province-form {
      max-width: 1000px;
      margin: 0 auto;
    }
  }
  
  .form-section {
    margin-bottom: 32px;
    background: #fafafa;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #f0f0f0;
    
    .section-title {
      margin: 0 0 20px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #e8e8e8;
      padding-bottom: 12px;
      
      .section-icon {
        color: #1890ff;
        font-size: 14px;
      }
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      
      :deep(.ant-form-item) {
        margin-bottom: 16px;
        
        &.full-width {
          grid-column: 1 / -1;
        }
        
        .ant-form-item-label {
          padding-bottom: 4px;
          
          label {
            font-size: 13px;
            font-weight: 500;
            color: #333;
          }
        }
        
        .ant-form-item-control {
          .ant-input,
          .ant-select,
          .ant-textarea {
            border-radius: 4px;
          }
          
          .ant-radio-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            
            .ant-radio-wrapper {
              font-size: 13px;
            }
          }
        }
      }
    }
  }
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
  
  :deep(.ant-descriptions) {
    .ant-descriptions-item-label {
      background: #fafafa;
      font-weight: 500;
    }
    
    .preview-value {
      color: #333;
    }
    
    .empty-value {
      color: #999;
      font-style: italic;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .province-policy-editor {
    .form-header {
      padding: 12px 16px;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .form-title {
        font-size: 14px;
        justify-content: center;
      }
      
      .form-actions {
        justify-content: center;
      }
    }
    
    .form-content {
      padding: 16px;
    }
    
    .form-section {
      padding: 16px;
      margin-bottom: 20px;
      
      .section-title {
        font-size: 13px;
        margin-bottom: 16px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        
        :deep(.ant-form-item) {
          margin-bottom: 12px;
          
          .ant-form-item-label label {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>