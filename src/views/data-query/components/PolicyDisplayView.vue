<template>
  <div class="policy-display-view">
    <!-- 基本政策信息 -->
    <div class="basic-policy-section">
      <div class="section-header">
        <h3 class="section-title">
          <bank-outlined class="title-icon" />
          基本政策信息
        </h3>
        <div class="section-actions">
          <a-tooltip title="管理自定义字段 - 可以添加、编辑和删除政策相关的自定义字段">
            <a-button 
              type="primary" 
              size="small"
              @click="showCustomFieldManager"
              class="custom-field-btn"
            >
              <setting-outlined />
              自定义字段
            </a-button>
          </a-tooltip>
          <a-button type="text" @click="handleRefresh" :loading="loading">
            <reload-outlined />
            刷新
          </a-button>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载基本政策信息...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>
      
      <!-- 基本政策信息展示 -->
      <div v-else-if="provincePolicyData || customFields.length > 0" class="basic-policy-grid">
        <!-- 自定义字段使用提示 -->
        <div v-if="customFields.length === 0 && Object.keys(visibleBasicFields).length === 0" class="custom-field-hint">
          <div class="hint-content">
            <setting-outlined class="hint-icon" />
            <h4>开始使用自定义字段</h4>
            <p>点击上方"自定义字段"按钮，可以添加您需要的政策字段：</p>
            <ul>
              <li>📝 添加文本、数字、选择器等不同类型的字段</li>
              <li>🎯 按省份设置不同的字段配置</li>
              <li>✏️ 支持编辑和删除已有字段</li>
              <li>👁️ 实时预览字段显示效果</li>
            </ul>
            <a-button 
              type="primary" 
              @click="showCustomFieldManager"
              class="start-btn"
            >
              立即开始
            </a-button>
          </div>
        </div>
        
        <!-- 政策字段显示 -->
        <div
          v-for="(fieldConfig, fieldName) in visibleBasicFields"
          :key="fieldName"
          class="policy-item"
          :class="{ 'custom-field-item': fieldConfig.isCustomField }"
        >
          <div class="policy-label">
            <span class="label-text">{{ fieldConfig.display_name }}</span>
            <a-tag v-if="fieldConfig.isCustomField" size="small" color="blue" class="custom-tag">
              自定义
            </a-tag>
            <a-tooltip v-if="fieldConfig.description" :title="fieldConfig.description">
              <question-circle-outlined class="field-help" />
            </a-tooltip>
          </div>
          <div class="policy-value">
            <div v-if="fieldConfig.type === 'textarea'" class="value-textarea">
              {{ formatValue(fieldConfig.value) }}
            </div>
            <a-tag v-else-if="fieldConfig.type === 'select'" :color="getSelectColor(fieldConfig.value)">
              {{ formatValue(fieldConfig.value) }}
            </a-tag>
            <span v-else class="value-text">{{ formatValue(fieldConfig.value) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 无数据状态 -->
      <div v-else class="no-data-state">
        <a-empty description="暂无基本政策信息">
          <template #image>
            <bank-outlined class="empty-icon" />
          </template>
          <p class="empty-hint">该区域的基本政策信息待完善</p>
        </a-empty>
      </div>
    </div>

    <!-- 提前批和农网板块 (2列布局) -->
    <div class="batch-sections">
      <div class="batch-grid">
        <!-- 提前批板块 -->
        <div class="batch-column">
          <EarlyBatchInfo
            :unit-id="unitId"
            :unit-info="unitInfo"
            :default-expanded="true"
            @data-loaded="handleEarlyBatchLoaded"
            @add-field="handleAddField"
          />
        </div>
        
        <!-- 农网板块 -->
        <div class="batch-column">
          <RuralGridInfo
            :unit-id="unitId"
            :unit-info="unitInfo"
            :default-expanded="true"
            @data-loaded="handleRuralGridLoaded"
            @add-field="handleAddField"
          />
        </div>
      </div>
    </div>

    <!-- 地市县情况概览 -->
    <div class="regional-overview-section">
      <RegionalOverview
        :unit-id="unitId"
        :unit-info="unitInfo"
        @data-loaded="handleRegionalOverviewLoaded"
      />
    </div>
    
    <!-- 自定义字段管理器 -->
    <CustomFieldManager
      v-model:open="customFieldManagerVisible"
      @field-updated="handleFieldUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  BankOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import { policyManagementAPI, getProvincePolicies, customFieldsAPI } from '@/api/policies'
import EarlyBatchInfo from './EarlyBatchInfo.vue'
import RuralGridInfo from './RuralGridInfo.vue'
import RegionalOverview from './RegionalOverview.vue'
import CustomFieldManager from './CustomFieldManager.vue'

// Props
interface Props {
  unitId?: number | null
  unitInfo?: any
  regionId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  unitId: null,
  unitInfo: null,
  regionId: null
})

// Emits
const emit = defineEmits<{
  'data-loaded': [data: any]
  'loading-change': [loading: boolean]
}>()

// 响应式数据
const loading = ref(false)
const provincePolicyData = ref<any>(null)
const earlyBatchData = ref<any>(null)
const ruralGridData = ref<any>(null)
const regionalOverviewData = ref<any>(null)
const customFieldManagerVisible = ref(false)
const customFields = ref<any[]>([])
const customFieldValues = ref<Record<string, any>>({})

// 计算省份名称
const currentProvince = computed(() => {
  if (!props.unitInfo?.unit_name) return ''
  
  // 从单位名称中提取省份信息
  const unitName = props.unitInfo.unit_name
  if (unitName.includes('省')) {
    const match = unitName.match(/([\u4e00-\u9fa5]+)省/)
    if (match) {
      return match[1] + '省'
    }
  }
  
  // 处理直辖市
  if (unitName.includes('北京')) return '北京'
  if (unitName.includes('上海')) return '上海'
  if (unitName.includes('天津')) return '天津'
  if (unitName.includes('重庆')) return '重庆'
  
  return ''
})

// 基本政策字段配置 (根据province_policies表结构，从四六级到校招字段，移除录取人数)
const basicPolicyFields = reactive({
  cet_requirement: {
    display_name: '四六级要求',
    type: 'select',
    description: '英语等级考试要求'
  },
  computer_requirement: {
    display_name: '计算机等级要求',
    type: 'select',
    description: '计算机等级考试要求'
  },
  overage_allowed: {
    display_name: '超龄能否通过',
    type: 'select',
    description: '年龄超出要求是否可以通过'
  },
  household_priority: {
    display_name: '是否非常看重户籍',
    type: 'select',
    description: '户籍对录取的影响程度'
  },
  non_first_choice_pass: {
    display_name: '非第一志愿是否通过网申',
    type: 'select',
    description: '非第一志愿的通过情况'
  },
  detailed_rules: {
    display_name: '详细录取规则',
    type: 'textarea',
    description: '具体的录取流程和规则'
  },
  unwritten_rules: {
    display_name: '网申不成文规定',
    type: 'textarea',
    description: '网申过程中的隐性规定'
  },
  stable_score_range: {
    display_name: '综合成绩多少分稳一点',
    type: 'text',
    description: '相对稳妥的分数范围'
  },
  single_cert_probability: {
    display_name: '有一个证书网申概率',
    type: 'textarea',
    description: '拥有证书对网申成功率的影响'
  },
  admission_ratio: {
    display_name: '报录比',
    type: 'text',
    description: '报名与录取的比例'
  },
  major_mismatch_allowed: {
    display_name: '本硕专业不一致可否通过网申',
    type: 'select',
    description: '专业不匹配的通过可能性'
  },
  first_batch_fail_second_batch: {
    display_name: '一批进面没录取可否正常报考二批',
    type: 'select',
    description: '批次间报考的限制情况'
  },
  deferred_graduation_impact: {
    display_name: '延毕休学影响网申吗',
    type: 'select',
    description: '学业延期对申请的影响'
  },
  second_choice_available: {
    display_name: '是否有二次志愿填报',
    type: 'select',
    description: '二次填报志愿的机会'
  },
  position_selection_method: {
    display_name: '具体选岗方式',
    type: 'textarea',
    description: '岗位选择的具体流程和方法'
  },
  early_batch_difference: {
    display_name: '提前批岗位和一二批岗位质量差异',
    type: 'textarea',
    description: '不同批次岗位质量的比较'
  },
  campus_recruit_then_first_batch: {
    display_name: '校招给了地方但是不满意是否还可以参加一批',
    type: 'select',
    description: '校招后是否能继续参加统一批次'
  }
})

// 计算属性
const visibleBasicFields = computed(() => {
  if (!provincePolicyData.value && customFields.value.length === 0) return {}
  
  const result: Record<string, any> = {}
  
  // 显示系统默认字段
  if (provincePolicyData.value) {
    Object.keys(basicPolicyFields).forEach(fieldName => {
      const fieldConfig = basicPolicyFields[fieldName]
      const fieldValue = provincePolicyData.value[fieldName]
      
      // 只显示有数据的字段
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        result[fieldName] = {
          ...fieldConfig,
          value: fieldValue,
          isCustomField: false
        }
      }
    })
  }
  
  // 显示自定义字段
  customFields.value.forEach(customField => {
    if (customField.is_active !== false) {
      const fieldValue = customFieldValues.value[customField.field_name] || ''
      
      // 显示所有启用的自定义字段（即使没有值也显示）
      result[`custom_${customField.field_name}`] = {
        display_name: customField.display_name,
        type: customField.field_type,
        description: customField.field_description,
        value: fieldValue,
        isCustomField: true,
        customFieldId: customField.id,
        isRequired: customField.is_required || false
      }
    }
  })
  
  return result
})

