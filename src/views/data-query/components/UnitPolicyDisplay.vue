<template>
  <div class="unit-policy-display">
    <!-- 基本信息板块 -->
    <div class="policy-section">
      <div class="section-header">
        <h4 class="section-title">
          <info-circle-outlined class="section-icon" />
          基本政策信息
        </h4>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载政策信息...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>

      <!-- 空状态占位 - 没有选择单位时显示 -->
      <div v-else-if="showEmptyState" class="policy-content">
        <div class="empty-state-card">
          <div class="empty-content">
            <file-text-outlined class="empty-icon" />
            <h4 class="empty-title">基本政策信息</h4>
            <p class="empty-text">请先选择一个单位查看对应的政策信息</p>
          </div>
        </div>
      </div>

      <!-- 政策内容展示 -->
      <div v-else-if="policyInfo" class="policy-content">
        <!-- 有数据时显示内容卡片网格 -->
        <div v-if="Object.keys(visibleFields).length > 0" class="content-grid">
          <div
            v-for="(fieldConfig, fieldName) in visibleFields"
            :key="fieldName"
            class="content-card"
            @click="openContentPreview(fieldConfig)"
          >
            <div class="card-header">
              <h4 class="card-title">{{ fieldConfig.display_name }}</h4>
            </div>
            <div class="card-content">
              <p class="content-preview">{{ formatFieldValue(fieldConfig.value) }}</p>
            </div>
          </div>
          
          <!-- 新增内容按钮（有数据时） -->
          <div v-if="unitId" class="add-content-card" @click="openAddDialog">
            <div class="add-content-inner">
              <plus-outlined class="add-icon" />
              <span class="add-text">新增内容</span>
            </div>
          </div>
        </div>
        
        <!-- 选中单位但无数据状态 -->
        <div v-else class="content-grid">
          <!-- 新增内容按钮 -->
          <div class="add-content-card" @click="openAddDialog">
            <div class="add-content-inner">
              <plus-outlined class="add-icon" />
              <span class="add-text">新增内容</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态（作为备用，正常情况下不会显示） -->
      <div v-else class="empty-state">
        <a-empty description="加载失败">
          <template #image>
            <file-text-outlined class="empty-icon" />
          </template>
          <p class="empty-hint">系统发生错误，请重新刷新页面</p>
        </a-empty>
      </div>
    </div>
    
    <!-- 新增内容对话框 -->
    <a-modal
      v-model:open="addDialogVisible"
      title="新增基本政策信息"
      width="600px"
      @ok="handleAddContent"
      @cancel="handleCancelAdd"
    >
      <div class="add-form">
        <a-form
          :model="addForm"
          layout="vertical"
        >
          <a-form-item label="标题" required>
            <a-input
              v-model:value="addForm.title"
              placeholder="请输入标题"
              size="large"
            />
          </a-form-item>
          <a-form-item label="内容" required>
            <a-textarea
              v-model:value="addForm.content"
              placeholder="请输入内容"
              :rows="6"
              size="large"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
    
    <!-- 内容预览对话框 - 简洁美化设计 -->
    <a-modal
      v-model:open="previewDialogVisible"
      title="内容详情"
      width="650px"
      :footer="null"
      class="content-preview-modal"
    >
      <div v-if="currentPreviewContent" class="content-preview">
        <!-- 标题区域 -->
        <div class="field-section">
          <div class="section-label">
            <file-text-outlined class="section-icon" />
            <span>标题</span>
          </div>
          <div class="section-content title-content">
            {{ currentPreviewContent.display_name }}
          </div>
        </div>
        
        <!-- 内容区域 -->
        <div class="field-section">
          <div class="section-label">
            <edit-outlined class="section-icon" />
            <span>内容详情</span>
          </div>
          <div class="section-content main-content">
            {{ currentPreviewContent.value }}
          </div>
        </div>
        
        <!-- 操作按钮区域 -->
        <div class="action-buttons">
          <a-space size="middle">
            <!-- 复制按钮 -->
            <a-button @click="copyToClipboard(currentPreviewContent.value)">
              <copy-outlined />
              复制内容
            </a-button>
            <!-- 编辑按钮 -->
            <a-button 
              type="primary" 
              @click="handleEditContent"
            >
              <edit-outlined />
              编辑内容
            </a-button>
            <!-- 删除按钮 -->
            <a-button 
              type="primary" 
              danger 
              @click="handleDeleteContent"
            >
              <delete-outlined />
              删除内容
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
    
    <!-- 编辑内容对话框 -->
    <a-modal
      v-model:open="isEditingContent"
      title="编辑内容"
      width="600px"
      @ok="handleSaveEdit"
      @cancel="handleCancelEdit"
      :confirm-loading="saving"
    >
      <div class="edit-form">
        <a-form
          :model="editContentForm"
          layout="vertical"
        >
          <a-form-item label="标题" required>
            <a-input
              v-model:value="editContentForm.title"
              placeholder="请输入标题"
              size="large"
            />
          </a-form-item>
          <a-form-item label="内容" required>
            <a-textarea
              v-model:value="editContentForm.content"
              placeholder="请输入内容"
              :rows="6"
              size="large"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  InfoCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined
} from '@ant-design/icons-vue'
import {
  getUnitDetails,
  type PolicyInfo,
  type UnitInfo
} from '@/api/policies'
import { 
  dataQueryContentAPI,
  getProvinceContent,
  type DataQueryContent
} from '@/api/data-query-content'

