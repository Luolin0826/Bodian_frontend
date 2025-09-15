<template>
  <div class="province-info">
    <!-- 组件标题和视图切换 -->
    <div class="province-info-header">
      <h4 class="info-title">
        <environment-outlined class="title-icon" />
        {{ currentProvinceName }}省份信息
      </h4>
      
      <div class="header-actions">
        <!-- 新增按钮 -->
        <a-dropdown :trigger="['click']" v-if="currentProvinceName">
          <a-button type="primary" size="small">
            <plus-outlined />
            新增内容
            <down-outlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleAddContent">
              <a-menu-item key="提前批">
                <clock-circle-outlined />
                提前批内容
              </a-menu-item>
              <a-menu-item key="一批/二批">
                <file-text-outlined />
                一批/二批内容
              </a-menu-item>
              <a-menu-item key="农网">
                <thunderbolt-outlined />
                农网内容
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        
        <!-- 视图切换按钮 -->
        <a-button-group>
          <a-button 
            :type="viewMode === 'list' ? 'primary' : 'default'"
            size="small"
            @click="viewMode = 'list'"
            title="列表视图"
          >
            <unordered-list-outlined />
          </a-button>
          <a-button 
            :type="viewMode === 'card' ? 'primary' : 'default'"
            size="small"
            @click="viewMode = 'card'"
            title="卡片视图"
          >
            <appstore-outlined />
          </a-button>
        </a-button-group>
      </div>
    </div>

    <!-- 内容展示区域 -->
    <div class="province-content-panel">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载省份信息...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!currentProvinceName" class="empty-state">
        <div class="empty-content">
          <environment-outlined class="empty-icon" />
          <h4 class="empty-title">选择单位查看省份信息</h4>
          <p class="empty-text">请在左侧"网申查询"面板中选择一个国网或南网单位</p>
        </div>
      </div>

      <!-- 无内容状态 -->
      <div v-else-if="totalContentCount === 0 && !loading" class="empty-state">
        <div class="empty-content">
          <file-text-outlined class="empty-icon" />
          <h4 class="empty-title">暂无省份信息</h4>
          <p class="empty-text">
            {{ currentProvinceName }}暂无相关信息，点击上方新增按钮添加内容
          </p>
        </div>
      </div>

      <!-- 内容展示 -->
      <div v-else class="content-container">
        <!-- 双栏统一列表展示，提高空间利用率 -->
        <div class="two-column-list">
          <template v-if="viewMode === 'list'">
            <div
              v-for="item in allContentList"
              :key="item.id"
              class="content-list-item"
              @click="openContentPreview(item)"
            >
              <div class="item-title-section">
                <span class="item-title">{{ item.title }}</span>
                <a-tag 
                  :color="getSectionDisplayTag(item.section).color" 
                  size="small"
                  class="section-tag"
                >
                  {{ getSectionDisplayTag(item.section).text }}
                </a-tag>
              </div>
              <div class="item-actions">
                <a-button type="text" size="small" @click.stop="copyToClipboard(item.content)" title="复制内容">
                  <copy-outlined />
                </a-button>
                <a-button type="text" size="small" @click.stop="startEditContent(item)" title="编辑内容">
                  <edit-outlined />
                </a-button>
                <a-button type="text" size="small" danger @click.stop="confirmDeleteContent(item)" title="删除内容">
                  <delete-outlined />
                </a-button>
              </div>
            </div>
          </template>
          
          <template v-else>
            <div
              v-for="item in allContentList"
              :key="item.id"
              class="content-card"
              :class="`card-${getSectionType(item.section)}`"
              @click="openContentPreview(item)"
            >
              <div class="card-header">
                <h4 class="card-title">{{ item.title }}</h4>
                <a-tag 
                  :color="getSectionDisplayTag(item.section).color" 
                  size="small"
                  class="card-section-tag"
                >
                  {{ getSectionDisplayTag(item.section).text }}
                </a-tag>
              </div>
              <div class="card-content">
                <p class="content-preview">{{ formatContentPreview(item.content) }}</p>
              </div>
              <div class="card-actions">
                <a-button type="text" size="small" @click.stop="copyToClipboard(item.content)" title="复制内容">
                  <copy-outlined />
                </a-button>
                <a-button type="text" size="small" @click.stop="startEditContent(item)" title="编辑内容">
                  <edit-outlined />
                </a-button>
                <a-button type="text" size="small" danger @click.stop="confirmDeleteContent(item)" title="删除内容">
                  <delete-outlined />
                </a-button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 内容预览对话框 -->
    <a-modal
      v-model:open="previewDialogVisible"
      :title="previewContent?.title"
      width="800px"
      :footer="null"
      class="content-preview-modal"
    >
      <div v-if="previewContent" class="content-preview">
        <!-- 内容头部信息 -->
        <div class="preview-header">
          <div class="preview-meta">
            <a-tag :color="getSectionColor(previewContent.section)">
              {{ getSectionDisplayName(previewContent.section) }}
            </a-tag>
            <span class="preview-date">{{ formatDate(previewContent.updated_at) }}</span>
          </div>
        </div>

        <!-- 内容正文 -->
        <div class="preview-content">
          <div class="content-text">{{ previewContent.content }}</div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="preview-actions">
          <a-space size="middle">
            <a-button @click="copyToClipboard(previewContent.content)">
              <copy-outlined />
              复制内容
            </a-button>
            <a-button type="primary" @click="startEditContent(previewContent)">
              <edit-outlined />
              编辑内容
            </a-button>
            <a-button
              type="primary"
              danger
              @click="confirmDeleteContent(previewContent)"
              :loading="deleteLoading"
            >
              <delete-outlined />
              删除内容
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 新增/编辑内容对话框 -->
    <a-modal
      v-model:open="editDialogVisible"
      :title="editMode === 'add' ? `新增${getSectionDisplayName(currentEditSection)}内容` : `编辑${currentEditItem?.section}内容`"
      width="700px"
      @ok="handleContentSubmit"
      @cancel="closeEditDialog"
      :confirm-loading="submitLoading"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item
          label="内容分类"
          name="section"
          :rules="[{ required: true, message: '请选择内容分类' }]"
        >
          <a-select
            v-model:value="editForm.section"
            placeholder="请选择内容分类"
            :disabled="editMode === 'edit'"
          >
            <a-select-option value="提前批">提前批</a-select-option>
            <a-select-option value="一批/二批">一批/二批</a-select-option>
            <a-select-option value="农网">农网</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="标题"
          name="title"
          :rules="[{ required: true, message: '请输入标题' }]"
        >
          <a-input
            v-model:value="editForm.title"
            placeholder="请输入内容标题"
            size="large"
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
            :rows="8"
            size="large"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteConfirmVisible"
      title="确认删除"
      @ok="handleDeleteContent"
      @cancel="cancelDeleteContent"
      :confirm-loading="deleteLoading"
    >
      <p>确定要删除这条内容吗？此操作不可撤销。</p>
      <div v-if="deleteTargetContent" class="delete-confirm-info">
        <p><strong>标题：</strong>{{ deleteTargetContent.title }}</p>
        <p><strong>分类：</strong>{{ getSectionDisplayName(deleteTargetContent.section) }}</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  FileTextOutlined,
  EnvironmentOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  PlusOutlined,
  DownOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import {
  dataQueryContentAPI,
  getProvinceAllContent,
  type DataQueryContent,
  type ProvinceContentSummary
} from '@/api/data-query-content'

