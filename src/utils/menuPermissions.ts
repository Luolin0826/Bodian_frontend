/**
 * 菜单权限配置工具
 * 用于管理系统菜单权限，特别是新增页面时的权限配置
 */

export interface MenuPermissionNode {
  key: string
  title: string
  description?: string
  icon?: string
  level?: 'low' | 'medium' | 'high'
  risk?: 'safe' | 'warning' | 'danger'
  category?: string
  path?: string // 对应路由路径
  children?: MenuPermissionNode[]
}

/**
 * 系统默认菜单权限配置
 * 当后端API未返回完整权限树时，使用此配置作为备用
 */
export const DEFAULT_MENU_PERMISSIONS: MenuPermissionNode[] = [
  {
    key: 'dashboard',
    title: '工作台',
    description: '系统主页和概览信息',
    icon: 'DashboardOutlined',
    level: 'low',
    risk: 'safe',
    category: '基础功能',
    path: '/dashboard'
  },
  {
    key: 'customer',
    title: '客户管理',
    description: '客户信息管理和维护',
    icon: 'TeamOutlined',
    level: 'medium',
    risk: 'safe',
    category: '业务管理',
    path: '/customer',
    children: [
      {
        key: 'customer-list',
        title: '客户列表',
        description: '查看和管理客户信息',
        path: '/customer/list',
        level: 'low',
        risk: 'safe'
      },
      {
        key: 'customer-follow',
        title: '跟进管理',
        description: '客户跟进记录管理',
        path: '/customer/follow',
        level: 'medium',
        risk: 'safe'
      },
      {
        key: 'customer-reminders',
        title: '跟进提醒',
        description: '客户跟进提醒设置',
        path: '/customer/reminders',
        level: 'low',
        risk: 'safe'
      },
      {
        key: 'customer-analytics',
        title: '跟进分析',
        description: '客户跟进数据分析',
        path: '/customer/analytics',
        level: 'low',
        risk: 'safe'
      }
    ]
  },
  {
    key: 'sales',
    title: '销售管理',
    description: '销售数据和统计管理',
    icon: 'ShoppingOutlined',
    level: 'medium',
    risk: 'safe',
    category: '业务管理',
    path: '/sales',
    children: [
      {
        key: 'sales-record',
        title: '销售记录',
        description: '销售记录查看和管理',
        path: '/sales/record',
        level: 'medium',
        risk: 'safe'
      },
      {
        key: 'sales-stats',
        title: '销售统计',
        description: '销售数据统计分析',
        path: '/sales/stats',
        level: 'low',
        risk: 'safe'
      }
    ]
  },
  {
    key: 'script',
    title: '话术库',
    description: '销售话术管理和维护',
    icon: 'FileTextOutlined',
    level: 'low',
    risk: 'safe',
    category: '工具辅助',
    path: '/script'
  },
  {
    key: 'knowledge',
    title: '知识库',
    description: '知识文档管理和查询',
    icon: 'BookOutlined',
    level: 'low',
    risk: 'safe',
    category: '工具辅助',
    path: '/knowledge'
  },
  {
    key: 'data-query',
    title: '数查一点通',
    description: '电网录取信息查询和分析工具',
    icon: 'SearchOutlined',
    level: 'medium',
    risk: 'safe',
    category: '数据分析',
    path: '/data-query'
  },
  {
    key: 'user-center',
    title: '用户中心',
    description: '个人信息和设置管理',
    icon: 'ProfileOutlined',
    level: 'low',
    risk: 'safe',
    category: '个人管理',
    path: '/user-center',
    children: [
      {
        key: 'user-profile',
        title: '个人信息',
        description: '查看和编辑个人信息',
        path: '/user-center/profile',
        level: 'low',
        risk: 'safe'
      },
      {
        key: 'user-preferences',
        title: '偏好设置',
        description: '个人偏好和界面设置',
        path: '/user-center/preferences',
        level: 'low',
        risk: 'safe'
      },
      {
        key: 'user-notifications',
        title: '消息通知',
        description: '系统消息和通知管理',
        path: '/user-center/notifications',
        level: 'low',
        risk: 'safe'
      },
      {
        key: 'user-security',
        title: '安全设置',
        description: '账户安全和密码管理',
        path: '/user-center/security',
        level: 'medium',
        risk: 'warning'
      },
      {
        key: 'user-login-logs',
        title: '登录日志',
        description: '账户登录记录查看',
        path: '/user-center/login-logs',
        level: 'low',
        risk: 'safe'
      },
      {
        key: 'user-devices',
        title: '设备管理',
        description: '登录设备管理',
        path: '/user-center/devices',
        level: 'medium',
        risk: 'warning'
      }
    ]
  },
  {
    key: 'system',
    title: '系统设置',
    description: '系统管理和配置',
    icon: 'SettingOutlined',
    level: 'high',
    risk: 'danger',
    category: '系统管理',
    path: '/system',
    children: [
      {
        key: 'system-user',
        title: '用户管理',
        description: '系统用户管理和维护',
        path: '/system/user',
        level: 'high',
        risk: 'danger'
      },
      {
        key: 'system-department',
        title: '部门管理',
        description: '组织架构管理',
        path: '/system/department',
        level: 'high',
        risk: 'warning'
      },
      {
        key: 'system-role',
        title: '角色权限',
        description: '角色和权限管理',
        path: '/system/role',
        level: 'high',
        risk: 'danger'
      },
      {
        key: 'system-log',
        title: '操作日志',
        description: '系统操作日志查看',
        path: '/system/log',
        level: 'medium',
        risk: 'safe'
      }
    ]
  }
]