// Props
interface Props {
  unitId?: number | null
  unitInfo?: UnitInfo | null
  showEmptyState?: boolean
  preloadedData?: any // 预加载的数据
}

const props = withDefaults(defineProps<Props>(), {
  unitId: null,
  unitInfo: null,
  showEmptyState: false,
  preloadedData: null
})

// Emits
const emit = defineEmits<{
  'policy-loaded': [policyInfo: PolicyInfo]
  'loading-change': [loading: boolean]
  'content-updated': [] // 新增：通知父组件内容已更新
}>()

// 响应式数据
const loading = ref(false)
const policyInfo = ref<PolicyInfo | null>(null)
const provincePolicyInfo = ref<any>(null)
const enabledFields = ref<string[]>([])
const saving = ref(false)

// 对话框状态
const addDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const isEditingContent = ref(false)

// 表单数据
const addForm = reactive({
  title: '',
  content: ''
})

const editContentForm = reactive({
  title: '',
  content: ''
})

const currentPreviewContent = ref<any>(null)
const currentContentId = ref<number | null>(null)

// 所有可能的政策字段 - 匹配province_policies表结构
const allFields = reactive<Record<string, any>>({
  cet_requirement: {
    display_name: '四六级要求',
    type: 'text',
    description: '英语等级考试要求'
  },
  computer_requirement: {
    display_name: '计算机等级要求',
    type: 'text',
    description: '计算机等级考试要求'
  },
  overage_allowed: {
    display_name: '超龄能否通过',
    type: 'text',
    description: '年龄超出要求是否可以通过'
  },
  household_priority: {
    display_name: '是否非常看重户籍',
    type: 'text',
    description: '户籍对录取的影响程度'
  },
  non_first_choice_pass: {
    display_name: '非第一志愿是否通过网申',
    type: 'text',
    description: '非第一志愿的通过情况'
  },
  detailed_rules: {
    display_name: '详细录取规则',
    type: 'textarea',
    description: '具体的录取流程和规则'
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
    type: 'text',
    description: '专业不匹配的通过可能性'
  },
  first_batch_fail_second_batch: {
    display_name: '一批进面没录取可否正常报考二批',
    type: 'text',
    description: '批次间报考的限制情况'
  },
  deferred_graduation_impact: {
    display_name: '延毕休学影响网申吗',
    type: 'text',
    description: '学业延期对申请的影响'
  },
  second_choice_available: {
    display_name: '是否有二次志愿填报',
    type: 'text',
    description: '二次填报志愿的机会'
  },
  position_selection_method: {
    display_name: '具体选岗方式',
    type: 'textarea',
    description: '岗位选择的具体流程和方法'
  },
  early_batch_difference: {
    display_name: '不成文规则',
    type: 'textarea',
    description: '网申过程中的隐性规定'
  },
  campus_recruit_then_first_batch: {
    display_name: '校招给了地方但是不满意是否还可以参加一批',
    type: 'text',
    description: '校招后是否能继续参加统一批次'
  },
  recruitment_count: {
    display_name: '录取人数',
    type: 'text',
    description: '计划录取的人数'
  },
  comprehensive_score_line: {
    display_name: '综合分数线',
    type: 'text',
    description: '综合成绩的分数线要求'
  },
  best_value_city_rank: {
    display_name: '最具性价比城市排名',
    type: 'text',
    description: '城市性价比排名情况'
  },
  best_value_district_rank: {
    display_name: '最具性价比区县排名',
    type: 'text',
    description: '区县性价比排名情况'
  },
  cost_effectiveness_rank: {
    display_name: '性价比排名',
    type: 'text',
    description: '综合性价比排名'
  },
  difficulty_rank: {
    display_name: '难度排名',
    type: 'text',
    description: '录取难度排名情况'
  },
  qualification_review_requirements: {
    display_name: '资格审查要求',
    type: 'text',
    description: '资格审查的具体要求'
  },
})

