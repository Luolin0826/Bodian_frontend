import { Modal, message } from 'ant-design-vue'
import { ExclamationCircleOutlined, DeleteOutlined, UserDeleteOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { h } from 'vue'

interface ConfirmOptions {
  title?: string
  content?: string
  type?: 'delete' | 'reset' | 'disable' | 'danger'
  target?: string
  onOk?: () => void | Promise<void>
  onCancel?: () => void
}

/**
 * 显示敏感操作的确认对话框
 */
export const showPermissionConfirm = (options: ConfirmOptions) => {
  const { title, content, type = 'danger', target, onOk, onCancel } = options

  // 根据操作类型生成默认的标题和内容
  const getDefaultConfig = (actionType: string, targetName?: string) => {
    const configs = {
      delete: {
        title: `确认删除${targetName ? ` ${targetName}` : ''}？`,
        content: `删除操作无法撤销，确定要永久删除${targetName ? `"${targetName}"` : '此项'}吗？`,
        icon: DeleteOutlined,
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger' as const
      },
      disable: {
        title: `确认禁用${targetName ? ` ${targetName}` : ''}？`,
        content: `禁用后${targetName ? `"${targetName}"` : '目标'}将无法正常使用，确定继续吗？`,
        icon: UserDeleteOutlined,
        okText: '确认禁用',
        cancelText: '取消',
        okType: 'danger' as const
      },
      reset: {
        title: `确认重置${targetName ? ` ${targetName}` : ''}？`,
        content: `重置操作将清除${targetName ? `"${targetName}"的` : ''}所有自定义设置，确定继续吗？`,
        icon: ReloadOutlined,
        okText: '确认重置',
        cancelText: '取消',
        okType: 'primary' as const
      },
      danger: {
        title: `确认执行此操作？`,
        content: `此操作具有潜在风险，请确认您有足够的权限执行此操作。`,
        icon: ExclamationCircleOutlined,
        okText: '确认执行',
        cancelText: '取消',
        okType: 'danger' as const
      }
    }
    
    return configs[actionType as keyof typeof configs] || configs.danger
  }

  const defaultConfig = getDefaultConfig(type, target)

  Modal.confirm({
    title: title || defaultConfig.title,
    icon: h(defaultConfig.icon, { style: { color: '#ff4d4f' } }),
    content: content || defaultConfig.content,
    okText: defaultConfig.okText,
    cancelText: defaultConfig.cancelText,
    okType: defaultConfig.okType,
    centered: true,
    width: 480,
    maskClosable: false,
    keyboard: false,
    
    // 自定义样式
    class: 'permission-confirm-modal',
    
    async onOk() {
      if (onOk) {
        try {
          await onOk()
        } catch (error) {
          console.error('操作执行失败:', error)
          message.error('操作失败，请重试')
          throw error // 阻止对话框关闭
        }
      }
    },
    
    onCancel() {
      if (onCancel) {
        onCancel()
      }
    }
  })
}

/**
 * 检查并执行需要确认的操作
 */
export const executeWithConfirmation = async (
  requiresConfirm: boolean,
  action: () => void | Promise<void>,
  confirmOptions?: ConfirmOptions
) => {
  if (!requiresConfirm) {
    // 不需要确认，直接执行
    await action()
    return
  }

  // 需要确认，显示确认对话框
  showPermissionConfirm({
    ...confirmOptions,
    onOk: action
  })
}

/**
 * 权限不足提示
 */
export const showPermissionDenied = (action?: string, reason?: string) => {
  Modal.warning({
    title: '🚫 权限不足',
    icon: h(ExclamationCircleOutlined, { style: { color: '#faad14' } }),
    content: h('div', { style: { lineHeight: '1.6' } }, [
      h('p', { style: { marginBottom: '12px', fontSize: '15px' } }, `您没有权限执行${action ? `\" ${action} \"` : '此操作'}。`),
      reason && h('div', { style: { background: '#fafafa', padding: '12px', borderRadius: '6px', marginBottom: '12px' } }, [
        h('strong', { style: { color: '#d32f2f', fontSize: '13px' } }, '📝 原因：'),
        h('span', { style: { color: '#666', fontSize: '13px', marginLeft: '8px' } }, reason)
      ]),
      h('div', { style: { background: '#e3f2fd', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #2196f3' } }, [
        h('p', { style: { margin: '0', color: '#1976d2', fontSize: '13px' } }, '📞 如需获得相关权限，请联系您的直线管理员或系统管理员。')
      ])
    ]),
    okText: '👍 我知道了',
    centered: true,
    width: 420
  })
}

/**
 * 敏感数据访问提示
 */
export const showDataSensitivityWarning = (dataType: string) => {
  Modal.info({
    title: '🔒 敏感数据提示',
    icon: h(ExclamationCircleOutlined, { style: { color: '#1890ff' } }),
    content: h('div', { style: { lineHeight: '1.6' } }, [
      h('p', { style: { marginBottom: '12px', fontSize: '15px' } }, `您正在访问${dataType}，为保护隐私，部分敏感信息已经进行了脱敏处理。`),
      h('div', { style: { background: '#fff3cd', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #ffc107' } }, [
        h('p', { style: { margin: '0 0 8px 0', color: '#856404', fontSize: '13px', fontWeight: '500' } }, '📊 数据访问说明：'),
        h('ul', { style: { margin: '0', paddingLeft: '16px', color: '#856404', fontSize: '13px' } }, [
          h('li', '脱敏数据仅显示部分内容，保护用户隐私'),
          h('li', '完整信息需要相应的数据查看权限'),
          h('li', '如有需要，请联系数据管理员申请权限')
        ])
      ])
    ]),
    okText: '👍 我了解了',
    centered: true,
    width: 420
  })
}

// 导出常用的确认操作类型
export const ConfirmTypes = {
  DELETE: 'delete',
  DISABLE: 'disable', 
  RESET: 'reset',
  DANGER: 'danger'
} as const