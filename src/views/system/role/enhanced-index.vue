<template>
  <div class="role-permission-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <SafetyCertificateOutlined class="title-icon" />
        <h1>角色权限管理</h1>
        <span class="title-desc">系统角色定义与权限精细化配置</span>
      </div>
      <div class="page-actions">
        <a-space>
          <a-button @click="refreshData">
            <ReloadOutlined />
            刷新数据
          </a-button>
          <a-button type="primary" @click="showCreateRole">
            <PlusOutlined />
            新建角色
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 统计仪表盘 -->
    <div class="stats-dashboard">
      <a-row :gutter="16">
        <a-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <SafetyCertificateOutlined />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalRoles }}</div>
              <div class="stat-label">系统角色</div>
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <UserOutlined />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">授权用户</div>
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <KeyOutlined />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalPermissions }}</div>
              <div class="stat-label">权限节点</div>
            </div>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <SettingOutlined />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.configuredRoles }}</div>
              <div class="stat-label">已配置</div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 主要内容 -->
    <a-card class="main-content">
      <div class="content-header">
        <div class="filter-section">
          <a-space>
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索角色名称或描述..."
              @search="handleSearch"
              allow-clear
              style="width: 300px"
            />
            <a-select
              v-model:value="levelFilter"
              placeholder="权限级别"
              allow-clear
              style="width: 120px"
              @change="handleSearch"
            >
              <a-select-option :value="range" v-for="range in levelRanges" :key="range.value">
                {{ range.label }}
              </a-select-option>
            </a-select>
          </a-space>
        </div>
        <div class="view-controls">
          <a-radio-group v-model:value="viewMode" button-style="solid">
            <a-radio-button value="card">
              <AppstoreOutlined />
              卡片视图
            </a-radio-button>
            <a-radio-button value="table">
              <BarsOutlined />
              列表视图
            </a-radio-button>
          </a-radio-group>
        </div>
      </div>

      <!-- 角色卡片视图 -->
      <div v-if="viewMode === 'card'" class="role-cards">
        <a-row :gutter="[16, 16]">
          <a-col 
            v-for="role in filteredRoles" 
            :key="role.name"
            :xs="24" 
            :sm="12" 
            :lg="8" 
            :xl="6"
          >
            <RoleCard
              :role="role"
              :active="selectedRole?.name === role.name"
              show-preview
              @configure="openPermissionEditor"
              @edit="editRole"
              @viewUsers="viewRoleUsers"
              @duplicate="duplicateRole"
              @export="exportRoleConfig"
            />
          </a-col>
        </a-row>
      </div>

      <!-- 角色列表视图 -->
      <div v-if="viewMode === 'table'" class="role-table">
        <a-table
          :columns="tableColumns"
          :data-source="filteredRoles"
          :loading="loading"
          :pagination="{
            total: filteredRoles.length,
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }"
          row-key="name"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'display_name'">
              <div class="role-name-cell">
                <a-avatar :style="{ backgroundColor: getRoleColor(record.name) }" size="small">
                  <component :is="getRoleIcon(record.name)" />
                </a-avatar>
                <div class="name-info">
                  <div class="name">{{ record.display_name }}</div>
                  <div class="code">{{ record.name }}</div>
                </div>
              </div>
            </template>
            
            <template v-if="column.key === 'level'">
              <a-tag :color="getLevelColor(record.level)">
                Level {{ record.level }}
              </a-tag>
            </template>
            
            <template v-if="column.key === 'user_count'">
              <a-button type="link" @click="viewRoleUsers(record)">
                {{ record.user_count || 0 }} 人
              </a-button>
            </template>
            
            <template v-if="column.key === 'permission_count'">
              <a-tag color="blue">{{ getPermissionCount(record) }} 项</a-tag>
            </template>
            
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-tooltip title="配置权限">
                  <a-button type="text" @click="openPermissionEditor(record)">
                    <SettingOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="查看用户">
                  <a-button type="text" @click="viewRoleUsers(record)">
                    <UserOutlined />
                  </a-button>
                </a-tooltip>
                <a-dropdown>
                  <a-button type="text">
                    <MoreOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="editRole(record)">
                        <EditOutlined />
                        编辑角色
                      </a-menu-item>
                      <a-menu-item @click="duplicateRole(record)">
                        <CopyOutlined />
                        复制角色
                      </a-menu-item>
                      <a-menu-item @click="exportRoleConfig(record)">
                        <ExportOutlined />
                        导出配置
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item @click="deleteRole(record)" danger>
                        <DeleteOutlined />
                        删除角色
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 权限配置抽屉 -->
    <a-drawer
      v-model:open="permissionDrawerVisible"
      title="权限配置"
      :width="1200"
      placement="right"
      :mask-closable="false"
      :destroy-on-close="true"
    >
      <PermissionEditor
        :role="selectedRole"
        :visible="permissionDrawerVisible"
        @save="savePermissions"
        @cancel="closePermissionEditor"
      />
    </a-drawer>

    <!-- 用户列表弹窗 -->
    <a-modal
      v-model:open="userListVisible"
      :title="`${currentRoleForUsers?.display_name} - 用户列表`"
      :width="800"
      :footer="null"
    >
      <a-table
        :columns="userColumns"
        :data-source="roleUsers"
        :loading="userListLoading"
        size="small"
        :pagination="{ pageSize: 10 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'real_name'">
            <div class="user-info">
              <a-avatar size="small">{{ record.real_name?.[0] }}</a-avatar>
              <div class="info">
                <div>{{ record.real_name }}</div>
                <div class="username">{{ record.username }}</div>
              </div>
            </div>
          </template>
          
          <template v-if="column.key === 'is_active'">
            <a-tag :color="record.is_active ? 'green' : 'red'">
              {{ record.is_active ? '正常' : '停用' }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  SafetyCertificateOutlined,
  UserOutlined,
  KeyOutlined,
  SettingOutlined,
  ReloadOutlined,
  PlusOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExportOutlined,
  MoreOutlined,
  CrownOutlined,
  TeamOutlined,
  ShopOutlined,
  ReadOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'

import RoleCard from './components/RoleCard.vue'
import PermissionEditor from './components/PermissionEditor.vue'
import {
  getRoles,
  getRoleUsers,
  type Role,
  type User
} from '@/api/system'

// 响应式数据
const loading = ref(false)
const permissionDrawerVisible = ref(false)
const userListVisible = ref(false)
const userListLoading = ref(false)
const viewMode = ref<'card' | 'table'>('card')
const searchKeyword = ref('')
const levelFilter = ref<string>()

const roleList = ref<Role[]>([])
const selectedRole = ref<Role | null>(null)
const currentRoleForUsers = ref<Role | null>(null)
const roleUsers = ref<User[]>([])

// 统计数据
const stats = reactive({
  totalRoles: 0,
  totalUsers: 0,
  totalPermissions: 0,
  configuredRoles: 0
})

// 权限级别范围
const levelRanges = [
  { value: '1-2', label: 'L1-2 基础' },
  { value: '3-4', label: 'L3-4 业务' },
  { value: '5-6', label: 'L5-6 管理' },
  { value: '7-8', label: 'L7-8 系统' },
  { value: '9-10', label: 'L9-10 超级' }
]

// 表格列定义
const tableColumns = [
  {
    title: '角色名称',
    dataIndex: 'display_name',
    key: 'display_name',
    width: 200
  },
  {
    title: '权限级别',
    dataIndex: 'level',
    key: 'level',
    width: 100
  },
  {
    title: '用户数量',
    dataIndex: 'user_count',
    key: 'user_count',
    width: 100
  },
  {
    title: '权限数量',
    key: 'permission_count',
    width: 100
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right'
  }
]

// 用户列表列定义
const userColumns = [
  {
    title: '用户',
    dataIndex: 'real_name',
    key: 'real_name'
  },
  {
    title: '部门',
    dataIndex: 'department_name',
    key: 'department_name'
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email'
  },
  {
    title: '最后登录',
    dataIndex: 'last_login',
    key: 'last_login'
  },
  {
    title: '状态',
    dataIndex: 'is_active',
    key: 'is_active'
  }
]

// 筛选后的角色列表
const filteredRoles = computed(() => {
  let filtered = roleList.value

  // 关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(role => 
      role.display_name.toLowerCase().includes(keyword) ||
      role.name.toLowerCase().includes(keyword) ||
      role.description.toLowerCase().includes(keyword)
    )
  }

  // 级别筛选
  if (levelFilter.value) {
    const [min, max] = levelFilter.value.split('-').map(Number)
    filtered = filtered.filter(role => 
      role.level >= min && role.level <= max
    )
  }

  return filtered
})

