<template>
  <div class="rural-grid-info">
    <div class="info-section">
      <div class="section-header">
        <h4 class="section-title">
          <thunderbolt-outlined class="section-icon" />
          农网板块
        </h4>
      </div>

      <!-- 内容区域 -->
      <div class="section-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <a-spin size="default" tip="正在加载农网信息...">
            <div class="loading-placeholder"></div>
          </a-spin>
        </div>

        <!-- 内容卡片展示 -->
        <div v-if="ruralGridInfo && hasData" class="content-grid">
          <!-- 内容卡片 -->
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
              <p class="content-preview">{{ formatValue(fieldConfig.value) }}</p>
            </div>
          </div>
          
          <!-- 新增内容按钮 -->
          <div v-if="unitId" class="add-content-card" @click="openAddDialog">
            <div class="add-content-inner">
              <plus-outlined class="add-icon" />
              <span class="add-text">新增内容</span>
            </div>
          </div>
        </div>
        
        <!-- 选中单位但无数据状态 -->
        <div v-else-if="unitId && !hasData" class="content-grid">
          <!-- 新增内容按钮 -->
          <div class="add-content-card" @click="openAddDialog">
            <div class="add-content-inner">
              <plus-outlined class="add-icon" />
              <span class="add-text">新增内容</span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="showEmptyState" class="empty-state-card">
          <div class="empty-content">
            <thunderbolt-outlined class="empty-icon" />
            <h4 class="empty-title">农网板块</h4>
            <p class="empty-text">请先选择一个单位查看对应的农网信息</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增内容对话框 -->
    <a-modal
      v-model:open="addDialogVisible"
      title="新增农网内容"
      width="600px"
      @ok="handleAddContent"
      @cancel="cancelAddContent"
      :confirm-loading="addLoading"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item
          label="标题"
          name="title"
          :rules="[{ required: true, message: '请输入标题' }]"
        >
          <a-input 
            v-model:value="addForm.title" 
            placeholder="请输入内容标题"
            class="uniform-input"
          />
        </a-form-item>
        <a-form-item
          label="内容"
          name="content"
          :rules="[{ required: true, message: '请输入内容' }]"
        >
          <a-textarea 
            v-model:value="addForm.content" 
            placeholder="请输入具体内容"
            :rows="6"
            class="uniform-textarea"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 内容预览对话框 - 简洁美化设计 -->
    <a-modal
      v-model:open="previewDialogVisible"
      title="农网内容详情"
      width="650px"
      :footer="null"
      class="content-preview-modal"
    >
      <div v-if="previewContent" class="content-preview">
        <!-- 标题区域 -->
        <div class="field-section">
          <div class="section-label">
            <thunderbolt-outlined class="section-icon" />
            <span>标题</span>
          </div>
          <div class="section-content title-content">
            {{ previewContent.title }}
          </div>
        </div>
        
        <!-- 内容区域 -->
        <div class="field-section">
          <div class="section-label">
            <edit-outlined class="section-icon" />
            <span>内容详情</span>
          </div>
          <div class="section-content main-content">
            {{ previewContent.content }}
          </div>
        </div>
        
        <!-- 操作按钮区域 -->
        <div class="action-buttons">
          <a-space size="middle">
            <!-- 复制按钮 -->
            <a-button @click="copyToClipboard(previewContent.content)">
              <copy-outlined />
              复制内容
            </a-button>
            <!-- 编辑按钮 -->
            <a-button 
              type="primary" 
              @click="startEditContent"
            >
              <edit-outlined />
              编辑内容
            </a-button>
            <!-- 删除按钮 -->
            <a-button 
              type="primary" 
              danger 
              @click="handleDeleteContent"
              :loading="deleteLoading"
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
      v-model:open="editDialogVisible"
      title="编辑农网内容"
      width="600px"
      @ok="handleUpdateContent"
      @cancel="cancelEditContent"
      :confirm-loading="editLoading"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item
          label="标题"
          name="title"
          :rules="[{ required: true, message: '请输入标题' }]"
        >
          <a-input 
            v-model:value="editForm.title" 
            placeholder="请输入内容标题"
            class="uniform-input"
          />
        </a-form-item>
        <a-form-item
          label="内容"
          name="content"
          :rules="[{ required: true, message: '请输入内容' }]"
        >
          <a-textarea 
            v-model:value="editForm.content" 
            placeholder="请输入具体内容"
            :rows="6"
            class="uniform-textarea"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  ThunderboltOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined
} from '@ant-design/icons-vue'
import {
  policySectionsAPI,
  customFieldsAPI,
  getUnitDetails,
  type RuralGridInfo,
  type RuralGridResponse
} from '@/api/policies'
import { 
  dataQueryContentAPI,
  getProvinceContent,
  type DataQueryContent
} from '@/api/data-query-content'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { useEditMode } from '@/composables/useEditMode'
import FieldManagerDialog from './FieldManagerDialog.vue'

