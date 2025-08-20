/**
 * 验证工具函数
 */

// 手机号验证
export const validatePhone = (phone: string): boolean => {
      return /^1[3-9]\d{9}$/.test(phone)
    }
    
    // 邮箱验证
    export const validateEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }
    
    // 身份证验证
    export const validateIdCard = (idCard: string): boolean => {
      return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
    }
    
    // URL验证
    export const validateUrl = (url: string): boolean => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }
    
    // 密码强度验证
    export const validatePassword = (password: string): {
      valid: boolean
      level: 'weak' | 'medium' | 'strong'
      message: string
    } => {
      if (password.length < 6) {
        return { valid: false, level: 'weak', message: '密码长度至少6位' }
      }
      
      let level: 'weak' | 'medium' | 'strong' = 'weak'
      let score = 0
      
      if (/[a-z]/.test(password)) score++
      if (/[A-Z]/.test(password)) score++
      if (/\d/.test(password)) score++
      if (/[!@#$%^&*]/.test(password)) score++
      
      if (score >= 3) level = 'strong'
      else if (score >= 2) level = 'medium'
      
      return {
        valid: true,
        level,
        message: level === 'strong' ? '密码强度高' : level === 'medium' ? '密码强度中等' : '密码强度较弱'
      }
    }