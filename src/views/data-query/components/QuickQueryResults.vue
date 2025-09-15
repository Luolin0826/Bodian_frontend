<template>
  <a-modal
    v-model:open="modalVisible"
    :title="`快捷查询结果 - ${queryTypeDisplayName}`"
    width="90%"
    :style="{ top: '20px' }"
    :bodyStyle="{ padding: '16px' }"
    :footer="null"
    :destroyOnClose="true"
    @cancel="handleClose"
  >
    <template #title>
      <div class="modal-title">
        <thunderbolt-outlined class="title-icon" />
        快捷查询结果 - {{ queryTypeDisplayName }}
      </div>
    </template>

    <div class="quick-query-results">
      <div class="results-section">
        <div class="section-header">
          <div class="section-actions">
            <!-- 进入编辑模式 -->
            <a-tooltip v-if="isSuperAdmin && !isEditMode" title="进入批量编辑模式">
              <a-button
                type="text"
                size="small"
                @click="toggleEditMode"
                class="edit-mode-btn"
              >
                <edit-outlined />
                编辑
              </a-button>
            </a-tooltip>
            
            <!-- 保存按钮（编辑模式下） -->
            <a-tooltip v-if="isEditMode" :title="hasChanges ? '保存所有修改并退出编辑模式' : '退出编辑模式'">
              <a-button
                type="primary"
                size="small"
                @click="saveAllChanges"
                :loading="saving"
                class="save-all-btn enhanced-save-btn"
              >
                <save-outlined />
                {{ hasChanges ? '保存' : '完成' }}
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="刷新数据">
              <a-button
                type="text"
                size="small"
                @click="handleRefresh"
                :loading="loading"
                class="refresh-btn"
              >
                <reload-outlined />
                刷新
              </a-button>
            </a-tooltip>
            
            <a-tooltip :title="isEditMode ? '退出编辑模式' : '关闭快捷查询结果'">
              <a-button
                type="text"
                size="small"
                @click="handleCloseOrExit"
                class="close-btn"
              >
                <close-outlined />
                {{ isEditMode ? '退出' : '关闭' }}
              </a-button>
            </a-tooltip>
          </div>
        </div>


      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载快捷查询结果...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>

      <!-- 数据表格 -->
      <div v-else-if="quickQueryData && quickQueryData.length > 0" class="results-table">
        <a-table
          :columns="tableColumns"
          :data-source="quickQueryData"
          :pagination="tablePagination"
          size="small"
          :scroll="{ x: 'max-content' }"
          @change="handleTableChange"
          :row-key="record => record.id"
        >
          <template #bodyCell="{ column, record, index }">
            <!-- 要求类型列 -->
            <template v-if="column.key === 'requirement_type'">
              <span class="requirement-type-cell">{{ getRequirementTypeDisplay(record, index) }}</span>
            </template>
            
            <!-- 操作列 -->
            <template v-if="column.key === 'actions'">
              <div class="row-actions">
                <div class="edit-controls">
                  <!-- 保存按钮 -->
                  <a-tooltip title="保存此行">
                    <a-button
                      type="text"
                      size="small"
                      @click="saveRow(record, index)"
                      :loading="savingRows[record.id]"
                      class="save-row-btn"
                    >
                      <check-outlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
            </template>
            
            <!-- 省份列 -->
            <template v-if="column.key === 'province'">
              <span class="province-name">{{ record.province }}</span>
            </template>
            
            <!-- 文本字段编辑 -->
            <template v-if="isTextEditField(column.key)">
              <a-input
                v-if="isEditMode"
                :value="getEditingFieldValue(record, column.key)"
                @change="(e) => updateFieldValue(record, column.key, e.target.value)"
                size="small"
                style="width: 120px; font-size: 12px;"
              />
              <span v-else class="text-value">
                {{ getFieldValue(record, column.key) || '-' }}
              </span>
            </template>
            
            <!-- 分数字段编辑 -->
            <template v-if="isScoreField(column.key)">
              <a-input
                v-if="isEditMode"
                :value="getEditingScoreValue(record, column.key)"
                @change="(e) => updateScoreValue(record, column.key, e.target.value)"
                size="small"
                style="width: 80px; font-size: 12px;"
                placeholder="分数"
              />
              <span v-else class="score-value">
                {{ getScoreValue(record, column.key) || '-' }}
              </span>
            </template>
            
            <!-- 录取人数字段编辑 -->
            <template v-if="isAdmissionField(column.key)">
              <a-input
                v-if="isEditMode"
                :value="getEditingAdmissionValue(record, column.key)"
                @change="(e) => updateAdmissionValue(record, column.key, e.target.value)"
                size="small"
                style="width: 80px; font-size: 12px;"
                placeholder="人数"
              />
              <span v-else class="admission-value">
                {{ getAdmissionValue(record, column.key) || '-' }}
              </span>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <a-empty description="暂无查询结果">
          <template #image>
            <search-outlined class="empty-icon" />
          </template>
          <p class="empty-hint">请重新执行快捷查询获取数据</p>
        </a-empty>
      </div>
    </div>
  </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  ThunderboltOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BankOutlined,
  TeamOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'