// 方法
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' && value.trim() === '') return '-'
  return String(value)
}

const getSelectColor = (value: any): string => {
  const colorMap: Record<string, string> = {
    '是': 'green',
    '否': 'red',
    '可以': 'green',
    '不可以': 'red',
    '很难': 'volcano',
    '视情况而定': 'orange',
    '视具体情况': 'orange',
    '有影响': 'red',
    '无影响': 'green',
    '有限制': 'orange',
    '部分地区有': 'blue',
    '需要放弃校招': 'volcano'
  }
  
  return colorMap[String(value)] || 'default'
}

const handleRefresh = async () => {
  if (props.regionId) {
    await loadProvincePolicyData(props.regionId)
  }
}

const handleEarlyBatchLoaded = (data: any) => {
  earlyBatchData.value = data
  console.log('提前批数据加载完成:', data)
}

const handleRuralGridLoaded = (data: any) => {
  ruralGridData.value = data
  console.log('农网数据加载完成:', data)
}

const handleRegionalOverviewLoaded = (data: any) => {
  regionalOverviewData.value = data
  console.log('地市县概览数据加载完成:', data)
}

const showCustomFieldManager = () => {
  customFieldManagerVisible.value = true
}

const handleFieldUpdated = async (section: string) => {
  console.log('字段更新，板块:', section)
  // 刷新相关板块数据
  if (section === 'basic' && props.regionId) {
    await loadProvincePolicyData(props.regionId)
  }
  // 重新加载自定义字段
  await loadCustomFields()
}

