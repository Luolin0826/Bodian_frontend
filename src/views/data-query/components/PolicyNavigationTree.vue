<template>
  <div class="policy-navigation-tree">
    <!-- 搜索框 -->
    <div class="search-section">
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索省份/城市/公司"
        size="small"
        @search="handleSearch"
        class="search-input"
      />
    </div>

    <!-- 树形结构 -->
    <div class="tree-section">
      <a-spin :spinning="treeLoading" tip="正在加载...">
        <a-tree
          v-model:expandedKeys="expandedKeys"
          v-model:selectedKeys="selectedKeys"
          :tree-data="filteredTreeData"
          :show-line="true"
          :show-icon="true"
          @select="handleTreeSelect"
          @expand="handleTreeExpand"
          @right-click="handleTreeRightClick"
          class="navigation-tree"
        >
          <template #icon="{ dataRef }">
            <environment-outlined v-if="dataRef.region_level === 'province'" />
            <cluster-outlined v-else-if="dataRef.region_level === 'city'" />
            <bank-outlined v-else-if="dataRef.region_level === 'company'" />
          </template>
          
          <template #title="{ dataRef }">
            <div class="tree-node-title">
              <div class="node-left">
                <span class="node-text">{{ getNodeDisplayText(dataRef) }}</span>
                <span class="region-type" :class="`type-${dataRef.region_level}`">
                  {{ getRegionTypeText(dataRef.region_level) }}
                </span>
              </div>
              <div class="node-right">
                <a-tag 
                  v-if="dataRef.hasPolicy" 
                  size="small" 
                  color="green"
                  class="policy-tag"
                >
                  ✓
                </a-tag>
                <a-tag 
                  v-else-if="dataRef.region_level !== 'city'"
                  size="small" 
                  color="orange"
                  class="policy-tag"
                >
                  !
                </a-tag>
              </div>
            </div>
          </template>
        </a-tree>
      </a-spin>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-header">
        <span class="stats-title">统计概览</span>
        <span class="completion-rate">{{ getCompletionRate() }}%</span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-info">
            <span class="stat-number">{{ stats.provinces }}</span>
            <span class="stat-label">省</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-info">
            <span class="stat-number">{{ stats.cities }}</span>
            <span class="stat-label">市</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-info">
            <span class="stat-number">{{ stats.companies }}</span>
            <span class="stat-label">区县</span>
          </div>
        </div>
        <div class="stat-item highlight">
          <div class="stat-info">
            <span class="stat-number">{{ stats.configured }}</span>
            <span class="stat-label">已配</span>
          </div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: getCompletionRate() + '%' }"></div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <a-dropdown
      v-model:open="contextMenuVisible"
      :trigger="['contextmenu']"
      placement="bottomLeft"
    >
      <div
        ref="contextMenuTarget"
        style="position: absolute; pointer-events: none;"
        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      />
      <template #overlay>
        <a-menu @click="handleContextMenuClick">
          <a-menu-item 
            key="add-child" 
            :disabled="!canAddChild"
            v-if="contextMenuNode"
          >
            <plus-outlined />
            新增{{ getChildLevelText() }}
          </a-menu-item>
          
          <a-menu-item 
            key="edit" 
            :disabled="!canEditNode"
            v-if="contextMenuNode"
          >
            <edit-outlined />
            编辑{{ getCurrentLevelText() }}
          </a-menu-item>
          
          <a-menu-divider v-if="contextMenuNode" />
          
          <a-menu-item 
            key="view-policy" 
            :disabled="!canViewPolicy"
            v-if="contextMenuNode"
          >
            <eye-outlined />
            查看政策
          </a-menu-item>
          
          <a-menu-item 
            key="copy-policy" 
            :disabled="!canCopyPolicy"
            v-if="contextMenuNode"
          >
            <copy-outlined />
            复制政策
          </a-menu-item>
          
          <a-menu-divider v-if="contextMenuNode" />
          
          <a-menu-item 
            key="refresh" 
            v-if="contextMenuNode"
          >
            <reload-outlined />
            刷新
          </a-menu-item>
          
          <a-menu-item 
            key="delete" 
            :disabled="!canDeleteNode"
            class="danger-menu-item"
            v-if="contextMenuNode"
          >
            <delete-outlined />
            删除{{ getCurrentLevelText() }}
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>

    <!-- 区域管理对话框 -->
    <RegionFormModal
      v-model:open="regionFormVisible"
      :mode="regionFormMode"
      :region-data="currentRegionData"
      :parent-node="contextMenuNode"
      @success="handleRegionFormSuccess"
    />

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteConfirmVisible"
      title="确认删除"
      @ok="handleDeleteConfirm"
      :confirm-loading="deleteLoading"
    >
      <div class="delete-confirm-content">
        <a-alert
          message="删除警告"
          :description="deleteConfirmText"
          type="warning"
          show-icon
          class="delete-warning"
        />
        
        <div v-if="deleteCheckResult" class="delete-info">
          <p v-if="deleteCheckResult.policy_count > 0">
            <strong>该区域包含 {{ deleteCheckResult.policy_count }} 个政策配置</strong>
          </p>
          <p v-if="deleteCheckResult.child_count > 0">
            <strong>该区域包含 {{ deleteCheckResult.child_count }} 个子区域</strong>
          </p>
          
          <a-form v-if="showDeleteOptions" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="删除方式">
              <a-radio-group v-model:value="deleteOptions.action">
                <a-radio value="soft">保留数据（软删除）</a-radio>
                <a-radio value="force">强制删除所有数据</a-radio>
                <a-radio value="migrate" v-if="deleteCheckResult.policy_count > 0">
                  迁移数据到其他区域
                </a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item 
              v-if="deleteOptions.action === 'migrate'" 
              label="迁移到"
            >
              <a-select
                v-model:value="deleteOptions.migrate_to"
                placeholder="选择目标区域"
                :options="migrationOptions"
              />
            </a-form-item>
          </a-form>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  EnvironmentOutlined,
  ClusterOutlined,
  BankOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { policyManagementAPI, type BatchTreeNode, type BatchTreeResponse } from '@/api/policies'
