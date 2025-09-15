<template>
  <div class="content-section">
    <!-- 操作栏 -->
    <div class="section-header">
      <div class="header-title">
        <span>{{ section }}内容管理</span>
        <a-tag :color="contents.length > 0 ? 'green' : 'gray'">
          {{ contents.length }}项内容
        </a-tag>
      </div>
      
      <div class="header-actions">
        <a-button @click="showAddModal" type="primary">
          <plus-outlined />
          添加内容
        </a-button>
        
        <a-button @click="refreshContent" :loading="refreshing">
          <reload-outlined />
          刷新
        </a-button>
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-list">
      <a-list
        :data-source="contents"
        :loading="loading"
      >
        <template #renderItem="{ item, index }">
          <a-list-item>
            <template #actions>
              <a-button
                type="text"
                size="small"
                @click="showEditModal(item)"
                title="编辑"
              >
                <edit-outlined />
              </a-button>
              
              <a-popconfirm
                title="确定要删除这项内容吗？"
                @confirm="deleteContent(item.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button
                  type="text"
                  size="small"
                  danger
                  title="删除"
                >
                  <delete-outlined />
                </a-button>
              </a-popconfirm>
            </template>
            
            <a-list-item-meta>
              <template #title>
                <span>{{ index + 1 }}. {{ item.title }}</span>
                <a-tag v-if="item.display_order" size="small" style="margin-left: 8px">
                  序号: {{ item.display_order }}
                </a-tag>
              </template>
              
              <template #description>
                <div class="content-preview">
                  {{ truncateContent(item.content, 100) }}
                </div>
                <div class="content-meta">
                  <span>更新时间: {{ formatDate(item.updated_at) }}</span>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- 添加/编辑内容对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingItem ? '编辑内容' : '添加内容'"
      @ok="handleSave"
      @cancel="handleCancel"
      width="800px"
      :confirmLoading="saving"
    >
      <a-form
        :model="formData"
        :rules="formRules"
        layout="vertical"
        ref="formRef"
      >
        <a-form-item label="标题" name="title">
          <a-input
            v-model:value="formData.title"
            placeholder="请输入内容标题"
          />
        </a-form-item>
        
        <a-form-item label="显示顺序" name="display_order">
          <a-input-number
            v-model:value="formData.display_order"
            :min="1"
            :max="100"
            placeholder="显示顺序（数字越小越靠前）"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="内容" name="content">
          <a-textarea
            v-model:value="formData.content"
            placeholder="请输入具体内容"
            :rows="10"
            show-count
            :maxlength="2000"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  ReloadOutlined 
} from '@ant-design/icons-vue'
import {
  dataQueryContentAPI,
  type DataQueryContent
} from '@/api/data-query-content'

// Props
const props = defineProps<{
  province: string
  section: '基本政策信息' | '提前批' | '农网'
  contents: DataQueryContent[]
}>()

// Emits
const emit = defineEmits<{
  refresh: []
  'content-updated': []
}>()

// 数据
const loading = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const modalVisible = ref(false)
const editingItem = ref<DataQueryContent | null>(null)

const formRef = ref()
const formData = reactive({
  title: '',
  content: '',
  display_order: 1
})

const formRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 200, message: '标题不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { max: 2000, message: '内容不能超过2000个字符', trigger: 'blur' }
  ],
  display_order: [
    { required: true, message: '请输入显示顺序', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '显示顺序必须在1-100之间', trigger: 'blur' }
  ]
}

// 工具函数
const truncateContent = (content: string, maxLength: number) => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取省份的unit_id
const getUnitIdByProvince = async (province: string): Promise<number | null> => {
  try {
    // 从省份列表中查找unit_id
    const provinces = await dataQueryContentAPI.getProvincesList()
    const provinceInfo = provinces.find(p => p.province === province)
    return provinceInfo?.unit_id || null
  } catch (error) {
    console.error('获取省份单位ID失败:', error)
    return null
  }
}

// 刷新内容
const refreshContent = () => {
  refreshing.value = true
  emit('refresh')
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

// 显示添加对话框
const showAddModal = () => {
  editingItem.value = null
  formData.title = ''
  formData.content = ''
  formData.display_order = (props.contents.length + 1)
  modalVisible.value = true
}

// 显示编辑对话框
const showEditModal = (item: DataQueryContent) => {
  editingItem.value = item
  formData.title = item.title
  formData.content = item.content
  formData.display_order = item.display_order
  modalVisible.value = true
}

// 保存内容
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true

    if (editingItem.value) {
      // 更新内容
      await dataQueryContentAPI.updateContent(editingItem.value.id, {
        title: formData.title,
        content: formData.content,
        display_order: formData.display_order
      })
      message.success('内容更新成功')
    } else {
      // 添加内容
      const unitId = await getUnitIdByProvince(props.province)
      if (!unitId) {
        message.error('无法找到对应的省份单位信息')
        return
      }

      await dataQueryContentAPI.createContent({
        unit_id: unitId,
        section: props.section,
        title: formData.title,
        content: formData.content,
        display_order: formData.display_order
      })
      message.success('内容添加成功')
    }

    modalVisible.value = false
    emit('content-updated')
  } catch (error) {
    console.error('保存内容失败:', error)
    message.error('保存内容失败')
  } finally {
    saving.value = false
  }
}

// 取消操作
const handleCancel = () => {
  modalVisible.value = false
  editingItem.value = null
}

// 删除内容
const deleteContent = async (contentId: number) => {
  try {
    await dataQueryContentAPI.deleteContent(contentId)
    message.success('删除成功')
    emit('content-updated')
  } catch (error) {
    console.error('删除内容失败:', error)
    message.error('删除失败')
  }
}
</script>

<style scoped lang="less">
.content-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fafafa;
    border-radius: 6px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .content-list {
    min-height: 300px;

    :deep(.ant-list-item) {
      border-radius: 6px;
      margin-bottom: 8px;
      background: white;
      border: 1px solid #f0f0f0;

      &:hover {
        border-color: #d9d9d9;
      }
    }

    .content-preview {
      color: #666;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .content-meta {
      font-size: 12px;
      color: #999;
    }
  }
}
</style>