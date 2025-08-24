<template>
  <div class="avatar-selector">
    <!-- 当前头像显示 -->
    <div class="current-avatar" @click="showSelector = true">
      <a-avatar :size="size" :src="currentAvatar" class="avatar-display">
        <template #icon>
          <UserOutlined v-if="!currentAvatar" />
        </template>
      </a-avatar>
      <div v-if="editable" class="avatar-edit-overlay">
        <CameraOutlined />
      </div>
    </div>

    <!-- 头像选择器弹窗 -->
    <a-modal
      v-model:open="showSelector"
      title="选择头像"
      :width="600"
      @ok="handleConfirm"
      @cancel="handleCancel"
    >
      <div class="avatar-selector-content">
        <!-- 可爱动物 -->
        <div class="avatar-category">
          <h4>🐱 可爱动物</h4>
          <div class="avatar-grid">
            <div
              v-for="avatar in animalAvatars"
              :key="avatar.id"
              class="avatar-option"
              :class="{ active: selectedAvatar === avatar.id }"
              @click="selectAvatar(avatar.id)"
            >
              <a-avatar :size="50" :src="avatar.url">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="avatar-label">{{ avatar.name }}</span>
            </div>
          </div>
        </div>

        <!-- 卡通角色 -->
        <div class="avatar-category">
          <h4>🤖 卡通角色</h4>
          <div class="avatar-grid">
            <div
              v-for="avatar in characterAvatars"
              :key="avatar.id"
              class="avatar-option"
              :class="{ active: selectedAvatar === avatar.id }"
              @click="selectAvatar(avatar.id)"
            >
              <a-avatar :size="50" :src="avatar.url">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="avatar-label">{{ avatar.name }}</span>
            </div>
          </div>
        </div>

        <!-- 表情包 -->
        <div class="avatar-category">
          <h4>😊 表情包</h4>
          <div class="avatar-grid">
            <div
              v-for="avatar in emojiAvatars"
              :key="avatar.id"
              class="avatar-option"
              :class="{ active: selectedAvatar === avatar.id }"
              @click="selectAvatar(avatar.id)"
            >
              <a-avatar :size="50" :src="avatar.url">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="avatar-label">{{ avatar.name }}</span>
            </div>
          </div>
        </div>

        <!-- 自定义上传 -->
        <div class="custom-upload">
          <a-upload
            :show-upload-list="false"
            accept="image/*"
            :before-upload="handleCustomUpload"
            class="custom-upload-btn"
          >
            <a-button>
              <UploadOutlined />
              上传自定义头像
            </a-button>
          </a-upload>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, CameraOutlined, UploadOutlined } from '@ant-design/icons-vue'

interface Props {
  modelValue?: string
  size?: number | 'large' | 'small' | 'default'
  editable?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  editable: true
})

const emit = defineEmits<Emits>()

const showSelector = ref(false)
const selectedAvatar = ref('')

