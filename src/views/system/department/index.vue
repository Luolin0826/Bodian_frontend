<template>
  <div class="department-page">
    <div class="page-header">
      <div class="page-title">
        <ApartmentOutlined class="title-icon" />
        <h1>部门管理</h1>
        <span class="title-desc">组织架构与部门设置</span>
      </div>
      <div class="page-actions">
        <a-button type="primary" size="large" @click="showCreateModal" class="create-btn">
          <PlusOutlined />
          <span class="hidden sm:inline">新增部门</span>
        </a-button>
      </div>
    </div>

    <!-- 统计仪表盘 -->
    <div class="stats-dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <ApartmentOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ departmentStats.total }}</div>
            <div class="stat-label">总部门数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <TeamOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ departmentStats.totalEmployees }}</div>
            <div class="stat-label">总员工数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <EnvironmentOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ departmentStats.regions }}</div>
            <div class="stat-label">覆盖地区</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <ShopOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ departmentStats.salesDepts }}</div>
            <div class="stat-label">销售部门</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-content">
      <!-- 搜索和控制栏 -->
      <div class="search-section">
        <div class="search-filters">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索部门名称或编码"
            class="search-input"
            @search="handleSearch"
            allow-clear
            size="large"
          />
          <a-select
            v-model:value="selectedType"
            placeholder="部门类型"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          >
            <a-select-option value="sales">销售部</a-select-option>
            <a-select-option value="teaching">教学部</a-select-option>
            <a-select-option value="admin">行政部</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
          <a-select
            v-if="regions.length > 0"
            v-model:value="selectedRegion"
            placeholder="选择地区"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          >
            <a-select-option
              v-for="region in regions"
              :key="region"
              :value="region"
            >
              {{ region }}
            </a-select-option>
          </a-select>
          <a-switch
            v-model:checked="showInactive"
            checked-children="显示停用"
            un-checked-children="隐藏停用"
            @change="handleSearch"
          />
        </div>
        <div class="view-controls">
          <a-radio-group v-model:value="viewMode" button-style="solid" size="large">
            <a-radio-button value="tree">
              <NodeIndexOutlined />
              <span class="hidden lg:inline ml-1">树形</span>
            </a-radio-button>
            <a-radio-button value="table">
              <TableOutlined />
              <span class="hidden lg:inline ml-1">表格</span>
            </a-radio-button>
          </a-radio-group>
        </div>
      </div>

      <!-- 部门内容区域 -->
      <div class="department-content">
        <!-- 树形视图 -->
        <div v-if="viewMode === 'tree'" class="department-tree">
          <a-tree
            :tree-data="departmentTree"
            :field-names="{children:'children', title:'name', key:'id'}"
            :expanded-keys="expandedKeys"
            @expand="onExpand"
            block-node
          >
            <template #title="nodeData">
              <div class="tree-node-content" :class="{ 'inactive': !nodeData.is_active }">
                <div class="node-main">
                  <span class="node-name">{{ nodeData.name }}</span>
                  <a-tag :color="getTypeColor(nodeData.type)" size="small">{{ getTypeLabel(nodeData.type) }}</a-tag>
                  <a-tag v-if="nodeData.region" color="blue" size="small">{{ nodeData.region }}</a-tag>
                  <span class="employee-count">{{ nodeData.employee_count || 0 }}人</span>
                </div>
                <div class="node-actions">
                  <a-tooltip title="查看详情">
                    <a-button type="text" size="small" @click.stop="showDetail(nodeData)">
                      <EyeOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="编辑">
                    <a-button type="text" size="small" @click.stop="handleEdit(nodeData)">
                      <EditOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="新增子部门">
                    <a-button type="text" size="small" @click.stop="showCreateModal(nodeData.id)">
                      <PlusOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button type="text" size="small" danger @click.stop="handleDelete(nodeData)">
                      <DeleteOutlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
            </template>
          </a-tree>
        </div>

        <!-- 表格视图 -->
        <div v-if="viewMode === 'table'" class="department-table">
          <a-table
            :columns="tableColumns"
            :data-source="departmentList"
            :loading="loading"
            :pagination="false"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <div class="department-name">
                  <span :style="{ paddingLeft: `${(record.level || 0) * 20}px` }">
                    {{ record.name }}
                  </span>
                  <a-tag v-if="record.parent_id" color="default" size="small">子部门</a-tag>
                </div>
              </template>
              
              <template v-if="column.key === 'type'">
                <a-tag :color="getTypeColor(record.type)">
                  {{ getTypeLabel(record.type) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'is_active'">
                <a-switch
                  v-model:checked="record.is_active"
                  @change="handleStatusChange(record)"
                  :loading="record.statusLoading"
                />
              </template>
              
              <template v-if="column.key === 'actions'">
                <div class="action-buttons">
                  <a-tooltip title="查看详情">
                    <a-button type="text" size="small" @click="showDetail(record)">
                      <EyeOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="编辑">
                    <a-button type="text" size="small" @click="handleEdit(record)">
                      <EditOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="新增子部门">
                    <a-button type="text" size="small" @click="showCreateModal(record.id)">
                      <PlusOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button type="text" size="small" danger @click="handleDelete(record)">
                      <DeleteOutlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </template>
            </template>
          </a-table>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="departmentList.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <ApartmentOutlined />
        </div>
        <h3 class="empty-title">暂无部门数据</h3>
        <p class="empty-desc">开始创建您的第一个部门</p>
        <a-button type="primary" size="large" @click="showCreateModal" class="empty-action">
          <PlusOutlined />
          创建部门
        </a-button>
      </div>
    </a-card>

    <!-- 新增/编辑部门弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingDepartment ? '编辑部门' : '新增部门'"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="submitLoading"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="部门编码" name="code">
              <a-input v-model:value="formData.code" placeholder="如：SH-SALES" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门名称" name="name">
              <a-input v-model:value="formData.name" placeholder="请输入部门名称" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="部门类型" name="type">
              <a-select v-model:value="formData.type" placeholder="选择部门类型">
                <a-select-option value="sales">销售部</a-select-option>
                <a-select-option value="teaching">教学部</a-select-option>
                <a-select-option value="admin">行政部</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="所属地区" name="region">
              <a-input v-model:value="formData.region" placeholder="如：上海、北京" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="上级部门" name="parent_id">
          <a-tree-select
            v-model:value="formData.parent_id"
            :tree-data="parentDepartmentOptions"
            :field-names="{children:'children', label:'name', value:'id'}"
            placeholder="选择上级部门（可选）"
            allow-clear
            tree-default-expand-all
            @change="(value) => { formData.parent_id = value }"
          />
        </a-form-item>

        <a-form-item label="部门负责人" name="manager_id">
          <a-select
            v-model:value="formData.manager_id"
            placeholder="选择部门负责人（可选）"
            allow-clear
            show-search
            :filter-option="filterManagerOption"
            @change="(value) => { formData.manager_id = value }"
          >
            <a-select-option
              v-for="user in managerOptions"
              :key="user.id"
              :value="user.id"
            >
              {{ user.real_name }}（{{ user.username }}）
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="部门描述" name="description">
          <a-textarea 
            v-model:value="formData.description" 
            placeholder="请输入部门描述"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 部门详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="部门详情"
      :width="isMobile ? '95vw' : '900px'"
      :footer="null"
      class="department-detail-modal"
    >
      <div v-if="currentDepartment" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>部门编码</label>
              <span>{{ currentDepartment.code }}</span>
            </div>
            <div class="info-item">
              <label>部门名称</label>
              <span>{{ currentDepartment.name }}</span>
            </div>
            <div class="info-item">
              <label>部门类型</label>
              <a-tag :color="getTypeColor(currentDepartment.type)">
                {{ getTypeLabel(currentDepartment.type) }}
              </a-tag>
            </div>
            <div class="info-item">
              <label>所属地区</label>
              <span>{{ currentDepartment.region || '-' }}</span>
            </div>
            <div class="info-item">
              <label>部门负责人</label>
              <span>{{ currentDepartment.manager_name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>员工数量</label>
              <span>{{ currentDepartment.employee_count || 0 }}人</span>
            </div>
          </div>
        </div>

        <!-- 部门员工 -->
        <div class="detail-section" v-if="departmentEmployees.length > 0">
          <h3 class="section-title">部门员工</h3>
          <div class="employee-list">
            <div v-for="employee in departmentEmployees" :key="employee.id" class="employee-item">
              <a-avatar :src="employee.avatar">{{ employee.real_name?.[0] }}</a-avatar>
              <div class="employee-info">
                <div class="employee-name">{{ employee.real_name }}</div>
                <div class="employee-role">{{ employee.role }} | {{ employee.employee_no }}</div>
              </div>
              <a-tag v-if="employee.id === currentDepartment.manager_id" color="gold">负责人</a-tag>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <a-button @click="handleEdit(currentDepartment)" type="primary">
            <EditOutlined />
            编辑部门
          </a-button>
          <a-button @click="detailVisible = false">
            关闭
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  ApartmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  NodeIndexOutlined,
  TableOutlined
} from '@ant-design/icons-vue'
import { useResponsive } from '@/composables/useResponsive'
import {
  getDepartments,
  getDepartmentTree,
  getDepartmentStats,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getUsers,
  type Department,
  type User
} from '@/api/system'

// 响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const modalVisible = ref(false)
const detailVisible = ref(false)
const viewMode = ref<'tree' | 'table'>('tree')

const departmentList = ref<Department[]>([])
const departmentTree = ref<Department[]>([])
const departmentEmployees = ref<User[]>([])
const editingDepartment = ref<Department | null>(null)
const currentDepartment = ref<Department | null>(null)
const formRef = ref()

// 统计数据
const departmentStats = reactive({
  total: 0,
  totalEmployees: 0,
  regions: 0,
  salesDepts: 0
})

// 搜索参数
const searchKeyword = ref('')
const selectedType = ref<string>()
const selectedRegion = ref<string>()
const showInactive = ref(false)

// 地区选项
const regions = ref<string[]>([])
const managerOptions = ref<User[]>([])
const expandedKeys = ref<number[]>([])

// 表单数据
const formData = reactive<Department>({
  code: '',
  name: '',
  type: 'sales',
  parent_id: undefined,
  region: '',
  manager_id: undefined,
  description: '',
  is_active: true
})

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入部门编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9-]+$/, message: '编码只能包含大写字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择部门类型', trigger: 'change' }
  ]
}

