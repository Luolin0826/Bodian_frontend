<template>
  <div class="company-policy-editor">
    <!-- 表单头部 -->
    <div class="form-header">
      <h3 class="form-title">
        <bank-outlined class="title-icon" />
        {{ region?.company || region?.city || '区县公司政策编辑' }}
      </h3>
      <div class="form-subtitle">
        <span class="subtitle-text">
          {{ region?.province }} > {{ region?.city }}
          <template v-if="region?.company"> > {{ region?.company }}</template>
        </span>
      </div>
      <div class="form-actions">
        <a-button type="text" @click="handleReset" :disabled="!hasChanges">
          <undo-outlined />
          重置
        </a-button>
        <a-button type="text" @click="handlePreview">
          <eye-outlined />
          预览
        </a-button>
        <a-button type="text" @click="handleCopyFrom">
          <copy-outlined />
          复制政策
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
        class="company-form"
      >
        <!-- 学历要求 - 本科 -->
        <div class="form-section">
          <h4 class="section-title">
            <graduation-cap-outlined class="section-icon" />
            本科学历要求
          </h4>
          <div class="form-grid">
            <a-form-item label="985本科" name="bachelor_985">
              <a-radio-group v-model:value="formData.bachelor_985">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="211本科" name="bachelor_211">
              <a-radio-group v-model:value="formData.bachelor_211">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省内双一流本科" name="bachelor_provincial_double_first">
              <a-radio-group v-model:value="formData.bachelor_provincial_double_first">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省外双一流本科" name="bachelor_external_double_first">
              <a-radio-group v-model:value="formData.bachelor_external_double_first">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省内双非一本" name="bachelor_provincial_non_double_first">
              <a-radio-group v-model:value="formData.bachelor_provincial_non_double_first">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省外双非一本" name="bachelor_external_non_double_first">
              <a-radio-group v-model:value="formData.bachelor_external_non_double_first">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省内二本" name="bachelor_provincial_second_tier">
              <a-radio-group v-model:value="formData.bachelor_provincial_second_tier">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="视情况">视情况</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省外二本" name="bachelor_external_second_tier">
              <a-radio-group v-model:value="formData.bachelor_external_second_tier">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="视情况">视情况</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="民办本科" name="bachelor_private">
              <a-radio-group v-model:value="formData.bachelor_private">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="很难">很难</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="专升本" name="bachelor_upgraded">
              <a-radio-group v-model:value="formData.bachelor_upgraded">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="很难">很难</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="专科" name="associate_degree">
              <a-radio-group v-model:value="formData.associate_degree">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="特殊岗位">特殊岗位</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>

        <!-- 学历要求 - 硕士 -->
        <div class="form-section">
          <h4 class="section-title">
            <book-outlined class="section-icon" />
            硕士学历要求
          </h4>
          <div class="form-grid">
            <a-form-item label="985硕士" name="master_985">
              <a-radio-group v-model:value="formData.master_985">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="211硕士" name="master_211">
              <a-radio-group v-model:value="formData.master_211">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省内双一流硕士" name="master_provincial_double_first">
              <a-radio-group v-model:value="formData.master_provincial_double_first">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省外双一流硕士" name="master_external_double_first">
              <a-radio-group v-model:value="formData.master_external_double_first">
                <a-radio value="要求">要求</a-radio>
                <a-radio value="不要求">不要求</a-radio>
                <a-radio value="优先">优先</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省内双非硕士" name="master_provincial_non_double">
              <a-radio-group v-model:value="formData.master_provincial_non_double">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="视情况">视情况</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="省外双非硕士" name="master_external_non_double">
              <a-radio-group v-model:value="formData.master_external_non_double">
                <a-radio value="接受">接受</a-radio>
                <a-radio value="不接受">不接受</a-radio>
                <a-radio value="视情况">视情况</a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </div>

        <!-- 薪资待遇 -->
        <div class="form-section">
          <h4 class="section-title">
            <money-collect-outlined class="section-icon" />
            薪资待遇
          </h4>
          <div class="form-grid">
            <a-form-item label="本科薪资待遇" name="bachelor_salary" :rules="salaryRules">
              <a-input 
                v-model:value="formData.bachelor_salary"
                placeholder="如：12-15万"
                addonAfter="万"
              />
            </a-form-item>

            <a-form-item label="硕士薪资待遇" name="master_salary" :rules="salaryRules">
              <a-input 
                v-model:value="formData.master_salary"
                placeholder="如：15-18万"
                addonAfter="万"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 分数要求 -->
        <div class="form-section">
          <h4 class="section-title">
            <calculator-outlined class="section-icon" />
            分数要求
          </h4>
          <div class="form-grid">
            <a-form-item label="本科进面线" name="bachelor_interview_line">
              <a-input 
                v-model:value="formData.bachelor_interview_line"
                placeholder="如：65分、70+"
              />
            </a-form-item>

            <a-form-item label="本科综合分" name="bachelor_comprehensive_score">
              <a-input 
                v-model:value="formData.bachelor_comprehensive_score"
                placeholder="如：75分、80+"
              />
            </a-form-item>

            <a-form-item label="硕士进面分" name="master_interview_line">
              <a-input 
                v-model:value="formData.master_interview_line"
                placeholder="如：68分、75+"
              />
            </a-form-item>
          </div>
        </div>

        <!-- 性价比评估 -->
        <div class="form-section">
          <h4 class="section-title">
            <star-outlined class="section-icon" />
            性价比评估
          </h4>
          <div class="form-grid">
            <a-form-item label="是否性价比最高的市" name="is_best_value_city">
              <a-radio-group v-model:value="formData.is_best_value_city">
                <a-radio value="是">是</a-radio>
                <a-radio value="否">否</a-radio>
                <a-radio value="较高">较高</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="是否性价比最高的区县" name="is_best_value_county">
              <a-radio-group v-model:value="formData.is_best_value_county">
                <a-radio value="是">是</a-radio>
                <a-radio value="否">否</a-radio>
                <a-radio value="较高">较高</a-radio>
              </a-radio-group>
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
          >
            <span v-if="value" class="preview-value">{{ formatPreviewValue(key, value) }}</span>
            <span v-else class="empty-value">未设置</span>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <!-- 复制政策模态框 -->
    <a-modal
      v-model:open="copyFromVisible"
      title="复制政策配置"
      @ok="handleConfirmCopy"
      @cancel="copyFromVisible = false"
    >
      <div class="copy-from-content">
        <p>选择要复制政策的源区域：</p>
        <a-select
          v-model:value="selectedCopySource"
          placeholder="请选择源区域"
          style="width: 100%"
          show-search
          :filter-option="filterCopyOptions"
        >
          <a-select-option 
            v-for="option in copySourceOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  BankOutlined,
  UndoOutlined,
  EyeOutlined,
  CopyOutlined,
  BookOutlined as GraduationCapOutlined,
  BookOutlined,
  MoneyCollectOutlined,
  CalculatorOutlined,
  StarOutlined
} from '@ant-design/icons-vue'
import { policyManagementAPI } from '@/api/policies'

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

