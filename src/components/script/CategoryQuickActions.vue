<template>
  <div class="category-quick-actions">
    <!-- 右键菜单触发器 -->
    <a-dropdown 
      :trigger="['contextmenu']"
      v-model:open="contextMenuOpen"
      :get-popup-container="getPopupContainer"
    >
      <slot :showContextMenu="showContextMenu" />
      
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <a-menu-item key="rename" :disabled="!canEdit">
            <edit-outlined />
            重命名分类
          </a-menu-item>
          
          <a-menu-item key="edit" :disabled="!canEdit">
            <form-outlined />
            编辑分类
          </a-menu-item>
          
          <a-menu-divider v-if="canEdit" />
          
          <a-menu-item key="create-child" :disabled="!canCreateChild">
            <plus-outlined />
            创建子分类
          </a-menu-item>
          
          <a-menu-divider />
          
          <a-menu-item key="view-scripts">
            <unordered-list-outlined />
            查看话术 ({{ category.script_count || 0 }})
          </a-menu-item>
          
          <a-menu-item key="copy-name">
            <copy-outlined />
            复制分类名
          </a-menu-item>
          
          <a-menu-divider v-if="canDelete" />
          
          <a-menu-item key="disable" v-if="canEdit && category.is_active" :disabled="!canDisable">
            <stop-outlined />
            禁用分类
          </a-menu-item>
          
          <a-menu-item key="enable" v-if="canEdit && !category.is_active">
            <play-circle-outlined />
            启用分类
          </a-menu-item>
          
          <a-menu-item key="delete" :disabled="!canDelete" class="danger-menu-item">
            <delete-outlined />
            删除分类
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    
    <!-- 快速编辑弹窗 -->
    <a-modal
      v-model:open="showRenameModal"
      title="重命名分类"
      :width="400"
      @ok="handleRename"
      @cancel="cancelRename"
    >
      <a-form>
        <a-form-item label="分类名称">
          <a-input 
            ref="renameInput"
            v-model:value="renameForm.name"
            placeholder="请输入新的分类名称"
            @press-enter="handleRename"
          />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 编辑分类弹窗 -->
    <a-modal
      v-model:open="showEditModal"
      title="编辑分类"
      :width="500"
      @ok="handleEdit"
      @cancel="cancelEdit"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="分类名称" required>
          <a-input 
            v-model:value="editForm.name"
            placeholder="请输入分类名称"
          />
        </a-form-item>
        
        <a-form-item label="分类描述">
          <a-textarea 
            v-model:value="editForm.description"
            placeholder="请输入分类描述（可选）"
            :rows="3"
          />
        </a-form-item>
        
        <a-form-item label="父分类">
          <CategorySelector
            v-model="editForm.parent_id"
            placeholder="选择父分类（可选）"
            :allow-create="false"
            :show-count="false"
          />
        </a-form-item>
        
        <a-form-item label="排序权重">
          <a-input-number 
            v-model:value="editForm.sort_order"
            placeholder="数值越小越靠前"
            :min="0"
            :max="9999"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-model:checked="editForm.is_active">
            启用此分类
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 创建子分类弹窗 -->
    <a-modal
      v-model:open="showCreateChildModal"
      title="创建子分类"
      :width="500"
      @ok="handleCreateChild"
      @cancel="cancelCreateChild"
    >
      <a-form :model="createChildForm" layout="vertical">
        <a-form-item label="父分类" required>
          <a-input :value="category.name" disabled />
        </a-form-item>
        
        <a-form-item label="分类名称" required>
          <a-input 
            v-model:value="createChildForm.name"
            placeholder="请输入分类名称"
          />
        </a-form-item>
        
        <a-form-item label="分类描述">
          <a-textarea 
            v-model:value="createChildForm.description"
            placeholder="请输入分类描述（可选）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  EditOutlined,
  FormOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  CopyOutlined,
  StopOutlined,
  PlayCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import CategorySelector from './CategorySelector.vue'
import {
  updateScriptCategory,
  createScriptCategory,
  deleteScriptCategory,
  type ScriptCategory
} from '@/api/script'

// Props
interface Props {
  category: ScriptCategory
  allowEdit?: boolean      // 是否允许编辑
  allowDelete?: boolean    // 是否允许删除
  allowCreateChild?: boolean  // 是否允许创建子分类
}

const props = withDefaults(defineProps<Props>(), {
  allowEdit: true,
  allowDelete: true,
  allowCreateChild: true
})

// Emits
const emit = defineEmits<{
  'update': [category: ScriptCategory]
  'delete': [categoryId: number]
  'create-child': [category: ScriptCategory]
  'view-scripts': [categoryId: number]
  'status-change': [categoryId: number, isActive: boolean]
}>()

// 数据
const contextMenuOpen = ref(false)
const showRenameModal = ref(false)
const showEditModal = ref(false)
const showCreateChildModal = ref(false)
const renameInput = ref()

const renameForm = ref({
  name: ''
})

const editForm = ref({
  name: '',
  description: '',
  parent_id: null as number | null,
  sort_order: 0,
  is_active: true
})