// 表格列定义
const tableColumns = [
  { title: '部门编码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '部门名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '地区', dataIndex: 'region', key: 'region', width: 100 },
  { title: '负责人', dataIndex: 'manager_name', key: 'manager_name', width: 120 },
  { title: '员工数', dataIndex: 'employee_count', key: 'employee_count', width: 80 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80 },
  { title: '操作', key: 'actions', width: 200 }
]

// 上级部门选项（排除当前编辑的部门及其子部门）
const parentDepartmentOptions = computed(() => {
  if (!editingDepartment.value) return departmentTree.value
  
  const filterTree = (nodes: Department[]): Department[] => {
    return nodes.filter(node => {
      if (node.id === editingDepartment.value?.id) return false
      if (node.children) {
        node.children = filterTree(node.children)
      }
      return true
    })
  }
  
  return filterTree(JSON.parse(JSON.stringify(departmentTree.value)))
})

// 获取部门类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    sales: 'blue',
    teaching: 'green',
    admin: 'orange',
    other: 'purple'
  }
  return colorMap[type] || 'default'
}

// 获取部门类型标签
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    sales: '销售部',
    teaching: '教学部',
    admin: '行政部',
    other: '其他'
  }
  return labelMap[type] || type
}

// 加载部门数据
const loadDepartments = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value.trim() || undefined,
      type: selectedType.value,
      region: selectedRegion.value,
      is_active: showInactive.value ? undefined : true
    }
    
    // 如果有筛选条件，只加载列表数据；否则同时加载树形数据
    // 注意：is_active为true是默认状态，只有当showInactive为true时才算是筛选条件
    const hasFilters = params.keyword || params.type || params.region || showInactive.value
    
    let listData, treeResponse
    
    if (hasFilters) {
      // 有筛选条件时，只加载筛选后的列表数据
      listData = await getDepartments(params)
      // 将筛选结果转换为树形结构用于树形视图
      departmentTree.value = buildTreeFromFilteredData(Array.isArray(listData) ? listData : (listData?.data || []))
    } else {
      // 无筛选条件时，加载完整的树形数据
      [listData, treeResponse] = await Promise.all([
        getDepartments(params),
        getDepartmentTree()
      ])
      departmentTree.value = Array.isArray(treeResponse) ? treeResponse : (treeResponse?.data || [])
    }
    
    // 确保数据都是数组格式
    departmentList.value = Array.isArray(listData) ? listData : (listData?.data || [])
    
    // 加载动态统计数据
    loadDepartmentStats()
    
    // 更新地区选项 - 使用完整数据
    if (!hasFilters) {
      updateRegions(departmentList.value)
    }
  } catch (error) {
    message.error('加载部门数据失败')
  } finally {
    loading.value = false
  }
}