// Props
interface Props {
  unitInfo?: any
}

const props = withDefaults(defineProps<Props>(), {
  unitInfo: null
})

// Emits
const emit = defineEmits<{
  'content-updated': []
  'loading-change': [loading: boolean]
}>()

// 响应式数据
const loading = ref(false)
const viewMode = ref<'list' | 'card'>('list')

// 数据存储 - 改为统一列表
const allContentList = ref<DataQueryContent[]>([])
const contentBySection = ref<{
  '一批/二批': DataQueryContent[]
  '提前批': DataQueryContent[]
  '农网': DataQueryContent[]
}>({
  '一批/二批': [],
  '提前批': [],
  '农网': []
})
const currentProvinceName = ref<string>('')
const currentUnitId = ref<number | null>(null)
const availableProvinces = ref<ProvinceContentSummary[]>([])

// 对话框状态
const previewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteConfirmVisible = ref(false)

// 加载状态
const submitLoading = ref(false)
const deleteLoading = ref(false)

// 表单数据
const editForm = reactive({
  section: '',
  title: '',
  content: ''
})

// 当前操作的项目
const currentEditItem = ref<DataQueryContent | null>(null)
const currentEditSection = ref<string>('')
const editMode = ref<'add' | 'edit'>('add')
const previewContent = ref<DataQueryContent | null>(null)
const deleteTargetContent = ref<DataQueryContent | null>(null)