// import { TreeDebugger } from '@/utils/treeDebugger.js' // 已移动到unused-scripts
import RegionFormModal from './RegionFormModal.vue'

// 类型定义
interface TreeNode {
  key: string
  title: string
  children?: TreeNode[]
  isLeaf?: boolean
  region_id: number
  region_level: 'province' | 'city' | 'company'
  province?: string
  city?: string
  company?: string
  region_code: string
  hasPolicy?: boolean
}

interface Region {
  region_id: number
  province?: string
  city?: string
  company?: string
  region_level: 'province' | 'city' | 'company'
  region_code: string
}

// Props
interface Props {
  selectedRegion?: Region | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedRegion: null
})

// Emits
const emit = defineEmits<{
  'region-selected': [region: Region]
  'region-expanded': [regionId: number]
}>()

// 响应式数据
const treeLoading = ref(false)
const searchText = ref('')
const expandedKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])
const treeData = ref<TreeNode[]>([])
const originalTreeData = ref<TreeNode[]>([])

// 统计信息
const stats = reactive({
  provinces: 0,
  cities: 0,
  companies: 0,
  configured: 0
})

// 缓存相关
const CACHE_KEY = 'policy-tree-data'
const CACHE_EXPIRY_KEY = 'policy-tree-data-expiry'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存
const batchTreeData = ref<BatchTreeResponse | null>(null)

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
const contextMenuNode = ref<TreeNode | null>(null)
const contextMenuTarget = ref()

// 区域表单相关
const regionFormVisible = ref(false)
const regionFormMode = ref<'add' | 'edit'>('add')
const currentRegionData = ref<any>(null)

// 删除相关
const deleteConfirmVisible = ref(false)
const deleteLoading = ref(false)
const deleteCheckResult = ref<any>(null)
const deleteOptions = reactive({
  action: 'soft',
  migrate_to: undefined
})
const migrationOptions = ref([])

// 计算属性
const filteredTreeData = computed(() => {
  if (!searchText.value.trim()) {
    return treeData.value
  }
  
  const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.filter(node => {
      // 检查当前节点是否匹配
      const matches = node.title.toLowerCase().includes(searchText.value.toLowerCase())
      
      // 检查子节点是否有匹配
      let hasMatchingChildren = false
      if (node.children) {
        const filteredChildren = filterNodes(node.children)
        hasMatchingChildren = filteredChildren.length > 0
        if (hasMatchingChildren) {
          node.children = filteredChildren
        }
      }
      
      return matches || hasMatchingChildren
    })
  }
  
  return filterNodes([...treeData.value])
})

