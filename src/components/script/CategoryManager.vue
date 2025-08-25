<template>
  <div class="category-manager">
    <!-- 顶部操作栏 -->
    <div class="manager-header">
      <div class="header-left">
        <h3 class="manager-title">
          <apartment-outlined class="title-icon" />
          话术分类管理
        </h3>
        <div class="header-stats">
          <a-badge :count="filteredTreeData.length" :offset="[10, -2]">
            <span class="category-count">
              显示{{ filteredTreeData.length }}个分类
            </span>
          </a-badge>
          <a-divider type="vertical" />
          <span class="total-count">共{{ totalCategoryCount }}个分类</span>
        </div>
      </div>
      
      <div class="header-actions">
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索分类名称..."
          size="small"
          style="width: 220px"
          allow-clear
          @press-enter="handleSearch"
        >
          <template #prefix>
            <search-outlined />
          </template>
        </a-input>
        
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <a-button type="primary" size="small">
            <plus-outlined />
            新建
            <down-outlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleMenuClick">
              <a-menu-item key="create-root">
                <folder-add-outlined />
                新建根分类
              </a-menu-item>
              <a-menu-item key="import">
                <import-outlined />
                批量导入
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="export">
                <export-outlined />
                导出分类
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        
        <a-button @click="refresh" size="small" :loading="loading" title="刷新数据">
          <reload-outlined />
        </a-button>
      </div>
    </div>
    
    <!-- 分类树 -->
    <div class="category-tree-wrapper">
      <a-spin :spinning="loading">
        <a-tree
          v-if="treeData.length > 0"
          :tree-data="filteredTreeData"
          :show-line="true"
          :show-icon="false"
          :selectable="true"
          :draggable="true"
          @select="handleSelect"
          @drop="handleDrop"
          class="category-tree"
        >
          <template #title="{ title, script_count, is_system, key }">
            <div class="tree-node" @contextmenu.prevent="(e) => showContextMenu(e, key, title, is_system)">
              <div class="node-content">
                <span class="node-name">{{ title }}</span>
                <div class="node-meta">
                  <a-tag v-if="is_system" color="blue" size="small">系统</a-tag>
                  <span v-if="script_count" class="node-count">({{ script_count }})</span>
                </div>
              </div>
              
              <div class="node-actions" v-if="!is_system">
                <a-button
                  type="text"
                  size="small"
                  @click.stop="handleEdit(key, title)"
                  class="action-btn"
                >
                  <edit-outlined />
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  @click.stop="handleCreateChild(key)"
                  class="action-btn"
                >
                  <plus-outlined />
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  @click.stop="handleDelete(key, title)"
                  class="action-btn delete-btn"
                  :disabled="script_count > 0"
                >
                  <delete-outlined />
                </a-button>
              </div>
            </div>
          </template>
        </a-tree>
        
        <div v-else class="empty-state">
          <folder-open-outlined class="empty-icon" />
          <p>暂无分类数据</p>
          <a-button type="primary" @click="handleCreate">
            <plus-outlined />
            创建第一个分类
          </a-button>
        </div>
      </a-spin>
    </div>
    
    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleEdit(contextMenu.nodeId, contextMenu.nodeName)">
        <edit-outlined />
        重命名
      </div>
      <div class="menu-item" @click="handleCreateChild(contextMenu.nodeId)">
        <plus-outlined />
        新建子分类
      </div>
      <div class="menu-divider"></div>
      <div 
        class="menu-item delete-item" 
        @click="handleDelete(contextMenu.nodeId, contextMenu.nodeName)"
        :class="{ disabled: contextMenu.isSystem }"
      >
        <delete-outlined />
        删除分类
      </div>
    </div>
    
    <!-- 新建/编辑分类弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :width="500"
      @ok="handleSubmit"
      @cancel="resetForm"
      :confirm-loading="submitting"
    >
      <a-form :model="form" layout="vertical" ref="formRef">
        <a-form-item
          label="分类名称"
          name="name"
          :rules="[{ required: true, message: '请输入分类名称' }]"
        >
          <a-input
            v-model:value="form.name"
            placeholder="请输入分类名称"
            @press-enter="handleSubmit"
          />
        </a-form-item>
        
        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="form.description"
            placeholder="请输入分类描述（可选）"
            :rows="3"
          />
        </a-form-item>
        
        <a-form-item label="父分类" name="parent_id" v-if="!form.id || mode === 'create'">
          <a-tree-select
            v-model:value="form.parent_id"
            :tree-data="parentOptions"
            placeholder="选择父分类（可选）"
            allow-clear
            :tree-default-expand-all="true"
            :field-names="{ label: 'title', value: 'key', children: 'children' }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  ApartmentOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  DownOutlined,
  FolderAddOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'