/**
 * 角色默认权限配置
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'dashboard', 'customer', 'customer-list', 'customer-follow', 'customer-reminders', 'customer-analytics',
    'sales', 'sales-record', 'sales-stats', 'script', 'knowledge', 'data-query',
    'user-center', 'user-profile', 'user-preferences', 'user-notifications', 'user-security', 'user-login-logs', 'user-devices',
    'system', 'system-user', 'system-department', 'system-role', 'system-log'
  ],
  admin: [
    'dashboard', 'customer', 'customer-list', 'customer-follow', 'customer-reminders', 'customer-analytics',
    'sales', 'sales-record', 'sales-stats', 'script', 'knowledge', 'data-query',
    'user-center', 'user-profile', 'user-preferences', 'user-notifications', 'user-security', 'user-login-logs', 'user-devices',
    'system', 'system-user', 'system-department', 'system-role', 'system-log'
  ],
  manager: [
    'dashboard', 'customer', 'customer-list', 'customer-follow', 'customer-reminders', 'customer-analytics',
    'sales', 'sales-record', 'sales-stats', 'script', 'knowledge', 'data-query',
    'user-center', 'user-profile', 'user-preferences', 'user-notifications', 'user-security', 'user-login-logs'
  ],
  sales: [
    'dashboard', 'customer', 'customer-list', 'customer-follow', 'customer-reminders',
    'sales', 'sales-record', 'script', 'knowledge', 'data-query',
    'user-center', 'user-profile', 'user-preferences', 'user-notifications'
  ],
  teacher: [
    'dashboard', 'customer', 'customer-list', 'script', 'knowledge', 'data-query',
    'user-center', 'user-profile', 'user-preferences', 'user-notifications'
  ],
  viewer: [
    'dashboard', 'script', 'knowledge', 'data-query',
    'user-center', 'user-profile', 'user-preferences'
  ]
}

/**
 * 根据路由路径获取对应的权限key
 */
export const getPermissionKeyByPath = (path: string): string | null => {
  const findKey = (nodes: MenuPermissionNode[], targetPath: string): string | null => {
    for (const node of nodes) {
      if (node.path === targetPath) {
        return node.key
      }
      if (node.children) {
        const found = findKey(node.children, targetPath)
        if (found) return found
      }
    }
    return null
  }
  
  return findKey(DEFAULT_MENU_PERMISSIONS, path)
}

/**
 * 根据权限key获取路径
 */
export const getPathByPermissionKey = (key: string): string | null => {
  const findPath = (nodes: MenuPermissionNode[], targetKey: string): string | null => {
    for (const node of nodes) {
      if (node.key === targetKey) {
        return node.path || null
      }
      if (node.children) {
        const found = findPath(node.children, targetKey)
        if (found) return found
      }
    }
    return null
  }
  
  return findPath(DEFAULT_MENU_PERMISSIONS, key)
}

/**
 * 获取所有权限节点的key
 */
export const getAllPermissionKeys = (): string[] => {
  const extractKeys = (nodes: MenuPermissionNode[]): string[] => {
    let keys: string[] = []
    nodes.forEach(node => {
      keys.push(node.key)
      if (node.children) {
        keys = keys.concat(extractKeys(node.children))
      }
    })
    return keys
  }
  
  return extractKeys(DEFAULT_MENU_PERMISSIONS)
}

/**
 * 检查权限依赖关系
 * 父级权限被选中时，子级权限是否应该自动选中
 */
export const getPermissionDependencies = (permissionKey: string): string[] => {
  const findNode = (nodes: MenuPermissionNode[], targetKey: string): MenuPermissionNode | null => {
    for (const node of nodes) {
      if (node.key === targetKey) {
        return node
      }
      if (node.children) {
        const found = findNode(node.children, targetKey)
        if (found) return found
      }
    }
    return null
  }
  
  const node = findNode(DEFAULT_MENU_PERMISSIONS, permissionKey)
  if (!node || !node.children) {
    return []
  }
  
  return node.children.map(child => child.key)
}

/**
 * 验证权限配置的完整性
 */
export const validatePermissions = (permissions: string[]): {
  valid: boolean
  missing: string[]
  invalid: string[]
  warnings: string[]
} => {
  const allValidKeys = getAllPermissionKeys()
  const missing: string[] = []
  const invalid: string[] = []
  const warnings: string[] = []
  
  // 检查无效的权限key
  permissions.forEach(key => {
    if (!allValidKeys.includes(key)) {
      invalid.push(key)
    }
  })
  
  // 检查依赖关系
  permissions.forEach(key => {
    const dependencies = getPermissionDependencies(key)
    dependencies.forEach(dep => {
      if (!permissions.includes(dep)) {
        missing.push(dep)
        warnings.push(`权限 ${key} 需要依赖权限 ${dep}`)
      }
    })
  })
  
  return {
    valid: invalid.length === 0,
    missing: [...new Set(missing)],
    invalid: [...new Set(invalid)],
    warnings
  }
}

/**
 * 为新用户角色推荐权限配置
 */
export const getRecommendedPermissions = (role: string): string[] => {
  return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.viewer
}

/**
 * 导出权限配置为JSON
 */
export const exportPermissionsConfig = () => {
  const config = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    menuPermissions: DEFAULT_MENU_PERMISSIONS,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    metadata: {
      totalPermissions: getAllPermissionKeys().length,
      roles: Object.keys(DEFAULT_ROLE_PERMISSIONS),
      lastUpdated: new Date().toISOString()
    }
  }
  
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'menu-permissions-config.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}