// 缓存相关方法
const getCachedData = (): BatchTreeResponse | null => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY)
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY)
    
    if (!cachedData || !expiryTime) return null
    
    if (Date.now() > parseInt(expiryTime)) {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
      return null
    }
    
    return JSON.parse(cachedData)
  } catch (error) {
    console.error('获取缓存数据失败:', error)
    return null
  }
}

const setCachedData = (data: BatchTreeResponse): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString())
  } catch (error) {
    console.error('保存缓存数据失败:', error)
  }
}

// 数据格式转换方法
const transformBatchDataToTreeFormat = (batchNodes: BatchTreeNode[]): TreeNode[] => {
  return batchNodes.map(node => transformBatchNodeToTreeNode(node))
}

const transformBatchNodeToTreeNode = (batchNode: BatchTreeNode): TreeNode => {
  const treeNode: TreeNode = {
    key: batchNode.id,
    title: batchNode.label,
    region_id: batchNode.region_id,
    region_level: batchNode.level,
    province: batchNode.province,
    city: batchNode.city,
    company: batchNode.company,
    region_code: batchNode.region_code || '',
    hasPolicy: batchNode.policy_status?.has_policy || false,
    isLeaf: batchNode.level === 'company' || (!batchNode.children || batchNode.children.length === 0)
  }
  
  if (batchNode.children && batchNode.children.length > 0) {
    treeNode.children = transformBatchDataToTreeFormat(batchNode.children)
  }
  
  return treeNode
}

// 方法
const getNodeDisplayText = (nodeData: TreeNode): string => {
  switch (nodeData.region_level) {
    case 'province':
      return nodeData.province || ''
    case 'city':
      return nodeData.city || ''
    case 'company':
      // 第三级只显示区县/公司名称
      return nodeData.company || ''
    default:
      return nodeData.title || ''
  }
}

const getRegionTypeText = (regionLevel: string): string => {
  switch (regionLevel) {
    case 'province':
      return '省'
    case 'city':
      return '市'
    case 'company':
      return '区县'
    default:
      return ''
  }
}

const getCompletionRate = (): number => {
  const total = stats.provinces + stats.companies // 只计算省份和公司级，市级不需要配置
  if (total === 0) return 0
  return Math.round((stats.configured / total) * 100)
}

// 右键菜单相关计算属性
const canAddChild = computed(() => {
  if (!contextMenuNode.value) return false
  // 省级可以添加市级，市级可以添加区县级，区县级不能添加子级
  return contextMenuNode.value.region_level !== 'company'
})

const canEditNode = computed(() => {
  // 所有节点都可以编辑
  return !!contextMenuNode.value
})

const canDeleteNode = computed(() => {
  if (!contextMenuNode.value) return false
  // 根据权限判断是否可以删除（这里简化处理）
  return true
})

const canViewPolicy = computed(() => {
  if (!contextMenuNode.value) return false
  // 只有省级和公司级可以查看政策
  return ['province', 'company'].includes(contextMenuNode.value.region_level)
})

const canCopyPolicy = computed(() => {
  if (!contextMenuNode.value) return false
  // 只有有政策配置的节点可以复制政策
  return contextMenuNode.value.hasPolicy && ['province', 'company'].includes(contextMenuNode.value.region_level)
})

const deleteConfirmText = computed(() => {
  if (!contextMenuNode.value) return ''
  const levelText = getRegionTypeText(contextMenuNode.value.region_level)
  return `确定要删除 "${contextMenuNode.value.title}" ${levelText}吗？删除后将无法恢复。`
})

const showDeleteOptions = computed(() => {
  return deleteCheckResult.value && (deleteCheckResult.value.policy_count > 0 || deleteCheckResult.value.child_count > 0)
})

// 右键菜单方法
const getChildLevelText = () => {
  if (!contextMenuNode.value) return ''
  const levelMap = {
    province: '市级',
    city: '区县公司',
    company: ''
  }
  return levelMap[contextMenuNode.value.region_level] || ''
}

const getCurrentLevelText = () => {
  if (!contextMenuNode.value) return ''
  return getRegionTypeText(contextMenuNode.value.region_level)
}

