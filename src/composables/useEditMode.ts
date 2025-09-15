import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useAutoSave } from './useAutoSave'

interface EditModeOptions {
  autoSave?: boolean // 是否启用自动保存
  autoSaveDelay?: number // 自动保存延迟
  onSave?: (data: any) => Promise<void> // 保存函数
  onCancel?: () => void // 取消函数
  validateData?: (data: any) => boolean // 数据验证函数
  showMessages?: boolean // 是否显示消息提示
}

/**
 * 统一的编辑模式管理组合式函数
 */
export function useEditMode<T extends Record<string, any>>(
  initialData: T,
  options: EditModeOptions = {}
) {
  const {
    autoSave = true,
    autoSaveDelay = 3000,
    onSave,
    onCancel,
    validateData,
    showMessages = true
  } = options

  // 编辑状态
  const isEditing = ref(false)
  const isSubmitting = ref(false)
  const originalData = ref<T>({ ...initialData })
  const editData = reactive<T>({ ...initialData })
  
  // 表单错误状态
  const errors = reactive<Record<string, string>>({})
  const hasErrors = computed(() => Object.keys(errors).length > 0)
  
  // 检查是否有修改
  const hasChanges = computed(() => {
    return JSON.stringify(editData) !== JSON.stringify(originalData.value)
  })
  
  // 设置数据
  const setData = (newData: T) => {
    originalData.value = { ...newData }
    Object.assign(editData, newData)
    clearErrors()
  }
  
  // 开始编辑
  const startEdit = () => {
    if (isEditing.value) return
    
    isEditing.value = true
    Object.assign(editData, originalData.value)
    clearErrors()
    
    console.log('开始编辑模式')
    
    // 启动自动保存监听
    if (autoSave && onSave && autoSaveWatcher) {
      autoSaveWatcher()
    }
  }
  
  // 取消编辑
  const cancelEdit = () => {
    if (!isEditing.value) return
    
    // 停止自动保存监听
    if (stopWatching) {
      stopWatching()
      stopWatching = null
      console.log('取消编辑：停止自动保存监听')
    }
    
    // 恢复原始数据
    Object.assign(editData, originalData.value)
    isEditing.value = false
    clearErrors()
    
    console.log('取消编辑模式')
    
    if (onCancel) {
      onCancel()
    }
    
    if (showMessages) {
      message.info('已取消编辑')
    }
  }
  
  // 保存编辑
  const saveEdit = async (description?: string) => {
    if (!isEditing.value || isSubmitting.value) return false
    
    try {
      // 数据验证
      if (validateData && !validateData(editData)) {
        if (showMessages) {
          message.error('📋 数据验证失败，请检查您的输入内容')
        }
        return false
      }
      
      // 检查表单错误
      if (hasErrors.value) {
        if (showMessages) {
          message.error('⚠️ 请先修正表单中的验证错误')
        }
        return false
      }
      
      isSubmitting.value = true
      
      // 手动保存时，先停止自动保存
      if (autoSaveInstance && description) {
        // 停止自动保存监听
        if (stopWatching) {
          stopWatching()
          stopWatching = null
          console.log('手动保存：停止自动保存监听')
        }
        // 取消任何pending的自动保存
        autoSaveInstance.stopAutoSave()
        console.log('手动保存：取消自动保存防抖')
      }
      
      if (onSave) {
        await onSave(editData)
      }
      
      // 保存成功后更新原始数据
      originalData.value = { ...editData }
      isEditing.value = false
      clearErrors()
      
      // 手动保存成功后，停止自动保存监听（因为已经退出编辑模式）
      if (description && stopWatching) {
        stopWatching()
        stopWatching = null
        console.log('手动保存成功：停止自动保存监听')
      }
      
      if (showMessages) {
        message.success('保存成功')
      }
      
      console.log('✅ 编辑保存成功', description || '自动保存')
      return true
    } catch (error) {
      console.error('❌ 编辑保存失败:', error)
      
      if (showMessages) {
        const errorMessage = error instanceof Error ? error.message : '保存失败'
        message.error(`😔 ${errorMessage}，请稍后重试`)
      }
      
      return false
    } finally {
      isSubmitting.value = false
    }
  }
  
  // 设置字段错误
  const setFieldError = (field: string, error: string) => {
    errors[field] = error
  }
  
  // 清除字段错误
  const clearFieldError = (field: string) => {
    delete errors[field]
  }
  
  // 清除所有错误
  const clearErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key])
  }
  
  // 验证必填字段
  const validateRequired = (fields: string[]) => {
    let isValid = true
    
    fields.forEach(field => {
      const value = editData[field]
      if (!value || (typeof value === 'string' && !value.trim())) {
        setFieldError(field, `${field}为必填项`)
        isValid = false
      } else {
        clearFieldError(field)
      }
    })
    
    return isValid
  }
  
  // 重置到初始状态
  const reset = (newData?: T) => {
    const dataToUse = newData || initialData
    originalData.value = { ...dataToUse }
    Object.assign(editData, dataToUse)
    isEditing.value = false
    isSubmitting.value = false
    clearErrors()
  }
  
  // 自动保存功能
  let autoSaveWatcher: (() => void) | null = null
  let autoSaveInstance: ReturnType<typeof useAutoSave> | null = null
  let stopWatching: (() => void) | null = null
  
  if (autoSave && onSave) {
    autoSaveInstance = useAutoSave(
      () => editData,
      {
        delay: autoSaveDelay,
        showMessages: false, // 自动保存不显示成功消息
        onSave,
        validateData,
        onError: (error) => {
          console.warn('自动保存失败:', error)
        }
      }
    )
    
    autoSaveWatcher = () => {
      if (!stopWatching) {
        stopWatching = autoSaveInstance!.startWatching()
      }
    }
  }
  
  // 获取编辑状态信息
  const getEditStatus = () => {
    if (isSubmitting.value) {
      return '保存中...'
    } else if (hasErrors.value) {
      return '存在验证错误'
    } else if (hasChanges.value && isEditing.value) {
      return '有未保存的更改'
    } else if (isEditing.value) {
      return '编辑中'
    } else {
      return '查看模式'
    }
  }
  
  return {
    // 状态
    isEditing,
    isSubmitting,
    hasChanges,
    hasErrors,
    editData,
    originalData,
    errors,
    
    // 方法
    setData,
    startEdit,
    cancelEdit,
    saveEdit,
    reset,
    
    // 错误处理
    setFieldError,
    clearFieldError,
    clearErrors,
    validateRequired,
    
    // 状态查询
    getEditStatus
  }
}

