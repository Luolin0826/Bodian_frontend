import { defineStore } from 'pinia'
import { authApi, type LoginParams, type LoginResponse } from '@/api/modules/auth'
import router from '@/router'

interface UserState {
  token: string | null
  userInfo: LoginResponse['user'] | null
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    permissions: []
  }),

  getters: {
    isLogin: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    realName: (state) => state.userInfo?.real_name || '',
    role: (state) => state.userInfo?.role || 'viewer',
    isAdmin: (state) => state.userInfo?.role === 'admin'
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
        this.permissions = []
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        router.push('/login')
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const res = await authApi.getUserInfo()
        this.userInfo = res.data.user
        this.permissions = res.data.permissions || []
        return res
      } catch (error) {
        throw error
      }
    }
  }
})