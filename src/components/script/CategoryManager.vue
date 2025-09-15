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
          <span class="stats-item">
            <span class="stats-label">显示:</span>
            <span class="stats-value">{{ filteredTreeData.length }}</span>
          </span>
          <span class="stats-item">
            <span class="stats-label">总数:</span>
            <span class="stats-value">{{ totalCategoryCount }}</span>
          </span>
          <a-tooltip title="拖拽分类节点可调整显示顺序">
            <span class="drag-tip">
              <drag-outlined />
              拖拽排序
            </span>
          </a-tooltip>
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
        
        <a-button @click="initializeSortOrder" size="small" title="初始化排序">
          <sort-ascending-outlined />
          初始化排序
        </a-button>
        
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
                <div class="node-left">
                  <span class="node-name">{{ title }}</span>
                  <a-tag v-if="is_system" color="blue" size="small">系统</a-tag>
                </div>
                <span v-if="script_count" class="node-count">{{ script_count }}</span>
              </div>
              
              <div class="node-actions" v-if="!is_system">
                <span class="drag-handle" title="拖拽调整顺序">
                  <drag-outlined />
                </span>
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
  ExportOutlined,
  DragOutlined,
  SortAscendingOutlined
} from '@ant-design/icons-vue'
import {
  getScriptCategoriesTree,
  createScriptCategory,
  updateScriptCategory,
  deleteScriptCategory,
  batchSortCategories,
  type ScriptCategory,
  type BatchSortRequest,
  type CategorySortItem
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
      is_system: category.is_system,
      sort_order: category.sort_order || 0
    }
    
    if (category.children && category.children.length > 0) {
      // 子分类也按sort_order排序
      const sortedChildren = [...category.children]
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      node.children = sortedChildren.map(buildTreeNode)
    }
    
    return node
  }
  
  // 根分类按sort_order排序
  const sortedCategories = [...categories.value]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  
  return sortedCategories.map(buildTreeNode)
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

// 初始化排序值
const initializeSortOrder = async () => {
  try {
    const allCategories = flattenCategories(categories.value)
    const needsUpdate: CategorySortItem[] = []
    
    // 检查是否需要初始化sort_order
    const hasUnsortedCategories = allCategories.some(cat => !cat.sort_order || cat.sort_order === 0)
    
    if (hasUnsortedCategories) {
      console.log('发现未排序的分类，正在初始化sort_order...')
      
      // 为根分类分配排序
      const rootCategories = allCategories.filter(cat => !cat.parent_id)
      rootCategories.forEach((cat, index) => {
        const newSortOrder = (index + 1) * 10
        if (cat.sort_order !== newSortOrder) {
          needsUpdate.push({ id: cat.id!, sort_order: newSortOrder })
        }
      })
      
      // 为子分类分配排序
      rootCategories.forEach(rootCat => {
        const childCategories = allCategories.filter(cat => cat.parent_id === rootCat.id)
        childCategories.forEach((child, index) => {
          const newSortOrder = (index + 1) * 10
          if (child.sort_order !== newSortOrder) {
            needsUpdate.push({ id: child.id!, sort_order: newSortOrder })
          }
        })
      })
      
      if (needsUpdate.length > 0) {
        console.log('初始化排序:', needsUpdate)
        await batchSortCategories({ categories: needsUpdate })
        message.success('排序初始化完成')
        
        // 重新加载数据
        await loadCategoriesData()
      }
    }
  } catch (error) {
    console.error('初始化排序失败:', error)
    message.error('初始化排序失败')
  }
}

const loadCategoriesData = async () => {
  const response = await getScriptCategoriesTree({ include_stats: true })
  categories.value = response.data || []
  
  // 调试：检查数据结构
  console.log('分类原始数据:', categories.value)
  console.log('构建的树数据:', treeData.value)
}

