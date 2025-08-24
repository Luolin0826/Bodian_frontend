<template>
  <div class="role-page">
    <div class="page-header">
      <div class="page-title">
        <SafetyCertificateOutlined class="title-icon" />
        <h1>角色权限</h1>
        <span class="title-desc">角色定义与权限配置</span>
      </div>
    </div>

    <!-- 统计仪表盘 -->
    <div class="stats-dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <SafetyCertificateOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ roleStats.total }}</div>
            <div class="stat-label">系统角色</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <UserOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ roleStats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <KeyOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ roleStats.totalPermissions }}</div>
            <div class="stat-label">权限点数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <SettingOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ roleStats.configuredRoles }}</div>
            <div class="stat-label">已配置角色</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-content">
      <!-- 角色列表 -->
      <div class="role-list">
        <a-row :gutter="24">
          <a-col
            v-for="role in roleList"
            :key="role.name"
            :xs="24"
            :sm="12"
            :lg="8"
            :xl="6"
            class="role-col"
          >
            <div class="role-card" :class="{ 'role-card-selected': selectedRole?.name === role.name }">
              <div class="role-header">
                <div class="role-title">
                  <a-avatar :style="{ backgroundColor: getRoleColor(role.name) }">
                    {{ role.display_name[0] }}
                  </a-avatar>
                  <div class="role-info">
                    <h4>{{ role.display_name }}</h4>
                    <p>{{ role.description }}</p>
                  </div>
                </div>
                <a-dropdown>
                  <a class="role-action" @click.prevent>
                    <MoreOutlined />
                  </a>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="selectRole(role)">
                        <SettingOutlined />
                        配置权限
                      </a-menu-item>
                      <a-menu-item @click="viewRoleUsers(role)">
                        <UserOutlined />
                        查看用户
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
              
              <div class="role-stats">
                <div class="stat-item">
                  <span class="stat-label">用户数量</span>
                  <span class="stat-value">{{ role.user_count || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">权限等级</span>
                  <a-tag :color="getLevelColor(role.level)">
                    Level {{ role.level }}
                  </a-tag>
                </div>
              </div>
              
              <div class="role-actions">
                <a-button type="primary" block @click="selectRole(role)">
                  <SettingOutlined />
                  配置权限
                </a-button>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </a-card>

    <!-- 权限配置面板 -->
    <a-card v-if="selectedRole" class="permission-panel" title="权限配置">
      <template #extra>
        <div class="panel-extra">
          <div class="current-role-info">
            <a-avatar :style="{ backgroundColor: getRoleColor(selectedRole.name) }" size="small">
              {{ selectedRole.display_name[0] }}
            </a-avatar>
            <span class="role-name">{{ selectedRole.display_name }}</span>
            <a-tag :color="getRoleColor(selectedRole.name)" size="small">{{ selectedRole.name }}</a-tag>
          </div>
          <a-button type="primary" @click="savePermissions" :loading="saveLoading">
            <SaveOutlined />
            保存配置
          </a-button>
        </div>
      </template>
      
      <div class="permission-content">
        <!-- 权限配置加载状态 -->
        <a-spin :spinning="permissionLoading" tip="正在加载权限配置...">
          <div class="permission-content-wrapper" :class="{ 'content-loading': permissionLoading }">
            <a-tabs v-model:activeKey="activePermissionTab" type="card">
          <a-tab-pane key="menu" tab="菜单权限">
            <div class="permission-section">
              <div class="section-header">
                <h4>菜单访问权限</h4>
                <p>控制用户可以访问的菜单页面</p>
              </div>
              
              <a-tree
                v-model:checkedKeys="menuPermissions"
                :tree-data="menuTreeData"
                checkable
                :default-expand-all="true"
                :field-names="{ title: 'title', key: 'key', children: 'children' }"
              >
                <template #title="{ title, description }">
                  <div class="tree-node-title">
                    <span>{{ title }}</span>
                    <span v-if="description" class="node-desc">{{ description }}</span>
                  </div>
                </template>
              </a-tree>
            </div>
          </a-tab-pane>
          
          <a-tab-pane key="operation" tab="操作权限">
            <div class="permission-section">
              <div class="section-header">
                <h4>功能操作权限</h4>
                <p>控制用户可以执行的具体操作</p>
              </div>
              
              <div class="operation-permissions">
                <div v-for="module in displayOperationModules" :key="module.key" class="module-section">
                  <div class="module-header">
                    <h5>{{ module.title }}</h5>
                    <a-checkbox
                      :indeterminate="getModuleIndeterminate(module.key)"
                      :checked="getModuleChecked(module.key)"
                      @change="onModuleChange($event, module.key)"
                    >
                      全选
                    </a-checkbox>
                  </div>
                  
                  <a-checkbox-group
                    v-model:value="operationPermissions[module.key]"
                    class="permission-group"
                  >
                    <a-row>
                      <a-col
                        v-for="permission in module.permissions"
                        :key="permission.key"
                        :span="8"
                        class="permission-item"
                      >
                        <a-checkbox :value="permission.key">
                          <div class="permission-info">
                            <span class="permission-name">{{ permission.name }}</span>
                            <span class="permission-desc">{{ permission.description }}</span>
                          </div>
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
            </div>
          </a-tab-pane>
          
          <a-tab-pane key="data" tab="数据权限">
            <div class="permission-section">
              <div class="section-header">
                <h4>数据访问权限</h4>
                <p>控制用户可以查看的数据范围</p>
              </div>
              
              <div class="data-permissions">
                <div class="data-scope-section">
                  <h5>数据查看范围</h5>
                  <a-radio-group v-model:value="dataPermissions.scope" class="scope-group">
                    <a-radio value="all">全部数据</a-radio>
                    <a-radio value="department">本部门数据</a-radio>
                    <a-radio value="self">仅本人数据</a-radio>
                    <a-radio value="custom">自定义范围</a-radio>
                  </a-radio-group>
                </div>
                
                <div v-if="dataPermissions.scope === 'custom'" class="custom-scope-section">
                  <h5>自定义数据范围</h5>
                  <a-checkbox-group v-model:value="dataPermissions.custom_scopes">
                    <a-row>
                      <a-col :span="8">
                        <a-checkbox value="student_data">学生数据</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="sales_data">销售数据</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="financial_data">财务数据</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="system_data">系统数据</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="log_data">日志数据</a-checkbox>
                      </a-col>
                      <a-col :span="8">
                        <a-checkbox value="report_data">报表数据</a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
                
                <div class="sensitive-data-section">
                  <h5>敏感数据权限</h5>
                  <a-checkbox-group v-model:value="dataPermissions.sensitive">
                    <a-row>
                      <a-col :span="12">
                        <a-checkbox value="phone">查看手机号</a-checkbox>
                      </a-col>
                      <a-col :span="12">
                        <a-checkbox value="id_card">查看身份证</a-checkbox>
                      </a-col>
                      <a-col :span="12">
                        <a-checkbox value="address">查看详细地址</a-checkbox>
                      </a-col>
                      <a-col :span="12">
                        <a-checkbox value="financial">查看财务信息</a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
            </div>
          </a-tab-pane>
            </a-tabs>
          </div>
        </a-spin>
      </div>
    </a-card>

    <!-- 角色用户列表弹窗 -->
    <a-modal
      v-model:open="userListVisible"
      :title="`${currentRoleForUsers?.display_name} - 用户列表`"
      width="800px"
      :footer="null"
    >
      <a-table
        :columns="userColumns"
        :data-source="roleUsers"
        :loading="userListLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'real_name'">
            <div class="user-info">
              <a-avatar :src="record.avatar">{{ record.real_name?.[0] }}</a-avatar>
              <div class="user-details">
                <div class="user-name">{{ record.real_name }}</div>
                <div class="user-username">@{{ record.username }}</div>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { 
  SafetyCertificateOutlined,
  UserOutlined,
  KeyOutlined,
  SettingOutlined,
  MoreOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import {
  getRoles,
  getRolePermissions,
  updateRolePermissions,
  getRoleUsers,
  getPermissionTree,
  type Role,
  type User,
  type PermissionNode
} from '@/api/system'

// 响应式数据
const loading = ref(false)
const saveLoading = ref(false)
const userListLoading = ref(false)
const userListVisible = ref(false)
const permissionLoading = ref(false)

const roleList = ref<Role[]>([])
const selectedRole = ref<Role | null>(null)
const currentRoleForUsers = ref<Role | null>(null)
const roleUsers = ref<User[]>([])
const activePermissionTab = ref('menu')

// 统计数据
const roleStats = reactive({
  total: 0,
  totalUsers: 0,
  totalPermissions: 0,
  configuredRoles: 0
})

// 权限数据
const menuPermissions = ref<string[]>([])
const operationPermissions = reactive<Record<string, string[]>>({})
const dataPermissions = reactive({
  scope: 'department',
  custom_scopes: [],
  sensitive: []
})

// 菜单树数据 - 基于实际路由结构
const menuTreeData = [
  {
    title: '工作台',
    key: '/dashboard',
    description: '系统工作台首页'
  },
  {
    title: '客户管理',
    key: '/customer',
    description: '学生客户管理模块',
    children: [
      { title: '客户列表', key: '/customer/list', description: '查看和管理客户列表' },
      { title: '跟进管理', key: '/customer/follow', description: '客户跟进记录管理' },
      { title: '跟进提醒', key: '/customer/reminders', description: '客户跟进提醒功能' },
      { title: '跟进分析', key: '/customer/analytics', description: '客户跟进数据分析' }
    ]
  },
  {
    title: '销售管理',
    key: '/sales',
    description: '销售业务管理模块',
    children: [
      { title: '销售记录', key: '/sales/record', description: '销售记录管理' },
      { title: '销售统计', key: '/sales/stats', description: '销售数据统计分析' }
    ]
  },
  {
    title: '话术库',
    key: '/script',
    description: '营销话术库管理'
  },
  {
    title: '知识库',
    key: '/knowledge',
    description: '企业知识库管理'
  },
  {
    title: '数查一点通',
    key: '/data-query',
    description: '电网录取信息查询和分析工具'
  },
  {
    title: '用户中心',
    key: '/user-center',
    description: '个人用户中心',
    children: [
      { title: '个人信息', key: '/user-center/profile', description: '个人资料管理' },
      { title: '偏好设置', key: '/user-center/preferences', description: '个人偏好设置' },
      { title: '消息通知', key: '/user-center/notifications', description: '消息通知管理' },
      { title: '安全设置', key: '/user-center/security', description: '账户安全设置' },
      { title: '登录日志', key: '/user-center/login-logs', description: '登录历史记录' }
    ]
  },
  {
    title: '系统设置',
    key: '/system',
    description: '系统管理设置',
    children: [
      { title: '用户管理', key: '/system/user', description: '系统用户账户管理' },
      { title: '部门管理', key: '/system/department', description: '组织部门结构管理' },
      { title: '角色权限', key: '/system/role', description: '系统角色权限配置' },
      { title: '操作日志', key: '/system/log', description: '系统操作日志查看' },
      { title: 'API测试', key: '/system/test-api', description: '系统API接口测试' }
    ]
  }
]

// 操作权限模块 - 基于实际业务功能
const operationModules = [
  {
    key: 'dashboard',
    title: '工作台',
    permissions: [
      { key: 'dashboard.view_stats', name: '查看统计', description: '查看工作台统计数据' },
      { key: 'dashboard.export_report', name: '导出报表', description: '导出工作台报表' }
    ]
  },
  {
    key: 'customer',
    title: '客户管理',
    permissions: [
      { key: 'customer.create', name: '新增客户', description: '创建新客户记录' },
      { key: 'customer.edit', name: '编辑客户', description: '修改客户基本信息' },
      { key: 'customer.delete', name: '删除客户', description: '删除客户记录' },
      { key: 'customer.view_sensitive', name: '查看敏感信息', description: '查看客户手机号等敏感信息' },
      { key: 'customer.export', name: '导出客户', description: '导出客户数据' },
      { key: 'customer.import', name: '批量导入', description: '批量导入客户数据' },
      { key: 'customer.assign', name: '分配客户', description: '分配客户给其他销售' },
      { key: 'customer.follow_create', name: '新增跟进', description: '创建客户跟进记录' },
      { key: 'customer.follow_edit', name: '编辑跟进', description: '修改跟进记录' },
      { key: 'customer.follow_delete', name: '删除跟进', description: '删除跟进记录' },
      { key: 'customer.reminder_manage', name: '提醒管理', description: '管理跟进提醒' },
      { key: 'customer.analytics_view', name: '查看分析', description: '查看客户跟进分析报表' }
    ]
  },
  {
    key: 'sales',
    title: '销售管理',
    permissions: [
      { key: 'sales.record_create', name: '新增记录', description: '创建销售记录' },
      { key: 'sales.record_edit', name: '编辑记录', description: '修改销售记录' },
      { key: 'sales.record_delete', name: '删除记录', description: '删除销售记录' },
      { key: 'sales.record_approve', name: '审核记录', description: '审核销售记录' },
      { key: 'sales.stats_view', name: '查看统计', description: '查看销售统计数据' },
      { key: 'sales.stats_export', name: '导出统计', description: '导出销售统计报表' },
      { key: 'sales.commission_view', name: '查看提成', description: '查看销售提成信息' },
      { key: 'sales.commission_manage', name: '提成管理', description: '管理销售提成设置' }
    ]
  },
  {
    key: 'script',
    title: '话术库',
    permissions: [
      { key: 'script.create', name: '新增话术', description: '创建新话术条目' },
      { key: 'script.edit', name: '编辑话术', description: '修改话术内容' },
      { key: 'script.delete', name: '删除话术', description: '删除话术条目' },
      { key: 'script.copy', name: '复制话术', description: '复制话术内容' },
      { key: 'script.category_manage', name: '分类管理', description: '管理话术分类' },
      { key: 'script.export', name: '导出话术', description: '导出话术数据' }
    ]
  },
  {
    key: 'knowledge',
    title: '知识库',
    permissions: [
      { key: 'knowledge.create', name: '新增知识', description: '创建知识条目' },
      { key: 'knowledge.edit', name: '编辑知识', description: '修改知识内容' },
      { key: 'knowledge.delete', name: '删除知识', description: '删除知识条目' },
      { key: 'knowledge.copy', name: '复制知识', description: '复制知识内容' },
      { key: 'knowledge.publish', name: '发布管理', description: '管理知识发布状态' },
      { key: 'knowledge.category_manage', name: '分类管理', description: '管理知识分类' },
      { key: 'knowledge.audit', name: '内容审核', description: '审核知识内容' },
      { key: 'knowledge.export', name: '导出知识', description: '导出知识数据' }
    ]
  },
  {
    key: 'system',
    title: '系统管理',
    permissions: [
      { key: 'system.user_create', name: '新增用户', description: '创建系统用户' },
      { key: 'system.user_edit', name: '编辑用户', description: '修改用户信息' },
      { key: 'system.user_delete', name: '删除用户', description: '删除系统用户' },
      { key: 'system.user_reset_password', name: '重置密码', description: '重置用户密码' },
      { key: 'system.dept_create', name: '新增部门', description: '创建组织部门' },
      { key: 'system.dept_edit', name: '编辑部门', description: '修改部门信息' },
      { key: 'system.dept_delete', name: '删除部门', description: '删除组织部门' },
      { key: 'system.role_create', name: '新增角色', description: '创建系统角色' },
      { key: 'system.role_edit', name: '编辑角色', description: '修改角色信息' },
      { key: 'system.role_delete', name: '删除角色', description: '删除系统角色' },
      { key: 'system.role_permission', name: '权限配置', description: '配置角色权限' },
      { key: 'system.log_view', name: '查看日志', description: '查看系统操作日志' },
      { key: 'system.log_export', name: '导出日志', description: '导出操作日志' },
      { key: 'system.config', name: '系统配置', description: '修改系统参数配置' },
      { key: 'system.backup', name: '数据备份', description: '执行系统数据备份' }
    ]
  }
]

// 用户列表表格列
const userColumns = [
  { title: '用户信息', dataIndex: 'real_name', key: 'real_name', width: 200 },
  { title: '工号', dataIndex: 'employee_no', key: 'employee_no', width: 120 },
  { title: '部门', dataIndex: 'department_name', key: 'department_name', width: 150 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80 },
  { title: '最后登录', dataIndex: 'last_login', key: 'last_login', width: 150 }
]

// 获取角色颜色
const getRoleColor = (roleName: string) => {
  const colorMap: Record<string, string> = {
    super_admin: '#ff4d4f',
    admin: '#fa8c16',
    manager: '#1890ff',
    sales: '#52c41a',
    teacher: '#722ed1',
    viewer: '#8c8c8c'
  }
  return colorMap[roleName] || '#1890ff'
}

// 动态生成操作模块显示列表
const displayOperationModules = computed(() => {
  const modules = []
  
  // 获取所有后端返回的操作权限模块
  const backendModules = Object.keys(operationPermissions)
  
  // 如果后端没有返回模块或选项卡切换时数据为空，使用硬编码模块作为备用
  if (backendModules.length === 0) {
    return operationModules.map(module => ({
      ...module,
      // 确保每个模块在operationPermissions中有对应的数组
      permissions: module.permissions.map(perm => {
        // 初始化模块权限数组（如果不存在）
        if (!operationPermissions[module.key]) {
          operationPermissions[module.key] = []
        }
        return perm
      })
    }))
  }
  
  // 为每个模块生成显示信息
  for (const moduleKey of backendModules) {
    // 查找是否有硬编码的模块配置
    const hardcodedModule = operationModules.find(m => m.key === moduleKey)
    
    if (hardcodedModule) {
      // 使用硬编码配置
      modules.push({
        ...hardcodedModule,
        // 确保权限数组存在
        permissions: hardcodedModule.permissions.map(perm => ({
          ...perm,
          // 这里可以添加动态状态检查
        }))
      })
    } else {
      // 动态生成模块配置
      const permissions = operationPermissions[moduleKey] || []
      modules.push({
        key: moduleKey,
        title: getModuleTitle(moduleKey),
        permissions: permissions.map(permKey => ({
          key: permKey,
          name: getPermissionName(permKey),
          description: `${moduleKey}模块的${permKey}权限`
        }))
      })
    }
  }
  
  return modules
})

// 获取模块标题
const getModuleTitle = (moduleKey: string) => {
  const titles = {
    auth: '认证管理',
    user: '用户管理', 
    department: '部门管理',
    role: '角色管理',
    log: '日志管理',
    script: '脚本管理',
    stats: '统计分析',
    data: '数据管理',
    customer: '客户管理',
    sales: '销售管理',
    knowledge: '知识库',
    system: '系统管理'
  }
  return titles[moduleKey as keyof typeof titles] || moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)
}

// 获取权限名称
const getPermissionName = (permKey: string) => {
  const names = {
    create: '创建',
    edit: '编辑', 
    delete: '删除',
    view: '查看',
    export: '导出',
    import: '导入',
    assign: '分配',
    batch_edit: '批量编辑',
    batch_delete: '批量删除',
    view_sensitive: '查看敏感信息',
    login: '登录',
    logout: '登出',
    refresh_token: '刷新令牌',
    manage_sessions: '会话管理',
    reset_password: '重置密码',
    change_password: '修改密码',
    change_status: '修改状态',
    transfer: '转移',
    backup: '备份',
    restore: '恢复',
    analyze: '分析',
    monitor: '监控',
    alert: '告警',
    execute: '执行',
    debug: '调试',
    publish: '发布',
    review: '审核',
    config: '配置',
    clear_log: '清理日志',
    maintenance: '维护',
    update: '更新',
    edit_permissions: '编辑权限',
    assign_users: '分配用户',
    view_all: '查看全部',
    copy: '复制',
    migrate: '迁移',
    sync: '同步',
    validate: '验证',
    cleanup: '清理',
    dashboard: '仪表板',
    report: '报表',
    chart: '图表',
    custom_query: '自定义查询'
  }
  return names[permKey as keyof typeof names] || permKey.charAt(0).toUpperCase() + permKey.slice(1)
}

// 获取等级颜色
const getLevelColor = (level: number) => {
  if (level <= 2) return 'red'
  if (level <= 3) return 'orange'
  if (level <= 4) return 'blue'
  return 'default'
}

// 获取模块选中状态
const getModuleChecked = (moduleKey: string) => {
  const module = displayOperationModules.value.find(m => m.key === moduleKey)
  if (!module) return false
  const modulePermissions = module.permissions || []
  const selectedPermissions = operationPermissions[moduleKey] || []
  return modulePermissions.length > 0 && selectedPermissions.length === modulePermissions.length
}

// 获取模块半选状态
const getModuleIndeterminate = (moduleKey: string) => {
  const module = displayOperationModules.value.find(m => m.key === moduleKey)
  if (!module) return false
  const modulePermissions = module.permissions || []
  const selectedPermissions = operationPermissions[moduleKey] || []
  return selectedPermissions.length > 0 && selectedPermissions.length < modulePermissions.length
}

// 模块全选/取消全选
const onModuleChange = (e: any, moduleKey: string) => {
  const module = displayOperationModules.value.find(m => m.key === moduleKey)
  if (!module) return
  const modulePermissions = module.permissions || []
  if (e.target.checked) {
    operationPermissions[moduleKey] = modulePermissions.map(p => p.key)
  } else {
    operationPermissions[moduleKey] = []
  }
}

// 加载角色列表
const loadRoles = async () => {
  loading.value = true
  try {
    roleList.value = await getRoles()
    
    // 更新统计数据
    roleStats.total = roleList.value.length
    roleStats.totalUsers = roleList.value.reduce((sum, role) => sum + (role.user_count || 0), 0)
    roleStats.totalPermissions = menuTreeData.reduce((sum, menu) => {
      return sum + 1 + (menu.children?.length || 0)
    }, 0) + operationModules.reduce((sum, module) => sum + module.permissions.length, 0)
    roleStats.configuredRoles = roleList.value.filter(role => 
      Object.keys(role.permissions || {}).length > 0
    ).length
  } catch (error) {
    message.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

// 选择角色
const selectRole = async (role: Role) => {
  selectedRole.value = role
  permissionLoading.value = true
  
  try {
    const permissions = await getRolePermissions(role.name)
    
    // 设置菜单权限
    menuPermissions.value = permissions.menu || []
    
    // 重置操作权限对象
    Object.keys(operationPermissions).forEach(key => {
      delete operationPermissions[key]
    })
    
    // 设置操作权限 - 直接使用后端返回的所有操作权限
    console.log('🔍 后端返回的操作权限:', permissions.operation)
    const backendOperationPermissions = permissions.operation || {}
    
    // 如果后端返回了权限数据，使用后端数据
    if (Object.keys(backendOperationPermissions).length > 0) {
      Object.assign(operationPermissions, backendOperationPermissions)
    } else {
      // 如果后端没有返回权限数据，初始化为空数组以确保UI正常显示
      operationModules.forEach(module => {
        operationPermissions[module.key] = []
      })
    }
    console.log('✅ 操作权限设置完成:', operationPermissions)
    
    // 设置数据权限
    Object.assign(dataPermissions, {
      scope: permissions.data?.scope || 'department',
      custom_scopes: permissions.data?.custom_scopes || [],
      sensitive: permissions.data?.sensitive || []
    })
  } catch (error) {
    message.error('加载角色权限失败')
    // 出错时也要初始化操作权限，确保UI能显示
    operationModules.forEach(module => {
      operationPermissions[module.key] = []
    })
  } finally {
    // 添加延迟让用户能感受到切换动画
    setTimeout(() => {
      permissionLoading.value = false
    }, 300)
  }
}

// 查看角色用户
const viewRoleUsers = async (role: Role) => {
  currentRoleForUsers.value = role
  userListVisible.value = true
  userListLoading.value = true
  
  try {
    const response = await getRoleUsers(role.name)
    roleUsers.value = response.data || response
  } catch (error) {
    message.error('加载用户列表失败')
  } finally {
    userListLoading.value = false
  }
}

// 保存权限配置
const savePermissions = async () => {
  if (!selectedRole.value) return
  
  saveLoading.value = true
  try {
    const permissions = {
      menu: menuPermissions.value,
      operation: operationPermissions,
      data: dataPermissions
    }
    
    await updateRolePermissions(selectedRole.value.name, permissions)
    message.success('权限配置保存成功')
    
    // 重新加载角色列表
    loadRoles()
  } catch (error) {
    message.error('权限配置保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 初始化操作权限模块
const initializeOperationPermissions = () => {
  // 为所有硬编码模块初始化空数组，确保UI能正常显示
  operationModules.forEach(module => {
    if (!operationPermissions[module.key]) {
      operationPermissions[module.key] = []
    }
  })
}

// 初始化
onMounted(() => {
  // 先初始化操作权限模块
  initializeOperationPermissions()
  // 然后加载角色列表
  loadRoles()
})
</script>

<style scoped lang="less">
.role-page {
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
  }
  
  .title-desc {
    color: #8c8c8c;
    font-size: 14px;
    margin-left: 8px;
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
  margin-bottom: 24px;
}

// 角色卡片
.role-col {
  margin-bottom: 24px;
}

.role-card {
  position: relative;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  background: white;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
  }
  
  &.role-card-selected {
    border-color: #1890ff;
    background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
    box-shadow: 0 6px 20px rgba(24, 144, 255, 0.25);
    transform: translateY(-2px);
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #1890ff, #40a9ff);
      border-radius: 12px;
      z-index: -1;
      animation: selectedGlow 2s ease-in-out infinite alternate;
    }
  }
  
  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .role-title {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      
      .role-info {
        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #262626;
        }
        
        p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #8c8c8c;
          line-height: 1.4;
        }
      }
    }
    
    .role-action {
      color: #8c8c8c;
      font-size: 16px;
      
      &:hover {
        color: #1890ff;
      }
    }
  }
  
  .role-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .stat-label {
        font-size: 12px;
        color: #8c8c8c;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #262626;
      }
    }
  }
  
  .role-actions {
    margin-top: auto;
  }
}