const handleAddField = (moduleType: string, moduleInfo: any) => {
  console.log('添加字段请求:', moduleType, moduleInfo)
  
  // 显示自定义字段管理器，并传递模块信息
  customFieldManagerVisible.value = true
  
  // 可以在这里设置特定的模块上下文，比如预填充字段名称等
  // 这个功能可以在CustomFieldManager组件中扩展
  message.info(`正在为${moduleInfo.sectionName}添加自定义字段`)
}

const loadCustomFields = async () => {
  if (!props.unitId && !props.regionId) return
  
  try {
    if (props.unitId) {
      // 使用合并接口，一次获取字段定义和值
      const response = await customFieldsAPI.getCustomFieldValues(
        props.unitId, 
        'basic', 
        currentProvince.value, 
        true // includeDefinitions
      )
      
      if (response.fields) {
        // 从合并接口提取字段定义和值
        customFields.value = response.fields.map((field: any) => ({
          field_id: field.field_id,
          field_name: field.field_name,
          display_name: field.display_name,
          field_type: field.field_type,
          section: field.section,
          province: field.province,
          is_required: field.is_required,
          display_order: field.display_order,
          field_content: field.field_content
        }))
        
        // 提取字段值
        customFieldValues.value = {}
        response.fields.forEach((field: any) => {
          if (field.has_value && field.field_value) {
            customFieldValues.value[field.field_name] = field.field_value
          }
        })
      }
    } else {
      // 仅需要字段定义（用于地区政策显示）
      const fieldsResponse = await customFieldsAPI.getCustomFields({
        section: 'basic'
      })
      customFields.value = fieldsResponse.fields || []
    }
    
    console.log('自定义字段加载成功:', customFields.value, customFieldValues.value)
  } catch (error) {
    console.error('加载自定义字段失败:', error)
  }
}