interface CopySourceOption {
  value: number
  label: string
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
const copyFromVisible = ref(false)
const originalData = ref<PolicyData>({})
const selectedCopySource = ref<number | null>(null)
const copySourceOptions = ref<CopySourceOption[]>([])

// 表单数据
const formData = reactive<PolicyData>({
  // 本科学历
  bachelor_985: '',
  bachelor_211: '',
  bachelor_provincial_double_first: '',
  bachelor_external_double_first: '',
  bachelor_provincial_non_double_first: '',
  bachelor_external_non_double_first: '',
  bachelor_provincial_second_tier: '',
  bachelor_external_second_tier: '',
  bachelor_private: '',
  bachelor_upgraded: '',
  associate_degree: '',
  
  // 硕士学历
  master_985: '',
  master_211: '',
  master_provincial_double_first: '',
  master_external_double_first: '',
  master_provincial_non_double: '',
  master_external_non_double: '',
  
  // 薪资待遇
  bachelor_salary: '',
  master_salary: '',
  
  // 分数要求
  bachelor_interview_line: '',
  bachelor_comprehensive_score: '',
  master_interview_line: '',
  
  // 性价比
  is_best_value_city: '',
  is_best_value_county: ''
})

// 验证规则
const salaryRules: Rule[] = [
  { 
    pattern: /^\d+-\d+$|^\d+$/, 
    message: '请输入正确的薪资格式，如：12-15 或 12', 
    trigger: 'blur' 
  }
]

const formRules: Record<string, Rule[]> = {
  bachelor_salary: salaryRules,
  master_salary: salaryRules
}

// 字段标签映射
const fieldLabels: Record<string, string> = {
  bachelor_985: '985本科',
  bachelor_211: '211本科',
  bachelor_provincial_double_first: '省内双一流本科',
  bachelor_external_double_first: '省外双一流本科',
  bachelor_provincial_non_double_first: '省内双非一本',
  bachelor_external_non_double_first: '省外双非一本',
  bachelor_provincial_second_tier: '省内二本',
  bachelor_external_second_tier: '省外二本',
  bachelor_private: '民办本科',
  bachelor_upgraded: '专升本',
  associate_degree: '专科',
  master_985: '985硕士',
  master_211: '211硕士',
  master_provincial_double_first: '省内双一流硕士',
  master_external_double_first: '省外双一流硕士',
  master_provincial_non_double: '省内双非硕士',
  master_external_non_double: '省外双非硕士',
  bachelor_salary: '本科薪资待遇',
  master_salary: '硕士薪资待遇',
  bachelor_interview_line: '本科进面线',
  bachelor_comprehensive_score: '本科综合分',
  master_interview_line: '硕士进面分',
  is_best_value_city: '是否性价比最高的市',
  is_best_value_county: '是否性价比最高的区县'
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(formData) !== JSON.stringify(originalData.value)
})