// 辅助方法
const getSectionDisplayName = (section: string): string => {
  const mapping = {
    '基本政策信息': '一批/二批',
    '一批/二批': '一批/二批',
    '提前批': '提前批',
    '农网': '农网'
  }
  return mapping[section] || section
}

const getSectionColor = (section: string): string => {
  const colors = {
    '基本政策信息': 'blue',
    '一批/二批': 'blue',
    '提前批': 'orange',
    '农网': 'green'
  }
  return colors[section] || 'default'
}

const getSectionDisplayTag = (section: string): { text: string; color: string } => {
  const tags = {
    '基本政策信息': { text: '一批/二批', color: 'blue' },
    '一批/二批': { text: '一批/二批', color: 'blue' },
    '提前批': { text: '提前批', color: 'orange' },
    '农网': { text: '农网', color: 'green' }
  }
  return tags[section] || { text: section, color: 'default' }
}

const getSectionType = (section: string): string => {
  const types = {
    '基本政策信息': 'basic',
    '一批/二批': 'basic',
    '提前批': 'advance',
    '农网': 'rural'
  }
  return types[section] || 'default'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatContentPreview = (content: string): string => {
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

// 加载省份列表
const loadProvinces = async () => {
  try {
    const provinces = await dataQueryContentAPI.getProvincesList()
    availableProvinces.value = provinces || []
  } catch (error) {
    console.error('加载省份列表失败:', error)
  }
}

// 加载省份内容
const loadProvinceContent = async (unitId: number) => {
  if (!unitId) {
    allContentList.value = []
    contentBySection.value = {
      '一批/二批': [],
      '提前批': [],
      '农网': []
    }
    return
  }
  
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 使用unit_id调用API获取按分类组织的数据
    const response = await dataQueryContentAPI.getContentByProvince(unitId.toString())
    
    console.log('省份信息API响应:', response)
    
    // 从API响应中获取实际的省份名称和unit_id
    if (response.province) {
      currentProvinceName.value = response.province
    }
    currentUnitId.value = unitId
    
    // 处理API返回的数据，注意API返回的key是中文的
    const sections = {
      '提前批': response.content['提前批'] || [],
      '一批/二批': response.content['一批/二批'] || [], // API现在直接返回一批/二批
      '农网': response.content['农网'] || []
    }
    
    // 按照API返回的分类结构组织数据
    contentBySection.value = sections
    
    // 合并所有数据到统一列表，保持API的优先级排序
    allContentList.value = [
      ...sections['提前批'],
      ...sections['一批/二批'], 
      ...sections['农网']
    ]
    
    console.log('统一列表内容:', allContentList.value)
    console.log('按分类组织的内容:', contentBySection.value)
    
  } catch (error) {
    console.error('加载省份内容失败:', error)
    message.error('加载省份信息失败')
    allContentList.value = []
    contentBySection.value = {
      '一批/二批': [],
      '提前批': [],
      '农网': []
    }
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

// 内容操作
const handleAddContent = ({ key }: { key: string }) => {
  currentEditSection.value = key
  editForm.section = key
  editForm.title = ''
  editForm.content = ''
  editMode.value = 'add'
  editDialogVisible.value = true
}

const startEditContent = (item: DataQueryContent) => {
  currentEditItem.value = item
  editMode.value = 'edit'
  editForm.section = item.section
  editForm.title = item.title
  editForm.content = item.content
  previewDialogVisible.value = false
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  currentEditItem.value = null
  currentEditSection.value = ''
  editForm.section = ''
  editForm.title = ''
  editForm.content = ''
}

const handleContentSubmit = async () => {
  if (!editForm.title.trim() || !editForm.content.trim()) {
    message.error('请输入标题和内容')
    return
  }
  
  try {
    submitLoading.value = true
    
    if (editMode.value === 'add') {
      // 使用当前的unit_id
      if (!currentUnitId.value) {
        message.error('无法获取当前单位ID')
        return
      }
      
      // 如果是一批/二批，需要转换为后端的基本政策信息
      const backendSection = editForm.section === '一批/二批' ? '基本政策信息' : editForm.section
      
      await dataQueryContentAPI.createContent({
        unit_id: currentUnitId.value,
        section: backendSection as '基本政策信息' | '提前批' | '农网',
        title: editForm.title.trim(),
        content: editForm.content.trim()
      })
      message.success('内容创建成功')
    } else {
      await dataQueryContentAPI.updateContent(currentEditItem.value!.id, {
        title: editForm.title.trim(),
        content: editForm.content.trim()
      })
      message.success('内容更新成功')
    }
    
    // 重新加载内容
    if (currentUnitId.value) {
      await loadProvinceContent(currentUnitId.value)
    }
    emit('content-updated')
    closeEditDialog()
  } catch (error) {
    console.error('内容操作失败:', error)
    message.error(`内容${editMode.value === 'add' ? '创建' : '更新'}失败`)
  } finally {
    submitLoading.value = false
  }
}

const openContentPreview = (item: DataQueryContent) => {
  previewContent.value = item
  previewDialogVisible.value = true
}

const confirmDeleteContent = (item: DataQueryContent) => {
  deleteTargetContent.value = item
  previewDialogVisible.value = false
  deleteConfirmVisible.value = true
}

const cancelDeleteContent = () => {
  deleteConfirmVisible.value = false
  deleteTargetContent.value = null
}

const handleDeleteContent = async () => {
  if (!deleteTargetContent.value) {
    message.error('无法确定要删除的内容')
    return
  }
  
  try {
    deleteLoading.value = true
    
    await dataQueryContentAPI.deleteContent(deleteTargetContent.value.id)
    
    message.success('删除内容成功')
    deleteConfirmVisible.value = false
    deleteTargetContent.value = null
    
    // 重新加载内容
    if (currentUnitId.value) {
      await loadProvinceContent(currentUnitId.value)
    }
    emit('content-updated')
    
  } catch (error) {
    console.error('删除内容失败:', error)
    message.error('删除内容失败，请重试')
  } finally {
    deleteLoading.value = false
  }
}

const copyToClipboard = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    message.success('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败')
  }
}

// 计算总内容数量
const totalContentCount = computed(() => {
  return allContentList.value.length
})

// 监听单位信息变化
watch(() => props.unitInfo, async (newUnitInfo) => {
  console.log('省份信息组件监听到单位变化:', newUnitInfo)
  
  if (newUnitInfo?.unit_id) {
    // 使用unit_id加载省份内容
    await loadProvinceContent(newUnitInfo.unit_id)
  } else {
    // 清空状态
    currentProvinceName.value = ''
    currentUnitId.value = null
    allContentList.value = []
    contentBySection.value = {
      '一批/二批': [],
      '提前批': [],
      '农网': []
    }
  }
}, { deep: true, immediate: true })

// 组件挂载
onMounted(async () => {
  await loadProvinces()
})
</script>

<style scoped lang="less">
.province-info {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;

  .province-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border-bottom: 1px solid #e8ecef;

    .info-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
      display: flex;
      align-items: center;
      gap: 8px;

      .title-icon {
        font-size: 16px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .province-content-panel {
    padding: 20px;

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;

      .loading-placeholder {
        width: 100%;
        height: 300px;
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;

      .empty-content {
        text-align: center;
        color: #8c8c8c;

        .empty-icon {
          font-size: 48px;
          color: #d9d9d9;
          margin-bottom: 16px;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 18px;
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

    .content-container {
      .two-column-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        align-items: start;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .left-column,
        .right-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-block {
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          overflow: hidden;

          .section-header {
            padding: 12px 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-bottom: 1px solid #e2e8f0;

            .section-title {
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              color: #334155;
              display: flex;
              align-items: center;
              gap: 8px;

              .section-icon {
                font-size: 16px;
              }

              .section-count {
                font-size: 12px;
                color: #64748b;
                font-weight: 400;
              }
            }
          }

          .section-content {
            padding: 16px;

            .list-item {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              padding: 12px;
              background: #fafbfc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.2s ease;

              &:hover {
                border-color: #3b82f6;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
                background: #f8fafc;
              }

              &:last-child {
                margin-bottom: 0;
              }

              .list-item-content {
                flex: 1;
                min-width: 0;

                .item-title-with-tag {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  flex-wrap: wrap;

                  .item-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e293b;
                    line-height: 1.4;
                    flex: 1;
                    min-width: 0;
                  }

                  .section-tag {
                    flex-shrink: 0;
                    font-size: 10px;
                    height: 20px;
                    line-height: 18px;
                    border-radius: 10px;
                    padding: 0 8px;
                  }
                }
              }

              .list-item-actions {
                display: flex;
                align-items: center;
                gap: 4px;
                flex-shrink: 0;
                margin-left: 8px;
                opacity: 0.7;

                &:hover {
                  opacity: 1;
                }
              }
            }

            .card-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 12px;

              .content-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;

                &::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 3px;
                  transition: all 0.3s ease;
                }

                &.card-basic::before {
                  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
                }

                &.card-advance::before {
                  background: linear-gradient(90deg, #fa8c16 0%, #ffa940 100%);
                }

                &.card-rural::before {
                  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
                }

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

                  &.card-basic {
                    border-color: #40a9ff;
                    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
                  }

                  &.card-advance {
                    border-color: #ffa940;
                    box-shadow: 0 4px 12px rgba(250, 140, 22, 0.15);
                  }

                  &.card-rural {
                    border-color: #73d13d;
                    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.15);
                  }
                }

                .card-header {
                  margin-bottom: 8px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  gap: 8px;

                  .card-title {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e293b;
                    line-height: 1.4;
                    flex: 1;
                  }

                  .card-section-tag {
                    flex-shrink: 0;
                    font-size: 10px;
                    height: 20px;
                    line-height: 18px;
                    border-radius: 10px;
                    padding: 0 8px;
                  }
                }

                .card-content {
                  margin-bottom: 8px;

                  .content-preview {
                    margin: 0;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                    height: 48px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    word-break: break-word;
                  }
                }

                .card-actions {
                  display: flex;
                  gap: 4px;
                  padding-top: 8px;
                  border-top: 1px solid #f1f5f9;
                  opacity: 0.7;

                  &:hover {
                    opacity: 1;
                  }
                }
              }
            }

            .empty-section {
              text-align: center;
              color: #94a3b8;
              font-size: 12px;
              padding: 20px;
              font-style: italic;
            }
          }
        }

        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
          margin: 8px 0;
        }
      }

      .list-view {
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #1890ff;
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
          }

          .list-item-content {
            flex: 1;

            .item-title {
              font-size: 14px;
              font-weight: 600;
              color: #262626;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;

              .section-tag {
                flex-shrink: 0;
              }
            }

            .item-meta {
              .item-date {
                font-size: 12px;
                color: #8c8c8c;
              }
            }
          }

          .list-item-actions {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      // 双栏统一列表展示
      .two-column-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        align-items: start;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .content-list-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px;
          background: #fafbfc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
            background: #f8fafc;
          }

          .item-title-section {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;

            .item-title {
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
              line-height: 1.4;
              flex: 1;
              min-width: 0;
            }

            .section-tag {
              flex-shrink: 0;
              font-size: 10px;
              height: 20px;
              line-height: 18px;
              border-radius: 10px;
              padding: 0 8px;
            }
          }

          .item-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            margin-left: 8px;
            opacity: 0.7;

            &:hover {
              opacity: 1;
            }
          }
        }

        .content-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            transition: all 0.3s ease;
          }

          &.card-basic::before {
            background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
          }

          &.card-advance::before {
            background: linear-gradient(90deg, #fa8c16 0%, #ffa940 100%);
          }

          &.card-rural::before {
            background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
          }

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

            &.card-basic {
              border-color: #40a9ff;
              box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
            }

            &.card-advance {
              border-color: #ffa940;
              box-shadow: 0 4px 12px rgba(250, 140, 22, 0.15);
            }

            &.card-rural {
              border-color: #73d13d;
              box-shadow: 0 4px 12px rgba(82, 196, 26, 0.15);
            }
          }

          .card-header {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;

            .card-title {
              margin: 0;
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
              line-height: 1.4;
              flex: 1;
            }

            .card-section-tag {
              flex-shrink: 0;
              font-size: 10px;
              height: 20px;
              line-height: 18px;
              border-radius: 10px;
              padding: 0 8px;
            }
          }

          .card-content {
            margin-bottom: 8px;

            .content-preview {
              margin: 0;
              font-size: 12px;
              color: #64748b;
              line-height: 1.4;
              height: 48px;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              word-break: break-word;
            }
          }

          .card-actions {
            display: flex;
            gap: 4px;
            padding-top: 8px;
            border-top: 1px solid #f1f5f9;
            opacity: 0.7;

            &:hover {
              opacity: 1;
            }
          }
        }
      }

      .card-view {
        .content-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;

          .content-card {
            background: white;
            border: 1px solid #f0f0f0;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
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
              transition: all 0.3s ease;
            }

            &.card-basic::before {
              background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
            }

            &.card-advance::before {
              background: linear-gradient(90deg, #fa8c16 0%, #ffa940 100%);
            }

            &.card-rural::before {
              background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
            }

            &:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

              &.card-basic {
                border-color: #40a9ff;
                box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
              }

              &.card-advance {
                border-color: #ffa940;
                box-shadow: 0 8px 24px rgba(250, 140, 22, 0.15);
              }

              &.card-rural {
                border-color: #73d13d;
                box-shadow: 0 8px 24px rgba(82, 196, 26, 0.15);
              }
            }

            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;

              .card-title {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #262626;
                line-height: 1.4;
                flex: 1;
                margin-right: 12px;
              }
            }

            .card-content {
              margin-bottom: 16px;

              .content-preview {
                margin: 0;
                font-size: 12px;
                color: #595959;
                line-height: 1.6;
                height: 76px;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
              }
            }

            .card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 12px;
              border-top: 1px solid #f0f0f0;

              .card-date {
                font-size: 12px;
                color: #8c8c8c;
              }

              .card-actions {
                display: flex;
                gap: 4px;
              }
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
    padding: 20px 24px;

    .ant-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #262626;
    }
  }

  .ant-modal-body {
    padding: 24px;
  }
}