import {
  quickQueryAPI,
  type QuickQueryUndergraduateInfo,
  type QuickQueryGraduateInfo,
  type QuickQueryAdmissionStats
} from '@/api/quick-query'

// Props
interface Props {
  visible?: boolean
  queryType?: 'undergraduate' | 'graduate' | 'admission_count'
  data?: any[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  queryType: 'undergraduate',
  data: () => [],
  loading: false
})

// Emits
const emit = defineEmits<{
  'close': []
  'refresh': [queryType: string]
  'data-updated': [data: any[]]
}>()

// 响应式数据
const exportLoading = ref(false)
const quickQueryData = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(50)
const modalVisible = ref(false)

// 编辑相关状态
const isSuperAdmin = ref(true)
const isEditMode = ref(false)
const editingRows = ref<Record<string, any>>({})
const changedRows = ref<Record<string, boolean>>({})
const savingRows = ref<Record<string, boolean>>({})
const saving = ref(false)

// 计算属性
const queryTypeDisplayName = computed(() => {
  const names = {
    undergraduate: '本科信息',
    graduate: '研究生信息',
    admission_count: '录取统计'
  }
  return names[props.queryType] || '查询结果'
})


const hasChanges = computed(() => {
  if (!isEditMode.value) return false
  
  // 检查是否有实际的数据变更
  for (const recordId in changedRows.value) {
    if (changedRows.value[recordId]) {
      return true
    }
  }
  
  return false
})

// 表格列定义
const tableColumns = computed(() => {
  const baseColumns = []

  // 录取人数查询不需要requirement_type列
  if (props.queryType !== 'admission_count') {
    baseColumns.push({
      title: '要求类型',
      key: 'requirement_type',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
      customCell: (record: any, index: number) => {
        return getRequirementTypeCellProps(record, index)
      }
    })
  }

  baseColumns.push({
    title: '省份',
    key: 'province',
    width: 120,
    fixed: 'left' as const,
    align: 'center' as const
  })

  // 根据查询类型添加不同的列
  if (props.queryType === 'undergraduate') {
    baseColumns.push(
      {
        title: '英语要求',
        key: 'undergraduate_english',
        width: 100,
        align: 'center' as const
      },
      {
        title: '计算机要求',
        key: 'undergraduate_computer',
        width: 120,
        align: 'center' as const
      },
      {
        title: '学历要求',
        key: 'undergraduate_qualification',
        width: 100,
        align: 'center' as const
      },
      {
        title: '年龄要求',
        key: 'undergraduate_age',
        width: 100,
        align: 'center' as const
      },
      {
        title: '分数线',
        children: [
          {
            title: '2025一批',
            key: '2025_batch1',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2025二批',
            key: '2025_batch2',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2024一批',
            key: '2024_batch1',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2024二批',
            key: '2024_batch2',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2023一批',
            key: '2023_batch1',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2023二批',
            key: '2023_batch2',
            width: 80,
            align: 'center' as const
          }
        ]
      }
    )
  } else if (props.queryType === 'graduate') {
    baseColumns.push(
      {
        title: '英语要求',
        key: 'graduate_english',
        width: 100,
        align: 'center' as const
      },
      {
        title: '计算机要求',
        key: 'graduate_computer',
        width: 120,
        align: 'center' as const
      },
      {
        title: '学历要求',
        key: 'graduate_qualification',
        width: 100,
        align: 'center' as const
      },
      {
        title: '年龄要求',
        key: 'graduate_age',
        width: 100,
        align: 'center' as const
      },
      {
        title: '分数线',
        children: [
          {
            title: '2025一批',
            key: '2025_batch1',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2025二批',
            key: '2025_batch2',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2024一批',
            key: '2024_batch1',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2024二批',
            key: '2024_batch2',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2023一批',
            key: '2023_batch1',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2023二批',
            key: '2023_batch2',
            width: 80,
            align: 'center' as const
          }
        ]
      }
    )
  } else if (props.queryType === 'admission_count') {
    baseColumns.push(
      {
        title: '录取人数',
        children: [
          {
            title: '2025一批',
            key: '2025_batch1_count',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2025二批',
            key: '2025_batch2_count',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2024一批',
            key: '2024_batch1_count',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2024二批',
            key: '2024_batch2_count',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2023一批',
            key: '2023_batch1_count',
            width: 80,
            align: 'center' as const
          },
          {
            title: '2023二批',
            key: '2023_batch2_count',
            width: 80,
            align: 'center' as const
          }
        ]
      }
    )
  }

  // 在编辑模式下添加操作列
  if (isEditMode.value) {
    baseColumns.push({
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      align: 'center' as const
    })
  }

  return baseColumns
})

