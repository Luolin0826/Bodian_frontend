import { ref, watch, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import { debounce } from 'lodash-es'

interface AutoSaveOptions {
  delay?: number // 自动保存延迟时间（毫秒）
  showMessages?: boolean // 是否显示保存消息
  onSave: (data: any) => Promise<void> // 保存函数
  onError?: (error: any) => void // 错误处理函数
  validateData?: (data: any) => boolean // 数据验证函数
}

interface VersionRecord {
  id: string
  timestamp: Date
  data: any
  description?: string
}

/**
 * 实时保存和版本控制组合式函数
 */
export function useAutoSave<T>(
  data: () => T,
  options: AutoSaveOptions
) {
  const {
    delay = 3000,
    showMessages = true,
    onSave,
    onError,
    validateData
  } = options

  // 保存状态
  const saving = ref(false)
  const lastSaved = ref<Date | null>(null)
  const hasChanges = ref(false)
  const saveError = ref<string | null>(null)
  const isManualSaving = ref(false) // 标记手动保存状态
  
  // 版本历史
  const versions = ref<VersionRecord[]>([])
  const maxVersions = 10 // 最大保存版本数
  
  // 创建防抖保存函数
  const debouncedSave = debounce(async () => {
    if (saving.value) {
      console.log('⏸️ 自动保存跳过：正在保存中')
      return
    }
    
    if (isManualSaving.value) {
      console.log('⏸️ 自动保存跳过：手动保存进行中')
      return
    }
    
    const currentData = data()
    
    // 数据验证
    if (validateData && !validateData(currentData)) {
      console.warn('⚠️ 自动保存跳过：数据验证失败')
      return
    }
    
    try {
      saving.value = true
      saveError.value = null
      
      console.log('🔄 开始自动保存:', new Date().toLocaleTimeString())
      await onSave(currentData)
      
      // 保存成功后更新状态
      lastSaved.value = new Date()
      hasChanges.value = false
      
      // 添加到版本历史
      addVersion(currentData)
      
      if (showMessages) {
        message.success('自动保存成功', 1)
      }
      
      console.log('✅ 自动保存成功:', new Date().toLocaleTimeString())
    } catch (error) {
      console.error('❌ 自动保存失败:', error)
      saveError.value = error instanceof Error ? error.message : '保存失败'
      
      if (onError) {
        onError(error)
      } else if (showMessages) {
        message.error('自动保存失败', 2)
      }
    } finally {
      saving.value = false
    }
  }, delay)
  
  // 添加版本记录
  const addVersion = (versionData: T, description?: string) => {
    const newVersion: VersionRecord = {
      id: `v_${Date.now()}`,
      timestamp: new Date(),
      data: JSON.parse(JSON.stringify(versionData)), // 深拷贝
      description
    }
    
    versions.value.unshift(newVersion)
    
    // 限制版本数量
    if (versions.value.length > maxVersions) {
      versions.value = versions.value.slice(0, maxVersions)
    }
  }
  
  // 手动保存
  const save = async (description?: string) => {
    // 设置手动保存标记
    isManualSaving.value = true
    
    // 取消防抖保存
    debouncedSave.cancel()
    
    const currentData = data()
    
    if (validateData && !validateData(currentData)) {
      isManualSaving.value = false
      throw new Error('数据验证失败')
    }
    
    try {
      saving.value = true
      saveError.value = null
      
      console.log('🔄 开始手动保存:', description || '手动保存')
      await onSave(currentData)
      
      lastSaved.value = new Date()
      hasChanges.value = false
      
      // 手动保存时添加描述版本
      addVersion(currentData, description || '手动保存')
      
      if (showMessages) {
        message.success('保存成功')
      }
      
      console.log('✅ 手动保存成功:', new Date().toLocaleTimeString())
    } catch (error) {
      console.error('❌ 手动保存失败:', error)
      saveError.value = error instanceof Error ? error.message : '保存失败'
      
      if (onError) {
        onError(error)
      }
      
      throw error
    } finally {
      saving.value = false
      isManualSaving.value = false
    }
  }
  
  // 恢复到指定版本
  const restoreVersion = (versionId: string): T | null => {
    const version = versions.value.find(v => v.id === versionId)
    if (version) {
      hasChanges.value = true
      return version.data
    }
    return null
  }
  
  // 删除版本
  const deleteVersion = (versionId: string) => {
    const index = versions.value.findIndex(v => v.id === versionId)
    if (index !== -1) {
      versions.value.splice(index, 1)
    }
  }
  
  // 清空版本历史
  const clearVersions = () => {
    versions.value = []
  }
  
  // 标记有变化
  const markChanged = () => {
    hasChanges.value = true
    debouncedSave()
  }
  
  // 监听数据变化
  const startWatching = () => {
    return watch(
      data,
      () => {
        markChanged()
      },
      { deep: true }
    )
  }
  
  // 停止自动保存
  const stopAutoSave = () => {
    debouncedSave.cancel()
  }
  
  // 获取保存状态信息
  const getSaveStatus = () => {
    if (saving.value) {
      return '保存中...'
    } else if (saveError.value) {
      return `保存失败: ${saveError.value}`
    } else if (hasChanges.value) {
      return '有未保存的更改'
    } else if (lastSaved.value) {
      return `上次保存: ${lastSaved.value.toLocaleTimeString()}`
    } else {
      return '尚未保存'
    }
  }
  
  // 组件卸载时清理
  onBeforeUnmount(() => {
    stopAutoSave()
  })
  
  return {
    // 状态
    saving,
    lastSaved,
    hasChanges,
    saveError,
    versions,
    
    // 方法
    save,
    markChanged,
    startWatching,
    stopAutoSave,
    restoreVersion,
    deleteVersion,
    clearVersions,
    getSaveStatus,
    
    // 版本控制
    addVersion
  }
}

/**
 * 简单的自动保存Hook，不包含版本控制
 */
export function useSimpleAutoSave<T>(
  data: () => T,
  saveFunction: (data: T) => Promise<void>,
  options: {
    delay?: number
    showMessages?: boolean
  } = {}
) {
  return useAutoSave(data, {
    delay: options.delay || 3000,
    showMessages: options.showMessages !== false,
    onSave: saveFunction
  })
}