import {
  getScriptCategoriesTree,
  createScriptCategory,
  updateScriptCategory,
  deleteScriptCategory,
  type ScriptCategory
} from '@/api/script'

// Props
interface Props {
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  height: '500px'
})

// Emits
const emit = defineEmits<{
  'update': [category: ScriptCategory]
  'create': [category: ScriptCategory]
  'delete': [categoryId: number]
  'refresh': []
}>()

// 数据
const loading = ref(false)
const submitting = ref(false)
const categories = ref<ScriptCategory[]>([])
const searchKeyword = ref('')
const modalVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const formRef = ref()

// 表单数据
const form = ref({
  id: null as number | null,
  name: '',
  description: '',
  parent_id: null as number | null
})

// 右键菜单
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  nodeId: null as number | null,
  nodeName: '',
  isSystem: false
})

// 计算属性
const modalTitle = computed(() => {
  return mode.value === 'create' ? '新建分类' : '编辑分类'
})

const totalCategoryCount = computed(() => {
  const countCategories = (cats: ScriptCategory[]): number => {
    let count = 0
    cats.forEach(cat => {
      count++
      if (cat.children && cat.children.length > 0) {
        count += countCategories(cat.children)
      }
    })
    return count
  }
  return countCategories(categories.value)
})

const treeData = computed(() => {
  const buildTreeNode = (category: ScriptCategory) => {
    const node: any = {
      title: category.name,
      key: category.id,
      script_count: category.script_count,
      is_system: category.is_system
    }
    
    if (category.children && category.children.length > 0) {
      node.children = category.children.map(buildTreeNode)
    }
    
    return node
  }
  
  return categories.value.map(buildTreeNode)
})

const filteredTreeData = computed(() => {
  if (!searchKeyword.value) {
    return treeData.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  
  const filterNode = (node: any): any | null => {
    const nameMatch = node.title.toLowerCase().includes(keyword)
    
    let filteredChildren: any[] = []
    if (node.children) {
      filteredChildren = node.children
        .map((child: any) => filterNode(child))
        .filter((child: any) => child !== null)
    }
    
    if (nameMatch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : undefined
      }
    }
    
    return null
  }
  
  return treeData.value
    .map(node => filterNode(node))
    .filter(node => node !== null)
})

const parentOptions = computed(() => {
  const excludeId = form.value.id
  
  const buildOptions = (cats: ScriptCategory[], level = 0): any[] => {
    return cats
      .filter(cat => cat.id !== excludeId) // 排除自身
      .map(cat => {
        const option: any = {
          title: cat.name,
          key: cat.id,
          disabled: level >= 2 // 限制层级深度
        }
        
        if (cat.children && cat.children.length > 0) {
          option.children = buildOptions(cat.children, level + 1)
        }
        
        return option
      })
  }
  
  return buildOptions(categories.value)
})

// 方法
const handleSearch = () => {
  // 搜索功能通过计算属性 filteredTreeData 实现
}

const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'create-root':
      handleCreate()
      break
    case 'import':
      message.info('批量导入功能正在开发中')
      break
    case 'export':
      handleExportCategories()
      break
  }
}