// 加载部门统计数据
const loadDepartmentStats = async () => {
  try {
    const stats = await getDepartmentStats()
    Object.assign(departmentStats, stats)
  } catch (error) {
    console.error('加载部门统计数据失败:', error)
    // 如果API失败，使用本地计算的统计数据作为备份
    updateStatsFromLocalData(departmentList.value)
  }
}

// 本地计算统计数据作为备份
const updateStatsFromLocalData = (departments: Department[]) => {
  departmentStats.total = departments.length
  departmentStats.totalEmployees = departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0)
  departmentStats.regions = new Set(departments.map(dept => dept.region).filter(Boolean)).size
  departmentStats.salesDepts = departments.filter(dept => dept.type === 'sales').length
}

// 将筛选后的列表数据转换为树形结构
const buildTreeFromFilteredData = (filteredDepartments: Department[]): Department[] => {
  if (!filteredDepartments.length) return []
  
  // 创建部门映射
  const departmentMap = new Map<number, Department>()
  const rootNodes: Department[] = []
  
  // 第一遍遍历：创建所有节点
  filteredDepartments.forEach(dept => {
    departmentMap.set(dept.id!, { ...dept, children: [] })
  })
  
  // 第二遍遍历：构建树形结构
  filteredDepartments.forEach(dept => {
    const currentNode = departmentMap.get(dept.id!)!
    
    if (dept.parent_id && departmentMap.has(dept.parent_id)) {
      // 有父节点且父节点在筛选结果中
      const parentNode = departmentMap.get(dept.parent_id)!
      if (!parentNode.children) parentNode.children = []
      parentNode.children.push(currentNode)
    } else {
      // 没有父节点或父节点不在筛选结果中，作为根节点
      rootNodes.push(currentNode)
    }
  })
  
  return rootNodes
}