// 已废弃：loadTreeData - 使用批量数据加载替代懒加载
// const loadTreeData = async (treeNode: any): Promise<void> => {
//   // 批量数据加载模式下不再需要懒加载
// }

const loadChildrenNodes = async (parentNode: TreeNode) => {
  try {
    let children: Region[] = []
    
    console.log('加载子节点:', {
      parentLevel: parentNode.region_level,
      parentId: parentNode.region_id,
      province: parentNode.province,
      city: parentNode.city
    })
    
    if (parentNode.region_level === 'province') {
      // 判断是否为直辖市或特殊行政区
      const isMunicipality = ['北京', '上海', '天津', '重庆', '香港', '澳门'].includes(parentNode.province || '')
      
      if (isMunicipality) {
        // 直辖市直接加载区/县级别（公司级别）
        console.log(`${parentNode.province} 是直辖市，直接加载区县级别数据`)
        try {
          const companiesResponse = await policyManagementAPI.getRegions({
            parent_id: parentNode.region_id,
            region_level: 'company',
            province: parentNode.province
          })
          children = companiesResponse.data || []
          console.log(`${parentNode.province} 直辖市加载到 ${children.length} 个区县`)
        } catch (error) {
          console.error(`加载直辖市 ${parentNode.province} 的区县数据失败:`, error)
          children = []
        }
      } else {
        // 普通省份加载下级城市
        console.log(`${parentNode.province} 是普通省份，加载城市级别数据`)
        try {
          const citiesResponse = await policyManagementAPI.getRegions({
            parent_id: parentNode.region_id,
            region_level: 'city',
            province: parentNode.province
          })
          children = citiesResponse.data || []
          console.log(`${parentNode.province} 省份加载到 ${children.length} 个城市`)
        } catch (error) {
          console.error(`加载省份 ${parentNode.province} 的城市数据失败:`, error)
          children = []
        }
      }
    } else if (parentNode.region_level === 'city') {
      // 加载该市下的公司
      console.log(`加载城市 ${parentNode.city} 的公司级别数据`)
      try {
        const companiesResponse = await policyManagementAPI.getRegions({
          parent_id: parentNode.region_id,
          region_level: 'company',
          province: parentNode.province,
          city: parentNode.city
        })
        children = companiesResponse.data || []
        console.log(`城市 ${parentNode.city} 加载到 ${children.length} 个公司`)
      } catch (error) {
        console.error(`加载城市 ${parentNode.city} 的公司数据失败:`, error)
        children = []
      }
    }
    
    console.log('获取到子节点数据:', children)
    
    if (children.length === 0) {
      console.warn('未获取到子节点数据')
      return
    }
    
    // 使用新的层级API检查政策配置状态
    const childrenWithPolicy = await Promise.all(
      children.map(async (child) => {
        let hasPolicy = false
        
        // 只有省级和公司级需要检查政策（市级是中间层）
        if (child.region_level === 'province' || child.region_level === 'company') {
          try {
            const regionPolicies = await policyManagementAPI.getRegionPolicies(child.region_id)
            
            // 检查是否有有效的政策数据
            const policies = regionPolicies.policies || {}
            hasPolicy = Object.keys(policies).some(key => policies[key] !== null && policies[key] !== undefined)
          } catch (error) {
            console.warn(`获取区域${child.region_id}政策失败:`, error)
            hasPolicy = false
          }
        }
        
        return {
          ...child,
          hasPolicy
        }
      })
    )
    
    console.log('处理后的子节点数据:', childrenWithPolicy)
    
    // 转换为树节点格式
    parentNode.children = childrenWithPolicy.map(region => {
      // 生成显示标题 - 这个主要用于搜索和内部标识
      const title = region.city || region.company || region.province || ''
      
      return {
        key: `${region.region_level}_${region.region_id}`,
        title: title,
        region_id: region.region_id,
        region_level: region.region_level,
        province: region.province || parentNode.province,
        city: region.city || parentNode.city,
        company: region.company,
        region_code: region.region_code || '',
        hasPolicy: region.hasPolicy,
        isLeaf: region.region_level === 'company',
        children: region.region_level === 'company' ? undefined : undefined
      }
    })
    
    console.log('最终生成的子节点:', parentNode.children)
    
    // 调试：检查子节点结构
    // TreeDebugger.checkTreeStructure(parentNode.children) // 已移动到unused-scripts
    
    // 更新统计
    updateStats()
  } catch (error) {
    console.error('加载子节点失败:', error)
    message.error('加载数据失败')
  }
}