// 表格分页配置
const tablePagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: quickQueryData.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 个省份`,
  pageSizeOptions: ['20', '50', '100', '200'],
  size: 'small' as const
}))

// 辅助函数
// 获取要求类型单元格合并属性
const getRequirementTypeCellProps = (record: any, index: number) => {
  const currentType = record.requirement_type
  
  if (!currentType) return { rowSpan: 1 }
  
  // 检查前一行是否有相同的requirement_type
  const prevRecord = quickQueryData.value[index - 1]
  if (prevRecord && prevRecord.requirement_type === currentType) {
    // 如果与前一行相同，隐藏此单元格
    return { rowSpan: 0 }
  }
  
  // 计算连续相同值的数量，用于设置rowspan
  let count = 1
  for (let i = index + 1; i < quickQueryData.value.length; i++) {
    if (quickQueryData.value[i].requirement_type === currentType) {
      count++
    } else {
      break
    }
  }
  
  // 返回rowspan属性
  return { rowSpan: count }
}

// 获取要求类型显示内容
const getRequirementTypeDisplay = (record: any, index: number) => {
  return record.requirement_type || ''
}

const getFieldValue = (record: any, key: string): string => {
  // 映射前端字段名到API字段名
  const fieldMapping: Record<string, string> = {
    'undergraduate_english': 'english_requirement',
    'undergraduate_computer': 'computer_requirement', 
    'undergraduate_qualification': 'qualification_review',
    'undergraduate_age': 'age_requirement',
    'graduate_english': 'english_requirement',
    'graduate_computer': 'computer_requirement',
    'graduate_qualification': 'qualification_review', 
    'graduate_age': 'age_requirement'
  }
  
  const apiFieldName = fieldMapping[key] || key
  return record[apiFieldName]
}

const getEditingFieldValue = (record: any, key: string): string => {
  const editingRecord = editingRows.value[record.id]
  if (!editingRecord) {
    return getFieldValue(record, key) || ''
  }
  
  // 映射前端字段名到API字段名
  const fieldMapping: Record<string, string> = {
    'undergraduate_english': 'english_requirement',
    'undergraduate_computer': 'computer_requirement', 
    'undergraduate_qualification': 'qualification_review',
    'undergraduate_age': 'age_requirement',
    'graduate_english': 'english_requirement',
    'graduate_computer': 'computer_requirement',
    'graduate_qualification': 'qualification_review', 
    'graduate_age': 'age_requirement'
  }
  
  const apiFieldName = fieldMapping[key] || key
  return editingRecord[apiFieldName] || ''
}

const getEditingScoreValue = (record: any, columnKey: string): string => {
  const editingRecord = editingRows.value[record.id]
  if (!editingRecord) {
    return getScoreValue(record, columnKey) || ''
  }
  
  // 解析分数数据
  const parts = columnKey.split('_')
  const year = parts[0] // '2025'
  const batch = parts.slice(1).join('_') // 'batch1'
  
  return editingRecord.scores?.[year]?.[batch] || ''
}

const getEditingAdmissionValue = (record: any, key: string): string => {
  const editingRecord = editingRows.value[record.id]
  if (!editingRecord) {
    const originalValue = getAdmissionValue(record, key)
    return originalValue?.toString() || ''
  }
  
  const [year, batch] = key.replace('_count', '').split('_')
  const value = editingRecord.admission_stats?.[year]?.[batch]
  return value?.toString() || ''
}

const getScoreKey = (columnKey: string): string => {
  // 将列名转换为API数据结构中的key
  // 例如：'2025_batch1' -> 'batch1'
  const parts = columnKey.split('_')
  return parts.slice(1).join('_') // 去掉年份部分
}

const getScoreValue = (record: any, columnKey: string): string => {
  // 解析分数数据
  // 例如：columnKey = '2025_batch1'
  const parts = columnKey.split('_')
  const year = parts[0] // '2025'
  const batch = parts.slice(1).join('_') // 'batch1'
  
  return record.scores?.[year]?.[batch] || '-'
}

// 方法
const isTextEditField = (key: string): boolean => {
  return [
    'undergraduate_english', 'undergraduate_computer', 'undergraduate_qualification', 'undergraduate_age',
    'graduate_english', 'graduate_computer', 'graduate_qualification', 'graduate_age'
  ].includes(key)
}

const isScoreField = (key: string): boolean => {
  return ['2025_batch1', '2025_batch2', '2024_batch1', '2024_batch2', '2023_batch1', '2023_batch2'].includes(key)
}

const isAdmissionField = (key: string): boolean => {
  return [
    '2025_batch1_count', '2025_batch2_count', '2024_batch1_count', 
    '2024_batch2_count', '2023_batch1_count', '2023_batch2_count'
  ].includes(key)
}

const getEditingRecord = (record: any) => {
  return editingRows.value[record.id] || record
}

const addToEditingRows = (record: any) => {
  if (!editingRows.value[record.id]) {
    editingRows.value[record.id] = { ...record }
  }
  return editingRows.value[record.id]
}

const checkRowChanges = (record: any) => {
  const editingRecord = editingRows.value[record.id]
  if (!editingRecord) {
    changedRows.value[record.id] = false
    return
  }
  
  // 深度比较编辑记录与原始记录
  const hasChanges = JSON.stringify(editingRecord) !== JSON.stringify(record)
  changedRows.value[record.id] = hasChanges
}

const updateFieldValue = (record: any, fieldKey: string, value: any) => {
  const editingRecord = addToEditingRows(record)
  
  // 映射前端字段名到API字段名
  const fieldMapping: Record<string, string> = {
    'undergraduate_english': 'english_requirement',
    'undergraduate_computer': 'computer_requirement', 
    'undergraduate_qualification': 'qualification_review',
    'undergraduate_age': 'age_requirement',
    'graduate_english': 'english_requirement',
    'graduate_computer': 'computer_requirement',
    'graduate_qualification': 'qualification_review', 
    'graduate_age': 'age_requirement'
  }
  
  const apiFieldName = fieldMapping[fieldKey] || fieldKey
  editingRecord[apiFieldName] = value
  
  // 检查整行是否有变更
  checkRowChanges(record)
  
  console.log(`更新字段值: ${record.province} - ${apiFieldName} = ${value}`)
}

const updateScoreValue = (record: any, columnKey: string, value: any) => {
  const editingRecord = addToEditingRows(record)
  if (!editingRecord.scores) {
    editingRecord.scores = {}
  }
  
  // 解析列名获取年份和批次
  const parts = columnKey.split('_')
  const year = parts[0] // '2025'
  const batch = parts.slice(1).join('_') // 'batch1'
  
  if (!editingRecord.scores[year]) {
    editingRecord.scores[year] = {}
  }
  
  editingRecord.scores[year][batch] = value
  
  // 检查整行是否有变更
  checkRowChanges(record)
  
  console.log(`更新分数: ${record.province} - ${year} ${batch} = ${value}`)
}

const getAdmissionValue = (record: any, key: string) => {
  const [year, batch] = key.replace('_count', '').split('_')
  return record.admission_stats?.[year]?.[batch] || null
}

const updateAdmissionValue = (record: any, key: string, value: any) => {
  const editingRecord = addToEditingRows(record)
  if (!editingRecord.admission_stats) {
    editingRecord.admission_stats = {}
  }
  
  const [year, batch] = key.replace('_count', '').split('_')
  if (!editingRecord.admission_stats[year]) {
    editingRecord.admission_stats[year] = {}
  }
  
  // 将字符串转换为数字，如果为空或无效则设为null
  const numValue = value === '' ? null : (isNaN(Number(value)) ? value : Number(value))
  
  editingRecord.admission_stats[year][batch] = numValue
  
  // 检查整行是否有变更
  checkRowChanges(record)
  
  console.log(`更新录取人数: ${record.province} - ${key} = ${numValue}`)
}

const toggleEditMode = () => {
  if (isEditMode.value) {
    editingRows.value = {}
    changedRows.value = {}
    savingRows.value = {}
    isEditMode.value = false
  } else {
    // 进入编辑模式时，初始化所有行的编辑数据
    initializeEditingData()
    isEditMode.value = true
  }
}

const initializeEditingData = () => {
  editingRows.value = {}
  changedRows.value = {}
  savingRows.value = {}
  
  // 为每一行初始化编辑数据，复制原始数据
  quickQueryData.value.forEach(record => {
    editingRows.value[record.id] = { ...record }
    changedRows.value[record.id] = false // 初始状态为未修改
  })
  
  console.log('✅ 初始化编辑数据完成，共初始化', quickQueryData.value.length, '条记录')
}

const saveRow = async (record: any, index: number) => {
  const editData = editingRows.value[record.id]
  
  if (!editData) {
    message.error('缺少编辑数据')
    return
  }
  
  try {
    savingRows.value[record.id] = true
    
    // 这里调用API保存数据，根据查询类型传递type参数
    const updateType = props.queryType === 'admission_count' ? 'undergraduate' : props.queryType as 'undergraduate' | 'graduate'
    console.log('🔄 保存单行数据:', { 
      recordId: record.id, 
      queryType: props.queryType, 
      updateType, 
      province: record.province 
    })
    await quickQueryAPI.updateData(record.id, editData, updateType)
    
    // 更新表格数据
    quickQueryData.value[index] = { ...editData }
    
    // 清除该行的编辑和变更状态
    delete editingRows.value[record.id]
    delete changedRows.value[record.id]
    
    message.success(`${record.province} 保存成功`)
    
    console.log(`行保存成功: ${record.province}`)
  } catch (error) {
    console.error('保存行数据失败:', error)
    message.error('保存失败，请重试')
  } finally {
    delete savingRows.value[record.id]
  }
}

const saveAllChanges = async () => {
  try {
    saving.value = true
    
    // 只保存有变更的行
    const changedRecordIds = Object.keys(changedRows.value).filter(id => changedRows.value[id])
    
    if (changedRecordIds.length > 0) {
      const updates = changedRecordIds.map(id => ({
        id: parseInt(id),
        fields: editingRows.value[id]
      }))
      
      // 根据查询类型传递type参数
      const updateType = props.queryType === 'admission_count' ? 'undergraduate' : props.queryType as 'undergraduate' | 'graduate'
      console.log('🔄 批量保存数据:', { 
        updatesCount: updates.length, 
        queryType: props.queryType, 
        updateType,
        recordIds: updates.map(u => u.id)
      })
      await quickQueryAPI.batchUpdate({ updates }, updateType)
      
      // 更新表格数据
      changedRecordIds.forEach(id => {
        const editData = editingRows.value[id]
        const index = quickQueryData.value.findIndex(item => item.id === parseInt(id))
        if (index !== -1) {
          quickQueryData.value[index] = { ...editData }
        }
      })
      
      message.success(`批量保存成功！已保存 ${updates.length} 条记录`)
    }
    
    // 清除所有编辑状态并退出编辑模式
    editingRows.value = {}
    changedRows.value = {}
    savingRows.value = {}
    isEditMode.value = false
    
    message.success('已退出编辑模式')
  } catch (error) {
    console.error('批量保存失败:', error)
    message.error('批量保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const exitEditMode = () => {
  console.log('🚪 exitEditMode 被调用')
  console.log('📊 当前编辑状态:', { 
    isEditMode: isEditMode.value, 
    hasChanges: hasChanges.value,
    editingRowsCount: Object.keys(editingRows.value).length,
    changedRowsCount: Object.keys(changedRows.value).filter(id => changedRows.value[id]).length
  })
  
  if (hasChanges.value) {
    // 有未保存的更改，询问用户
    console.log('⚠️ 检测到未保存的更改，显示确认对话框')
    if (confirm('您有未保存的更改，确定要退出编辑模式吗？')) {
      console.log('✅ 用户确认退出，清理编辑状态')
      editingRows.value = {}
      changedRows.value = {}
      savingRows.value = {}
      isEditMode.value = false
      message.info('已退出编辑模式，未保存的更改已丢弃')
    } else {
      console.log('❌ 用户取消退出')
    }
  } else {
    // 没有更改，直接退出
    console.log('✅ 没有更改，直接退出编辑模式')
    editingRows.value = {}
    changedRows.value = {}
    savingRows.value = {}
    isEditMode.value = false
    message.info('已退出编辑模式')
  }
}

const handleTableChange = (pagination: any) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
}

const handleRefresh = () => {
  emit('refresh', props.queryType)
}

const handleExport = async () => {
  try {
    exportLoading.value = true
    
    const blob = await quickQueryAPI.exportExcel({ format: props.queryType })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `快捷查询_${queryTypeDisplayName.value}_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const handleCloseOrExit = () => {
  console.log('🔄 handleCloseOrExit 被调用, isEditMode:', isEditMode.value)
  if (isEditMode.value) {
    console.log('📝 当前处于编辑模式，调用 exitEditMode')
    exitEditMode()
  } else {
    console.log('❌ 当前不在编辑模式，调用 handleClose')
    handleClose()
  }
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    quickQueryData.value = [...newData]
    currentPage.value = 1
    
    // 如果当前处于编辑模式，重新初始化编辑数据
    if (isEditMode.value) {
      initializeEditingData()
    }
  }
}, { immediate: true })