// 更新地区选项
const updateRegions = (departments: Department[]) => {
  const regionSet = new Set(
    departments
      .map(dept => dept.region)
      .filter(region => region && region.trim() !== '')
  )
  regions.value = Array.from(regionSet).sort()
  console.log('Updated regions:', regions.value)
  
  if (regions.value.length === 0) {
    console.log('没有找到地区数据，地区筛选器将被隐藏')
  }
}

// 加载管理员选项
const loadManagerOptions = async () => {
  try {
    const response = await getUsers({ role: 'manager' })
    // 确保 response.data 是数组
    managerOptions.value = Array.isArray(response.data) ? response.data : (response.data?.data || [])
  } catch (error) {
    console.error('加载管理员选项失败:', error)
    managerOptions.value = []
  }
}

// 搜索
const handleSearch = () => {
  loadDepartments()
}

// 显示新增弹窗
const showCreateModal = (parentId?: number) => {
  resetForm()
  if (parentId) {
    formData.parent_id = parentId
  }
  modalVisible.value = true
}

// 编辑部门
const handleEdit = (department: Department) => {
  editingDepartment.value = department
  // 先重置表单字段，再在nextTick中填充数据
  resetFormFields()
  nextTick(() => {
    Object.assign(formData, {
      code: department.code || '',
      name: department.name || '',
      type: department.type || 'sales',
      parent_id: department.parent_id || undefined,
      region: department.region || '',
      manager_id: department.manager_id || undefined,
      description: department.description || '',
      is_active: department.is_active ?? true
    })
  })
  modalVisible.value = true
}

// 显示详情
const showDetail = async (department: Department) => {
  currentDepartment.value = department
  detailVisible.value = true
  
  // 加载部门员工
  try {
    departmentEmployees.value = await getDepartmentEmployees(department.id!)
  } catch (error) {
    console.error('加载部门员工失败:', error)
  }
}