// 计算属性
const visibleFields = computed(() => {
  if (!policyInfo.value && !provincePolicyInfo.value) return {}
  
  const result: Record<string, any> = {}
  
  enabledFields.value.forEach(fieldName => {
    if (allFields[fieldName]) {
      // 优先使用省级政策数据，如果没有再使用单位政策数据
      let fieldValue = null
      let fieldDescription = allFields[fieldName].description
      let dataSource = 'unknown'
      
      // 先尝试从省级政策获取数据
      if (provincePolicyInfo.value && provincePolicyInfo.value[fieldName] !== undefined && provincePolicyInfo.value[fieldName] !== null) {
        fieldValue = provincePolicyInfo.value[fieldName]
        dataSource = 'province'
      }
      // 再尝试从单位政策获取数据
      else if (policyInfo.value && policyInfo.value[fieldName]) {
        const backendData = policyInfo.value[fieldName]
        fieldValue = backendData?.value || null
        fieldDescription = backendData?.description || fieldDescription
        dataSource = 'policy'
      }
      
      // 添加调试日志
      console.log(`🔍 visibleFields处理字段 ${fieldName}:`, {
        fieldValue,
        dataSource,
        'provincePolicyInfo存在': !!provincePolicyInfo.value,
        'provincePolicyInfo[fieldName]': provincePolicyInfo.value?.[fieldName],
        'policyInfo存在': !!policyInfo.value,
        'policyInfo[fieldName]': policyInfo.value?.[fieldName],
        'allFields存在': !!allFields[fieldName]
      })
      
      result[fieldName] = {
        ...allFields[fieldName],
        value: fieldValue,
        description: fieldDescription
      }
    }
  })
  
  console.log('🔍 最终visibleFields结果:', result)
  return result
})

// 计算属性
const unitId = computed(() => props.unitId)
const unitInfo = computed(() => props.unitInfo)

// 方法
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' && value.trim() === '') return '-'
  return String(value)
}

const formatNumber = (value: any): string => {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return num.toLocaleString()
}

const isCountField = (fieldName: string): boolean => {
  return false // 移除了录取人数字段
}

const isScoreField = (fieldName: string): boolean => {
  return ['comprehensive_score_line'].includes(fieldName)
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
    '需要放弃校招': 'volcano',
    '不限': 'cyan',
    '四级': 'blue',
    '六级': 'green',
    '四级优先': 'geekblue',
    '六级优先': 'green',
    '二级': 'orange',
    '三级': 'red',
    '二级优先': 'gold',
    '三级优先': 'red',
    '略有影响': 'orange'
  }
  
  return colorMap[String(value)] || 'default'
}

// 检查内容是否过长（超过100个字符或包含换行）
const isContentLong = (value: any): boolean => {
  if (!value) return false
  const str = String(value)
  return str.length > 100 || str.includes('\n')
}

// 打开新增对话框
const openAddDialog = () => {
  addForm.title = ''
  addForm.content = ''
  addDialogVisible.value = true
}

// 处理新增内容
const handleAddContent = async () => {
  if (!addForm.title.trim() || !addForm.content.trim()) {
    message.warning('请填写标题和内容')
    return
  }
  
  if (!props.unitId) {
    message.warning('请先选择一个单位')
    return
  }
  
  try {
    saving.value = true
    
    // 获取省份名称
    const provinceName = currentProvince.value
    if (!provinceName) {
      message.error('无法确定省份信息')
      return
    }
    
    // 调用API新增内容
    await dataQueryContentAPI.createContent({
      unit_id: props.unitId,
      section: '基本政策信息',
      title: addForm.title.trim(),
      content: addForm.content.trim()
    })
    
    message.success('新增成功')
    addDialogVisible.value = false
    
    // 通知父组件内容已更新，需要刷新预加载数据
    emit('content-updated')
    
    // 重新加载本地数据
    if (props.unitId) {
      await loadPolicyInfo(props.unitId)
    }
    
  } catch (error) {
    console.error('新增失败:', error)
    message.error('新增失败，请重试')
  } finally {
    saving.value = false
  }
}

// 取消新增
const handleCancelAdd = () => {
  addDialogVisible.value = false
}

// 打开内容预览
const openContentPreview = (fieldConfig: any) => {
  currentPreviewContent.value = fieldConfig
  
  // 从fieldName中提取content ID
  const fieldName = Object.keys(visibleFields.value).find(key => visibleFields.value[key] === fieldConfig)
  if (fieldName && fieldName.startsWith('content_')) {
    currentContentId.value = parseInt(fieldName.replace('content_', ''))
  }
  
  previewDialogVisible.value = true
  isEditingContent.value = false
}

// 复制内容到剪贴板
const copyToClipboard = async (content: string) => {
  const { copyWithMessage } = await import('@/utils/clipboard')
  await copyWithMessage(content)
}

// 开始编辑内容
const handleEditContent = () => {
  if (currentPreviewContent.value) {
    editContentForm.title = currentPreviewContent.value.display_name
    editContentForm.content = currentPreviewContent.value.value
    previewDialogVisible.value = false // 关闭预览对话框
    isEditingContent.value = true // 打开编辑对话框
  }
}

// 取消编辑
const handleCancelEdit = () => {
  isEditingContent.value = false
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!editContentForm.title.trim() || !editContentForm.content.trim()) {
    message.warning('请填写标题和内容')
    return
  }
  
  if (!currentContentId.value) {
    message.error('无法确定要更新的内容')
    return
  }
  
  try {
    saving.value = true
    
    await dataQueryContentAPI.updateContent(currentContentId.value, {
      title: editContentForm.title.trim(),
      content: editContentForm.content.trim()
    })
    
    message.success('更新成功')
    isEditingContent.value = false
    
    // 通知父组件内容已更新，需要刷新预加载数据
    emit('content-updated')
    
    // 重新加载本地数据
    if (props.unitId) {
      await loadPolicyInfo(props.unitId)
    }
    
    previewDialogVisible.value = false
    
  } catch (error) {
    console.error('更新失败:', error)
    message.error('更新失败，请重试')
  } finally {
    saving.value = false
  }
}