// Props
interface Props {
  unitId?: number | null
  unitInfo?: any
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
  'data-loaded': [data: RuralGridResponse['data']]
  'loading-change': [loading: boolean]
  'content-updated': [] // 新增：通知父组件内容已更新
}>()

// 响应式数据
const loading = ref(false)
const ruralGridInfo = ref<RuralGridInfo | null>(null)
const hasData = ref(false)
const enabledFields = ref<string[]>([])

// 新增内容相关
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addForm = reactive({
  title: '',
  content: ''
})

// 预览内容相关
const previewDialogVisible = ref(false)
const previewContent = ref<any>(null)


// 编辑内容相关
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  id: null,
  title: '',
  content: ''
})

// 删除相关
const deleteLoading = ref(false)


// 所有可能的农网字段 - 匹配API返回的字段名
const allFields = reactive({
  salary_benefits: {
    display_name: '薪资待遇',
    type: 'text',
    description: '农网岗位的薪资待遇和福利情况'
  },
  exam_schedule: {
    display_name: '考试安排',
    type: 'text',
    description: '农网招聘考试的具体时间安排'
  },
  application_status: {
    display_name: '申请状态',
    type: 'text',
    description: '农网岗位网申的通过率和竞争情况'
  },
  online_assessment: {
    display_name: '线上测评',
    type: 'text',
    description: '线上测评的内容和评估方式'
  },
  personality_test: {
    display_name: '性格测试',
    type: 'text',
    description: '性格测试的形式和重要性'
  },
  qualification_review: {
    display_name: '资格审查',
    type: 'text',
    description: '资格审查的流程和材料要求'
  },
  written_test_content: {
    display_name: '笔试内容',
    type: 'text',
    description: '笔试的科目、题型和考核重点'
  }
})