const loadBatchTreeData = async (useCache: boolean = true) => {
  try {
    treeLoading.value = true
    
    // 尝试从缓存获取数据
    if (useCache) {
      const cachedData = getCachedData()
      if (cachedData) {
        console.log('✅ 使用缓存的树数据')
        batchTreeData.value = cachedData
        processTreeData(cachedData)
        return
      }
    }
    
    // 从API获取批量树数据
    console.log('🔄 从API获取批量树数据...')
    const response = await policyManagementAPI.getBatchTreeData(true)
    
    // 保存到缓存
    setCachedData(response)
    batchTreeData.value = response
    
    processTreeData(response)
    
    console.log('✅ 批量树数据加载成功:', response)
    message.success(`数据加载成功 - ${response.performance_improvement}`)
    
  } catch (error) {
    console.error('❌ 批量树数据加载失败:', error)
    message.error('加载树数据失败，尝试降级到懒加载模式')
    
    // 降级到原来的懒加载方式
    await loadRootDataFallback()
  } finally {
    treeLoading.value = false
  }
}

const processTreeData = (response: BatchTreeResponse) => {
  // 转换数据格式
  const convertedTreeData = transformBatchDataToTreeFormat(response.tree_data)
  treeData.value = convertedTreeData
  originalTreeData.value = [...convertedTreeData]
  
  // 更新统计信息
  stats.provinces = response.stats.total_provinces
  stats.cities = response.stats.total_cities
  stats.companies = response.stats.total_companies
  stats.configured = (response.stats.provinces_with_policy || 0) + (response.stats.companies_with_policy || 0)
}

// 降级方法：保留原来的懒加载逻辑作为备用
const loadRootDataFallback = async () => {
  try {
    treeLoading.value = true
    
    // 获取所有省份
    const regionsResponse = await policyManagementAPI.getRegions({
      region_level: 'province'
    })
    
    const provinces = regionsResponse.data || []
    
    // 使用新的层级API检查省级政策配置状态
    const provincesWithPolicy = await Promise.all(
      provinces.map(async (province) => {
        let hasPolicy = false
        try {
          const regionPolicies = await policyManagementAPI.getRegionPolicies(province.region_id)
          
          // 检查省级政策数据
          const policies = regionPolicies.policies || {}
          hasPolicy = policies.province !== null && policies.province !== undefined
        } catch (error) {
          console.warn(`获取省份${province.region_id}政策失败:`, error)
          hasPolicy = false
        }
        
        return {
          ...province,
          hasPolicy
        }
      })
    )
    
    // 转换为树节点格式
    const rootNodes: TreeNode[] = provincesWithPolicy.map(province => ({
      key: `province_${province.region_id}`,
      title: province.province || '',
      region_id: province.region_id,
      region_level: province.region_level as 'province',
      province: province.province,
      region_code: province.region_code || '',
      hasPolicy: province.hasPolicy,
      isLeaf: false, // 省份节点肯定有子节点（城市）
      children: undefined // 使用 undefined 表示需要异步加载
    }))
    
    treeData.value = rootNodes
    originalTreeData.value = [...rootNodes]
    
    // 调试：检查根节点结构
    // TreeDebugger.checkTreeStructure(rootNodes) // 已移动到unused-scripts
    
    // 更新统计
    updateStats()
  } catch (error) {
    console.error('加载根节点数据失败:', error)
    message.error('加载数据失败')
  } finally {
    treeLoading.value = false
  }
}

const updateStats = () => {
  let provinces = 0
  let cities = 0
  let companies = 0
  let configured = 0
  
  const countNodes = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      if (node.region_level === 'province') {
        provinces++
        if (node.hasPolicy) configured++
      } else if (node.region_level === 'city') {
        cities++
      } else if (node.region_level === 'company') {
        companies++
        if (node.hasPolicy) configured++
      }
      
      if (node.children) {
        countNodes(node.children)
      }
    })
  }
  
  countNodes(treeData.value)
  
  stats.provinces = provinces
  stats.cities = cities
  stats.companies = companies
  stats.configured = configured
}