const loadCategories = async () => {
  loading.value = true
  try {
    await loadCategoriesData()
    
    // 初始化排序（如果需要）
    await initializeSortOrder()
    
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

// 控制拖拽行为
const allowDrop = (info: any) => {
  try {
    console.log('allowDrop被调用，info:', info)
    
    // 更详细的调试信息
    if (!info) {
      console.log('allowDrop: info为空')
      return false
    }
    
    // 检查info的所有属性
    console.log('info的属性:', Object.keys(info))
    
    // 尝试不同的属性访问方式
    const dragNode = info.dragNode || info.drag || info.dragging
    const node = info.node || info.dropNode || info.drop
    
    console.log('解析的节点:', { dragNode, node })
    
    if (!dragNode || !node) {
      console.log('allowDrop: 节点为空', { 
        hasDragNode: !!dragNode, 
        hasNode: !!node,
        infoKeys: Object.keys(info)
      })
      return false
    }
    
    console.log('allowDrop: 允许拖拽', {
      dragKey: dragNode?.key,
      dropKey: node?.key,
      dragTitle: dragNode?.title,
      dropTitle: node?.title
    })
    
    return true
  } catch (error) {
    console.error('allowDrop函数出错:', error, info)
    return false
  }
}

const handleDrop = async (info: any) => {
  console.log('拖拽排序事件:', info)
  
  // 检查参数完整性
  if (!info || !info.dragNode || !info.node) {
    console.error('handleDrop: 参数不完整', info)
    return
  }
  
  const { dragNode, node, dropPosition, dropToGap } = info
  
  // 检查节点数据完整性
  if (!dragNode.key || !node.key) {
    console.error('handleDrop: 节点key缺失', { dragNode, node })
    return
  }
  
  // 获取拖拽节点和目标节点信息
  const dragKey = dragNode.key as number
  const dropKey = node.key as number
  
  console.log('拖拽详情:', {
    dragKey,
    dropKey,
    dropPosition,
    dropToGap,
    dragTitle: dragNode.title,
    dropTitle: node.title
  })
  
  try {
    // 构建新的排序列表
    const updatedCategories = await buildNewSortOrder(dragKey, dropKey, dropPosition, dropToGap)
    
    if (updatedCategories.length === 0) {
      console.log('无需更新排序')
      return
    }
    
    // 调用批量排序API
    console.log('准备更新排序:', updatedCategories)
    await batchSortCategories({ categories: updatedCategories })
    
    message.success('排序更新成功')
    
    // 重新加载数据以反映排序变化
    await loadCategoriesData()
    
  } catch (error) {
    console.error('排序更新失败:', error)
    message.error('排序更新失败，请重试')
    
    // 失败时重新加载原始数据
    await loadCategoriesData()
  }
}

// 构建新的排序顺序（简化版本）
const buildNewSortOrder = async (dragKey: number, dropKey: number, dropPosition: number, dropToGap: boolean): Promise<CategorySortItem[]> => {
  const updates: CategorySortItem[] = []
  
  // 找到拖拽节点和目标节点
  const dragCategory = findCategoryById(categories.value, dragKey)
  const dropCategory = findCategoryById(categories.value, dropKey)
  
  if (!dragCategory || !dropCategory) {
    console.error('找不到拖拽或目标分类')
    return []
  }
  
  // 只处理同层级拖拽
  if (dragCategory.parent_id !== dropCategory.parent_id) {
    message.warning('请在同层级内调整顺序')
    return []
  }
  
  // 获取同级所有分类，按当前sort_order排序
  const siblings = getSiblings(categories.value, dragCategory.parent_id)
  console.log('同级分类:', siblings.map(s => ({ id: s.id, name: s.name, sort_order: s.sort_order })))
  
  if (siblings.length <= 1) {
    console.log('只有一个同级分类，无需排序')
    return []
  }
  
  // 找到拖拽和目标在siblings中的索引
  const dragIndex = siblings.findIndex(cat => cat.id === dragKey)
  const dropIndex = siblings.findIndex(cat => cat.id === dropKey)
  
  if (dragIndex === -1 || dropIndex === -1) {
    console.error('找不到分类索引')
    return []
  }
  
  // 创建新的排序数组
  const newSiblings = [...siblings]
  // 移除拖拽的项
  const dragItem = newSiblings.splice(dragIndex, 1)[0]
  
  // 计算新的插入位置
  let newIndex = dropIndex
  if (dragIndex < dropIndex) {
    newIndex = dropIndex - 1 // 因为移除了拖拽项，索引需要调整
  }
  
  // 根据dropPosition微调插入位置
  if (dropPosition > 0) {
    newIndex = newIndex + 1
  }
  
  // 插入到新位置
  newSiblings.splice(newIndex, 0, dragItem)
  
  console.log('新排序:', newSiblings.map(s => ({ id: s.id, name: s.name })))
  
  // 重新分配sort_order
  newSiblings.forEach((cat, index) => {
    const newSortOrder = (index + 1) * 10
    if (cat.sort_order !== newSortOrder) {
      updates.push({
        id: cat.id!,
        sort_order: newSortOrder
      })
    }
  })
  
  console.log('排序更新列表:', updates)
  return updates
}

// 获取同级分类（同一parent_id的分类）
const getSiblings = (cats: ScriptCategory[], parentId: number | null | undefined): ScriptCategory[] => {
  const allCategories = flattenCategories(cats)
  return allCategories
    .filter(cat => cat.parent_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

// 扁平化分类树
const flattenCategories = (cats: ScriptCategory[]): ScriptCategory[] => {
  const result: ScriptCategory[] = []
  
  const flatten = (categories: ScriptCategory[]) => {
    categories.forEach(cat => {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children)
      }
    })
  }
  
  flatten(cats)
  return result
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
    padding: 12px 16px;
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
        gap: 16px;
        
        .stats-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          
          .stats-label {
            color: #8c8c8c;
          }
          
          .stats-value {
            color: #1890ff;
            font-weight: 600;
            min-width: 20px;
            text-align: center;
          }
        }
        
        .drag-tip {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #1890ff;
          background: #f0f9ff;
          padding: 2px 8px;
          border-radius: 12px;
          
          .anticon {
            font-size: 10px;
          }
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
    padding: 8px 16px 16px;
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
          
          .node-left {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .node-name {
              font-weight: 500;
            }
          }
          
          .node-count {
            font-size: 12px;
            color: #fff;
            background: #1890ff;
            padding: 1px 6px;
            border-radius: 10px;
            min-width: 16px;
            text-align: center;
            line-height: 16px;
          }
        }
        
        .node-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transition: all 0.2s;
          
          .drag-handle {
            cursor: move;
            color: #8c8c8c;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
            
            &:hover {
              color: #1890ff;
              background: #f0f9ff;
            }
          }
          
          .action-btn {
            padding: 2px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 12px;
            transition: all 0.2s;
            
            &:hover {
              background-color: #f0f9ff;
              color: #1890ff;
              transform: scale(1.05);
            }
            
            &.delete-btn:hover {
              color: #ff4d4f;
              background-color: #fff2f0;
              transform: scale(1.05);
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
    
    &.drag-over-gap-top {
      border-top: 2px dashed #1890ff;
    }
    
    &.drag-over-gap-bottom {
      border-bottom: 2px dashed #1890ff;
    }
    
    &.drag-over {
      background-color: #e6f7ff;
      border-radius: 4px;
    }
  }
  
  .ant-tree-draggable-icon {
    color: #8c8c8c;
    cursor: move;
    
    &:hover {
      color: #1890ff;
    }
  }
}
</style>