import { ref, computed, onMounted } from 'vue'
import { getUserPreferences, type UserPreferences } from '@/api/user-center'

const preferences = ref<UserPreferences>({
  appearance: {
    theme_mode: 'light',
    sidebar_collapsed: false,
    show_breadcrumb: true,
    language: 'zh-CN',
    font_size: 'medium'
  },
  notification: {
    system_notification: true,
    email_notification: false,
    sound_notification: true,
    browser_notification: true
  },
  security: {
    auto_logout_time: 60,
    session_timeout: 30,
    enable_two_factor: false
  },
  workspace: {
    default_page: '/dashboard',
    items_per_page: 100,
    date_format: 'YYYY-MM-DD',
    time_format: '24h'
  }
})

const isLoaded = ref(false)

export const useUserPreferences = () => {
  const fetchPreferences = async () => {
    try {
      const response = await getUserPreferences()
      if (response.code === 0) {
        preferences.value = { ...preferences.value, ...response.data }
      }
    } catch (error) {
      console.error('获取用户偏好设置失败:', error)
    } finally {
      isLoaded.value = true
    }
  }

  const itemsPerPage = computed(() => preferences.value.workspace.items_per_page)
  const dateFormat = computed(() => preferences.value.workspace.date_format)
  const timeFormat = computed(() => preferences.value.workspace.time_format)
  const defaultPage = computed(() => preferences.value.workspace.default_page)

  const loadPreferencesOnce = () => {
    if (!isLoaded.value) {
      fetchPreferences()
    }
  }

  return {
    preferences,
    isLoaded,
    fetchPreferences,
    loadPreferencesOnce,
    // Computed getters for common preferences
    itemsPerPage,
    dateFormat,
    timeFormat,
    defaultPage
  }
}