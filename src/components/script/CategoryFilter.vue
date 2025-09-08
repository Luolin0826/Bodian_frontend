<template>
  <div class="category-filter">
    <div class="filter-header">
      <div class="header-left">
        <filter-outlined class="filter-icon" />
        <span class="filter-title">分类筛选</span>
        <a-badge :count="selectedCategories.length" :offset="[10, -2]">
          <span class="selected-count" v-if="selectedCategories.length > 0">
            (已选{{ selectedCategories.length }}个)
          </span>
        </a-badge>
      </div>
      
      <div class="header-actions">
        <!-- 快速新建分类按钮 -->
        <a-button v-if="allowCreate" type="link" size="small" @click="showCreateModal = true">
          <plus-outlined />
          新建分类
        </a-button>
        
        <!-- 清空选择 -->
        <a-button 
          v-if="selectedCategories.length > 0" 
          type="link" 
          size="small" 
          @click="clearSelection"
        >
          <close-outlined />
          清空
        </a-button>
        
        <!-- 折叠/展开切换 -->
        <a-button type="link" size="small" @click="collapsed = !collapsed">
          <up-outlined v-if="!collapsed" />
          <down-outlined v-else />
        </a-button>
      </div>
    </div>
    
    <!-- 筛选内容区域 -->
    <div class="filter-content" v-show="!collapsed">
      <!-- 搜索框 -->
      <div class="search-section">
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索分类..."
          size="small"
          allow-clear
          @input="handleSearch"
        >
          <template #prefix>
            <search-outlined class="search-icon" />
          </template>
        </a-input>
      </div>
      
      <!-- 分类树形结构 -->
      <div class="category-tree">
        <a-tree
          v-model:checkedKeys="checkedKeys"
          :tree-data="treeData"
          :checkable="true"
          :selectable="false"
          :show-line="true"
          :show-icon="false"
          @check="handleTreeCheck"
        >
          <template #title="{ title, script_count, is_system }">
            <span class="tree-node-title">
              <span class="node-name">{{ title }}</span>
              <a-tag v-if="is_system" color="blue" size="small">系统</a-tag>
              <span v-if="showCount && script_count" class="node-count">({{ script_count }})</span>
            </span>
          </template>
        </a-tree>
      </div>
      
      <!-- 底部操作区域 -->
      <div class="filter-footer">
        <div class="action-buttons">
          <a-button size="small" @click="selectAll" v-if="!allSelected">
            全选
          </a-button>
          <a-button size="small" @click="clearSelection" v-else>
            取消全选
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 创建分类弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      title="创建新分类"
      :width="500"
      @ok="handleCreateCategory"
      @cancel="resetCreateForm"
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="分类名称" name="name" required>
          <a-input 
            v-model:value="createForm.name" 
            placeholder="请输入分类名称"
            @press-enter="handleCreateCategory"
          />
        </a-form-item>
        
        <a-form-item label="分类描述" name="description">
          <a-textarea 
            v-model:value="createForm.description" 
            placeholder="请输入分类描述（可选）"
            :rows="3"
          />
        </a-form-item>
        
        <a-form-item label="父分类" name="parent_id">
          <CategorySelector
            v-model="createForm.parent_id"
            placeholder="选择父分类（可选）"
            :allow-create="false"
            :show-count="false"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  FilterOutlined,
  PlusOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'
import CategorySelector from './CategorySelector.vue'
import {
  getScriptCategoriesTree,
  createScriptCategory,
  type ScriptCategory
} from '@/api/script'

// Props
interface Props {
  modelValue?: number[]
  showCount?: boolean    // 是否显示话术数量
  allowCreate?: boolean  // 是否允许创建新分类
  defaultCollapsed?: boolean  // 默认是否折叠
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  showCount: true,
  allowCreate: true,
  defaultCollapsed: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'change': [selectedCategories: number[], categories: ScriptCategory[]]
  'create': [category: ScriptCategory]
}>()

// 数据
const loading = ref(false)
const categories = ref<ScriptCategory[]>([])
const selectedCategories = ref<number[]>(props.modelValue)
const searchKeyword = ref('')
const collapsed = ref(props.defaultCollapsed)
// 移除displayMode，固定使用树形结构
const checkedKeys = ref<number[]>([])

// 创建分类相关
const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  description: '',
  parent_id: null as number | null
})