const handleTreeSelect = (keys: string[], info: any) => {
  if (keys.length === 0) return
  
  const selectedNode: TreeNode = info.node.dataRef
  
  // 只有省级和公司级可以编辑，但城市级可以选中用于展开
  if (selectedNode.region_level === 'city') {
    // 城市级节点主要用于展开，不进行政策编辑
    // 清除选中状态，但不阻止展开操作
    selectedKeys.value = []
    message.info('市级主要起连接作用，请展开查看下级区县公司')
    return
  }
  
  const region: Region = {
    region_id: selectedNode.region_id,
    region_level: selectedNode.region_level,
    province: selectedNode.province,
    city: selectedNode.city,
    company: selectedNode.company,
    region_code: selectedNode.region_code
  }
  
  emit('region-selected', region)
}

const handleTreeExpand = (keys: string[], info: any) => {
  expandedKeys.value = keys
  
  console.log('树节点展开事件:', {
    expanded: info.expanded,
    nodeData: info.node.dataRef,
    hasChildren: !!info.node.dataRef.children?.length,
    expandedKeys: keys,
    node: info.node
  })
  
  // 节点展开时的处理（批量数据已预加载，无需异步加载）
  if (info.expanded) {
    console.log('节点展开 - 数据已预加载')
    emit('region-expanded', info.node.dataRef.region_id)
  }
}

const handleSearch = () => {
  // 搜索功能通过计算属性实现
  if (searchText.value.trim()) {
    // 展开所有匹配的节点
    const expandKeys: string[] = []
    const findMatchingKeys = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.title.toLowerCase().includes(searchText.value.toLowerCase())) {
          expandKeys.push(node.key)
        }
        if (node.children) {
          findMatchingKeys(node.children)
        }
      })
    }
    
    findMatchingKeys(treeData.value)
    expandedKeys.value = [...new Set([...expandedKeys.value, ...expandKeys])]
  }
}

// 右键菜单事件处理
const handleTreeRightClick = (info: any) => {
  const { event, node } = info
  event.preventDefault()
  
  contextMenuNode.value = node.dataRef
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuVisible.value = true
}

const handleContextMenuClick = async ({ key }: { key: string }) => {
  if (!contextMenuNode.value) return
  
  contextMenuVisible.value = false
  
  try {
    switch (key) {
      case 'add-child':
        await handleAddChild()
        break
      case 'edit':
        await handleEditNode()
        break
      case 'view-policy':
        handleViewPolicy()
        break
      case 'copy-policy':
        handleCopyPolicy()
        break
      case 'refresh':
        await handleRefreshNode()
        break
      case 'delete':
        await handleDeleteNode()
        break
    }
  } catch (error) {
    console.error('右键菜单操作失败:', error)
    message.error('操作失败，请重试')
  }
}

const handleAddChild = async () => {
  if (!contextMenuNode.value) return
  
  regionFormMode.value = 'add'
  currentRegionData.value = null
  regionFormVisible.value = true
}

const handleEditNode = async () => {
  if (!contextMenuNode.value) return
  
  try {
    const regionDetail = await policyManagementAPI.getRegionDetail(contextMenuNode.value.region_id)
    
    regionFormMode.value = 'edit'
    currentRegionData.value = regionDetail
    regionFormVisible.value = true
  } catch (error) {
    console.error('获取区域详情失败:', error)
    message.error('获取区域详情失败')
  }
}

const handleViewPolicy = () => {
  if (!contextMenuNode.value) return
  
  const region: Region = {
    region_id: contextMenuNode.value.region_id,
    region_level: contextMenuNode.value.region_level,
    province: contextMenuNode.value.province,
    city: contextMenuNode.value.city,
    company: contextMenuNode.value.company,
    region_code: contextMenuNode.value.region_code
  }
  
  emit('region-selected', region)
}

const handleCopyPolicy = () => {
  if (!contextMenuNode.value) return
  message.info('复制政策功能开发中...')
}

const handleRefreshNode = async () => {
  if (!contextMenuNode.value) return
  
  try {
    // 重新加载该节点的数据
    if (contextMenuNode.value.region_level === 'province') {
      await loadBatchTreeData(false) // 强制刷新，不使用缓存
    } else {
      // 对于非根节点，直接重新加载整个树数据
      await loadBatchTreeData(false) // 强制刷新，不使用缓存
    }
    
    message.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    message.error('刷新失败')
  }
}