const loadProvincePolicyData = async (regionId: number) => {
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 优先使用新的province_policies API
    try {
      const policyData = await getProvincePolicies(regionId)
      provincePolicyData.value = policyData.policy_info || policyData
    } catch (newApiError) {
      console.warn('新API失败，尝试使用政策管理API:', newApiError)
      // 回退到政策管理API
      const policyData = await policyManagementAPI.getProvincePolicy(regionId)
      provincePolicyData.value = policyData.policy_data || policyData
    }
    
    // 加载自定义字段
    await loadCustomFields()
    
    emit('data-loaded', {
      type: 'province_policy',
      data: provincePolicyData.value
    })
    
    console.log('✅ 省级政策数据加载成功:', provincePolicyData.value)
  } catch (error) {
    console.error('❌ 加载省级政策数据失败:', error)
    message.error('加载基本政策信息失败，请重试')
    provincePolicyData.value = null
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

// 监听regionId变化
watch(() => props.regionId, (newRegionId) => {
  if (newRegionId) {
    loadProvincePolicyData(newRegionId)
  } else {
    provincePolicyData.value = null
  }
}, { immediate: true })

// 初始化
onMounted(() => {
  if (props.regionId) {
    loadProvincePolicyData(props.regionId)
  }
})
</script>

<style scoped lang="less">
.policy-display-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  // 基本政策信息区域
  .basic-policy-section {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
      
      .section-title {
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
      
      .section-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .loading-container {
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      
      .loading-placeholder {
        width: 100%;
        height: 200px;
      }
    }
    
    // 基本政策信息网格
    .basic-policy-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 16px;
      }
      
      .policy-item {
        background: #fafafa;
        border: 1px solid #e8e8e8;
        border-radius: 6px;
        padding: 14px;
        transition: all 0.2s ease;
        
        &:hover {
          background: #f5f5f5;
          border-color: #d9d9d9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        &.custom-field-item {
          background: #f0f8ff;
          border-color: #91d5ff;
          
          &:hover {
            background: #e6f7ff;
            border-color: #40a9ff;
          }
        }
        
        .policy-label {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
          
          .label-text {
            font-size: 13px;
            font-weight: 600;
            color: #262626;
          }
          
          .custom-tag {
            margin-left: 4px;
            font-size: 10px;
            line-height: 1.2;
            height: auto;
            padding: 1px 4px;
          }
        }
        
        .custom-field-hint {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
          border: 2px dashed #1890ff;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          margin-bottom: 16px;
          
          .hint-content {
            max-width: 500px;
            margin: 0 auto;
            
            .hint-icon {
              font-size: 48px;
              color: #1890ff;
              margin-bottom: 16px;
              display: block;
            }
            
            h4 {
              font-size: 18px;
              color: #1890ff;
              margin-bottom: 12px;
              font-weight: 600;
            }
            
            p {
              font-size: 14px;
              color: #666;
              margin-bottom: 16px;
            }
            
            ul {
              text-align: left;
              margin: 16px 0;
              padding-left: 20px;
              
              li {
                font-size: 13px;
                color: #555;
                line-height: 1.6;
                margin-bottom: 8px;
              }
            }
            
            .start-btn {
              margin-top: 16px;
              padding: 8px 24px;
              height: auto;
              border-radius: 8px;
              font-weight: 500;
            }
          }
        }
      }
      
      .custom-field-btn {
        background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
        border: none;
        border-radius: 6px;
        font-weight: 500;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }
          
          .field-help {
            font-size: 12px;
            color: #1890ff;
            cursor: help;
            
            &:hover {
              color: #40a9ff;
            }
          }
        }
        
        .policy-value {
          .value-text {
            font-size: 13px;
            color: #595959;
            line-height: 1.5;
          }
          
          .value-textarea {
            font-size: 13px;
            color: #595959;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 120px;
            overflow-y: auto;
          }
          
          :deep(.ant-tag) {
            font-size: 12px;
            font-weight: 500;
          }
        }
      }
    }
    
    .no-data-state {
      padding: 40px;
      text-align: center;
      
      .empty-icon {
        font-size: 48px;
        color: #d9d9d9;
        margin-bottom: 16px;
      }
      
      .empty-hint {
        font-size: 13px;
        color: #999;
        margin: 0;
      }
    }
  }
  
  // 提前批和农网板块区域
  .batch-sections {
    .batch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      
      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .batch-column {
        min-height: 200px;
      }
    }
  }
  
  // 地市县概览区域
  .regional-overview-section {
    // RegionalOverview组件自带样式
  }
}

// 响应式适配
@media (max-width: 768px) {
  .policy-display-view {
    gap: 16px;
    
    .basic-policy-section {
      .section-header {
        padding: 12px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        
        .section-title {
          font-size: 14px;
        }
        
        .section-actions {
          align-self: flex-end;
        }
      }
      
      .basic-policy-grid {
        .policy-item {
          padding: 12px;
          
          .policy-label .label-text {
            font-size: 12px;
          }
          
          .policy-value {
            .value-text,
            .value-textarea {
              font-size: 12px;
            }
          }
        }
      }
    }
    
    .batch-sections .batch-grid {
      gap: 12px;
    }
  }
}
</style>