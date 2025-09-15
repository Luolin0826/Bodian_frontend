import { defineStore } from 'pinia'
import { authApi, type LoginParams, type LoginResponse } from '@/api/modules/auth'
import router from '@/router'
import { getPermissionKeyByPath, DEFAULT_ROLE_PERMISSIONS } from '@/utils/menuPermissions'

// 权限等级辅助函数
const getRoleLevel = (role: string): number => {
  const roleLevels: Record<string, number> = {
    'super_admin': 100,
    'admin': 90,
    'manager': 70,
    'sales': 50,
    'teacher': 40,
    'viewer': 10
  }
  return roleLevels[role] || 0
}

const getLevelValue = (level: 'low' | 'medium' | 'high'): number => {
  const levelValues = {
    'low': 10,
    'medium': 50,
    'high': 80
  }
  return levelValues[level]
}

// 数据权限接口定义
interface DataPermissions {
  scope: 'all' | 'department' | 'own' | 'custom'
  regional_permissions: string[]       // 区域权限
  department_permissions: string[]     // 部门权限
  customer_permissions: string[]       // 客户数据权限
  data_types: string[]                // 数据类型权限
  sensitive: string[]                 // 敏感数据权限
  custom_scopes?: string[]           // 自定义范围
  project_category_permissions: string[]  // 项目分类权限
}

interface UserState {
  token: string | null
  userInfo: LoginResponse['user'] | null
  permissions: {
    menu: string[]
    operation: Record<string, string[]>
    data: DataPermissions
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    const token = localStorage.getItem('token')
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
    const permissions = JSON.parse(localStorage.getItem('permissions') || '{"menu":[],"operation":{},"data":{"scope":"own","regional_permissions":[],"department_permissions":[],"customer_permissions":[],"data_types":[],"sensitive":[],"project_category_permissions":[]}}')
    
    console.log('🚀 UserStore 初始化状态:', {
      hasToken: !!token,
      userInfo,
      permissions,
      menuCount: permissions.menu?.length || 0
    })
    
    // 确保data权限结构完整
    if (!permissions.data || typeof permissions.data !== 'object') {
      permissions.data = {
        scope: 'own',
        regional_permissions: [],
        department_permissions: [],
        customer_permissions: [],
        data_types: [],
        sensitive: [],
        project_category_permissions: []
      }
    }
    
    // 确保项目分类权限字段存在（向后兼容）
    if (!permissions.data.project_category_permissions) {
      permissions.data.project_category_permissions = []
    }
    
    return {
      token,
      userInfo,
      permissions: {
        menu: permissions.menu || [],
        operation: permissions.operation || {},
        data: permissions.data
      }
    }
  },

  getters: {
    isLogin: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    realName: (state) => state.userInfo?.real_name || '',
    role: (state) => state.userInfo?.role || 'viewer',
    isAdmin: (state) => state.userInfo?.role === 'admin',
    
    // 权限检查方法
    hasMenuPermission: (state) => (menuPath: string) => {
      console.log('🔍 检查菜单权限:', menuPath, {
        userRole: state.userInfo?.role,
        menuPermissions: state.permissions.menu,
        menuCount: state.permissions.menu?.length || 0
      })
      
      // 超级管理员拥有所有菜单权限
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        console.log('✅ 管理员用户，拥有所有权限')
        return true
      }
      
      // 后端权限格式已统一，通过权限键映射检查
      const permissionKey = getPermissionKeyByPath(menuPath)
      let hasPermission = false
      
      if (permissionKey) {
        // 检查是否有对应的权限键
        hasPermission = state.permissions.menu.includes(permissionKey)
        console.log('🔄 权限键检查:', {
          path: menuPath,
          permissionKey,
          hasPermissionKey: hasPermission
        })
      }
      
      // 移除默认权限后备逻辑，严格按照后端返回的权限数据进行权限判断
      // 这样可以确保权限控制的准确性和安全性
      
      console.log(`${hasPermission ? '✅' : '❌'} 菜单权限检查结果:`, hasPermission)
      return hasPermission
    },
    
