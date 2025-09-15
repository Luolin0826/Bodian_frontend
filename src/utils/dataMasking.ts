/**
 * 数据脱敏处理工具
 * 用于检测和处理后端返回的脱敏数据
 */

export interface MaskingConfig {
  /** 是否显示脱敏提示 */
  showTip?: boolean
  /** 脱敏提示文本 */
  tipText?: string
  /** 脱敏类型 */
  type?: 'phone' | 'email' | 'idcard' | 'bankcard' | 'custom'
}

/**
 * 检测数据是否被脱敏
 */
export const isMaskedData = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false
  
  // 常见的脱敏模式
  const maskingPatterns = [
    /\*{2,}/,           // 连续的星号 **
    /\d{2,}\*{2,}\d*/,  // 数字+星号+数字 如: 138****1234
    /.+\*{2,}.+/,       // 任意字符+星号+任意字符
    /^.{1,2}\*+.{0,2}$/, // 开头1-2字符+星号+结尾0-2字符
  ]
  
  return maskingPatterns.some(pattern => pattern.test(value))
}

/**
 * 获取脱敏数据的类型
 */
export const getMaskingType = (value: string): MaskingConfig['type'] => {
  if (!value) return 'custom'
  
  // 手机号脱敏：138****1234
  if (/^1[3-9]\d\*{4}\d{4}$/.test(value)) return 'phone'
  
  // 邮箱脱敏：abc***@example.com
  if (/.+\*{2,}.+@.+\..+/.test(value)) return 'email'
  
  // 身份证脱敏：110***********1234
  if (/^\d{3}\*{8,}\d{3,4}$/.test(value)) return 'idcard'
  
  // 银行卡脱敏：6222***********1234
  if (/^\d{4}\*{8,}\d{4}$/.test(value)) return 'bankcard'
  
  return 'custom'
}

/**
 * 为脱敏数据添加视觉提示
 */
export const addMaskingIndicator = (value: string, config?: MaskingConfig) => {
  if (!isMaskedData(value)) return value
  
  const maskingType = getMaskingType(value)
  const defaultConfig: MaskingConfig = {
    showTip: true,
    type: maskingType,
    tipText: getMaskingTipText(maskingType)
  }
  
  const finalConfig = { ...defaultConfig, ...config }
  
  return {
    value,
    isMasked: true,
    type: finalConfig.type,
    tipText: finalConfig.tipText,
    showTip: finalConfig.showTip
  }
}

/**
 * 获取脱敏提示文本
 */
const getMaskingTipText = (type: MaskingConfig['type']): string => {
  const tipTexts = {
    phone: '手机号已脱敏处理',
    email: '邮箱地址已脱敏处理',
    idcard: '身份证号已脱敏处理', 
    bankcard: '银行卡号已脱敏处理',
    custom: '敏感信息已脱敏处理'
  }
  return tipTexts[type || 'custom']
}

/**
 * 批量处理对象中的脱敏数据
 */
export const processMaskedObject = <T extends Record<string, any>>(
  obj: T,
  sensitiveFields: (keyof T)[] = []
): T & { _maskingInfo?: Record<string, any> } => {
  if (!obj || typeof obj !== 'object') return obj
  
  const result = { ...obj }
  const maskingInfo: Record<string, any> = {}
  
  // 处理指定的敏感字段
  sensitiveFields.forEach(field => {
    const value = obj[field]
    if (value && typeof value === 'string' && isMaskedData(value)) {
      const maskInfo = addMaskingIndicator(value)
      maskingInfo[field as string] = maskInfo
    }
  })
  
  // 自动检测可能的脱敏字段
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    if (value && typeof value === 'string' && isMaskedData(value)) {
      if (!maskingInfo[key]) {
        const maskInfo = addMaskingIndicator(value)
        maskingInfo[key] = maskInfo
      }
    }
  })
  
  // 如果有脱敏信息，添加到结果中
  if (Object.keys(maskingInfo).length > 0) {
    (result as any)._maskingInfo = maskingInfo
  }
  
  return result
}