// 删除部门
const handleDelete = (department: Department) => {
  // 检查是否有子部门或员工
  if (department.children && department.children.length > 0) {
    message.warning('该部门存在子部门，无法删除')
    return
  }
  
  if (department.employee_count && department.employee_count > 0) {
    message.warning('该部门存在员工，无法删除')
    return
  }
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除部门"${department.name}"吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteDepartment(department.id!)
        message.success('删除成功')
        loadDepartments()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

// 状态变更
const handleStatusChange = async (department: Department) => {
  department.statusLoading = true
  try {
    await updateDepartment(department.id!, { ...department })
    message.success('状态更新成功')
  } catch (error) {
    department.is_active = !department.is_active // 回滚状态
    message.error('状态更新失败')
  } finally {
    department.statusLoading = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 确保数据格式正确，处理可能的事件对象或无效值
    const submitData = {
      ...formData,
      parent_id: formData.parent_id && typeof formData.parent_id === 'number' && !isNaN(formData.parent_id)
        ? formData.parent_id 
        : undefined,
      manager_id: formData.manager_id && typeof formData.manager_id === 'number' && !isNaN(formData.manager_id)
        ? formData.manager_id 
        : undefined
    }
    
    // 移除所有undefined值
    Object.keys(submitData).forEach(key => {
      if ((submitData as any)[key] === undefined) {
        delete (submitData as any)[key]
      }
    })
    
    console.log('Submitting department data:', submitData)
    
    if (editingDepartment.value) {
      await updateDepartment(editingDepartment.value.id!, submitData)
      message.success('更新部门成功')
    } else {
      await createDepartment(submitData)
      message.success('创建部门成功')
    }
    
    modalVisible.value = false
    loadDepartments()
  } catch (error: any) {
    if (error?.errorFields) return // 表单验证错误
    console.error('Department submit error:', error)
    message.error(editingDepartment.value ? '更新部门失败' : '创建部门失败')
  } finally {
    submitLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单字段（用于编辑前清理）
const resetFormFields = () => {
  Object.assign(formData, {
    code: '',
    name: '',
    type: 'sales',
    parent_id: undefined,
    region: '',
    manager_id: undefined,
    description: '',
    is_active: true
  })
  formRef.value?.resetFields()
}

// 完全重置表单（用于新增）
const resetForm = () => {
  // 先清空编辑状态
  editingDepartment.value = null
  
  // 重置表单数据
  resetFormFields()
}

// 树展开事件
const onExpand = (keys: number[]) => {
  expandedKeys.value = keys
}

// 过滤管理员选项
const filterManagerOption = (input: string, option: any) => {
  return option.children.toLowerCase().includes(input.toLowerCase())
}

// 加载完整地区数据
const loadAllRegions = async () => {
  try {
    // 获取所有部门数据来提取地区信息
    const allDepartments = await getDepartments({})
    const departments = Array.isArray(allDepartments) ? allDepartments : (allDepartments?.data || [])
    updateRegions(departments)
  } catch (error) {
    console.error('加载地区数据失败:', error)
    regions.value = []
  }
}

// 初始化
onMounted(() => {
  loadDepartments()
  loadManagerOptions()
  loadAllRegions()
})
</script>

<style scoped lang="less">
.department-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
}

// 页面头部
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    font-size: 28px;
    color: #1890ff;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
    
    @media (max-width: 767px) {
      font-size: 20px;
    }
  }
  
  .title-desc {
    color: #8c8c8c;
    font-size: 14px;
    margin-left: 8px;
    
    @media (max-width: 767px) {
      display: none;
    }
  }
}

// 统计仪表盘
.stats-dashboard {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #262626;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 13px;
      color: #8c8c8c;
    }
  }
}

// 主要内容
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
}

// 搜索区域
.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 250px;
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
  
  .filter-select {
    width: 120px;
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
}

// 树形视图
.tree-node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &.inactive {
    opacity: 0.6;
  }
  
  .node-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    
    .node-name {
      font-weight: 500;
      color: #262626;
    }
    
    .employee-count {
      color: #8c8c8c;
      font-size: 12px;
    }
  }
  
  .node-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover .node-actions {
    opacity: 1;
  }
}

// 表格视图
.department-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

// 详情弹窗
.detail-content {
  .detail-section {
    margin-bottom: 24px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #262626;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      label {
        font-size: 12px;
        color: #8c8c8c;
        font-weight: 500;
      }
      
      span {
        font-size: 14px;
        color: #262626;
      }
    }
  }
  
  .employee-list {
    .employee-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 8px;
      
      .employee-info {
        flex: 1;
        
        .employee-name {
          font-weight: 500;
          color: #262626;
        }
        
        .employee-role {
          font-size: 12px;
          color: #8c8c8c;
        }
      }
    }
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  
  .empty-icon {
    font-size: 64px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }
  
  .empty-title {
    font-size: 16px;
    color: #262626;
    margin: 0 0 8px 0;
  }
  
  .empty-desc {
    color: #8c8c8c;
    margin: 0 0 24px 0;
  }
  
  .empty-action {
    height: 44px;
    border-radius: 8px;
  }
}
</style>