.content-preview {
  .preview-header {
    margin-bottom: 20px;

    .preview-meta {
      display: flex;
      align-items: center;
      gap: 16px;

      .preview-date {
        font-size: 14px;
        color: #8c8c8c;
      }
    }
  }

  .preview-content {
    margin-bottom: 24px;

    .content-text {
      font-size: 14px;
      line-height: 1.8;
      color: #262626;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #f0f0f0;
      min-height: 120px;
      max-height: 400px;
      overflow-y: auto;
    }
  }

  .preview-actions {
    display: flex;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;

    .ant-btn {
      height: 40px;
      border-radius: 8px;
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

.delete-confirm-info {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;

  p {
    margin: 4px 0;
    font-size: 13px;
    color: #666;

    strong {
      color: #262626;
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .province-info {
    .province-content-panel {
      .content-container {
        .card-view {
          .content-cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .province-info {
    .province-info-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }
    }

    .province-content-panel {
      padding: 16px;

      .content-container {
        .two-column-layout {
          grid-template-columns: 1fr !important;
          gap: 16px;

          .left-column {
            order: 1;
          }
          
          .right-column {
            order: 2;
          }
        }
      }
    }
  }

}

// 移动端适配
@media (max-width: 768px) {
  .province-info {
    .province-content-panel {
      padding: 16px;

      .content-container {
        .unified-content-list {
          .content-list-item {
            padding: 10px 12px;

            .item-title-section {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;

              .item-title {
                font-size: 13px;
              }

              .section-tag {
                align-self: flex-start;
              }
            }

            .item-actions {
              flex-direction: column;
              gap: 2px;
            }
          }

          .card-grid {
            grid-template-columns: 1fr;
            gap: 12px;

            .content-card {
              padding: 12px;

              .card-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;

                .card-section-tag {
                  align-self: flex-start;
                }
              }

              .card-content {
                .content-preview {
                  height: 48px;
                  -webkit-line-clamp: 2;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>