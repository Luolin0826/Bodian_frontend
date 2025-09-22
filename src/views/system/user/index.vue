<template>
  <div class="user-page">
    <div class="page-header">
      <div class="page-title">
        <UserOutlined class="title-icon" />
        <h1>用户管理</h1>
        <span class="title-desc">员工账户与权限管理</span>
      </div>
      <div class="page-actions">
        <a-button type="primary" size="large" @click="showCreateModal" class="create-btn">
          <UserAddOutlined />
          <span class="hidden sm:inline">新增用户</span>
        </a-button>
      </div>
    </div>

    <!-- 统计仪表盘 -->
    <div class="stats-dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <UserOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.total }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <CheckCircleOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.active }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <TeamOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.sales }}</div>
            <div class="stat-label">销售人员</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.todayLogin }}</div>
            <div class="stat-label">今日登录</div>
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
            placeholder="搜索用户名、姓名或工号"
            class="search-input"
            @search="handleSearch"
            allow-clear
            size="large"
          />
          <a-select
            v-model:value="selectedRole"
            placeholder="选择角色"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          >
            <a-select-option v-for="role in roleOptions" :key="role.name" :value="role.name">
              {{ role.display_name }}
            </a-select-option>
          </a-select>
          <a-cascader
            v-model:value="selectedDepartment"
            :options="departmentOptions"
            :field-names="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="选择部门"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          />
          <a-range-picker
            v-model:value="hireDateRange"
            :placeholder="['开始日期', '结束日期']"
            @change="handleSearch"
            size="large"
          />
        </div>
        <div class="action-controls">
          <a-switch
            v-model:checked="showInactive"
            checked-children="显示停用"
            un-checked-children="隐藏停用"
            @change="handleSearch"
          />
          <a-button-group>
            <a-button @click="handleBatchEnable" :disabled="selectedRowKeys.length === 0">
              批量启用
            </a-button>
            <a-button @click="handleBatchDisable" :disabled="selectedRowKeys.length === 0">
              批量停用
            </a-button>
          </a-button-group>
        </div>
      </div>

      <!-- 用户表格 -->
      <div class="user-table">
        <a-table
          :columns="tableColumns"
          :data-source="userList"
          :loading="loading"
          :pagination="pagination"
          :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
          @change="handleTableChange"
          row-key="id"
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'employee_no'">
              <span class="employee-no">{{ record.employee_no }}</span>
            </template>
            
            <template v-if="column.key === 'real_name'">
              <div class="user-info">
                <a-avatar :src="record.avatar">{{ record.real_name?.[0] }}</a-avatar>
                <div class="user-details">
                  <div class="user-name">{{ record.real_name }}</div>
                  <div class="user-username">@{{ record.username }}</div>
                </div>
              </div>
            </template>
            
            <template v-if="column.key === 'role'">
              <a-tag :color="getRoleColor(record.role)">
                {{ getRoleLabel(record.role) }}
              </a-tag>
            </template>
            
            <template v-if="column.key === 'department_name'">
              <a-tag v-if="record.department_name" color="blue">
                {{ record.department_name }}
              </a-tag>
              <span v-else class="text-gray">未分配</span>
            </template>
            
            <template v-if="column.key === 'phone'">
              <MaskedText 
                :value="record.phone || '-'"
                data-type="phone"
                :show-apply-button="false"
              />
            </template>
            
            <template v-if="column.key === 'email'">
              <MaskedText 
                :value="record.email || '-'"
                data-type="email"
                :show-apply-button="false"
              />
            </template>
            
            <template v-if="column.key === 'hire_date'">
              <span v-if="record.hire_date" class="hire-date">
                {{ formatDate(record.hire_date) }}
              </span>
              <span v-else class="text-gray">-</span>
            </template>
            
            <template v-if="column.key === 'is_active'">
              <a-switch
                v-model:checked="record.is_active"
                @change="handleStatusChange(record)"
                :loading="record.statusLoading"
              />
            </template>
            
            <template v-if="column.key === 'last_login'">
              <span v-if="record.last_login" class="last-login">
                {{ formatDateTime(record.last_login) }}
              </span>
              <span v-else class="text-gray">从未登录</span>
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
                <a-tooltip title="重置密码">
                  <a-button type="text" size="small" @click="handleResetPassword(record)">
                    <KeyOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="删除" v-if="showDeleteButton(record)">
                  <a-button type="text" size="small" danger @click="handleDelete(record)">
                    <DeleteOutlined />
                  </a-button>
                </a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 新增/编辑用户弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingUser ? '编辑用户' : '新增用户'"
      width="900px"
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
            <a-form-item label="用户名" name="username">
              <a-input v-model:value="formData.username" placeholder="请输入用户名" :disabled="!!editingUser" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="真实姓名" name="real_name">
              <a-input v-model:value="formData.real_name" placeholder="请输入真实姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16" v-if="!editingUser">
          <a-col :span="12">
            <a-form-item label="密码" name="password">
              <a-input-password v-model:value="formData.password" placeholder="请输入密码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="确认密码" name="confirmPassword">
              <a-input-password v-model:value="formData.confirmPassword" placeholder="请再次输入密码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="角色" name="role">
              <a-select v-model:value="formData.role" placeholder="选择用户角色">
                <a-select-option v-for="role in roleOptions" :key="role.name" :value="role.name">
                  {{ role.display_name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="所属部门" name="department_id">
              <a-cascader
                v-model:value="formData.department_id"
                :options="departmentOptions"
                :field-names="{ label: 'name', value: 'id', children: 'children' }"
                placeholder="选择所属部门"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="手机号" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱" name="email">
              <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="入职日期" name="hire_date">
              <a-date-picker
                v-model:value="formData.hire_date"
                placeholder="选择入职日期"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工号" name="employee_no">
              <a-input 
                v-model:value="formData.employee_no" 
                placeholder="自动生成" 
                disabled
                :suffix="editingUser ? undefined : '入职后自动生成'"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 用户详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="用户详情"
      :width="isMobile ? '95vw' : '800px'"
      :footer="null"
      class="user-detail-modal"
    >
      <div v-if="currentUser" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <div class="user-profile">
            <a-avatar :size="80" :src="currentUser.avatar">
              {{ currentUser.real_name?.[0] }}
            </a-avatar>
            <div class="profile-info">
              <h4>{{ currentUser.real_name }}</h4>
              <p>@{{ currentUser.username }}</p>
              <a-tag :color="getRoleColor(currentUser.role)">
                {{ getRoleLabel(currentUser.role) }}
              </a-tag>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>工号</label>
              <span class="employee-no">{{ currentUser.employee_no }}</span>
            </div>
            <div class="info-item">
              <label>所属部门</label>
              <span>{{ currentUser.department_name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>手机号</label>
              <MaskedText 
                :value="currentUser.phone || '-'"
                data-type="phone"
                :show-apply-button="false"
              />
            </div>
            <div class="info-item">
              <label>邮箱</label>
              <MaskedText 
                :value="currentUser.email || '-'"
                data-type="email"
                :show-apply-button="false"
              />
            </div>
            <div class="info-item">
              <label>入职日期</label>
              <span>{{ currentUser.hire_date || '-' }}</span>
            </div>
            <div class="info-item">
              <label>最后登录</label>
              <span>{{ currentUser.last_login ? formatDateTime(currentUser.last_login) : '从未登录' }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <a-button @click="handleEdit(currentUser)" type="primary">
            <EditOutlined />
            编辑用户
          </a-button>
          <a-button @click="handleResetPassword(currentUser)">
            <KeyOutlined />
            重置密码
          </a-button>
          <a-button @click="detailVisible = false">
            关闭
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 重置密码弹窗 -->
    <a-modal
      v-model:open="passwordModalVisible"
      title="重置密码"
      @ok="handlePasswordSubmit"
      @cancel="handlePasswordCancel"
      :confirm-loading="passwordLoading"
    >
      <a-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        layout="vertical"
      >
        <a-form-item label="新密码" name="password">
          <a-input-password v-model:value="passwordForm.password" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { 
  UserOutlined,
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import { useResponsive } from '@/composables/useResponsive'
import { useUserStore } from '@/stores/user'
import { processMaskedArray, SENSITIVE_FIELD_NAMES } from '@/utils/dataMasking'
import MaskedText from '@/components/common/MaskedText.vue'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  batchUpdateUserStatus,
  getDepartmentTree,
  getRoles,
  type User,
  type Department,
  type Role
} from '@/api/system'

// 响应式工具
const { isMobile } = useResponsive()

// 用户状态管理
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const passwordLoading = ref(false)
const modalVisible = ref(false)
const detailVisible = ref(false)
const passwordModalVisible = ref(false)

const userList = ref<User[]>([])
const departmentOptions = ref<Department[]>([])
const roleOptions = ref<Role[]>([])
const editingUser = ref<User | null>(null)
const currentUser = ref<User | null>(null)
const selectedRowKeys = ref<number[]>([])
const formRef = ref()
const passwordFormRef = ref()

// 统计数据
const userStats = reactive({
  total: 0,
  active: 0,
  sales: 0,
  todayLogin: 0
})

// 搜索参数
const searchKeyword = ref('')
const selectedRole = ref<string>()
const selectedDepartment = ref<number>()
const hireDateRange = ref<[Dayjs, Dayjs]>()
const showInactive = ref(false)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 表单数据
const formData = reactive<User & { confirmPassword?: string }>({
  username: '',
  real_name: '',
  password: '',
  confirmPassword: '',
  role: 'sales',
  department_id: undefined,
  phone: '',
  email: '',
  hire_date: '',
  is_active: true
})

// 密码表单
const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名只能包含字母、数字和下划线，长度3-20位', trigger: 'blur' }
  ],
  real_name: [
    { required: false, message: '请输入真实姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (value !== formData.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 密码表单验证规则
const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (value !== passwordForm.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}

// 表格列定义
const tableColumns = [
  { title: '工号', dataIndex: 'employee_no', key: 'employee_no', width: 120, fixed: 'left' },
  { title: '用户信息', dataIndex: 'real_name', key: 'real_name', width: 200, fixed: 'left' },
  { title: '角色', dataIndex: 'role', key: 'role', width: 120 },
  { title: '所属部门', dataIndex: 'department_name', key: 'department_name', width: 150 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
  { title: '入职日期', dataIndex: 'hire_date', key: 'hire_date', width: 120 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80 },
  { title: '最后登录', dataIndex: 'last_login', key: 'last_login', width: 150 },
  { title: '操作', key: 'actions', width: 180, fixed: 'right' }
]

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colorMap: Record<string, string> = {
    super_admin: 'red',
    admin: 'orange',
    manager: 'blue',
    sales: 'green',
    teacher: 'purple',
    viewer: 'default'
  }
  return colorMap[role] || 'default'
}

// 获取角色标签
const getRoleLabel = (role: string) => {
  const labelMap: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '系统管理员',
    manager: '部门经理',
    sales: '销售人员',
    teacher: '教学人员',
    viewer: '查看人员'
  }
  return labelMap[role] || role
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

// 加载用户数据
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value.trim() || undefined,
      role: selectedRole.value,
      department_id: selectedDepartment.value,
      is_active: showInactive.value ? undefined : true,
      hire_date_start: hireDateRange.value?.[0]?.format('YYYY-MM-DD'),
      hire_date_end: hireDateRange.value?.[1]?.format('YYYY-MM-DD'),
      page: pagination.current,
      per_page: pagination.pageSize
    }
    
    const response = await getUsers(params)
    
    // 处理脱敏数据
    const processedData = processMaskedArray(response.data, ['phone', 'email'])
    userList.value = processedData
    pagination.total = response.total
    
    // 更新统计数据
    updateStats(response.data)
  } catch (error) {
    message.error('加载用户数据失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStats = (users: User[]) => {
  userStats.total = users.length
  userStats.active = users.filter(user => user.is_active).length
  userStats.sales = users.filter(user => user.role === 'sales').length
  userStats.todayLogin = users.filter(user => {
    if (!user.last_login) return false
    return dayjs(user.last_login).isAfter(dayjs().startOf('day'))
  }).length
}

// 加载部门选项
const loadDepartments = async () => {
  try {
    const response = await getDepartmentTree()
    // 确保 departmentOptions 是数组
    departmentOptions.value = Array.isArray(response) ? response : (response?.data || [])
  } catch (error) {
    console.error('加载部门数据失败:', error)
    departmentOptions.value = []
  }
}

// 加载角色选项
const loadRoles = async () => {
  try {
    const response = await getRoles()
    roleOptions.value = Array.isArray(response) ? response : (response?.data || [])
  } catch (error) {
    console.error('加载角色数据失败:', error)
    roleOptions.value = []
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadUsers()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadUsers()
}

// 选择变化
const onSelectChange = (keys: number[]) => {
  selectedRowKeys.value = keys
}

// 显示新增弹窗
const showCreateModal = () => {
  resetForm()
  modalVisible.value = true
}

// 编辑用户
const handleEdit = (user: User) => {
  editingUser.value = user
  // 先重置表单，再在nextTick中填充数据
  resetFormFields()
  nextTick(() => {
    Object.assign(formData, {
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      department_id: user.department_id,
      phone: user.phone,
      email: user.email,
      hire_date: user.hire_date ? dayjs(user.hire_date) : undefined,
      is_active: user.is_active,
      employee_no: user.employee_no
    })
  })
  modalVisible.value = true
}

// 显示详情
const showDetail = (user: User) => {
  currentUser.value = user
  detailVisible.value = true
}

// 检查用户删除权限
const canDeleteUser = (currentUser: User, targetUser: User): { 
  canDelete: boolean; 
  reason?: string 
} => {
  // 基础权限检查 - 只有管理员级别才能删除用户
  if (!userStore.hasOperationPermission('user', 'delete') && 
      !['super_admin', 'admin'].includes(currentUser.role)) {
    return { canDelete: false, reason: '无用户删除权限' }
  }

  // 自删保护
  if (currentUser.id === targetUser.id) {
    return { canDelete: false, reason: '不能删除自己的账户' }
  }

  // 角色层级检查
  const roleHierarchy = {
    'super_admin': 4,
    'admin': 3, 
    'manager': 2,
    'sales': 1,
    'teacher': 1,
    'viewer': 1
  }

  const currentUserLevel = roleHierarchy[currentUser.role] || 0
  const targetUserLevel = roleHierarchy[targetUser.role] || 0

  if (currentUserLevel <= targetUserLevel) {
    return { canDelete: false, reason: '权限不足，无法删除同级或更高级用户' }
  }

  // 部门权限检查（管理员级别）
  if (currentUser.role === 'manager') {
    if (currentUser.department_id !== targetUser.department_id) {
      return { canDelete: false, reason: '只能删除本部门用户' }
    }
  }

  return { canDelete: true }
}

// 检查是否显示删除按钮
const showDeleteButton = (user: User) => {
  if (!userStore.userInfo) return false
  const authResult = canDeleteUser(userStore.userInfo, user)
  return authResult.canDelete
}

// 删除用户
const handleDelete = (user: User) => {
  if (!userStore.userInfo) {
    message.error('用户信息异常')
    return
  }

  // 权限检查
  const authResult = canDeleteUser(userStore.userInfo, user)
  
  if (!authResult.canDelete) {
    message.error(authResult.reason!)
    return
  }
  Modal.confirm({
    title: '⚠️ 危险操作确认',
    content: `您即将删除用户"${user.real_name}"(${user.username})，此操作将：
    
    • 永久删除用户账户和相关数据
    • 无法恢复已删除的信息
    • 影响该用户的所有关联记录
    
    请确认您有权限执行此操作！`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteUser(user.id!)
        message.success('删除成功')
        loadUsers()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

// 重置密码
const handleResetPassword = (user: User) => {
  currentUser.value = user
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  passwordModalVisible.value = true
}

// 状态变更
const handleStatusChange = async (user: User) => {
  user.statusLoading = true
  const originalStatus = user.is_active
  try {
    await updateUser(user.id!, { ...user })
    
    // 如果用户被停用且当前隐藏停用用户，自动切换为显示停用用户
    if (!user.is_active && !showInactive.value) {
      showInactive.value = true
      message.success('用户已停用，已自动切换为显示停用用户')
    } else {
      message.success(`用户已${user.is_active ? '启用' : '停用'}`)
    }
    
    // 重新加载用户列表以显示最新状态
    loadUsers()
  } catch (error) {
    user.is_active = originalStatus // 回滚状态
    message.error('状态更新失败')
  } finally {
    user.statusLoading = false
  }
}

// 批量启用
const handleBatchEnable = async () => {
  try {
    await batchUpdateUserStatus(selectedRowKeys.value, true)
    message.success('批量启用成功')
    selectedRowKeys.value = []
    loadUsers()
  } catch (error) {
    message.error('批量启用失败')
  }
}

// 批量停用
const handleBatchDisable = async () => {
  try {
    await batchUpdateUserStatus(selectedRowKeys.value, false)
    
    // 如果当前隐藏停用用户，自动切换为显示停用用户
    if (!showInactive.value) {
      showInactive.value = true
      message.success('批量停用成功，已自动切换为显示停用用户')
    } else {
      message.success('批量停用成功')
    }
    
    selectedRowKeys.value = []
    loadUsers()
  } catch (error) {
    message.error('批量停用失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const submitData = { ...formData }
    if (submitData.hire_date && dayjs.isDayjs(submitData.hire_date)) {
      submitData.hire_date = submitData.hire_date.format('YYYY-MM-DD')
    }
    delete submitData.confirmPassword
    
    if (editingUser.value) {
      await updateUser(editingUser.value.id!, submitData)
      message.success('更新用户成功')
    } else {
      await createUser(submitData)
      message.success('创建用户成功')
    }
    
    modalVisible.value = false
    loadUsers()
  } catch (error) {
    if (error?.errorFields) return // 表单验证错误
    message.error(editingUser.value ? '更新用户失败' : '创建用户失败')
  } finally {
    submitLoading.value = false
  }
}

// 提交密码
const handlePasswordSubmit = async () => {
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    
    await resetUserPassword(currentUser.value!.id!, passwordForm.password)
    message.success('密码重置成功')
    passwordModalVisible.value = false
  } catch (error) {
    if (error?.errorFields) return // 表单验证错误
    message.error('密码重置失败')
  } finally {
    passwordLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 取消密码重置
const handlePasswordCancel = () => {
  passwordModalVisible.value = false
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
}

// 重置表单字段（用于编辑前清理）
const resetFormFields = () => {
  Object.assign(formData, {
    username: '',
    real_name: '',
    password: '',
    confirmPassword: '',
    role: 'sales',
    department_id: undefined,
    phone: '',
    email: '',
    hire_date: '',
    is_active: true,
    employee_no: ''
  })
  formRef.value?.resetFields()
}

// 完全重置表单（用于新增）
const resetForm = () => {
  // 先清空编辑状态
  editingUser.value = null
  
  // 重置表单数据
  resetFormFields()
}

// 初始化
onMounted(() => {
  loadUsers()
  loadDepartments()
  loadRoles()
})
</script>

<style scoped lang="less">
.user-page {
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
  align-items: flex-start;
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
  flex-wrap: wrap;
  
  .search-input {
    width: 250px;
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
  
  .filter-select {
    width: 150px;
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
}

.action-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 767px) {
    justify-content: space-between;
  }
}

// 表格相关
.employee-no {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1890ff;
  background: #f0f8ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-details {
    .user-name {
      font-weight: 500;
      color: #262626;
      margin-bottom: 2px;
    }
    
    .user-username {
      font-size: 12px;
      color: #8c8c8c;
    }
  }
}

.last-login {
  font-size: 12px;
  color: #8c8c8c;
}

.text-gray {
  color: #8c8c8c;
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
      margin-bottom: 16px;
      color: #262626;
    }
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    
    .profile-info {
      h4 {
        margin: 0 0 4px 0;
        font-size: 18px;
        color: #262626;
      }
      
      p {
        margin: 0 0 8px 0;
        color: #8c8c8c;
      }
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
        
        &.employee-no {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: #1890ff;
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
</style>