// 计算属性
const filteredCategories = computed(() => {
  if (!searchKeyword.value) {
    return categories.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return categories.value.filter(category => {
    // 检查当前分类
    if (category.name.toLowerCase().includes(keyword)) {
      return true
    }
    
    // 检查子分类
    if (category.children && category.children.length > 0) {
      const matchingChildren = category.children.filter(child =>
        child.name.toLowerCase().includes(keyword)
      )
      
      if (matchingChildren.length > 0) {
        // 创建一个副本，只包含匹配的子分类
        return {
          ...category,
          children: matchingChildren
        }
      }
    }
    
    return false
  })
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
  
  return filteredCategories.value.map(buildTreeNode)
})

const allSelected = computed(() => {
  const allIds = getAllCategoryIds(categories.value)
  return allIds.length > 0 && allIds.every(id => selectedCategories.value.includes(id))
})

// 方法
const loadCategories = async () => {
  loading.value = true
  try {
    const response = await getScriptCategoriesTree()
    categories.value = response.data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const getAllCategoryIds = (cats: ScriptCategory[]): number[] => {
  const ids: number[] = []
  cats.forEach(cat => {
    if (cat.id) ids.push(cat.id)
    if (cat.children) {
      ids.push(...getAllCategoryIds(cat.children))
    }
  })
  return ids
}

const handleCategoryToggle = (categoryId: number, checked: boolean) => {
  if (checked) {
    if (!selectedCategories.value.includes(categoryId)) {
      selectedCategories.value.push(categoryId)
    }
  } else {
    const index = selectedCategories.value.indexOf(categoryId)
    if (index > -1) {
      selectedCategories.value.splice(index, 1)
    }
  }
  
  emitChange()
}

const handleTreeCheck = (checkedKeys: number[]) => {
  selectedCategories.value = checkedKeys
  emitChange()
}

const handleSearch = () => {
  // 搜索功能通过计算属性 filteredCategories 实现
}

const selectAll = () => {
  selectedCategories.value = getAllCategoryIds(categories.value)
  emitChange()
}

const clearSelection = () => {
  selectedCategories.value = []
  emitChange()
}

const emitChange = () => {
  emit('update:modelValue', [...selectedCategories.value])
  emit('change', [...selectedCategories.value], categories.value)
}

const handleCreateCategory = async () => {
  if (!createForm.value.name.trim()) {
    message.warning('分类名称不能为空')
    return
  }
  
  try {
    const response = await createScriptCategory({
      name: createForm.value.name.trim(),
      description: createForm.value.description || undefined,
      parent_id: createForm.value.parent_id
    })
    
    message.success('分类创建成功')
    emit('create', response.data)
    
    // 重新加载分类列表
    await loadCategories()
    
    // 关闭弹窗并重置表单
    showCreateModal.value = false
    resetCreateForm()
  } catch (error) {
    console.error('创建分类失败:', error)
    message.error('创建分类失败')
  }
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    parent_id: null
  }
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  selectedCategories.value = [...newValue]
  checkedKeys.value = [...newValue]
}, { immediate: true })

watch(selectedCategories, (newValue) => {
  checkedKeys.value = [...newValue]
})

// 生命周期
onMounted(() => {
  loadCategories()
  startAutoRefresh()
})

// 添加自动刷新功能
let refreshTimer: NodeJS.Timeout | null = null

const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  // 每30秒自动刷新一次分类数据
  refreshTimer = setInterval(() => {
    loadCategories()
  }, 30000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 暴露方法给父组件
defineExpose({
  refresh: loadCategories,
  getSelectedCategories: () => selectedCategories.value,
  collapse: () => collapsed.value = true,
  expand: () => collapsed.value = false,
  startAutoRefresh,
  stopAutoRefresh
})
</script>

<style scoped lang="less">
.category-filter {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
  
  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
    border-radius: 6px 6px 0 0;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .filter-icon {
        color: #1890ff;
      }
      
      .filter-title {
        font-weight: 500;
        color: #333;
      }
      
      .selected-count {
        font-size: 12px;
        color: #1890ff;
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  
  .filter-content {
    padding: 16px;
    
    .search-section {
      margin-bottom: 16px;
      
      .search-icon {
        color: #8c8c8c;
      }
    }
    
    .category-tags {
      max-height: 300px;
      overflow-y: auto;
      
      .category-group {
        margin-bottom: 16px;
        
        .group-title {
          font-size: 13px;
          font-weight: 500;
          color: #666;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #e8e8e8;
        }
        
        .group-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
      
      .category-tag {
        margin: 2px 4px 2px 0;
        cursor: pointer;
        transition: all 0.2s;
        
        &.child-tag {
          margin-left: 16px;
          opacity: 0.9;
        }
        
        .tag-content {
          display: flex;
          align-items: center;
          gap: 4px;
          
          .tag-name {
            font-size: 12px;
          }
          
          .tag-count {
            font-size: 11px;
            opacity: 0.7;
          }
        }
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
        }
      }
    }
    
    .category-tree {
      max-height: 300px;
      overflow-y: auto;
      
      .tree-node-title {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .node-name {
          flex: 1;
        }
        
        .node-count {
          font-size: 11px;
          color: #8c8c8c;
        }
      }
    }
    
    .filter-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }
  }
}

:deep(.ant-tree) {
  .ant-tree-treenode {
    padding: 4px 0;
    
    .ant-tree-node-content-wrapper {
      padding: 2px 4px;
      border-radius: 4px;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
  
  .ant-tree-checkbox {
    margin-right: 8px;
  }
}

:deep(.ant-tag) {
  &.ant-tag-checkable {
    border: 1px solid #d9d9d9;
    
    &.ant-tag-checkable-checked {
      background-color: #1890ff;
      border-color: #1890ff;
      color: #fff;
    }
  }
}
</style>