const handleExportCategories = () => {
  try {
    const exportData = {
      exportTime: new Date().toISOString(),
      totalCount: totalCategoryCount.value,
      categories: categories.value
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `script-categories-${new Date().getTime()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    message.success('分类数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  }
}

const loadCategories = async () => {
  loading.value = true
  try {
    const response = await getScriptCategoriesTree()
    categories.value = response.data || []
    emit('refresh')
  } catch (error) {
    console.error('获取分类失败:', error)
    message.error('获取分类失败')
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  loadCategories()
}

const handleCreate = (parentId?: number) => {
  mode.value = 'create'
  form.value = {
    id: null,
    name: '',
    description: '',
    parent_id: parentId || null
  }
  modalVisible.value = true
  
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleCreateChild = (parentId: number) => {
  handleCreate(parentId)
}

const handleEdit = (categoryId: number, categoryName: string) => {
  const category = findCategoryById(categories.value, categoryId)
  if (!category) {
    message.error('分类不存在')
    return
  }
  
  mode.value = 'edit'
  form.value = {
    id: category.id!,
    name: category.name,
    description: category.description || '',
    parent_id: category.parent_id || null
  }
  modalVisible.value = true
  
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleDelete = (categoryId: number, categoryName: string) => {
  const category = findCategoryById(categories.value, categoryId)
  if (!category) return
  
  if (category.script_count && category.script_count > 0) {
    message.warning(`分类"${categoryName}"下还有${category.script_count}个话术，无法删除`)
    return
  }
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类"${categoryName}"吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        await deleteScriptCategory(categoryId)
        message.success('删除成功')
        emit('delete', categoryId)
        loadCategories()
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除失败')
      }
    }
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    submitting.value = true
    
    const data = {
      name: form.value.name.trim(),
      description: form.value.description || undefined,
      parent_id: form.value.parent_id
    }
    
    if (mode.value === 'create') {
      const response = await createScriptCategory(data)
      message.success('创建成功')
      emit('create', response.data)
    } else {
      const response = await updateScriptCategory(form.value.id!, data)
      message.success('更新成功')
      emit('update', response.data)
    }
    
    modalVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('提交失败:', error)
    message.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    id: null,
    name: '',
    description: '',
    parent_id: null
  }
}

const handleSelect = (selectedKeys: number[]) => {
  // 处理节点选择
}

const handleDrop = (info: any) => {
  // 处理拖拽排序
  console.log('拖拽排序:', info)
}

const showContextMenu = (e: MouseEvent, nodeId: number, nodeName: string, isSystem: boolean) => {
  if (isSystem) return // 系统分类不显示右键菜单
  
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    nodeId,
    nodeName,
    isSystem
  }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
}

const findCategoryById = (cats: ScriptCategory[], id: number): ScriptCategory | null => {
  for (const cat of cats) {
    if (cat.id === id) return cat
    if (cat.children) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}

// 生命周期
onMounted(() => {
  loadCategories()
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})

// 暴露方法
defineExpose({
  refresh: loadCategories
})
</script>

<style scoped lang="less">
.category-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  
  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
    border-radius: 8px 8px 0 0;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .manager-title {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #333;
        font-size: 16px;
        font-weight: 600;
        
        .title-icon {
          color: #1890ff;
          font-size: 18px;
        }
      }
      
      .header-stats {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .category-count {
          font-size: 12px;
          color: #1890ff;
          font-weight: 500;
        }
        
        .total-count {
          font-size: 12px;
          color: #666;
        }
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .category-tree-wrapper {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    
    .category-tree {
      .tree-node {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 4px 0;
        
        &:hover .node-actions {
          opacity: 1;
        }
        
        .node-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .node-name {
            font-weight: 500;
          }
          
          .node-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .node-count {
              font-size: 12px;
              color: #8c8c8c;
            }
          }
        }
        
        .node-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: all 0.2s;
          
          .action-btn {
            padding: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 12px;
            transition: all 0.2s;
            
            &:hover {
              background-color: #f0f9ff;
              color: #1890ff;
              transform: scale(1.1);
            }
            
            &.delete-btn:hover {
              color: #ff4d4f;
              background-color: #fff2f0;
              transform: scale(1.1);
            }
          }
        }
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: #8c8c8c;
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: #d9d9d9;
      }
      
      p {
        margin-bottom: 16px;
        font-size: 14px;
      }
    }
  }
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    &.disabled {
      color: #ccc;
      cursor: not-allowed;
      
      &:hover {
        background-color: transparent;
      }
    }
    
    &.delete-item:hover:not(.disabled) {
      background-color: #fff2f0;
      color: #ff4d4f;
    }
  }
  
  .menu-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 4px 0;
  }
}

:deep(.ant-tree) {
  .ant-tree-node-content-wrapper {
    width: 100%;
    
    &:hover {
      background-color: transparent;
    }
    
    &.ant-tree-node-selected {
      background-color: #e6f7ff;
    }
  }
  
  .ant-tree-treenode {
    padding: 2px 0;
  }
}
</style>