const createChildForm = ref({
  name: '',
  description: ''
})

// 计算属性
const canEdit = computed(() => {
  // 系统分类不允许编辑
  return props.allowEdit && !props.category.is_system
})

const canDelete = computed(() => {
  // 系统分类或有子分类的分类不允许删除
  return props.allowDelete && 
         !props.category.is_system && 
         (!props.category.children || props.category.children.length === 0) &&
         (!props.category.script_count || props.category.script_count === 0)
})

const canCreateChild = computed(() => {
  return props.allowCreateChild
})

const canDisable = computed(() => {
  // 有话术的分类不能禁用
  return !props.category.script_count || props.category.script_count === 0
})

// 方法
const getPopupContainer = (triggerNode: HTMLElement) => {
  return triggerNode.parentNode as HTMLElement
}

const showContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  contextMenuOpen.value = true
}

const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'rename':
      openRenameModal()
      break
    case 'edit':
      openEditModal()
      break
    case 'create-child':
      openCreateChildModal()
      break
    case 'view-scripts':
      emit('view-scripts', props.category.id!)
      break
    case 'copy-name':
      copyToClipboard(props.category.name)
      break
    case 'disable':
      handleStatusChange(false)
      break
    case 'enable':
      handleStatusChange(true)
      break
    case 'delete':
      confirmDelete()
      break
  }
}

const openRenameModal = () => {
  renameForm.value.name = props.category.name
  showRenameModal.value = true
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

const handleRename = async () => {
  const newName = renameForm.value.name.trim()
  if (!newName) {
    message.warning('分类名称不能为空')
    return
  }
  
  if (newName === props.category.name) {
    showRenameModal.value = false
    return
  }
  
  try {
    const response = await updateScriptCategory(props.category.id!, {
      name: newName
    })
    
    message.success('分类重命名成功')
    emit('update', response.data)
    showRenameModal.value = false
  } catch (error) {
    console.error('重命名失败:', error)
    message.error('重命名失败')
  }
}

const cancelRename = () => {
  showRenameModal.value = false
}

const openEditModal = () => {
  editForm.value = {
    name: props.category.name,
    description: props.category.description || '',
    parent_id: props.category.parent_id || null,
    sort_order: props.category.sort_order || 0,
    is_active: props.category.is_active !== false
  }
  showEditModal.value = true
}

const handleEdit = async () => {
  if (!editForm.value.name.trim()) {
    message.warning('分类名称不能为空')
    return
  }
  
  try {
    const response = await updateScriptCategory(props.category.id!, {
      name: editForm.value.name.trim(),
      description: editForm.value.description || undefined,
      parent_id: editForm.value.parent_id,
      sort_order: editForm.value.sort_order,
      is_active: editForm.value.is_active
    })
    
    message.success('分类更新成功')
    emit('update', response.data)
    showEditModal.value = false
  } catch (error) {
    console.error('更新失败:', error)
    message.error('更新失败')
  }
}

const cancelEdit = () => {
  showEditModal.value = false
}

const openCreateChildModal = () => {
  createChildForm.value = {
    name: '',
    description: ''
  }
  showCreateChildModal.value = true
}

const handleCreateChild = async () => {
  if (!createChildForm.value.name.trim()) {
    message.warning('分类名称不能为空')
    return
  }
  
  try {
    const response = await createScriptCategory({
      name: createChildForm.value.name.trim(),
      description: createChildForm.value.description || undefined,
      parent_id: props.category.id!
    })
    
    message.success('子分类创建成功')
    emit('create-child', response.data)
    showCreateChildModal.value = false
  } catch (error) {
    console.error('创建子分类失败:', error)
    message.error('创建子分类失败')
  }
}

const cancelCreateChild = () => {
  showCreateChildModal.value = false
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败')
  }
}

const handleStatusChange = async (isActive: boolean) => {
  try {
    await updateScriptCategory(props.category.id!, {
      is_active: isActive
    })
    
    message.success(isActive ? '分类已启用' : '分类已禁用')
    emit('status-change', props.category.id!, isActive)
  } catch (error) {
    console.error('状态修改失败:', error)
    message.error('状态修改失败')
  }
}

const confirmDelete = () => {
  Modal.confirm({
    title: '确认删除分类',
    content: `确定要删除分类"${props.category.name}"吗？此操作不可撤销。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: handleDelete
  })
}

const handleDelete = async () => {
  try {
    await deleteScriptCategory(props.category.id!)
    message.success('分类删除成功')
    emit('delete', props.category.id!)
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  }
}
</script>

<style scoped lang="less">
.category-quick-actions {
  display: inline-block;
}

:deep(.ant-dropdown-menu) {
  .danger-menu-item {
    color: #ff4d4f;
    
    &:hover {
      background-color: #fff2f0;
      color: #ff4d4f;
    }
    
    .anticon {
      color: #ff4d4f;
    }
  }
  
  .ant-dropdown-menu-item {
    &:hover {
      .anticon {
        color: inherit;
      }
    }
  }
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}
</style>