    hasOperationPermission: (state) => (module: string, operation: string, level?: 'low' | 'medium' | 'high') => {
      console.log('🔍 检查操作权限:', { module, operation, level, userRole: state.userInfo?.role })
      
      // 超级管理员拥有所有操作权限
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        console.log('✅ 管理员用户，拥有所有操作权限')
        return true
      }
      
      const modulePermissions = state.permissions.operation[module] || []
      const hasBasicPermission = modulePermissions.includes(operation)
      
      // 如果没有指定权限等级，使用基础权限检查
      if (!level) {
        console.log(`${hasBasicPermission ? '✅' : '❌'} 基础操作权限检查结果:`, hasBasicPermission)
        return hasBasicPermission
      }
      
      // 根据权限等级进行额外检查
      const userRole = state.userInfo?.role || 'viewer'
      const roleLevel = getRoleLevel(userRole)
      const requiredLevel = getLevelValue(level)
      
      const hasLevelPermission = roleLevel >= requiredLevel && hasBasicPermission
      console.log(`${hasLevelPermission ? '✅' : '❌'} 等级权限检查结果:`, {
        userRole,
        roleLevel,
        requiredLevel,
        hasLevelPermission
      })
      
      return hasLevelPermission
    },

    // 检查是否需要二次确认的敏感操作
    requiresConfirmation: (state) => (module: string, operation: string) => {
      const sensitiveOperations = [
        'user.delete',
        'user.reset_password',
        'user.disable',
        'role.delete',
        'department.delete',
        'system.reset'
      ]
      
      const operationKey = `${module}.${operation}`
      return sensitiveOperations.includes(operationKey)
    },

    // 检查数据权限
    hasDataPermission: (state) => (dataType: string) => {
      console.log('🔍 检查数据权限:', { dataType, userRole: state.userInfo?.role })
      
      // 超级管理员拥有所有数据权限
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      
      return state.permissions.data.data_types.includes(dataType)
    },

    // 检查区域数据访问权限
    hasRegionalAccess: (state) => (region: string) => {
      console.log('🔍 检查区域权限:', { region, scope: state.permissions.data.scope })
      
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      
      const { scope, regional_permissions } = state.permissions.data
      
      if (scope === 'all') return true
      if (scope === 'own' && regional_permissions.includes(region)) return true
      if (scope === 'custom' && regional_permissions.includes(region)) return true
      
      return false
    },

    // 检查敏感数据访问权限
    hasSensitiveAccess: (state) => (field: string) => {
      console.log('🔍 检查敏感数据权限:', { field, sensitive: state.permissions.data.sensitive })
      
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      
      return state.permissions.data.sensitive.includes(field)
    },

    // 检查部门数据访问权限
    hasDepartmentAccess: (state) => (departmentId: string) => {
      console.log('🔍 检查部门权限:', { departmentId, permissions: state.permissions.data.department_permissions })
      
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      
      const { scope, department_permissions } = state.permissions.data
      
      if (scope === 'all') return true
      if (scope === 'department' && department_permissions.includes(departmentId)) return true
      if (scope === 'own' && state.userInfo?.department_id === departmentId) return true
      
      return false
    },

    // 检查客户数据访问权限
    hasCustomerAccess: (state) => (customerId: string) => {
      console.log('🔍 检查客户权限:', { customerId, permissions: state.permissions.data.customer_permissions })
      
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      
      const { scope, customer_permissions } = state.permissions.data
      
      if (scope === 'all') return true
      if (customer_permissions.includes(customerId)) return true
      
      return false
    },

    // 检查项目分类访问权限
    hasProjectCategoryAccess: (state) => (categoryId: string | number) => {
      console.log('🔍 检查项目分类权限:', { categoryId, permissions: state.permissions.data.project_category_permissions })
      
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      
      const { scope, project_category_permissions } = state.permissions.data
      
      // 如果数据访问范围是全部，则拥有所有分类权限
      if (scope === 'all') return true
      
      // 检查是否有指定分类的权限
      const categoryIdStr = categoryId.toString()
      return project_category_permissions.includes(categoryIdStr)
    }
  },

  actions: {
    // 登录
    async login(params: LoginParams) {
      try {
        const res = await authApi.login(params)
        this.token = res.access_token
        this.userInfo = res.user
        
        // 持久化存储token和用户信息
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('userInfo', JSON.stringify(res.user))
        
        // 存储会话ID（如果后端提供）
        if (res.session_id) {
          localStorage.setItem('sessionId', res.session_id)
          console.log('✅ 会话ID已存储:', res.session_id)
        }
        
        return res
      } catch (error) {
        throw error
      }
    },

    // 登出
    async logout() {
      try {
        await authApi.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = null
        this.userInfo = null
        this.permissions = {
          menu: [],
          operation: {}
        }
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('permissions')
        localStorage.removeItem('sessionId') // 清除会话ID
        router.push('/login')
      }
    },

    // 获取用户信息和权限
    async getUserInfo() {
      try {
        const res = await authApi.getUserInfo()
        console.log('🔍 getUserInfo API response:', res)
        console.log('🔍 API response type:', typeof res)
        console.log('🔍 API response keys:', Object.keys(res))
        
        // 后端直接返回用户信息，permissions在用户对象中
        this.userInfo = res
        this.permissions = res.permissions || { menu: [], operation: {} }
        
        // 持久化权限数据
        localStorage.setItem('permissions', JSON.stringify(this.permissions))
        
        console.log('✅ 用户信息设置完成:', this.userInfo)
        console.log('✅ 用户权限设置完成:', this.permissions)
        console.log('✅ 权限菜单数量:', this.permissions.menu?.length || 0)
        console.log('✅ 权限菜单列表:', this.permissions.menu)
        
        return res
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error)
        throw error
      }
    },

    // 设置权限（用于角色权限修改后的更新）
    setPermissions(permissions: { menu: string[], operation: Record<string, string[]>, data?: DataPermissions }) {
      // 确保数据权限结构完整
      const dataPermissions = permissions.data || {
        scope: 'own',
        regional_permissions: [],
        department_permissions: [],
        customer_permissions: [],
        data_types: [],
        sensitive: [],
        project_category_permissions: []
      }
      
      this.permissions = {
        menu: permissions.menu || [],
        operation: permissions.operation || {},
        data: dataPermissions
      }
      
      localStorage.setItem('permissions', JSON.stringify(this.permissions))
    },

    // 更新用户信息（支持部分更新）
    updateUserInfo(updates: Partial<LoginResponse['user']>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...updates }
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        console.log('✅ 用户信息已更新:', updates)
      }
    },

    // 更新头像
    updateAvatar(avatar: string) {
      if (this.userInfo) {
        this.userInfo.avatar = avatar
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        console.log('✅ 头像已更新:', avatar)
      }
    },

    // 执行需要权限确认的操作
    async executeSecureOperation(
      module: string, 
      operation: string, 
      action: () => void | Promise<void>,
      options?: {
        target?: string
        type?: 'delete' | 'reset' | 'disable' | 'danger'
        skipConfirm?: boolean
      }
    ) {
      const { target, type, skipConfirm = false } = options || {}
      
      // 检查基础权限
      if (!this.hasOperationPermission(module, operation)) {
        const { showPermissionDenied } = await import('@/utils/permissionConfirm')
        showPermissionDenied(`${module}.${operation}`, '您的角色没有执行此操作的权限')
        return
      }

      // 检查是否需要确认
      const needsConfirm = this.requiresConfirmation(module, operation) && !skipConfirm
      
      if (needsConfirm) {
        const { showPermissionConfirm } = await import('@/utils/permissionConfirm')
        showPermissionConfirm({
          type: type || 'danger',
          target,
          onOk: action
        })
      } else {
        await action()
      }
    }
  }
})