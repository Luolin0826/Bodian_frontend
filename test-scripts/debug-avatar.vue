<template>
  <div style="padding: 20px;">
    <h2>头像调试页面</h2>
    
    <div style="margin: 20px 0;">
      <h3>1. 测试 useUserAvatar</h3>
      <div>头像类型: {{ typeof avatar.displayUrl }}</div>
      <div>头像值: {{ String(avatar.displayUrl) }}</div>
      <div>是否为ref: {{ isRef(avatar.displayUrl) ? 'Yes' : 'No' }}</div>
      <div>解包后值: {{ unref(avatar.displayUrl) }}</div>
    </div>
    
    <div style="margin: 20px 0;">
      <h3>2. 测试Avatar组件</h3>
      <!-- 直接传值 -->
      <a-avatar :size="50" :src="unref(avatar.displayUrl)" style="margin-right: 10px;">
        <template #icon><UserOutlined /></template>
      </a-avatar>
      
      <!-- 通过computed传值 -->
      <a-avatar :size="50" :src="computedUrl" style="margin-right: 10px;">
        <template #icon><UserOutlined /></template>
      </a-avatar>
      
      <!-- 使用字符串测试 -->
      <a-avatar :size="50" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMiIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSIyIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Im0xNSAyNSBhNSA1IDAgMCAwIDEwIDAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg==">
        <template #icon><UserOutlined /></template>
      </a-avatar>
    </div>
    
    <div style="margin: 20px 0;">
      <h3>3. 调试信息</h3>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, unref, isRef } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { useUserAvatar } from '@/composables/useUserAvatar'

const avatar = useUserAvatar()

const computedUrl = computed(() => {
  const url = unref(avatar.displayUrl)
  console.log('🐛 computedUrl:', typeof url, url?.substring(0, 30) + '...')
  return url || ''
})

const debugInfo = computed(() => {
  return {
    displayUrl: {
      type: typeof avatar.displayUrl,
      value: String(avatar.displayUrl),
      isRef: isRef(avatar.displayUrl),
      unrefValue: unref(avatar.displayUrl)?.substring(0, 50) + '...'
    },
    loading: {
      type: typeof avatar.loading,
      value: avatar.loading,
      isRef: isRef(avatar.loading),
      unrefValue: unref(avatar.loading)
    }
  }
})
</script>