// 删除内容
const handleDeleteContent = async () => {
  if (!currentContentId.value) {
    message.error('无法确定要删除的内容')
    return
  }
  
  try {
    saving.value = true
    
    await dataQueryContentAPI.deleteContent(currentContentId.value)
    
    message.success('删除成功')
    previewDialogVisible.value = false
    
    // 通知父组件内容已更新，需要刷新预加载数据
    emit('content-updated')
    
    // 重新加载本地数据
    if (props.unitId) {
      await loadPolicyInfo(props.unitId)
    }
    
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败，请重试')
  } finally {
    saving.value = false
  }
}


// 计算当前单位名称（用于查询）
const currentProvince = computed(() => {
  // 直接返回单位名称，无论是省公司还是直属单位
  if (!props.unitInfo?.unit_name) return ''
  return props.unitInfo.unit_name
})


const loadBasicPolicyData = async (unitId: number) => {
  try {
    // 首先加载自定义字段定义，确保 allFields 包含自定义字段
    if (currentProvince.value) {
      // loadCustomFields() 已移除，不再需要
    }
    
    // 使用新的统一API获取基本政策数据
    const response = await policySectionsAPI.getBasicPolicy(unitId)
    
    let basicPolicyData = null
    
    // 统一处理多种响应格式
    if (response?.data?.section_data) {
      basicPolicyData = response.data.section_data
    } else if (response?.section_data) {
      basicPolicyData = response.section_data
    } else if (response?.basic_policy_info) {
      basicPolicyData = response.basic_policy_info
    }
    
    if (basicPolicyData) {
      // 初始化 policyInfo
      if (!policyInfo.value) {
        policyInfo.value = {}
      }
      
      // 将新API的数据格式转换为组件期望的格式
      Object.keys(basicPolicyData).forEach(fieldName => {
        const fieldData = basicPolicyData[fieldName]
        if (policyInfo.value) {
          policyInfo.value[fieldName] = {
            value: fieldData.value,
            display_name: fieldData.display_name,
            type: fieldData.type,
            priority: fieldData.priority,
            data_source: fieldData.data_source || 'policy_sections'
          }
        }
      })
      
      console.log('✅ 基本政策数据刷新成功')
    }
    
    // 注：已改为直接使用 data-query-content API，不再需要 custom-fields 请求
    
  } catch (error) {
    console.error('❌ 获取基本政策数据失败:', error)
    // 如果获取基本政策失败，仍然尝试重新加载完整数据
    await loadPolicyInfo(unitId)
  }
}

