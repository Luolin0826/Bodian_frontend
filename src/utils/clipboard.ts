/**
 * 兼容性复制工具函数
 * 支持现代浏览器的 clipboard API 和旧浏览器的 execCommand
 */

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) {
    return false
  }

  // 方法1: 尝试使用现代的 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn('Clipboard API 失败，尝试使用兼容方法:', error)
    }
  }

  // 方法2: 使用 execCommand (兼容旧浏览器和非HTTPS环境)
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // 设置样式，使其不可见但能被选中
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    
    // 选中文本
    textArea.select()
    textArea.setSelectionRange(0, text.length)
    
    // 执行复制命令
    const successful = document.execCommand('copy')
    
    // 清理
    document.body.removeChild(textArea)
    
    return successful
  } catch (error) {
    console.error('execCommand 复制也失败了:', error)
    return false
  }
}

/**
 * 带消息提示的复制函数
 */
export const copyWithMessage = async (text: string, successMessage = '复制成功', errorMessage = '复制失败，请手动复制'): Promise<void> => {
  const { message } = await import('ant-design-vue')
  
  try {
    const success = await copyToClipboard(text)
    if (success) {
      message.success(successMessage)
    } else {
      message.error(errorMessage)
    }
  } catch (error) {
    console.error('复制失败:', error)
    message.error(errorMessage)
  }
}