// 权限配置面板
.panel-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .current-role-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(24, 144, 255, 0.08);
    border-radius: 20px;
    animation: roleSwitch 0.5s ease;
    
    .role-name {
      font-weight: 600;
      color: #262626;
    }
  }
}

@keyframes roleSwitch {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.permission-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  
  .panel-extra {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .role-name {
      font-weight: 600;
      color: #262626;
    }
  }
}

.permission-content {
  .permission-content-wrapper {
    transition: all 0.3s ease;
    
    &.content-loading {
      opacity: 0.7;
      transform: translateY(10px);
    }
  }
  .permission-section {
    .section-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
      
      h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #262626;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #8c8c8c;
      }
    }
  }
}

// 树节点标题
.tree-node-title {
  display: flex;
  flex-direction: column;
  
  .node-desc {
    font-size: 12px;
    color: #8c8c8c;
    margin-top: 2px;
  }
}

// 操作权限
.operation-permissions {
  .module-section {
    margin-bottom: 32px;
    
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
      
      h5 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #262626;
      }
    }
    
    .permission-group {
      width: 100%;
      
      .permission-item {
        margin-bottom: 16px;
        
        .permission-info {
          display: flex;
          flex-direction: column;
          
          .permission-name {
            font-size: 14px;
            color: #262626;
            font-weight: 500;
          }
          
          .permission-desc {
            font-size: 12px;
            color: #8c8c8c;
            margin-top: 2px;
          }
        }
      }
    }
  }
}

// 数据权限
.data-permissions {
  .data-scope-section,
  .custom-scope-section,
  .sensitive-data-section {
    margin-bottom: 24px;
    
    h5 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #262626;
    }
    
    .scope-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
}

// 用户信息
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

// 选中角色发光动画
@keyframes selectedGlow {
  from {
    opacity: 0.3;
  }
  to {
    opacity: 0.6;
  }
}

// 内容切换动画
@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>