const loadPolicyInfo = async (unitId: number) => {
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 使用新的data-query-content API获取基本政策信息
    try {
      // 先获取省份名称（从unitInfo或API获取）
      let provinceName = ''
      if (props.unitInfo?.unit_name) {
        provinceName = props.unitInfo.unit_name
      } else {
        // 如果unitInfo没有，从API获取
        try {
          const unitDetails = await getUnitDetails(unitId)
          provinceName = unitDetails.unit_name
        } catch (error) {
          console.warn('⚠️ 无法获取单位信息:', error)
          provinceName = ''
        }
      }
      
      if (provinceName) {
        console.log('🔍 开始加载基本政策信息，省份:', provinceName)
        
        // 使用新API获取基本政策信息内容
        const basicPolicyContents = await getProvinceContent(provinceName, '基本政策信息')
        console.log('📋 获取到基本政策信息内容:', basicPolicyContents)
        
        // 初始化 policyInfo
        policyInfo.value = {}
        
        // 将新API的内容转换为组件期望的格式
        if (basicPolicyContents.length > 0) {
          // 将每个内容条目转换为字段格式
          basicPolicyContents.forEach((contentItem: DataQueryContent, index: number) => {
            const fieldName = `content_${contentItem.id}` // 使用内容ID作为字段名
            if (policyInfo.value) {
              policyInfo.value[fieldName] = {
                value: contentItem.content,
                display_name: contentItem.title,
                type: 'textarea' as const,
                priority: contentItem.display_order || index + 1,
                data_source: 'data_query_content'
              }
            }
          })
          
          console.log('✅ 基本政策数据转换完成，包含', basicPolicyContents.length, '个内容条目')
        } else {
          console.log('ℹ️ 该省份暂无基本政策信息内容')
        }
        
        // 更新字段配置，显示所有新加载的字段
        if (policyInfo.value && Object.keys(policyInfo.value).length > 0) {
          enabledFields.value = Object.keys(policyInfo.value)
        }
        
        // 尝试获取省级政策信息（如果需要，保留原有逻辑）
        if (provinceName.includes('省')) {
          const match = provinceName.match(/([\u4e00-\u9fa5]+)省/)
          if (match) {
            const provinceOnly = match[1]
            try {
              const provincePolicyResponse = await policyManagementAPI.getProvincePolicies({
                province: provinceOnly,
                limit: 1
              })
              
              if (provincePolicyResponse?.policies && provincePolicyResponse.policies.length > 0) {
                provincePolicyInfo.value = provincePolicyResponse.policies[0]
                console.log('✅ 省级政策信息加载成功:', provincePolicyInfo.value)
              }
            } catch (provincePolicyError) {
              console.warn('⚠️ 获取省级政策失败:', provincePolicyError)
              provincePolicyInfo.value = null
            }
          }
        }
      } else {
        console.warn('⚠️ 无法确定省份名称，无法加载基本政策信息')
        // 初始化空的policyInfo
        policyInfo.value = {}
        enabledFields.value = []
      }
    } catch (newApiError) {
      console.error('❌ 新API获取基本政策失败:', newApiError)
      // 如果新API失败，回退到原有API
      console.log('🔄 回退到原有API获取基本政策数据')
      try {
        const basicPolicyResponse = await policySectionsAPI.getBasicPolicy(unitId)
        
        let basicPolicyData = null
        
        // 原有API格式处理逻辑
        if (basicPolicyResponse?.data?.section_data) {
          basicPolicyData = basicPolicyResponse.data.section_data
        } else if (basicPolicyResponse?.section_data) {
          basicPolicyData = basicPolicyResponse.section_data
        } else if (basicPolicyResponse?.basic_policy_info) {
          basicPolicyData = basicPolicyResponse.basic_policy_info
        }
        
        if (basicPolicyData) {
          policyInfo.value = {}
          
          // 转换原有API的数据格式
          Object.keys(basicPolicyData).forEach(fieldName => {
            const fieldData = basicPolicyData[fieldName]
            if (policyInfo.value) {
              policyInfo.value[fieldName] = {
                value: fieldData.value,
                display_name: fieldData.display_name,
                type: fieldData.type,
                priority: fieldData.priority,
                data_source: fieldData.data_source || 'policy_sections'
              }
            }
          })
          
          enabledFields.value = Object.keys(policyInfo.value)
          console.log('✅ 回退到原有API，基本政策数据加载成功')
        }
      } catch (fallbackError) {
        console.error('❌ 原有API也获取失败:', fallbackError)
        throw fallbackError
      }
    }
    
    emit('policy-loaded', policyInfo.value)
    console.log('✅ 政策信息加载成功:', policyInfo.value)
  } catch (error) {
    console.error('❌ 加载政策信息失败:', error)
    message.error('加载政策信息失败，请重试')
    policyInfo.value = null
    provincePolicyInfo.value = null
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

// 使用预加载数据
const usePreloadedData = (preloadedContents: DataQueryContent[]) => {
  try {
    console.log('📋 开始处理预加载的基本政策数据:', preloadedContents)
    
    // 初始化 policyInfo
    policyInfo.value = {}
    
    // 将预加载的内容转换为组件期望的格式
    if (preloadedContents.length > 0) {
      preloadedContents.forEach((contentItem: DataQueryContent, index: number) => {
        const fieldName = `content_${contentItem.id}` // 使用内容ID作为字段名
        
        // 添加字段定义到 allFields（这很重要！）
        allFields[fieldName] = {
          display_name: contentItem.title,
          type: 'textarea' as const,
          description: `来自${contentItem.section}的内容`,
          is_custom: false,
          data_source: 'data_query_content'
        }
        
        if (policyInfo.value) {
          policyInfo.value[fieldName] = {
            value: contentItem.content,
            display_name: contentItem.title,
            type: 'textarea' as const,
            priority: contentItem.display_order || index + 1,
            data_source: 'data_query_content'
          }
        }
      })
      
      console.log('✅ 预加载基本政策数据转换完成，包含', preloadedContents.length, '个内容条目')
    } else {
      console.log('ℹ️ 预加载数据为空')
    }
    
    // 更新字段配置，显示所有新加载的字段
    if (policyInfo.value && Object.keys(policyInfo.value).length > 0) {
      enabledFields.value = Object.keys(policyInfo.value)
    } else {
      enabledFields.value = []
    }
    
    emit('policy-loaded', policyInfo.value)
    console.log('✅ 预加载数据处理完成')
    
  } catch (error) {
    console.error('❌ 处理预加载数据失败:', error)
    policyInfo.value = {}
    enabledFields.value = []
  }
}

const initializeFieldConfig = () => {
  // 清除旧的字段配置限制
  try {
    // 清除本地存储的字段配置限制
    localStorage.removeItem('policyFieldsConfig')
    
    // 初始状态不显示任何字段，只有加载到实际数据时才显示
    enabledFields.value = []
  } catch (error) {
    console.error('字段配置初始化失败:', error)
    enabledFields.value = []
  }
}

// 监听单位ID变化 - 优先使用预加载数据
watch(() => props.unitId, (newUnitId, oldUnitId) => {
  // 先清空旧数据（除非是初始加载）
  if (oldUnitId !== undefined) {
    policyInfo.value = null
    provincePolicyInfo.value = null
    currentPreviewContent.value = null
    enabledFields.value = []
  }
  
  if (newUnitId) {
    // 如果有预加载数据，优先使用预加载数据
    if (props.preloadedData && props.preloadedData.data && props.preloadedData.data.length > 0) {
      console.log('🔍 使用预加载的基本政策数据:', props.preloadedData)
      usePreloadedData(props.preloadedData.data)
    } else {
      // 如果没有预加载数据，才发起API请求
      console.log('⚠️ 没有预加载数据，回退到API请求')
      loadPolicyInfo(newUnitId)
    }
  } else {
    // 清空所有相关数据
    policyInfo.value = null
    provincePolicyInfo.value = null
    currentPreviewContent.value = null
    enabledFields.value = []
  }
}, { immediate: true })

// 监听预加载数据变化
watch(() => props.preloadedData, (newPreloadedData) => {
  if (newPreloadedData && newPreloadedData.data && newPreloadedData.data.length > 0) {
    console.log('🔄 预加载数据更新，使用新数据:', newPreloadedData)
    usePreloadedData(newPreloadedData.data)
  }
}, { immediate: true, deep: true })

// 监听省份变化，确保省份切换时清除旧数据并重新加载
watch(() => currentProvince.value, async (newProvince, oldProvince) => {
  if (newProvince !== oldProvince && newProvince && props.unitId) {
    console.log('🔄 省份变化，清除旧数据并重新加载:', {
      oldProvince,
      newProvince,
      unitId: props.unitId
    })
    
    // 清除旧的自定义字段定义和值
    Object.keys(allFields).forEach(fieldName => {
      if (allFields[fieldName].is_custom) {
        delete allFields[fieldName]
      }
    })
    
    // 清除 policyInfo 中的自定义字段
    if (policyInfo.value) {
      Object.keys(policyInfo.value).forEach(fieldName => {
        if (policyInfo.value[fieldName].data_source === 'custom_fields') {
          delete policyInfo.value[fieldName]
        }
      })
    }
    
    // 注：loadCustomFields() 已移除，不再需要
    
    console.log('✅ 省份切换完成')
  }
})

// 生命周期
onMounted(async () => {
  initializeFieldConfig()
  // 注：loadCustomFields() 已移除，不再需要
})
</script>

<style scoped lang="less">
.unit-policy-display {
  .policy-section {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }

  // 区域头部 - 紧凑版本
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;

    .section-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 6px;

      .section-icon {
        color: #1890ff;
        font-size: 14px;
      }
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .edit-status {
        .status-tag {
          font-size: 11px;
          line-height: 1.2;
          height: auto;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 4px;
          
          .anticon {
            font-size: 10px;
            margin-right: 2px;
          }
        }
      }

      .edit-btn,
      .config-btn,
      .refresh-btn,
      .save-btn,
      .cancel-btn,
      .add-field-btn {
        color: #666;
        width: 24px;
        height: 24px;
        font-size: 12px;

        &:hover {
          color: #1890ff;
        }
      }
      
      .edit-btn {
        &:hover {
          color: #52c41a;
        }
      }
      
      .save-btn {
        &:hover {
          color: #52c41a;
        }
      }
      
      .cancel-btn {
        &:hover {
          color: #ff4d4f;
        }
      }
      
      .add-field-btn {
        &:hover {
          color: #1890ff;
          background-color: #e6f7ff;
        }
      }
    }
  }

  // 加载状态
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

  // 内容卡片展示 - 参考提前批组件的设计
  .policy-content {
    .content-grid {
      padding: 16px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      min-height: 120px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 12px;
      }

      // 内容卡片样式 - 蓝色主题，参考农网板块
      .content-card {
        background: linear-gradient(145deg, #f9fcff 0%, #f0f9ff 100%);
        border: 1px solid #bae7ff;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        min-height: 80px;
        display: flex;
        flex-direction: column;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
          border-color: #40a9ff;
          background: linear-gradient(145deg, #f0f9ff 0%, #e6f7ff 100%);

          &::before {
            height: 4px;
            background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%);
          }
        }

        .card-header {
          margin-bottom: 12px;

          .card-title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #0958d9;
            line-height: 1.4;
          }
        }

        .card-content {
          flex: 1;
          display: flex;
          flex-direction: column;

          .content-preview {
            margin: 0;
            font-size: 12px;
            color: #595959;
            line-height: 1.5;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            flex: 1;
          }
        }
      }

      // 新增内容卡片
      .add-content-card {
        border: 2px dashed #d9d9d9;
        border-radius: 8px;
        background: #fafafa;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          border-color: #52c41a;
          background: #f6ffed;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(82, 196, 26, 0.1);
        }

        .add-content-inner {
          text-align: center;
          color: #8c8c8c;

          .add-icon {
            font-size: 24px;
            margin-bottom: 8px;
            display: block;
          }

          .add-text {
            font-size: 12px;
            font-weight: 500;
          }
        }

        &:hover .add-content-inner {
          color: #52c41a;
        }
      }

    }

    // 空状态卡片 - 美化版本（移出content-grid作用域）
    .empty-state-card {
      background: linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%);
      border: 2px solid #e1e8ed;
      border-radius: 12px;
      margin: 20px;
      min-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%);
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(24, 144, 255, 0.12);
        border-color: #bae7ff;
      }

      .empty-content {
        text-align: center;
        color: #8c8c8c;
        padding: 24px;

        .empty-icon {
          font-size: 48px;
          color: #40a9ff;
          margin-bottom: 16px;
          display: block;
          filter: drop-shadow(0 2px 4px rgba(64, 169, 255, 0.2));
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #595959;
        }

        .empty-text {
          margin: 0;
          font-size: 14px;
          color: #8c8c8c;
          line-height: 1.5;
        }
      }
    }
  }

  .policy-fields {
    padding: 16px;

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 8px;
      min-height: 120px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 12px;
      }
    }

    .field-item {
      background: linear-gradient(145deg, #f6ffed 0%, #f0f9e8 100%);
      border: 1px solid #d9f7be;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      min-height: 120px;
      display: flex;
      flex-direction: column;

      // 添加顶部装饰边框
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
        transition: all 0.3s ease;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(82, 196, 26, 0.15);
        border-color: #73d13d;
        background: linear-gradient(145deg, #f0f9e8 0%, #eaf5e3 100%);

        &::before {
          height: 4px;
          background: linear-gradient(90deg, #52c41a 0%, #73d13d 50%, #95de64 100%);
        }
      }

      .field-label {
        margin-bottom: 12px;

        .label-text {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #389e0d;
          line-height: 1.4;
        }

        .field-help {
          font-size: 10px;
          color: #999;
          cursor: help;

          &:hover {
            color: #1890ff;
          }
        }
      }

      .field-value {
        flex: 1;
        display: flex;
        flex-direction: column;

        .content-preview {
          margin: 0;
          font-size: 12px;
          color: #595959;
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          flex: 1;
        }
      }

      // 新增内容卡片
      .add-content-card {
        border: 2px dashed #d9d9d9;
        border-radius: 8px;
        background: #fafafa;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          border-color: #52c41a;
          background: #f6ffed;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(82, 196, 26, 0.1);
        }

        .add-content-inner {
          text-align: center;
          color: #8c8c8c;

          .add-icon {
            font-size: 24px;
            margin-bottom: 8px;
            display: block;
          }

          .add-text {
            font-size: 12px;
            font-weight: 500;
          }
        }

        &:hover .add-content-inner {
          color: #52c41a;
        }
      }
    }
  }

  // 字段配置面板
  .field-config-panel {
    margin-top: 20px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;

      h5 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
    }

    .config-content {
      padding: 16px;

      .field-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }

        .field-checkbox-item {
          :deep(.ant-checkbox-wrapper) {
            font-size: 13px;
            color: #666;

            &:hover {
              color: #1890ff;
            }
          }
        }
      }
    }
  }

  // 空状态
  .empty-state {
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

  // 空状态占位符美化样式
  .empty-placeholder {
    position: relative;
    
    .placeholder-grid {
      margin-bottom: 24px;
    }

    .placeholder-hint {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 120px;
      
      .hint-content {
        text-align: center;
        padding: 20px;
        
        .hint-icon {
          font-size: 36px;
          color: #1890ff;
          margin-bottom: 12px;
          opacity: 0.8;
        }
        
        .hint-title {
          font-size: 16px;
          font-weight: 600;
          color: #262626;
          margin: 8px 0;
          font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .hint-text {
          font-size: 13px;
          color: #8c8c8c;
          margin: 8px 0 12px 0;
          line-height: 1.5;
        }
        
        .hint-tag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          
          .anticon {
            margin-right: 4px;
          }
        }
      }
    }
  }
  
  // 编辑表单样式
  .edit-form {
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
    margin: 6px;
    
    :deep(.ant-form-item) {
      margin-bottom: 16px;
      
      .ant-form-item-label {
        padding-bottom: 4px;
        
        label {
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }
      }
      
      .ant-form-item-control {
        .ant-input,
        .ant-textarea,
        .ant-input-number,
        .ant-select {
          border-radius: 4px;
          font-size: 12px;
        }
        
        .ant-radio-group {
          .ant-radio-wrapper {
            font-size: 12px;
            margin-right: 12px;
          }
        }
      }
      
      .ant-form-item-explain {
        font-size: 11px;
      }
    }
    
    .ant-row {
      .ant-col {
        padding: 4px 8px;
      }
    }
    
    // 统一的输入框样式
    .uniform-input,
    .uniform-textarea,
    .uniform-select,
    .uniform-input-number {
      border-radius: 8px;
      border: 1.5px solid #d9d9d9;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #40a9ff;
      }
      
      &:focus,
      &.ant-input-focused,
      &.ant-select-focused {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
      }
    }
    
    .uniform-textarea {
      &.ant-input {
        min-height: 100px;
        padding: 12px;
        line-height: 1.6;
      }
    }
    
    .uniform-radio-group {
      .ant-radio-wrapper {
        font-size: 14px;
        margin-right: 16px;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: #f0f8ff;
        }
        
        &.ant-radio-wrapper-checked {
          background-color: #e6f7ff;
          border-color: #1890ff;
        }
      }
    }
  }
}