// 计算属性
const visibleFields = computed(() => {
  const result: Record<string, any> = {}
  
  // 只显示启用的字段
  enabledFields.value.forEach(fieldName => {
    if (allFields[fieldName]) {
      let fieldValue = null
      let fieldDescription = allFields[fieldName].description
      
      // 如果有数据，使用数据中的值
      if (ruralGridInfo.value && ruralGridInfo.value[fieldName]) {
        const backendValue = ruralGridInfo.value[fieldName]
        if (backendValue && backendValue.value !== null && backendValue.value !== undefined) {
          fieldValue = backendValue.value
          fieldDescription = backendValue.description || fieldDescription
        }
      }
      
      result[fieldName] = {
        ...allFields[fieldName],
        value: fieldValue,
        description: fieldDescription
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
    '高': 'green',
    '中': 'orange',
    '低': 'red',
    '优': 'green',
    '良': 'blue',
    '中等': 'orange',
    '差': 'red',
    '必须': 'red',
    '建议': 'orange',
    '可选': 'green'
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

// 取消新增
const cancelAddContent = () => {
  addDialogVisible.value = false
  addForm.title = ''
  addForm.content = ''
}

// 新增内容
const handleAddContent = async () => {
  if (!addForm.title.trim() || !addForm.content.trim()) {
    message.error('请输入标题和内容')
    return
  }
  
  if (!props.unitId) {
    message.error('缺少单位信息')
    return
  }
  
  try {
    addLoading.value = true
    
    // 获取省份名称
    const provinceName = currentProvince.value
    if (!provinceName) {
      message.error('无法确定省份信息')
      return
    }
    
    await dataQueryContentAPI.createContent({
      unit_id: props.unitId,
      section: '农网',
      title: addForm.title.trim(),
      content: addForm.content.trim(),
      province: provinceName
    })
    
    message.success('新增内容成功')
    addDialogVisible.value = false
    addForm.title = ''
    addForm.content = ''
    
    // 通知父组件内容已更新，需要刷新预加载数据
    emit('content-updated')
    
    // 重新加载本地数据
    if (props.unitId) {
      await loadRuralGridData(props.unitId)
    }
  } catch (error) {
    console.error('新增内容失败:', error)
    message.error('新增内容失败，请重试')
  } finally {
    addLoading.value = false
  }
}

// 复制内容到剪贴板
const copyToClipboard = async (content: string) => {
  const { copyWithMessage } = await import('@/utils/clipboard')
  await copyWithMessage(content)
}

// 打开内容预览
const openContentPreview = (fieldConfig: any) => {
  const fieldName = Object.keys(visibleFields.value).find(key => visibleFields.value[key] === fieldConfig)
  if (fieldName && fieldName.startsWith('content_')) {
    const contentId = fieldName.replace('content_', '')
    previewContent.value = {
      id: contentId,
      title: fieldConfig.display_name,
      content: fieldConfig.value
    }
  } else {
    previewContent.value = {
      title: fieldConfig.display_name,
      content: fieldConfig.value
    }
  }
  previewDialogVisible.value = true
}

// 开始编辑内容
const startEditContent = () => {
  if (previewContent.value) {
    editForm.id = previewContent.value.id
    editForm.title = previewContent.value.title
    editForm.content = previewContent.value.content
    previewDialogVisible.value = false
    editDialogVisible.value = true
  }
}

// 取消编辑
const cancelEditContent = () => {
  editDialogVisible.value = false
  editForm.id = null
  editForm.title = ''
  editForm.content = ''
}

// 更新内容
const handleUpdateContent = async () => {
  if (!editForm.title.trim() || !editForm.content.trim()) {
    message.error('请输入标题和内容')
    return
  }
  
  if (!editForm.id) {
    message.error('缺少内容ID')
    return
  }
  
  try {
    editLoading.value = true
    
    await dataQueryContentAPI.updateContent(editForm.id, {
      title: editForm.title.trim(),
      content: editForm.content.trim()
    })
    
    message.success('更新内容成功')
    editDialogVisible.value = false
    editForm.id = null
    editForm.title = ''
    editForm.content = ''
    
    // 通知父组件内容已更新，需要刷新预加载数据
    emit('content-updated')
    
    // 重新加载本地数据
    if (props.unitId) {
      await loadRuralGridData(props.unitId)
    }
  } catch (error) {
    console.error('更新内容失败:', error)
    message.error('更新内容失败，请重试')
  } finally {
    editLoading.value = false
  }
}

// 删除内容
const handleDeleteContent = async () => {
  if (!previewContent.value?.id) {
    message.error('缺少内容ID')
    return
  }
  
  try {
    deleteLoading.value = true
    
    await dataQueryContentAPI.deleteContent(previewContent.value.id)
    
    message.success('删除内容成功')
    previewDialogVisible.value = false
    previewContent.value = null
    
    // 通知父组件内容已更新，需要刷新预加载数据
    emit('content-updated')
    
    // 重新加载本地数据
    if (props.unitId) {
      await loadRuralGridData(props.unitId)
    }
  } catch (error) {
    console.error('删除内容失败:', error)
    message.error('删除内容失败，请重试')
  } finally {
    deleteLoading.value = false
  }
}

// 计算属性
const unitId = computed(() => props.unitId)
const unitInfo = computed(() => props.unitInfo)

// 计算当前单位名称（用于查询）
const currentProvince = computed(() => {
  // 直接返回单位名称，无论是省公司还是直属单位
  if (!props.unitInfo?.unit_name) return ''
  return props.unitInfo.unit_name
})

// 保存自定义字段值
const saveCustomFieldsValues = async (customFieldsData: Record<string, any>) => {
  if (!props.unitId) {
    throw new Error('缺少单位ID，无法保存自定义字段')
  }
  
  // 调用自定义字段值更新API
  await customFieldsAPI.updateCustomFieldValues(props.unitId, {
    section: 'rural_grid',
    field_values: customFieldsData
  })
  console.log('✅ [农网] 自定义字段值更新完成:', customFieldsData)
}

// 加载自定义字段
// 注：原 loadCustomFields 函数已移除，直接使用 data-query-content API

const loadRuralGridData = async (unitId: number) => {
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 注：loadCustomFields() 已移除，不再需要
    
    // 使用新的data-query-content API获取农网信息
    try {
      // 先获取省份名称
      let provinceName = ''
      if (props.unitInfo?.unit_name) {
        provinceName = props.unitInfo.unit_name
      } else {
        try {
          const unitDetails = await getUnitDetails(unitId)
          provinceName = unitDetails.unit_name
        } catch (error) {
          console.warn('⚠️ 无法获取单位信息:', error)
          provinceName = ''
        }
      }
      
      if (provinceName) {
        console.log('🔍 开始加载农网信息，省份:', provinceName)
        
        // 使用新API获取农网内容
        const ruralGridContents = await getProvinceContent(provinceName, '农网')
        console.log('📋 获取到农网内容:', ruralGridContents)
        
        // 转换为组件期望的格式
        const convertedData = {}
        if (ruralGridContents.length > 0) {
          ruralGridContents.forEach((contentItem: DataQueryContent, index: number) => {
            const fieldName = `content_${contentItem.id}`
            convertedData[fieldName] = {
              value: contentItem.content,
              display_name: contentItem.title,
              type: 'textarea' as const
            }
          })
          
          console.log('✅ 农网数据转换完成，包含', ruralGridContents.length, '个内容条目')
        }
        
        // 合并基本字段数据和自定义字段数据
        if (!ruralGridInfo.value) {
          ruralGridInfo.value = {}
        }
        
        // 先保留现有的自定义字段数据，再用新的API数据更新基本字段
        const existingCustomFields = {}
        if (ruralGridInfo.value) {
          Object.keys(ruralGridInfo.value).forEach(fieldName => {
            const fieldConfig = allFields[fieldName]
            if (fieldConfig?.is_custom) {
              existingCustomFields[fieldName] = ruralGridInfo.value[fieldName]
            }
          })
        }
        ruralGridInfo.value = { ...convertedData, ...existingCustomFields }
        hasData.value = Object.keys(convertedData).length > 0 || Object.keys(existingCustomFields).length > 0
        
        // 只显示实际有数据的字段
        const fieldsWithData = Object.keys(convertedData).concat(Object.keys(existingCustomFields))
        enabledFields.value = fieldsWithData
        console.log('📌 农网启用字段列表（仅显示有数据的字段）:', enabledFields.value)

        emit('data-loaded', { rural_grid_info: convertedData, has_data: hasData.value })
        console.log('✅ 农网信息加载成功')
      } else {
        console.warn('⚠️ 无法确定省份名称，无法加载农网信息')
        ruralGridInfo.value = null
        hasData.value = false
        emit('data-loaded', { rural_grid_info: null, has_data: false })
      }
    } catch (newApiError) {
      console.error('❌ 新API获取农网数据失败:', newApiError)
      // 如果新API失败，回退到原有API
      console.log('🔄 回退到原有API获取农网数据')
      try {
        const response = await policySectionsAPI.getRuralGridPolicy(unitId)
        
        // 检查API响应结构，优先使用 rural_grid_info
        let sectionData = null
        
        if (response?.data?.rural_grid_info) {
          sectionData = response.data.rural_grid_info
        } else if (response?.rural_grid_info) {
          sectionData = response.rural_grid_info
        } else if (response?.data?.section_data) {
          sectionData = response.data.section_data
        } else if (response?.section_data) {
          sectionData = response.section_data
        } else if (response?.data) {
          sectionData = response.data
        }
        
        if (sectionData && Object.keys(sectionData).length > 0) {
          // 转换为组件期望的格式
          const convertedData = {}
          Object.keys(sectionData).forEach(fieldName => {
            const fieldData = sectionData[fieldName]
            let value = null
            
            if (fieldData && typeof fieldData === 'object' && fieldData.value !== undefined) {
              value = fieldData.value
            } else if (fieldData !== null && fieldData !== undefined) {
              value = fieldData
            }
            
            convertedData[fieldName] = {
              value: value,
              display_name: fieldData?.display_name || allFields[fieldName]?.display_name || fieldName,
              type: fieldData?.type || allFields[fieldName]?.type || 'text'
            }
          })
          
          // 合并数据
          if (!ruralGridInfo.value) {
            ruralGridInfo.value = {}
          }
          
          const existingCustomFields = {}
          if (ruralGridInfo.value) {
            Object.keys(ruralGridInfo.value).forEach(fieldName => {
              const fieldConfig = allFields[fieldName]
              if (fieldConfig?.is_custom) {
                existingCustomFields[fieldName] = ruralGridInfo.value[fieldName]
              }
            })
          }
          ruralGridInfo.value = { ...convertedData, ...existingCustomFields }
          hasData.value = Object.keys(convertedData).some(key => {
            const itemValue = convertedData[key]?.value
            return itemValue && itemValue !== '' && itemValue !== null && itemValue !== undefined
          })
          
          emit('data-loaded', { rural_grid_info: convertedData, has_data: hasData.value })
          console.log('✅ 回退到原有API，农网信息加载成功')
        }
      } catch (fallbackError) {
        console.error('❌ 原有API也获取失败:', fallbackError)
        throw fallbackError
      }
    }
  } catch (error) {
    console.error('❌ 加载农网信息失败:', error)
    message.error('加载农网信息失败，请重试')
    ruralGridInfo.value = null
    hasData.value = false
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

// 使用预加载数据
const usePreloadedData = (preloadedContents: DataQueryContent[]) => {
  try {
    console.log('📋 [农网] 开始处理预加载数据:', preloadedContents)
    
    // 初始化 ruralGridInfo
    ruralGridInfo.value = {}
    
    // 将预加载的内容转换为组件期望的格式
    if (preloadedContents.length > 0) {
      const convertedData = {}
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
        
        convertedData[fieldName] = {
          value: contentItem.content,
          display_name: contentItem.title,
          type: 'textarea' as const,
          priority: contentItem.display_order || index + 1,
          data_source: 'data_query_content'
        }
      })
      
      ruralGridInfo.value = convertedData
      hasData.value = Object.keys(convertedData).length > 0
      
      // 更新字段配置，显示所有新加载的字段
      enabledFields.value = Object.keys(convertedData)
      
      console.log('✅ [农网] 预加载数据转换完成，包含', preloadedContents.length, '个内容条目')
    } else {
      console.log('ℹ️ [农网] 预加载数据为空')
      hasData.value = false
      enabledFields.value = []
    }
    
    emit('data-loaded', { rural_grid_info: ruralGridInfo.value, has_data: hasData.value })
    console.log('✅ [农网] 预加载数据处理完成')
    
  } catch (error) {
    console.error('❌ [农网] 处理预加载数据失败:', error)
    ruralGridInfo.value = {}
    hasData.value = false
    enabledFields.value = []
  }
}

// 监听单位ID变化 - 优先使用预加载数据
watch(() => props.unitId, (newUnitId) => {
  if (newUnitId) {
    // 如果有预加载数据，优先使用预加载数据
    if (props.preloadedData && props.preloadedData.data && props.preloadedData.data.length > 0) {
      console.log('🔍 [农网] 使用预加载数据:', props.preloadedData)
      usePreloadedData(props.preloadedData.data)
    } else {
      // 如果没有预加载数据，才发起API请求
      console.log('⚠️ [农网] 没有预加载数据，回退到API请求')
      loadRuralGridData(newUnitId)
    }
  } else {
    ruralGridInfo.value = null
    hasData.value = false
  }
}, { immediate: true })

// 监听预加载数据变化
watch(() => props.preloadedData, (newPreloadedData) => {
  if (newPreloadedData && newPreloadedData.data && newPreloadedData.data.length > 0) {
    console.log('🔄 [农网] 预加载数据更新，使用新数据:', newPreloadedData)
    usePreloadedData(newPreloadedData.data)
  }
}, { immediate: true, deep: true })

// 监听省份变化，确保字段隔离
watch(() => currentProvince.value, (newProvince, oldProvince) => {
  if (oldProvince && newProvince && newProvince !== oldProvince) {
    console.log(`🔄 [农网] 省份切换: ${oldProvince} → ${newProvince}`)
    
    // 清空自定义字段定义，防止跨省份污染
    Object.keys(allFields).forEach(fieldName => {
      const fieldConfig = allFields[fieldName]
      if (fieldConfig?.is_custom) {
        delete allFields[fieldName]
        console.log(`🗑️ [农网] 清除旧省份自定义字段: ${fieldName}`)
      }
    })
    
    // 重新加载当前单位的数据
    if (props.unitId) {
      loadRuralGridData(props.unitId)
    }
  }
})

</script>

<style scoped lang="less">
.rural-grid-info {
  .info-section {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }

  // 区域头部
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #ecffdb 0%, #e6f7ff 100%);
    }

    .section-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;

      .section-icon {
        color: #52c41a;
        font-size: 14px;
      }

      .data-tag {
        font-size: 10px;
        font-weight: 500;
      }
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 4px;

      .edit-btn,
      .refresh-btn,
      .save-btn,
      .cancel-btn,
      .add-field-btn {
        color: #666;

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

      .expand-btn {
        color: #999;
        transition: all 0.2s ease;

        &.expanded {
          transform: rotate(180deg);
          color: #52c41a;
        }

        &:hover {
          color: #52c41a;
        }
      }
    }
  }

  // 区域内容
  .section-content {
    .loading-container {
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;

      .loading-placeholder {
        width: 100%;
        height: 120px;
      }
    }

    // 内容卡片网格
    .content-grid {
      padding: 12px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      min-height: 120px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 12px;
      }

      // 内容卡片样式
      .content-card {
        background: linear-gradient(145deg, #f9fffc 0%, #f6ffed 100%);
        border: 1px solid #d9f7be;
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
          background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(82, 196, 26, 0.15);
          border-color: #73d13d;
          background: linear-gradient(145deg, #f6ffed 0%, #ecffdb 100%);

          &::before {
            height: 4px;
            background: linear-gradient(90deg, #52c41a 0%, #73d13d 50%, #95de64 100%);
          }
        }

        .card-header {
          margin-bottom: 12px;

          .card-title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #389e0d;
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

    // 空状态卡片
    .empty-state-card {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin: 16px;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;

      .empty-content {
        text-align: center;
        color: #8c8c8c;

        .empty-icon {
          font-size: 36px;
          color: #95de64;
          margin-bottom: 12px;
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
        }
      }
    }

  }
  
  // 编辑表单样式
  .edit-form {
    padding: 16px;
    background: #f9fffc;
    border-radius: 6px;
    margin: 12px;
    
    :deep(.ant-form-item) {
      margin-bottom: 16px;
      
      .ant-form-item-label {
        padding-bottom: 4px;
        
        label {
          font-size: 12px;
          font-weight: 600;
          color: #389e0d;
        }
      }
      
      .ant-form-item-control {
        .ant-input,
        .ant-textarea,
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
        border-color: #52c41a;
      }
      
      &:focus,
      &.ant-input-focused,
      &.ant-select-focused {
        border-color: #389e0d;
        box-shadow: 0 0 0 2px rgba(56, 158, 13, 0.1);
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
          background-color: #f6ffed;
        }
        
        &.ant-radio-wrapper-checked {
          background-color: #f6ffed;
          border-color: #389e0d;
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .rural-grid-info {
    .section-header {
      padding: 12px 14px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .section-title {
        font-size: 13px;
        gap: 6px;

        .section-icon {
          font-size: 13px;
        }
      }

      .section-actions {
        align-self: flex-end;
        margin-top: -20px;
      }
    }

    .section-content {
      .grid-info-layout {
        .info-item {
          padding: 12px;
          
          .info-label .label-text {
            font-size: 11px;
          }
          
          .info-value {
            .value-text,
            .value-time,
            .value-default {
              font-size: 11px;
            }
          }
        }
      }

      .no-data-state {
        padding: 20px 16px;

        .no-data-content {
          .no-data-icon {
            font-size: 32px;
          }

          .no-data-text {
            font-size: 12px;
          }

          .no-data-tips {
            padding: 12px;

            p {
              font-size: 11px;
            }

            ul li {
              font-size: 10px;
            }
          }
        }
      }
    }
  }
}

// 增强版话术详情样式 - 农网
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
          border: 1px solid #bae7ff;
          
          &.question-content {
            background: linear-gradient(135deg, #f0f8ff 0%, #bae7ff 100%);
            color: #1565c0;
            font-style: italic;
          }
          
          &.answer-content {
            background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
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
    
    .preview-content {
      .field-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
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
          flex: 1;
          margin-left: 8px;
        }
        
        .preview-actions {
          display: flex;
          gap: 8px;
        }
      }
      
      .content-text {
        font-size: 14px;
        line-height: 1.6;
        color: #595959;
        white-space: pre-wrap;
        word-break: break-word;
        background: #f9fffc;
        border-radius: 6px;
        padding: 16px;
        border: 1px solid #d9f7be;
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

// 农网板块预览弹窗 - 绿色主题样式 (使用global确保样式生效)
:global(.rural-grid-modal) {
  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0 !important;
    padding: 16px 24px !important;
    
    .ant-modal-title {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: #262626 !important;
    }
  }
  
  .ant-modal-body {
    padding: 24px !important;
    
    .script-detail-enhanced {
      display: flex !important;
      flex-direction: column !important;
      gap: 20px !important;
      
      .question-section-enhanced {
        .section-header {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-bottom: 12px !important;
          
          .anticon {
            font-size: 16px !important;
            color: #52c41a !important;
          }
          
          .section-title {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #52c41a !important;
          }
        }
        
        .section-content-enhanced.question-content {
          font-size: 16px !important;
          line-height: 1.8 !important;
          padding: 16px !important;
          border-radius: 8px !important;
          background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%) !important;
          color: #389e0d !important;
          font-style: italic !important;
          border: 1px solid #d9f7be !important;
          word-wrap: break-word !important;
          white-space: pre-wrap !important;
        }
      }
      
      .answer-section-enhanced {
        .section-header {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-bottom: 12px !important;
          
          .anticon {
            font-size: 16px !important;
            color: #52c41a !important;
          }
          
          .section-title {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #52c41a !important;
          }
        }
        
        .section-content-enhanced.answer-content {
          font-size: 16px !important;
          line-height: 1.8 !important;
          padding: 16px !important;
          border-radius: 8px !important;
          background: linear-gradient(135deg, #f6ffed 0%, #f0f9e8 100%) !important;
          color: #333 !important;
          font-weight: 500 !important;
          border: 1px solid #d9f7be !important;
          word-wrap: break-word !important;
          white-space: pre-wrap !important;
        }
      }

      .action-section {
        display: flex !important;
        justify-content: center !important;
        padding-top: 8px !important;
        border-top: 1px solid #f0f0f0 !important;
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