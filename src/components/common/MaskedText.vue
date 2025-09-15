<template>
  <span class="masked-text">
    <!-- 空值显示 -->
    <span v-if="!value || value === null || value === undefined" class="empty-value">-</span>
    
    <!-- 脱敏数据显示 -->
    <span v-else-if="isMasked" class="masked-value">
      <span class="value-text">{{ value }}</span>
      <a-tooltip v-if="showTip" :title="tipText" placement="top">
        <EyeInvisibleOutlined class="mask-icon" />
      </a-tooltip>
    </span>
    
    <!-- 普通数据显示 -->
    <span v-else class="normal-value">{{ value }}</span>
    
    <!-- 权限申请按钮（可选） -->
    <a-button 
      v-if="isMasked && showApplyButton && canApply"
      type="link" 
      size="small" 
      class="apply-access-btn"
      @click="handleApplyAccess"
    >
      <UnlockOutlined />
      申请查看
    </a-button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EyeInvisibleOutlined, UnlockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { isMaskedData, getMaskingType, getMaskingTipText, createMaskedDisplayProps } from '@/utils/dataMasking'

interface Props {
  /** 要显示的值 */
  value?: string | null | undefined
  /** 是否显示脱敏提示图标 */
  showTip?: boolean
  /** 自定义提示文本 */
  tipText?: string
  /** 是否显示申请查看按钮 */
  showApplyButton?: boolean
  /** 数据类型 */
  dataType?: string
  /** 是否可以申请查看权限 */
  canApply?: boolean
}

interface Emits {
  (e: 'apply-access', dataType?: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showTip: true,
  showApplyButton: false,
  canApply: true
})

const emit = defineEmits<Emits>()

// 计算脱敏相关属性
const maskingProps = computed(() => {
  // 处理 null/undefined 的情况
  const value = props.value || ''
  return createMaskedDisplayProps(value, {
    showTip: props.showTip,
    tipText: props.tipText
  })
})

const isMasked = computed(() => maskingProps.value.isMasked)
const tipText = computed(() => props.tipText || maskingProps.value.tipText || '')

// 申请查看权限
const handleApplyAccess = () => {
  message.info('权限申请功能开发中...')
  emit('apply-access', props.dataType)
}
</script>

<style scoped lang="less">
.masked-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .masked-value {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    
    .value-text {
      color: #666;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      letter-spacing: 0.5px;
    }
    
    .mask-icon {
      color: #faad14;
      font-size: 12px;
      opacity: 0.8;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .normal-value {
    color: inherit;
  }
  
  .empty-value {
    color: #d9d9d9;
    font-style: italic;
  }
  
  .apply-access-btn {
    padding: 0 4px;
    height: auto;
    font-size: 12px;
    color: #1890ff;
    
    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-radius: 4px;
    }
  }
}

// 不同类型的脱敏数据样式
.masked-text {
  &[data-type="phone"] .masked-value .value-text {
    background: linear-gradient(135deg, #ffe7e7 0%, #fff0f0 100%);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #ffd6d6;
  }
  
  &[data-type="email"] .masked-value .value-text {
    background: linear-gradient(135deg, #e7f3ff 0%, #f0f8ff 100%);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #d6ebff;
  }
  
  &[data-type="idcard"] .masked-value .value-text {
    background: linear-gradient(135deg, #fff7e7 0%, #fffaf0 100%);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #ffe7d6;
  }
  
  &[data-type="bankcard"] .masked-value .value-text {
    background: linear-gradient(135deg, #f0f9ff 0%, #f8fcff 100%);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #d9f1ff;
  }
}
</style>