// 增强版话术详情样式 - 基本政策信息
:deep(.content-preview-modal) {
  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
    
    .ant-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }
  }
  
  .ant-modal-body {
    padding: 24px;
    
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
            color: #52c41a;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #52c41a;
          }
        }
        
        .section-content-enhanced {
          font-size: 16px;
          line-height: 1.8;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d9f7be;
          
          &.question-content {
            background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
            color: #389e0d;
            font-style: italic;
          }
          
          &.answer-content {
            background: linear-gradient(135deg, #f6ffed 0%, #f0f9e8 100%);
            color: #333;
            font-weight: 500;
          }
        }
      }

      .action-buttons-enhanced {
        display: flex;
        justify-content: center;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .unit-policy-display {
    .section-header {
      padding: 8px 10px;

      .section-title {
        font-size: 12px;
        gap: 4px;

        .section-icon {
          font-size: 11px;
        }
      }

      .section-actions {
        .edit-btn,
        .config-btn,
        .refresh-btn,
        .save-btn,
        .cancel-btn {
          width: 20px;
          height: 20px;
          font-size: 11px;
        }
      }
    }

    .policy-fields {
      padding: 8px;

      .field-item {
        padding: 6px 8px;
        min-height: 45px;

        .field-label .label-text {
          font-size: 10px;
        }

        .field-value {
          .value-text,
          .value-default {
            font-size: 11px;
          }

          .value-number {
            font-size: 12px;

            .unit {
              font-size: 10px;
            }
          }

          .value-select,
          .value-boolean {
            font-size: 10px;
            
            :deep(.ant-tag) {
              font-size: 9px;
              padding: 1px 4px;
            }
          }
        }
      }
    }

    // 移动端美化样式优化
    .policy-fields {
      .field-item {
        padding: 8px 10px;
        min-height: 55px;
        border-radius: 6px;

        // 移动端装饰边框调整
        &::after {
          height: 2px;
        }

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

          &::after {
            height: 2px;
          }
        }

        .field-label {
          margin-bottom: 4px;
          gap: 4px;

          &::before {
            width: 2px;
            height: 10px;
          }

          .label-text {
            font-size: 10px;
            padding: 1px 4px;
            letter-spacing: 0.2px;
          }
        }

        .field-value {
          padding: 4px 6px;
          min-height: 22px;

          &::before {
            width: 1px;
          }

          .value-text,
          .value-default {
            font-size: 11px;
            margin-left: 4px;
          }

          .value-number {
            font-size: 12px;
            margin-left: 4px;

            .unit {
              font-size: 10px;
            }
          }

          .value-select,
          .value-boolean {
            margin-left: 4px;

            :deep(.ant-tag) {
              font-size: 9px;
              padding: 1px 4px;
            }
          }
        }
      }
    }
  }
}