/**
 * 创建字段编辑器
 */
export function useFieldEditor<T>(
  value: T,
  options: {
    onSave?: (newValue: T) => Promise<void>
    validator?: (value: T) => boolean | string
    showMessages?: boolean
  } = {}
) {
  const { onSave, validator, showMessages = true } = options
  
  const isEditing = ref(false)
  const isSaving = ref(false)
  const originalValue = ref<T>(value)
  const editValue = ref<T>(value)
  const error = ref<string>('')
  
  const hasChanges = computed(() => {
    return JSON.stringify(editValue.value) !== JSON.stringify(originalValue.value)
  })
  
  const startEdit = () => {
    isEditing.value = true
    editValue.value = originalValue.value
    error.value = ''
  }
  
  const cancelEdit = () => {
    editValue.value = originalValue.value
    isEditing.value = false
    error.value = ''
  }
  
  const saveEdit = async () => {
    if (isSaving.value) return false
    
    // 验证
    if (validator) {
      const validationResult = validator(editValue.value)
      if (validationResult !== true) {
        error.value = typeof validationResult === 'string' ? validationResult : '验证失败'
        return false
      }
    }
    
    try {
      isSaving.value = true
      
      if (onSave) {
        await onSave(editValue.value)
      }
      
      originalValue.value = editValue.value
      isEditing.value = false
      error.value = ''
      
      if (showMessages) {
        message.success('保存成功')
      }
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败'
      error.value = errorMessage
      
      if (showMessages) {
        message.error(`😔 ${errorMessage}，请检查后重试`)
      }
      
      return false
    } finally {
      isSaving.value = false
    }
  }
  
  // 更新值
  const setValue = (newValue: T) => {
    originalValue.value = newValue
    if (!isEditing.value) {
      editValue.value = newValue
    }
  }
  
  return {
    isEditing,
    isSaving,
    hasChanges,
    error,
    editValue,
    originalValue,
    
    startEdit,
    cancelEdit,
    saveEdit,
    setValue
  }
}