// 本地头像数据（作为fallback）
const animalAvatars = [
  {
    id: 'cat',
    name: '小猫',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGQjZDMSIvPgogIDxjaXJjbGUgY3g9IjM1IiBjeT0iMzUiIHI9IjgiIGZpbGw9IiNGRjY5QjQiLz4KICA8Y2lyY2xlIGN4PSI2NSIgY3k9IjM1IiByPSI4IiBmaWxsPSIjRkY2OUI0Ii8+CiAgPGNpcmNsZSBjeD0iNDAiIGN5PSI0NSIgcj0iMyIgZmlsbD0iIzAwMCIvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8cGF0aCBkPSJNNDUgNTUgUTUwIDYwIDU1IDU1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0zNSAyNSBRNDAgMTUgNDUgMjUiIGZpbGw9IiNGRjY5QjQiLz4KICA8cGF0aCBkPSJNNTUgMjUgUTYwIDE1IDY1IDI1IiBmaWxsPSIjRkY2OUI0Ii8+Cjwvc3ZnPg=='
  },
  {
    id: 'dog',
    name: '小狗',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0RFQjg4NyIvPgogIDxlbGxpcHNlIGN4PSIzMCIgY3k9IjMwIiByeD0iMTIiIHJ5PSIyMCIgZmlsbD0iI0RFQjg4NyIvPgogIDxlbGxpcHNlIGN4PSI3MCIgY3k9IjMwIiByeD0iMTIiIHJ5PSIyMCIgZmlsbD0iI0RFQjg4NyIvPgogIDxjaXJjbGUgY3g9IjQyIiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8Y2lyY2xlIGN4PSI1OCIgY3k9IjQ1IiByPSIzIiBmaWxsPSIjMDAwIi8+CiAgPGVsbGlwc2UgY3g9IjUwIiBjeT0iNTUiIHJ4PSI4IiByeT0iNiIgZmlsbD0iIzAwMCIvPgogIDxwYXRoIGQ9Ik00MiA2MCBRNTEGOTY1IDU4IDYwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4='
  },
  {
    id: 'bear',
    name: '小熊',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0NEODUzRiIvPgogIDxjaXJjbGUgY3g9IjI1IiBjeT0iMjUiIHI9IjE1IiBmaWxsPSIjQ0Q4NTNGIi8+CiAgPGNpcmNsZSBjeD0iNzUiIGN5PSIyNSIgcj0iMTUiIGZpbGw9IiNDRDg1M0YiLz4KICA8Y2lyY2xlIGN4PSI0MiIgY3k9IjQ1IiByPSIzIiBmaWxsPSIjMDAwIi8+CiAgPGNpcmNsZSBjeD0iNTgiIGN5PSI0NSIgcj0iMyIgZmlsbD0iIzAwMCIvPgogIDxlbGxpcHNlIGN4PSI1MCIgY3k9IjU1IiByeD0iNiIgcnk9IjQiIGZpbGw9IiMwMDAiLz4KICA8cGF0aCBkPSJNNDIgNjIgUTUwIDY3IDU4IDYyIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4='
  },
  {
    id: 'rabbit',
    name: '小兔',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0Y1RjVEQyIvPgogIDxlbGxpcHNlIGN4PSIzNSIgY3k9IjE1IiByeD0iOCIgcnk9IjI1IiBmaWxsPSIjRjVGNURDIi8+CiAgPGVsbGlwc2UgY3g9IjY1IiBjeT0iMTUiIHJ4PSI4IiByeT0iMjUiIGZpbGw9IiNGNUY1REMiLz4KICA8ZWxsaXBzZSBjeD0iMzUiIGN5PSIxOCIgcng9IjQiIHJ5PSIxOCIgZmlsbD0iI0ZGQjZDMSIvPgogIDxlbGxpcHNlIGN4PSI2NSIgY3k9IjE4IiByeD0iNCIgcnk9IjE4IiBmaWxsPSIjRkZCNkMxIi8+CiAgPGNpcmNsZSBjeD0iNDIiIGN5PSI0NSIgcj0iMyIgZmlsbD0iIzAwMCIvPgogIDxjaXJjbGUgY3g9IjU4IiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8cGF0aCBkPSJNNDUgNTUgUTUwIDU4IDU1IDU1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4='
  },
  {
    id: 'panda',
    name: '熊猫',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGRkZGRiIvPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjMDAwIi8+CiAgPGNpcmNsZSBjeD0iNzAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiMwMDAiLz4KICA8Y2lyY2xlIGN4PSIzNSIgY3k9IjMwIiByPSIxMiIgZmlsbD0iI0ZGRkZGRiIvPgogIDxjaXJjbGUgY3g9IjY1IiBjeT0iMzAiIHI9IjEyIiBmaWxsPSIjRkZGRkZGIi8+CiAgPGNpcmNsZSBjeD0iNDIiIGN5PSI0NSIgcj0iMyIgZmlsbD0iIzAwMCIvPgogIDxjaXJjbGUgY3g9IjU4IiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8ZWxsaXBzZSBjeD0iNTAiIGN5PSI1NSIgcng9IjYiIHJ5PSI0IiBmaWxsPSIjMDAwIi8+CiAgPHBhdGggZD0iTTQyIDYyIFE1MCA2NyA1OCA2MiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+'
  },
  {
    id: 'fox',
    name: '小狐',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGOEMwMCIvPgogIDxwb2x5Z29uIHBvaW50cz0iMzUsMjUgNDUsNSA1NSwyNSIgZmlsbD0iI0ZGOEMwMCIvPgogIDxwb2x5Z29uIHBvaW50cz0iNTUsMjUgNjUsNSA3NSwyNSIgZmlsbD0iI0ZGOEMwMCIvPgogIDxwb2x5Z29uIHBvaW50cz0iNDIsMjAgNDgsMTAgNTIsMjAiIGZpbGw9IiNGRkZGRkYiLz4KICA8cG9seWdvbiBwb2ludHM9IjU4LDIwIDYyLDEwIDY4LDIwIiBmaWxsPSIjRkZGRkZGIi8+CiAgPGNpcmNsZSBjeD0iNDIiIGN5PSI0NSIgcj0iMyIgZmlsbD0iIzAwMCIvPgogIDxjaXJjbGUgY3g9IjU4IiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8ZWxsaXBzZSBjeD0iNTAiIGN5PSI1NSIgcng9IjYiIHJ5PSI0IiBmaWxsPSIjMDAwIi8+CiAgPHBhdGggZD0iTTQyIDYyIFE1MCA2NyA1OCA2MiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+'
  }
]