// 加载角色列表
const loadRoles = async () => {
  loading.value = true
  try {
    const roles = await getRoles()
    roleList.value = roles
    
    // 更新统计数据
    stats.totalRoles = roles.length
    stats.totalUsers = roles.reduce((sum, role) => sum + (role.user_count || 0), 0)
    stats.configuredRoles = roles.filter(role => 
      role.permissions && Object.keys(role.permissions).length > 0
    ).length
    stats.totalPermissions = 156 // 预设权限总数
    
  } catch (error) {
    message.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

// 打开权限配置编辑器
const openPermissionEditor = async (role: Role) => {
  selectedRole.value = role
  permissionDrawerVisible.value = true
}

// 关闭权限配置编辑器
const closePermissionEditor = () => {
  permissionDrawerVisible.value = false
  selectedRole.value = null
}

// 保存权限配置
const savePermissions = async (permissions: any) => {
  if (!selectedRole.value) return
  
  try {
    await updateRolePermissions(selectedRole.value.name, { permissions })
    message.success('权限配置保存成功')
    closePermissionEditor()
    loadRoles() // 重新加载数据
  } catch (error) {
    message.error('保存权限配置失败')
  }
}

// 查看角色用户
const viewRoleUsers = async (role: Role) => {
  currentRoleForUsers.value = role
  userListLoading.value = true
  userListVisible.value = true
  
  try {
    const response = await getRoleUsers(role.name)
    roleUsers.value = response.users
  } catch (error) {
    console.error('加载用户列表失败:', error)
    message.error('加载用户列表失败')
  } finally {
    userListLoading.value = false
  }
}

// 编辑角色
const editRole = (role: Role) => {
  message.info('角色编辑功能开发中')
}

// 复制角色
const duplicateRole = (role: Role) => {
  message.info('角色复制功能开发中')
}

// 导出角色配置
const exportRoleConfig = (role: Role) => {
  const config = JSON.stringify(role, null, 2)
  const blob = new Blob([config], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${role.name}_config.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('角色配置已导出')
}

// 删除角色
const deleteRole = (role: Role) => {
  if (role.is_system) {
    message.warning('系统内置角色不允许删除')
    return
  }
  message.info('角色删除功能开发中')
}

// 新建角色
const showCreateRole = () => {
  message.info('新建角色功能开发中')
}

// 搜索处理
const handleSearch = () => {
  // 筛选逻辑在计算属性中处理
}

// 刷新数据
const refreshData = () => {
  loadRoles()
}

// 获取角色颜色
const getRoleColor = (roleName: string) => {
  const colors = {
    super_admin: '#f5222d',
    admin: '#fa541c',
    manager: '#faad14',
    sales: '#52c41a',
    teacher: '#1890ff',
    viewer: '#722ed1'
  }
  return colors[roleName as keyof typeof colors] || '#666666'
}

// 获取角色图标
const getRoleIcon = (roleName: string) => {
  const icons = {
    super_admin: CrownOutlined,
    admin: SafetyCertificateOutlined,
    manager: TeamOutlined,
    sales: ShopOutlined,
    teacher: ReadOutlined,
    viewer: EyeOutlined
  }
  return icons[roleName as keyof typeof icons] || SafetyCertificateOutlined
}

// 获取级别颜色
const getLevelColor = (level: number) => {
  if (level >= 9) return 'red'
  if (level >= 7) return 'orange'
  if (level >= 5) return 'blue'
  if (level >= 3) return 'green'
  return 'default'
}

// 获取权限数量
const getPermissionCount = (role: Role) => {
  if (!role.permissions) return 0
  
  const countPermissions = (perms: any, key?: string): number => {
    let total = 0
    
    if (Array.isArray(perms)) {
      // 数组直接返回长度
      return perms.length
    }
    
    if (typeof perms === 'object' && perms !== null) {
      // 对于对象，遍历其属性
      Object.entries(perms).forEach(([childKey, value]) => {
        if (Array.isArray(value)) {
          // 数组值，计算长度
          total += value.length
        } else if (typeof value === 'object' && value !== null) {
          // 嵌套对象，递归计算
          total += countPermissions(value, childKey)
        } else if (typeof value === 'boolean' && value) {
          // 布尔值为true时计数
          total++
        } else if (typeof value === 'string' && value) {
          // 非空字符串计数
          total++
        }
      })
    }
    
    return total
  }
  
  return countPermissions(role.permissions)
}

// 初始化
onMounted(() => {
  loadRoles()
})
</script>

<style scoped lang="less">
.role-permission-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
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
      }
      
      .title-desc {
        color: #8c8c8c;
        font-size: 14px;
        margin-left: 8px;
      }
    }
  }
  
  .stats-dashboard {
    margin-bottom: 24px;
    
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;
      }
      
      .stat-content {
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
  }
  
  .main-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
    
    .role-cards {
      min-height: 400px;
    }
    
    .role-table {
      .role-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .name-info {
          .name {
            font-weight: 500;
            color: #262626;
          }
          
          .code {
            font-size: 12px;
            color: #8c8c8c;
          }
        }
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .info {
          .username {
            font-size: 12px;
            color: #8c8c8c;
          }
        }
      }
    }
  }
}
</style>