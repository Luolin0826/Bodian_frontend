// src/api/request.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

// 创建axios实例 - 注意这里的baseURL配置
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',  // 使用环境变量配置，为空时使用相对路径
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig | any) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('Request:', config.method?.toUpperCase(), config.url, 'params:', config.params, 'data:', config.data)
    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('Response:', response.status, response.data)
    
    // 检查响应状态码
    if (!response || response.status < 200 || response.status >= 300) {
      console.error('响应状态码异常:', response.status)
      throw new Error(`HTTP Error: ${response.status}`)
    }
    
    // 检查响应数据
    if (!response.data) {
      console.error('响应数据为空')
      throw new Error('Empty response data')
    }
    
    return response.data
  },
  (error: AxiosError) => {
    console.error('Response error:', error.response?.status, error.response?.data)
    
    if (error.response) {
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      
      switch (error.response.status) {
        case 401:
          if (isLoginRequest) {
            // 登录接口的401错误，不做统一处理，让具体页面处理
            break
          } else {
            // 其他接口的401错误，说明token过期
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            message.error('登录已过期，请重新登录')
            router.push('/login')
          }
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          if (!isLoginRequest) {
            const errorData = error.response.data as any
            message.error(errorData?.message || '请求失败')
          }
      }
    } else if (error.request) {
      message.error('网络错误，请检查您的网络连接')
    } else {
      message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default service