// 方法
const getFieldLabel = (fieldName: string): string => {
  return fieldLabels[fieldName] || fieldName
}

const formatPreviewValue = (fieldName: string, value: any): string => {
  if (fieldName.includes('salary') && value) {
    return value + '万'
  }
  return value
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

const handleCopyFrom = async () => {
  // 加载可复制的源选项
  await loadCopySourceOptions()
  copyFromVisible.value = true
}

const loadCopySourceOptions = async () => {
  try {
    // 获取同省份下的所有公司
    const regions = await policyManagementAPI.getRegions({
      region_level: 'company',
      province: props.region?.province
    })
    
    copySourceOptions.value = regions
      .filter(region => region.region_id !== props.region?.region_id)
      .map(region => ({
        value: region.region_id,
        label: `${region.city || '未知城市'} - ${region.company || '未知公司'}`
      }))
  } catch (error) {
    console.error('加载复制源选项失败:', error)
    message.error('加载可复制的政策源失败')
  }
}

const filterCopyOptions = (input: string, option: any) => {
  return option.children.toLowerCase().includes(input.toLowerCase())
}

// 控制初始化状态，避免在数据加载时触发不必要的事件
let isInitializing = false

const handleConfirmCopy = async () => {
  if (!selectedCopySource.value) {
    message.error('请选择要复制的源区域')
    return
  }
  
  try {
    // 使用新的层级API获取源区域的政策数据
    const sourceRegionPolicies = await policyManagementAPI.getRegionPolicies(selectedCopySource.value)
    
    if (sourceRegionPolicies.policies?.company) {
      // 复制公司政策数据到当前表单
      Object.assign(formData, sourceRegionPolicies.policies.company)
      message.success('政策配置复制成功')
    } else {
      message.warning('源区域暂无公司政策配置')
    }
    
    copyFromVisible.value = false
    selectedCopySource.value = null
  } catch (error) {
    console.error('复制政策失败:', error)
    message.error('复制政策失败，请重试')
  }
}

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
  if (newRegion && newRegion.region_level === 'company') {
    // 重置表单数据
    Object.keys(formData).forEach(key => {
      formData[key] = ''
    })
  }
})

onMounted(() => {
  console.log('CompanyPolicy component mounted')
})
</script>

<style scoped lang="less">
.company-policy-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .form-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    
    .form-title {
      margin: 0 0 4px 0;
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
    
    .form-subtitle {
      margin-bottom: 12px;
      
      .subtitle-text {
        font-size: 12px;
        color: #666;
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
    
    .company-form {
      max-width: 1200px;
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
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      
      :deep(.ant-form-item) {
        margin-bottom: 16px;
        
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
          .ant-select {
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

.preview-content,
.copy-from-content {
  :deep(.ant-descriptions) {
    .ant-descriptions-item-label {
      background: #fafafa;
      font-weight: 500;
      width: 35%;
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

.copy-from-content {
  p {
    margin-bottom: 16px;
    color: #666;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .company-policy-editor {
    .form-header {
      padding: 12px 16px;
      
      .form-title {
        font-size: 14px;
      }
      
      .form-subtitle .subtitle-text {
        font-size: 11px;
      }
      
      .form-actions {
        margin-top: 8px;
        flex-wrap: wrap;
        gap: 6px;
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
          
          .ant-radio-group .ant-radio-wrapper {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>