const characterAvatars = [
  {
    id: 'robot',
    name: '机器人',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB4PSIyMCIgeT0iMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgcng9IjEwIiBmaWxsPSIjNDE2OUUxIi8+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iOCIgZmlsbD0iIzQxNjlFMSIvPgogIDxjaXJjbGUgY3g9IjgwIiBjeT0iMjAiIHI9IjgiIGZpbGw9IiM0MTY5RTEiLz4KICA8cmVjdCB4PSIzNSIgeT0iNDAiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwMEZGMDAiLz4KICA8cmVjdCB4PSI1NyIgeT0iNDAiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwMEZGMDAiLz4KICA8cmVjdCB4PSI0MiIgeT0iNTUiIHdpZHRoPSIxNiIgaGVpZ2h0PSI0IiBmaWxsPSIjRkZGRkZGIi8+CiAgPHJlY3QgeD0iMjUiIHk9Ijg1IiB3aWR0aD0iMTIiIGhlaWdodD0iOCIgZmlsbD0iIzQxNjlFMSIvPgogIDxyZWN0IHg9IjYzIiB5PSI4NSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjgiIGZpbGw9IiM0MTY5RTEiLz4KPC9zdmc+'
  },
  {
    id: 'princess',
    name: '公主',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGREJBQyIvPgogIDxwYXRoIGQ9Ik0yMCAzMCBRMzAgMTAgNTAgMTAgUTcwIDEwIDgwIDMwIFE3NSAyNSA2NSAyNSBRNTUgMjAgNTAgMjAgUTQ1IDIwIDM1IDI1IFEyNSAyNSAyMCAzMCIgZmlsbD0iI0ZGRDcwMCIvPgogIDxjaXJjbGUgY3g9IjQyIiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8Y2lyY2xlIGN4PSI1OCIgY3k9IjQ1IiByPSIzIiBmaWxsPSIjMDAwIi8+CiAgPHBhdGggZD0iTTQyIDU1IFE1MCA2MCA1OCA1NSIgc3Ryb2tlPSIjRkYxNDkzIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8Y2lyY2xlIGN4PSIzNSIgY3k9IjM4IiByPSI0IiBmaWxsPSIjRkY2OUI0Ii8+CiAgPGNpcmNsZSBjeD0iNjUiIGN5PSIzOCIgcj0iNCIgZmlsbD0iI0ZGNjlCNCIvPgo8L3N2Zz4='
  },
  {
    id: 'superhero',
    name: '超人',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGREJBQyIvPgogIDxwYXRoIGQ9Ik0yNSAyNSBRNDAgMTUgNTAgMTUgUTYwIDE1IDc1IDI1IFE3MCAyMCA2MCAyMCBRNTAgMTggNDAgMjAgUTMwIDIwIDI1IDI1IiBmaWxsPSIjMDAwIi8+CiAgPGNpcmNsZSBjeD0iNDIiIGN5PSI0NSIgcj0iMyIgZmlsbD0iIzAwMCIvPgogIDxjaXJjbGUgY3g9IjU4IiBjeT0iNDUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8cGF0aCBkPSJNNDIgNTUgUTUwIDYwIDU4IDU1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgogIDxyZWN0IHg9IjM1IiB5PSI3MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjE1IiBmaWxsPSIjREMxNDNDIi8+CiAgPHBvbHlnb24gcG9pbnRzPSI0NSw3NSA1MCw3MCA1NSw3NSIgZmlsbD0iI0ZGRDcwMCIvPgo8L3N2Zz4='
  }
]