const handleDeleteNode = async () => {
  if (!contextMenuNode.value) return
  
  try {
    deleteCheckResult.value = await policyManagementAPI.checkRegionDeletable(contextMenuNode.value.region_id)
    deleteConfirmVisible.value = true
  } catch (error) {
    console.error('检查删除条件失败:', error)
    message.error('检查删除条件失败')
  }
}

const handleDeleteConfirm = async () => {
  if (!contextMenuNode.value) return
  
  try {
    deleteLoading.value = true
    
    const options = deleteOptions.action === 'soft' ? {} : {
      force: deleteOptions.action === 'force',
      migrate_to: deleteOptions.migrate_to
    }
    
    await policyManagementAPI.deleteRegion(contextMenuNode.value.region_id, options)
    
    message.success('删除成功')
    deleteConfirmVisible.value = false
    
    // 刷新树数据
    await loadBatchTreeData(false) // 强制刷新，不使用缓存
    
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  } finally {
    deleteLoading.value = false
  }
}

const handleRegionFormSuccess = async () => {
  regionFormVisible.value = false
  message.success(regionFormMode.value === 'add' ? '添加成功' : '更新成功')
  
  // 刷新树数据
  await loadBatchTreeData(false) // 强制刷新，不使用缓存
}

// 辅助方法
const findParentNode = (targetNode: TreeNode): TreeNode | null => {
  const findInTree = (nodes: TreeNode[]): TreeNode | null => {
    for (const node of nodes) {
      if (node.children) {
        for (const child of node.children) {
          if (child.key === targetNode.key) {
            return node
          }
        }
        const found = findInTree(node.children)
        if (found) return found
      }
    }
    return null
  }
  
  return findInTree(treeData.value)
}