// 监听visible变化，控制弹窗显示和重置编辑状态
watch(() => props.visible, (newVisible) => {
  modalVisible.value = newVisible
  if (!newVisible) {
    editingRows.value = {}
    changedRows.value = {}
    savingRows.value = {}
    isEditMode.value = false
  }
}, { immediate: true })
</script>

<style scoped lang="less">
// 弹窗标题样式
.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .title-icon {
    color: #1890ff;
    font-size: 16px;
  }
}

.quick-query-results {
  .results-section {
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }

  // 区域头部（简化版，用于弹窗内部）
  .section-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 0 16px 0;
    margin-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .section-actions {
      display: flex;
      gap: 8px;

      .edit-mode-btn,
      .save-all-btn,
      .export-btn,
      .refresh-btn,
      .close-btn {
        color: #666;

        &:hover {
          color: #1890ff;
        }
      }
      
      .edit-mode-btn {
        &.edit-mode-active {
          color: #1890ff;
          background-color: #e6f7ff;
        }
      }
      
      .save-all-btn {
        &:hover {
          color: #52c41a;
        }
        
        &.enhanced-save-btn {
          background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
          border-color: #52c41a;
          box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
          font-weight: 600;
          
          &:hover {
            background: linear-gradient(135deg, #73d13d 0%, #95de64 100%);
            border-color: #73d13d;
            box-shadow: 0 4px 8px rgba(82, 196, 26, 0.3);
            transform: translateY(-1px);
          }
        }
      }
      
      .close-btn {
        &:hover {
          color: #ff4d4f;
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

  // 表格区域
  .results-table {
    padding: 0;

    :deep(.ant-table) {
      .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 600;
        color: #262626;
        font-size: 13px;
      }

      .ant-table-tbody > tr {
        &:hover {
          background-color: #f5f5f5;
        }
      }

      .ant-table-tbody > tr > td {
        font-size: 13px;
        padding: 8px 12px;
      }
    }

    .province-name {
      font-weight: 500;
    }

    .text-value,
    .score-value,
    .admission-value {
      font-size: 12px;
    }

    .score-value {
      color: #fa8c16;
      font-weight: 500;
    }

    .admission-value {
      color: #52c41a;
      font-weight: 500;
    }

    // 要求类型列样式
    .requirement-type-cell {
      text-align: center;
      vertical-align: middle;
      font-weight: 500;
      color: #1890ff;
    }
    
    // 行操作按钮
    .row-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      
      .edit-controls {
        .save-row-btn {
          color: #666;
          width: 20px;
          height: 20px;
          font-size: 12px;
          
          &:hover {
            color: #52c41a;
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
}

// 响应式适配
@media (max-width: 768px) {
  .quick-query-results {
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


    .results-table {
      padding: 16px;

      :deep(.ant-table) {
        .ant-table-thead > tr > th,
        .ant-table-tbody > tr > td {
          font-size: 12px;
          padding: 6px 8px;
        }
      }
    }
  }
}
</style>