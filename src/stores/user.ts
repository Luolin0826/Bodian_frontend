import { defineStore } from 'pinia'
import { authApi, type LoginParams, type LoginResponse } from '@/api/modules/auth'
import router from '@/router'
import { getPermissionKeyByPath, DEFAULT_ROLE_PERMISSIONS } from '@/utils/menuPermissions'

interface UserState {
  token: string | null
  userInfo: LoginResponse['user'] | null
  permissions: {
    menu: string[]
    operation: Record<string, string[]>
    data?: any
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    const token = localStorage.getItem('token')
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
    const permissions = JSON.parse(localStorage.getItem('permissions') || '{"menu":[],"operation":{}}')
    
    console.log('🚀 UserStore 初始化状态:', {
      hasToken: !!token,
      userInfo,
      permissions,
      menuCount: permissions.menu?.length || 0
    })
    
    return {
      token,
      userInfo,
      permissions
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
      
      // 首先检查用户存储的权限
      let hasPermission = state.permissions.menu.includes(menuPath)
      
      // 如果没有权限，使用默认权限配置作为后备
      if (!hasPermission && state.userInfo?.role) {
        const permissionKey = getPermissionKeyByPath(menuPath)
        if (permissionKey) {
          const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[state.userInfo.role] || []
          hasPermission = defaultPermissions.includes(permissionKey)
          
          console.log('🔄 使用默认权限配置检查:', {
            path: menuPath,
            permissionKey,
            userRole: state.userInfo.role,
            hasDefaultPermission: hasPermission
          })
        }
      }
      
      console.log(`${hasPermission ? '✅' : '❌'} 菜单权限检查结果:`, hasPermission)
      return hasPermission
    },
    
    hasOperationPermission: (state) => (module: string, operation: string) => {
      // 超级管理员拥有所有操作权限
      if (state.userInfo?.role === 'super_admin' || state.userInfo?.role === 'admin') {
        return true
      }
      const modulePermissions = state.permissions.operation[module] || []
      return modulePermissions.includes(operation)
    }
  },

  actions: {
    // 登录
    async login(params: LoginParams) {
      try {
        const res = await authApi.login(params)
        this.token = res.access_token
        this.userInfo = res.user
        
        // 持久化
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('userInfo', JSON.stringify(res.user))
        
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
    setPermissions(permissions: { menu: string[], operation: Record<string, string[]>, data?: any }) {
      this.permissions = permissions
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
    }
  }
})