// 监听选中区域变化
watch(() => props.selectedRegion, (newRegion) => {
  if (newRegion) {
    const key = `${newRegion.region_level}_${newRegion.region_id}`
    selectedKeys.value = [key]
  } else {
    selectedKeys.value = []
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  loadBatchTreeData() // 使用新的批量加载方法
})
</script>

<style scoped lang="less">
.policy-navigation-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .search-section {
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
    
    .search-input {
      width: 100%;
      
      :deep(.ant-input-search) {
        .ant-input {
          border-radius: 6px;
          font-size: 12px;
        }
        
        .ant-btn {
          border-radius: 0 6px 6px 0;
        }
      }
    }
  }
  
  .tree-section {
    flex: 1;
    padding: 8px;
    overflow-y: auto;
    
    .navigation-tree {
      // 强制所有树节点的子元素水平排列
      :deep(.ant-tree-treenode) {
        padding: 1px 0; // 减少垂直间距
        
        // 整个树节点的布局
        & > .ant-tree-node-content-wrapper {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
        }
        
        // 确保switcher、图标、标题都在同一行
        .ant-tree-switcher,
        .ant-tree-iconEle,
        .ant-tree-title {
          display: inline-flex !important;
          align-items: center !important;
        }
        
        .ant-tree-node-content-wrapper {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-start !important;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          min-height: 26px;
          height: 26px;
          width: 100%;
          
          &:hover {
            background: #f0f8ff;
            box-shadow: 0 1px 3px rgba(24, 144, 255, 0.1);
          }
          
          &.ant-tree-node-selected {
            background: #e6f7ff;
            border-left: 3px solid #1890ff;
            padding-left: 5px;
          }
        }
        
        .ant-tree-switcher {
          width: 18px; // 稍微减小
          height: 18px;
          line-height: 18px;
          margin-top: 4px; // 调整对齐
        }
      }
      
      :deep(.ant-tree-icon) {
        margin-right: 8px;
        width: 16px;
        height: 16px;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        .anticon {
          font-size: 14px;
        }
      }
      
      // 确保图标容器水平排列
      :deep(.ant-tree-iconEle) {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-right: 8px;
        flex-shrink: 0;
        height: 100%;
      }
      
      // 确保标题容器水平排列
      :deep(.ant-tree-title) {
        display: inline-flex !important;
        align-items: center !important;
        flex: 1;
        height: 100%;
        line-height: 1;
      }
      
      .tree-node-title {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100%;
        height: 24px; // 固定行高
        padding: 0;
        
        .node-left {
          flex: 1;
          display: flex;
          align-items: center;
          flex-direction: row;
          gap: 8px;
          min-width: 0; // 允许文本截断
          
          .node-text {
            font-size: 13px;
            font-weight: 500;
            color: #333;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
          }
          
          .region-type {
            font-size: 9px;
            padding: 1px 4px;
            border-radius: 2px;
            font-weight: 500;
            flex-shrink: 0;
            line-height: 1.2;
            
            &.type-province {
              background: #e6f7ff;
              color: #1890ff;
            }
            
            &.type-city {
              background: #f6ffed;
              color: #52c41a;
            }
            
            &.type-company {
              background: #fff7e6;
              color: #fa8c16;
            }
          }
        }
        
        .node-right {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
          
          .policy-tag {
            font-size: 9px;
            line-height: 1;
            padding: 1px 3px;
            border-radius: 2px;
            min-width: 16px;
            text-align: center;
            font-weight: bold;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }
      
      // 不同层级的缩进和样式
      :deep(.ant-tree-treenode) {
        &[data-level="0"] {
          .node-text {
            font-weight: 600;
          }
        }
        
        &[data-level="1"] {
          .node-text {
            font-weight: 500;
            color: #555;
          }
        }
        
        &[data-level="2"] {
          .node-text {
            color: #666;
          }
        }
      }
    }
  }
  
  .stats-section {
    padding: 10px;
    border-top: 1px solid #f0f0f0;
    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    
    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .stats-title {
        font-size: 11px;
        color: #666;
        font-weight: 500;
      }
      
      .completion-rate {
        font-size: 12px;
        font-weight: 600;
        color: #1890ff;
        background: #e6f7ff;
        padding: 1px 4px;
        border-radius: 2px;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 8px;
      
      .stat-item {
        text-align: center;
        padding: 6px 4px;
        background: white;
        border-radius: 4px;
        border: 1px solid #f0f0f0;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: #d9d9d9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        &.highlight {
          background: #e6f7ff;
          border-color: #91d5ff;
          
          .stat-number {
            color: #1890ff !important;
          }
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          
          .stat-number {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            line-height: 1;
          }
          
          .stat-label {
            font-size: 10px;
            color: #666;
            line-height: 1;
          }
        }
      }
    }
    
    .progress-bar {
      height: 3px;
      background: #f0f0f0;
      border-radius: 2px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
        transition: width 0.3s ease;
        border-radius: 2px;
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .policy-navigation-tree {
    .search-section {
      padding: 8px;
    }
    
    .tree-section {
      padding: 8px;
      
      .navigation-tree {
        :deep(.ant-tree-treenode) {
          .ant-tree-node-content-wrapper {
            min-height: 24px;
            height: 24px;
            padding: 3px 6px;
          }
          
          .ant-tree-switcher {
            width: 16px;
            height: 16px;
            line-height: 16px;
          }
        }
        
        :deep(.ant-tree-icon) {
          width: 14px;
          height: 14px;
          margin-right: 4px;
          
          .anticon {
            font-size: 12px;
          }
        }
        
        .tree-node-title {
          height: 20px;
          
          .node-left {
            gap: 4px;
            
            .node-text {
              font-size: 12px;
            }
            
            .region-type {
              font-size: 8px;
              padding: 1px 3px;
            }
          }
          
          .node-right .policy-tag {
            font-size: 8px;
            min-width: 14px;
            height: 14px;
          }
        }
      }
    }
    
    .stats-section {
      padding: 8px;
      
      .stats-grid {
        gap: 6px;
        
        .stat-item {
          padding: 4px;
          
          .stat-number {
            font-size: 14px;
          }
          
          .stat-label {
            font-size: 10px;
          }
        }
      }
    }
  }
}

// 右键菜单样式
:deep(.ant-dropdown-menu) {
  .danger-menu-item {
    color: #ff4d4f;
    
    &:hover {
      color: #fff;
      background-color: #ff4d4f;
    }
  }
}

.delete-confirm-content {
  .delete-warning {
    margin-bottom: 16px;
  }
  
  .delete-info {
    margin-top: 12px;
    
    p {
      margin: 8px 0;
      
      strong {
        color: #ff4d4f;
      }
    }
  }
}
</style>