// 内容预览对话框样式
:deep(.content-preview-modal) {
  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
    
    .ant-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }
  }
  
  .ant-modal-body {
    padding: 24px;
    
    .preview-content {
      .field-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
        
        .field-type-indicator {
          font-size: 12px;
          font-weight: 500;
        }
        
        .field-name {
          font-size: 14px;
          font-weight: 600;
          color: #262626;
        }
      }
      
      .content-text {
        font-size: 14px;
        line-height: 1.6;
        color: #595959;
        white-space: pre-wrap;
        word-break: break-word;
        background: #fafafa;
        border-radius: 6px;
        padding: 16px;
        border: 1px solid #f0f0f0;
        min-height: 100px;
        max-height: 400px;
        overflow-y: auto;
        
        &:empty::before {
          content: '暂无内容';
          color: #bfbfbf;
          font-style: italic;
        }
      }
    }
  }
}

// 内容预览弹窗样式 - 简洁美化设计
.content-preview-modal {
  :deep(.ant-modal-header) {
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border-bottom: 2px solid #91d5ff;
    
    .ant-modal-title {
      color: #1890ff;
      font-weight: 600;
      font-size: 16px;
    }
  }
  
  :deep(.ant-modal-body) {
    padding: 24px;
  }
}

.content-preview {
  .field-section {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #1890ff;
      font-weight: 600;
      font-size: 14px;
      
      .section-icon {
        font-size: 16px;
      }
    }
    
    .section-content {
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #f0f0f0;
      background: #fafafa;
      min-height: 60px;
      
      &.title-content {
        background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
        border-color: #bae7ff;
        color: #1890ff;
        font-weight: 600;
        font-size: 15px;
      }
      
      &.main-content {
        background: linear-gradient(135deg, #f6ffed 0%, #f0f9e8 100%);
        border-color: #d9f7be;
        color: #262626;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
        min-height: 100px;
      }
    }
  }
  
  .action-buttons {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    text-align: center;
    
    .ant-btn {
      height: 36px;
      border-radius: 6px;
      font-weight: 500;
      
      .anticon {
        font-size: 14px;
      }
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

</style>