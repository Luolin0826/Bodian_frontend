<template>
  <div class="permission-tree">
    <div class="tree-header">
      <div class="header-actions">
        <a-space>
          <a-button size="small" @click="expandAll">
            <NodeExpandOutlined />
            展开全部
          </a-button>
          <a-button size="small" @click="collapseAll">
            <NodeCollapseOutlined />
            收起全部
          </a-button>
          <a-button size="small" @click="checkAll">
            <CheckSquareOutlined />
            全选
          </a-button>
          <a-button size="small" @click="uncheckAll">
            <BorderOutlined />
            取消全选
          </a-button>
        </a-space>
      </div>
      <div class="search-box">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索权限..."
          allow-clear
          @search="handleSearch"
          size="small"
        />
      </div>
    </div>
    
    <a-tree
      ref="treeRef"
      v-model:checkedKeys="checkedKeys"
      v-model:expandedKeys="expandedKeys"
      :tree-data="filteredTreeData"
      checkable
      check-strictly
      :field-names="{ title: 'title', key: 'key', children: 'children' }"
      @check="onCheck"
    >
      <template #title="nodeData">
        <div class="tree-node">
          <div class="node-content">
            <component :is="nodeData.icon" v-if="nodeData.icon" class="node-icon" />
            <span class="node-title">{{ nodeData.title }}</span>
            <a-tag v-if="nodeData.level" :color="getLevelColor(nodeData.level)" size="small">
              {{ nodeData.level }}
            </a-tag>
          </div>
          <div class="node-description" v-if="nodeData.description">
            {{ nodeData.description }}
          </div>
          <div class="node-meta" v-if="nodeData.risk || nodeData.category">
            <a-tag v-if="nodeData.risk" :color="getRiskColor(nodeData.risk)" size="small">
              {{ nodeData.risk }}
            </a-tag>
            <span v-if="nodeData.category" class="category-tag">{{ nodeData.category }}</span>
          </div>
        </div>
      </template>
    </a-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NodeExpandOutlined,
  NodeCollapseOutlined,
  CheckSquareOutlined,
  BorderOutlined
} from '@ant-design/icons-vue'

interface PermissionNode {
  key: string
  title: string
  description?: string
  icon?: string
  level?: 'low' | 'medium' | 'high'
  risk?: 'safe' | 'warning' | 'danger'
  category?: string
  children?: PermissionNode[]
}

interface Props {
  treeData: PermissionNode[]
  value?: string[]
}

interface Emits {
  (e: 'update:value', value: string[]): void
  (e: 'change', checkedKeys: string[], checkedNodes: PermissionNode[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const treeRef = ref()
const searchText = ref('')
const checkedKeys = ref<string[]>(props.value || [])
const expandedKeys = ref<string[]>([])

// 搜索过滤
const filteredTreeData = computed(() => {
  if (!searchText.value) return props.treeData
  
  const filterTree = (nodes: PermissionNode[]): PermissionNode[] => {
    return nodes.filter(node => {
      const matchTitle = node.title.toLowerCase().includes(searchText.value.toLowerCase())
      const matchDesc = node.description?.toLowerCase().includes(searchText.value.toLowerCase())
      const hasMatchingChildren = node.children && filterTree(node.children).length > 0
      
      if (matchTitle || matchDesc || hasMatchingChildren) {
        return {
          ...node,
          children: node.children ? filterTree(node.children) : undefined
        }
      }
      return false
    }).filter(Boolean) as PermissionNode[]
  }
  
  return filterTree(props.treeData)
})

// 监听外部值变化
watch(() => props.value, (newVal) => {
  console.log('🌳 权限树收到新的选中值:', newVal)
  checkedKeys.value = newVal || []
  
  // 检查缺失的权限节点
  if (newVal && newVal.length > 0) {
    const allTreeKeys = getAllKeysFromTree(props.treeData)
    const missingKeys = newVal.filter(key => !allTreeKeys.includes(key))
    if (missingKeys.length > 0) {
      console.warn('⚠️ Tree missing follow keys:', missingKeys.map(k => `'${k}'`).join(', '))
    }
  }
}, { immediate: true })

// 获取树中所有的key
const getAllKeysFromTree = (nodes: PermissionNode[]): string[] => {
  let keys: string[] = []
  nodes.forEach(node => {
    keys.push(node.key)
    if (node.children) {
      keys = keys.concat(getAllKeysFromTree(node.children))
    }
  })
  return keys
}

// 监听内部值变化
watch(checkedKeys, (newVal) => {
  emit('update:value', newVal)
}, { deep: true })

// 展开全部
const expandAll = () => {
  const getAllKeys = (nodes: PermissionNode[]): string[] => {
    let keys: string[] = []
    nodes.forEach(node => {
      keys.push(node.key)
      if (node.children) {
        keys = keys.concat(getAllKeys(node.children))
      }
    })
    return keys
  }
  expandedKeys.value = getAllKeys(props.treeData)
}

// 收起全部
const collapseAll = () => {
  expandedKeys.value = []
}

// 全选
const checkAll = () => {
  const getAllKeys = (nodes: PermissionNode[]): string[] => {
    let keys: string[] = []
    nodes.forEach(node => {
      keys.push(node.key)
      if (node.children) {
        keys = keys.concat(getAllKeys(node.children))
      }
    })
    return keys
  }
  checkedKeys.value = getAllKeys(props.treeData)
}

// 取消全选
const uncheckAll = () => {
  checkedKeys.value = []
}

// 处理搜索
const handleSearch = () => {
  if (searchText.value) {
    expandAll()
  }
}

// 处理选择
const onCheck = (checkedKeysValue: any, info: any) => {
  emit('change', checkedKeysValue, info.checkedNodes)
}

// 获取级别颜色
const getLevelColor = (level: string) => {
  const colors = {
    low: 'green',
    medium: 'orange', 
    high: 'red'
  }
  return colors[level as keyof typeof colors] || 'default'
}

// 获取风险颜色
const getRiskColor = (risk: string) => {
  const colors = {
    safe: 'green',
    warning: 'orange',
    danger: 'red'
  }
  return colors[risk as keyof typeof colors] || 'default'
}
</script>

<style scoped lang="less">
.permission-tree {
  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fafafa;
    border-radius: 6px;
    
    .search-box {
      width: 240px;
    }
  }
  
  .tree-node {
    width: 100%;
    
    .node-content {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      
      .node-icon {
        font-size: 14px;
        color: #666;
      }
      
      .node-title {
        font-weight: 500;
      }
    }
    
    .node-description {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }
    
    .node-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .category-tag {
        font-size: 11px;
        color: #666;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
  }
}
</style>