<template>
  <div class="category-selector">
    <a-select
      v-model:value="selectedValue"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :loading="loading"
      :allow-clear="allowClear"
      :show-search="showSearch"
      :filter-option="filterOption"
      :dropdown-style="{ maxHeight: '200px', overflowY: 'auto' }"
      :virtual="false"
      @change="handleChange"
      @search="handleSearch"
    >
      <template #suffixIcon>
        <folder-outlined />
      </template>
      
      <!-- 可以创建新分类的选项 -->
      <a-select-option v-if="allowCreate && searchValue && !hasMatchingCategory" :value="CREATE_NEW_VALUE">
        <div class="create-option">
          <plus-outlined class="create-icon" />
          <span>创建分类"{{ searchValue }}"</span>
        </div>
      </a-select-option>
      
      <!-- 分类选项 -->
      <template v-for="category in filteredCategories" :key="category.id">
        <!-- 有子分类的情况：只显示子分类，父分类作为分组标题 -->
        <a-select-opt-group v-if="category.children && category.children.length > 0" :label="category.name">
          <a-select-option 
            v-for="child in category.children" 
            :key="`child-${child.id}`"
            :value="child.id"
            :disabled="child.is_system && !allowSystemCategory"
          >
            <div class="category-option child-option">
              <span class="category-name">{{ child.name }}</span>
              <a-tag v-if="child.is_system" color="blue" size="small">系统</a-tag>
              <span class="script-count" v-if="showCount && child.script_count">({{ child.script_count }})</span>
            </div>
          </a-select-option>
        </a-select-opt-group>
        
        <!-- 没有子分类的分类项：直接显示 -->
        <a-select-option 
          v-else 
          :key="`single-${category.id}`"
          :value="category.id"
          :disabled="category.is_system && !allowSystemCategory"
        >
          <div class="category-option">
            <span class="category-name">{{ category.name }}</span>
            <a-tag v-if="category.is_system" color="blue" size="small">系统</a-tag>
            <span class="script-count" v-if="showCount && category.script_count">({{ category.script_count }})</span>
          </div>
        </a-select-option>
      </template>
      
      <!-- 空状态 -->
      <template #notFoundContent>
        <div class="empty-content">
          <inbox-outlined class="empty-icon" />
          <span>暂无匹配的分类</span>
        </div>
      </template>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  FolderOutlined, 
  PlusOutlined, 
  InboxOutlined 
} from '@ant-design/icons-vue'
import { 
  getScriptCategoriesTree, 
  createScriptCategory, 
  type ScriptCategory 
} from '@/api/script'

// Props
interface Props {
  modelValue?: number | null
  placeholder?: string
  size?: 'large' | 'middle' | 'small'
  disabled?: boolean
  allowClear?: boolean
  showSearch?: boolean
  showCount?: boolean      // 是否显示话术数量
  allowCreate?: boolean    // 是否允许创建新分类
  allowSystemCategory?: boolean  // 是否允许选择系统分类
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择分类',
  size: 'middle',
  disabled: false,
  allowClear: true,
  showSearch: true,
  showCount: true,
  allowCreate: false,
  allowSystemCategory: true
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [value: number | null, category?: ScriptCategory]
  'create': [name: string]
}>()

// 数据
const loading = ref(false)
const categories = ref<ScriptCategory[]>([])
const searchValue = ref('')
const selectedValue = ref<number | null | string>(props.modelValue)

// 创建新分类的特殊值
const CREATE_NEW_VALUE = '__CREATE_NEW__'

// 计算属性
const filteredCategories = computed(() => {
  if (!searchValue.value) {
    return categories.value
  }
  
  const keyword = searchValue.value.toLowerCase()
  return categories.value.filter(category => {
    // 检查当前分类
    if (category.name.toLowerCase().includes(keyword)) {
      return true
    }
    
    // 检查子分类
    if (category.children && category.children.length > 0) {
      return category.children.some(child => 
        child.name.toLowerCase().includes(keyword)
      )
    }
    
    return false
  })
})

const hasMatchingCategory = computed(() => {
  if (!searchValue.value) return false
  const keyword = searchValue.value.toLowerCase()
  return categories.value.some(category => 
    category.name.toLowerCase() === keyword ||
    (category.children && category.children.some(child => 
      child.name.toLowerCase() === keyword
    ))
  )
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

const handleChange = async (value: number | null | string) => {
  if (value === CREATE_NEW_VALUE) {
    // 创建新分类
    await handleCreateCategory(searchValue.value)
    return
  }
  
  selectedValue.value = value as number | null
  emit('update:modelValue', selectedValue.value)
  
  // 查找对应的分类对象
  const category = findCategoryById(selectedValue.value)
  emit('change', selectedValue.value, category)
}

const handleSearch = (value: string) => {
  searchValue.value = value
}

const handleCreateCategory = async (name: string) => {
  if (!name.trim()) {
    message.warning('分类名称不能为空')
    return
  }
  
  loading.value = true
  try {
    const response = await createScriptCategory({ 
      name: name.trim(),
      description: `用户创建的分类: ${name.trim()}`
    })
    
    message.success('分类创建成功')
    emit('create', name.trim())
    
    // 重新加载分类列表
    await loadCategories()
    
    // 选中新创建的分类
    selectedValue.value = response.data.id || null
    emit('update:modelValue', selectedValue.value)
    emit('change', selectedValue.value, response.data)
    
    // 清空搜索
    searchValue.value = ''
  } catch (error) {
    console.error('创建分类失败:', error)
    message.error('创建分类失败')
  } finally {
    loading.value = false
  }
}

const findCategoryById = (id: number | null): ScriptCategory | undefined => {
  if (!id) return undefined
  
  for (const category of categories.value) {
    if (category.id === id) {
      return category
    }
    
    if (category.children) {
      for (const child of category.children) {
        if (child.id === id) {
          return child
        }
      }
    }
  }
  
  return undefined
}

const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase())
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue
})

// 生命周期
onMounted(() => {
  loadCategories()
  startAutoRefresh()
})

// 添加实时刷新功能
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
  getCategories: () => categories.value,
  startAutoRefresh,
  stopAutoRefresh
})
</script>

<style scoped lang="less">
.category-selector {
  width: 100%;
}

.category-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .category-name {
    flex: 1;
    margin-right: 8px;
  }
  
  .script-count {
    font-size: 12px;
    color: #8c8c8c;
  }
  
  &.child-option {
    padding-left: 24px;
    position: relative;
    
    .category-name {
      color: #595959;
      font-size: 13px;
    }
    
    &::before {
      content: '├─';
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #d9d9d9;
      font-size: 12px;
      font-family: monospace;
    }
  }
}

.create-option {
  display: flex;
  align-items: center;
  color: #1890ff;
  font-weight: 500;
  
  .create-icon {
    margin-right: 8px;
    font-size: 12px;
  }
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  color: #8c8c8c;
  
  .empty-icon {
    font-size: 20px;
    margin-bottom: 8px;
  }
}

:deep(.ant-select-dropdown) {
  .ant-select-item-group {
    .ant-select-item-group-label {
      font-weight: 600;
      color: #262626;
      background-color: #fafafa;
      padding: 8px 12px;
      font-size: 13px;
    }
  }
  
  .ant-select-item-group-list {
    .ant-select-item-option {
      &:hover {
        background-color: #f5f5f5;
      }
      
      &.ant-select-item-option-selected {
        background-color: #e6f7ff;
      }
    }
  }
}

:deep(.ant-tag) {
  margin-left: 4px;
}
</style>