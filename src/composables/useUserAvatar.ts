import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { getAvatarDisplayUrl } from '@/api/avatar'
import { getDisplayAvatar } from '@/utils/avatar'

/**
 * 用户头像管理组合式API
 * 提供统一的头像显示和更新逻辑
 */
export function useUserAvatar() {
  const userStore = useUserStore()
  const displayUrl = ref('')
  const loading = ref(false)
  
  // 当前用户头像值
  const avatarValue = computed(() => userStore.userInfo?.avatar)
  
  // 更新头像显示URL
  const updateDisplayUrl = async (value?: string) => {
    try {
      loading.value = true
      const avatarId = value || avatarValue.value
      
      console.log('🔄 更新头像显示URL:', avatarId)
      
      if (!avatarId) {
        // 使用默认头像
        displayUrl.value = getDisplayAvatar()
        return
      }
      
      // 首先尝试异步获取（从API）
      if (avatarId && !avatarId.startsWith('data:') && !avatarId.startsWith('http')) {
        try {
          const url = await getAvatarDisplayUrl(avatarId)
          displayUrl.value = url
          console.log('✅ 异步获取头像成功:', url.substring(0, 50) + '...')
          return
        } catch (error) {
          console.warn('⚠️ 异步获取头像失败，使用同步方法:', error)
        }
      }
      
      // 回退到同步获取（本地映射）
      displayUrl.value = getDisplayAvatar(avatarId)
      console.log('✅ 同步获取头像:', displayUrl.value.substring(0, 50) + '...')
      
    } catch (error) {
      console.error('❌ 头像显示更新失败:', error)
      displayUrl.value = getDisplayAvatar() // 使用默认头像
    } finally {
      loading.value = false
    }
  }
  
  // 监听头像变化
  watch(avatarValue, (newValue) => {
    console.log('👁️ 检测到头像变化:', newValue)
    updateDisplayUrl(newValue)
  }, { immediate: true })
  
  // 监听userStore整体变化
  userStore.$subscribe((mutation, state) => {
    console.log('👁️ UserStore订阅变化:', mutation.type, state.userInfo?.avatar)
    updateDisplayUrl()
  })
  
  return {
    displayUrl,
    loading,
    
    /**
     * 手动刷新头像
     */
    refresh: () => updateDisplayUrl(),
    
    /**
     * 设置新头像（仅更新显示，不调用API）
     */
    setDisplayUrl: (url: string) => {
      displayUrl.value = url
    }
  }
}