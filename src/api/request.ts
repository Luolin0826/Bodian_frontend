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
    const sessionId = localStorage.getItem('sessionId')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId
    }
    
    // 为请求添加重试计数器
    if (!config.retryCount) {
      config.retryCount = 0
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
      const errorData = error.response.data as any
      const errorMessage = errorData?.message || ''
      
      switch (error.response.status) {
        case 401:
          if (isLoginRequest) {
            // 登录接口的401错误，不做统一处理，让具体页面处理
            break
          } else {
            // 根据错误消息进行细致的401处理
            if (errorMessage.includes('Token已被撤销') || errorMessage.includes('token已被撤销')) {
              localStorage.removeItem('token')
              localStorage.removeItem('userInfo')
              localStorage.removeItem('sessionId')
              message.error('🚫 您的登录令牌已被管理员撤销，请重新登录')
              router.push('/login')
            } else if (errorMessage.includes('会话已过期') || errorMessage.includes('session已过期')) {
              localStorage.removeItem('token')
              localStorage.removeItem('userInfo') 
              localStorage.removeItem('sessionId')
              message.error('⏰ 您的登录会话已过期，为了保障账户安全，请重新登录')
              router.push('/login')
            } else if (errorMessage.includes('账号已被禁用') || errorMessage.includes('用户已被禁用')) {
              localStorage.removeItem('token')
              localStorage.removeItem('userInfo')
              localStorage.removeItem('sessionId')
              // 跳转到账号禁用页面
              router.push('/error/account-disabled')
            } else {
              // 通用的401处理
              localStorage.removeItem('token')
              localStorage.removeItem('userInfo')
              localStorage.removeItem('sessionId')
              message.error('⏰ 您的登录状态已失效，请重新登录以继续使用')
              router.push('/login')
            }
          }
          break
        case 403:
          // 对于403错误，如果是因为缓存导致的短暂权限验证失败，尝试重试
          const config = error.config as any
          if (config && config.retryCount < 1 && !isLoginRequest) {
            config.retryCount += 1
            console.log(`权限验证失败，正在重试第${config.retryCount}次...`)
            return service.request(config)
          }
          
          // 重试失败或不需要重试的情况
          if (errorMessage) {
            message.error(`⚠️ 权限不足：${errorMessage}`)
          } else {
            message.error('🚫 您没有访问此资源的权限，如有需要请联系管理员')
          }
          // 可选：跳转到403页面
          // router.push('/error/403')
          break
        case 404:
          message.error('🔍 请求的资源不存在，请检查请求地址是否正确')
          break
        case 500:
          message.error('😱 服务器出现了一些问题，请稍后重试或联系技术支持')
          break
        default:
          if (!isLoginRequest) {
            message.error(errorMessage || '😔 请求处理失败，请稍后重试')
          }
      }
    } else if (error.request) {
      message.error('🌐 网络连接异常，请检查您的网络设置并重试')
    } else {
      message.error('⚙️ 请求配置出现错误，请联系技术支持')
    }
    
    return Promise.reject(error)
  }
)

export default service