const emojiAvatars = [
  {
    id: 'smile',
    name: '笑脸',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGRDcwMCIvPgogIDxjaXJjbGUgY3g9IjM1IiBjeT0iNDAiIHI9IjUiIGZpbGw9IiMwMDAiLz4KICA8Y2lyY2xlIGN4PSI2NSIgY3k9IjQwIiByPSI1IiBmaWxsPSIjMDAwIi8+CiAgPHBhdGggZD0iTTMwIDYwIFE1MCA4MCA3MCA2MCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+'
  },
  {
    id: 'wink',
    name: '眨眼',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGRDcwMCIvPgogIDxwYXRoIGQ9Ik0zMCAzOCBRMzUgNDIgNDAgMzgiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+CiAgPGNpcmNsZSBjeD0iNjUiIGN5PSI0MCIgcj0iNSIgZmlsbD0iIzAwMCIvPgogIDxwYXRoIGQ9Ik0zMCA2MCBRNTMGOCA3MCA2MCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+'
  },
  {
    id: 'cool',
    name: '酷炫',
    url: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI0ZGRDcwMCIvPgogIDxyZWN0IHg9IjI1IiB5PSIzNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjEyIiByeD0iNiIgZmlsbD0iIzAwMCIvPgogIDxyZWN0IHg9IjMwIiB5PSIzNyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjgiIHJ4PSI0IiBmaWxsPSIjMzMzIi8+CiAgPHJlY3QgeD0iNTIiIHk9IjM3IiB3aWR0aD0iMTgiIGhlaWdodD0iOCIgcng9IjQiIGZpbGw9IiMzMzMiLz4KICA8cGF0aCBkPSJNMzUgNjUgUTUwIDcwIDY1IDY1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4='
  }
]

// 当前显示的头像URL
const currentAvatar = computed(() => {
  if (!props.modelValue) {
    return animalAvatars[0].url // 默认小猫头像
  }
  
  // 如果是完整的URL，直接返回
  if (props.modelValue.startsWith('http') || props.modelValue.startsWith('data:')) {
    return props.modelValue
  }
  
  // 如果是头像ID，查找对应的URL
  const allAvatars = [...animalAvatars, ...characterAvatars, ...emojiAvatars]
  const avatar = allAvatars.find(a => a.id === props.modelValue)
  return avatar ? avatar.url : animalAvatars[0].url
})

// 选择头像
const selectAvatar = (avatarId: string) => {
  selectedAvatar.value = avatarId
}

// 初始化选中的头像
watch(() => props.modelValue, (newValue) => {
  selectedAvatar.value = newValue || ''
}, { immediate: true })

// 确认选择
const handleConfirm = () => {
  if (selectedAvatar.value) {
    emit('update:modelValue', selectedAvatar.value)
    emit('change', selectedAvatar.value)
  }
  showSelector.value = false
}

// 取消选择
const handleCancel = () => {
  selectedAvatar.value = props.modelValue || ''
  showSelector.value = false
}

// 自定义上传
const handleCustomUpload = (file: File) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      selectedAvatar.value = result
      message.success('图片已选择，点击确定保存')
      resolve(false) // 阻止默认上传行为
    }
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.avatar-selector {
  position: relative;
  display: inline-block;
}

.current-avatar {
  position: relative;
  cursor: pointer;
}

.avatar-display {
  transition: all 0.3s ease;
}

.current-avatar:hover .avatar-display {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.avatar-edit-overlay {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  background: #1890ff;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.avatar-selector-content {
  max-height: 500px;
  overflow-y: auto;
}

.avatar-category {
  margin-bottom: 24px;
}

.avatar-category h4 {
  margin: 0 0 12px 0;
  color: #262626;
  font-weight: 600;
  font-size: 16px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.avatar-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.avatar-option:hover {
  border-color: #1890ff;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.avatar-option.active {
  border-color: #1890ff;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  background: #f0f8ff;
}

.avatar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.custom-upload {
  margin-top: 16px;
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.custom-upload-btn {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .avatar-option {
    padding: 8px;
  }
}

@media (max-width: 576px) {
  .avatar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .avatar-label {
    font-size: 11px;
  }
}
</style>