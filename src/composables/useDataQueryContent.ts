import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  getProvinceAllContent,
  type DataQueryContent
} from '@/api/data-query-content'
import { getUnitDetails } from '@/api/policies'

export interface DataQueryState {
  '基本政策信息': {
    loading: boolean
    data: DataQueryContent[]
    hasData: boolean
  }
  '提前批': {
    loading: boolean
    data: DataQueryContent[]
    hasData: boolean
  }
  '农网': {
    loading: boolean
    data: DataQueryContent[]
    hasData: boolean
  }
}

export function useDataQueryContent() {
  // 状态数据
  const loading = ref(false)
  const currentProvince = ref('')
  const state = ref<DataQueryState>({
    '基本政策信息': {
      loading: false,
      data: [],
      hasData: false
    },
    '提前批': {
      loading: false,
      data: [],
      hasData: false
    },
    '农网': {
      loading: false,
      data: [],
      hasData: false
    }
  })

  // 计算属性
  const allLoading = computed(() => {
    return loading.value || 
           state.value['基本政策信息'].loading ||
           state.value['提前批'].loading ||
           state.value['农网'].loading
  })

  const hasAnyData = computed(() => {
    return state.value['基本政策信息'].hasData ||
           state.value['提前批'].hasData ||
           state.value['农网'].hasData
  })

  // 获取单位名称（用于查询）
  const getProvinceName = async (unitId?: number, unitInfo?: any): Promise<string> => {
    // 直接使用单位名称，无论是省公司还是直属单位
    if (unitInfo?.unit_name) {
      console.log('🏢 使用单位名称进行查询:', unitInfo.unit_name)
      return unitInfo.unit_name
    }
    
    if (unitId) {
      try {
        const unitDetails = await getUnitDetails(unitId)
        console.log('🏢 从API获取单位名称:', unitDetails.unit_name)
        return unitDetails.unit_name
      } catch (error) {
        console.warn('⚠️ 无法获取单位信息:', error)
      }
    }
    
    return ''
  }

  // 一次性加载省份的所有内容
  const loadProvinceContent = async (unitId?: number, unitInfo?: any) => {
    try {
      loading.value = true
      
      // 获取省份名称
      const provinceName = await getProvinceName(unitId, unitInfo)
      if (!provinceName) {
        console.warn('⚠️ 无法确定省份名称，无法加载内容')
        resetState()
        return
      }

      currentProvince.value = provinceName
      console.log('🔍 开始加载省份内容，省份:', provinceName)

      // 一次性获取所有专栏内容
      const allContent = await getProvinceAllContent(provinceName)
      console.log('📋 获取到省份所有内容:', allContent)

      // 更新各专栏状态
      Object.keys(allContent).forEach(section => {
        const sectionKey = section as keyof typeof allContent
        const contents = allContent[sectionKey]
        
        state.value[sectionKey] = {
          loading: false,
          data: contents,
          hasData: contents.length > 0
        }
      })

      console.log('✅ 省份内容加载完成')
      
    } catch (error) {
      console.error('❌ 加载省份内容失败:', error)
      message.error('加载内容失败，请重试')
      resetState()
    } finally {
      loading.value = false
    }
  }

  // 加载单个专栏内容（如果需要单独刷新）
  const loadSectionContent = async (section: keyof DataQueryState) => {
    if (!currentProvince.value) {
      console.warn('⚠️ 无省份信息，无法加载专栏内容')
      return
    }

    try {
      state.value[section].loading = true
      
      // 重新获取该省份的所有内容，然后更新指定专栏
      const allContent = await getProvinceAllContent(currentProvince.value)
      const contents = allContent[section]
      
      state.value[section] = {
        loading: false,
        data: contents,
        hasData: contents.length > 0
      }
      
      console.log(`✅ ${section}内容刷新完成`)
      
    } catch (error) {
      console.error(`❌ 加载${section}内容失败:`, error)
      message.error(`加载${section}内容失败`)
      state.value[section].loading = false
    }
  }

  // 重置状态
  const resetState = () => {
    currentProvince.value = ''
    Object.keys(state.value).forEach(section => {
      const sectionKey = section as keyof DataQueryState
      state.value[sectionKey] = {
        loading: false,
        data: [],
        hasData: false
      }
    })
  }

  // 将内容转换为组件期望的格式
  const convertToComponentFormat = (contents: DataQueryContent[]) => {
    const converted: Record<string, any> = {}
    
    contents.forEach((contentItem, index) => {
      const fieldName = `content_${contentItem.id}`
      converted[fieldName] = {
        value: contentItem.content,
        display_name: contentItem.title,
        type: 'textarea' as const,
        priority: contentItem.display_order || index + 1,
        data_source: 'data_query_content'
      }
    })
    
    return converted
  }

  return {
    // 状态
    loading: allLoading,
    currentProvince,
    state,
    hasAnyData,
    
    // 方法
    loadProvinceContent,
    loadSectionContent,
    resetState,
    convertToComponentFormat,
    
    // 便捷访问器
    basicPolicyData: computed(() => state.value['基本政策信息']),
    earlyBatchData: computed(() => state.value['提前批']),
    ruralGridData: computed(() => state.value['农网'])
  }
}