/**
 * 批量处理数组中的脱敏数据
 */
export const processMaskedArray = <T extends Record<string, any>>(
  array: T[],
  sensitiveFields: (keyof T)[] = []
): (T & { _maskingInfo?: Record<string, any> })[] => {
  if (!Array.isArray(array)) return array
  
  return array.map(item => processMaskedObject(item, sensitiveFields))
}

/**
 * 创建脱敏数据显示组件的props
 */
export const createMaskedDisplayProps = (
  value: string,
  config?: MaskingConfig
) => {
  if (!isMaskedData(value)) {
    return { value, isMasked: false }
  }
  
  const maskInfo = addMaskingIndicator(value, config)
  return {
    value: maskInfo.value,
    isMasked: maskInfo.isMasked,
    type: maskInfo.type,
    tipText: maskInfo.tipText,
    showTip: maskInfo.showTip
  }
}

/**
 * 检查用户是否有查看完整敏感数据的权限
 */
export const canViewSensitiveData = (
  userRole: string,
  dataType: string
): boolean => {
  // 管理员可以查看所有敏感数据
  if (['super_admin', 'admin'].includes(userRole)) {
    return true
  }
  
  // 根据数据类型和用户角色判断权限
  const permissions: Record<string, string[]> = {
    'customer_phone': ['admin', 'super_admin', 'sales', 'manager'],
    'customer_email': ['admin', 'super_admin', 'sales', 'manager'],
    'user_phone': ['admin', 'super_admin', 'manager'],
    'user_idcard': ['admin', 'super_admin'],
    'financial_data': ['admin', 'super_admin'],
  }
  
  return permissions[dataType]?.includes(userRole) || false
}

/**
 * 对敏感数据进行脱敏处理
 */
export const maskSensitiveData = (value: string, fieldType?: string): string => {
  if (!value || typeof value !== 'string') return value
  
  // 如果已经是脱敏数据，直接返回
  if (isMaskedData(value)) return value
  
  // 根据字段类型进行脱敏
  switch (fieldType) {
    case 'phone':
    case 'mobile':
      // 手机号脱敏：138****1234
      return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      
    case 'email':
      // 邮箱脱敏：abc***@example.com
      const [username, domain] = value.split('@')
      if (username && domain) {
        const maskedUsername = username.length > 3 
          ? username.substring(0, 3) + '***'
          : '***'
        return `${maskedUsername}@${domain}`
      }
      return value
      
    case 'id_card':
    case 'identity_card':
      // 身份证脱敏：110***********1234
      return value.replace(/(\d{3})\d+(\d{4})/, '$1***********$2')
      
    case 'bank_card':
    case 'card_number':
      // 银行卡脱敏：6222***********1234
      return value.replace(/(\d{4})\d+(\d{4})/, '$1***********$2')
      
    case 'real_name':
    case 'name':
      // 姓名脱敏：张*
      return value.length > 1 ? value[0] + '*'.repeat(value.length - 1) : '*'
      
    case 'address':
      // 地址脱敏：保留前几个字符
      return value.length > 6 ? value.substring(0, 6) + '***' : '***'
      
    default:
      // 通用脱敏：保留前后字符，中间用星号
      if (value.length <= 2) return '*'.repeat(value.length)
      if (value.length <= 4) return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1]
      return value.substring(0, 2) + '***' + value.substring(value.length - 2)
  }
}

/**
 * 常用的敏感字段名称映射
 */
export const SENSITIVE_FIELD_NAMES: Record<string, string[]> = {
  phone: ['phone', 'mobile', 'telephone', 'tel', 'phone_number'],
  email: ['email', 'mail', 'email_address'],
  idcard: ['id_card', 'identity_card', 'id_number', 'identity_number'],
  bankcard: ['bank_card', 'card_number', 'account_number'],
  address: ['address', 'home_address', 'company_address'],
  name: ['real_name', 'full_name', 'customer_name']
}