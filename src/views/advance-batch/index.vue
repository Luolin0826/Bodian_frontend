<template>
  <div class="advance-batch-container">

    <!-- 院校管理弹窗 -->
    <UniversityManagement
      v-model:visible="universityManagementVisible"
      :universities="universities"
      :loading="universitiesLoading"
      @refresh="fetchUniversities"
    />

    <!-- 融合的反馈管理弹窗（包含站点管理功能） -->
    <IntegratedFeedbackManagement
      v-model:visible="feedbackManagementVisible"
      @refresh="handleRefreshData"
    />

    <!-- 院校就业信息头部 -->
    <UniversityHeader
      :universities="universities"
      :loading="universitiesLoading"
      :can-manage="canManageContent"
      @manage="handleManageUniversities"
    />

    <!-- 省份筛选工具栏 -->
    <ProvinceFilter
      :provinces="availableProvinces"
      :selected="selectedProvince"
      :can-manage="canManageContent"
      @change="handleProvinceFilter"
      @manage-feedback="handleManageFeedbackGlobal"
    />

    <!-- 省份提前批信息展示区域 -->
    <div class="provinces-section">
      <a-spin :spinning="provincesLoading">
        <div class="provinces-list">
          <ProvinceCard
            v-for="province in filteredProvinces"
            :key="province.id"
            :province="province"
            @view-announcement="handleViewAnnouncement"
            @view-feedback="handleViewFeedback"
            @manage-feedback="handleManageFeedback"
          />
        </div>
      </a-spin>
    </div>

    <!-- 空状态 -->
    <a-empty 
      v-if="!provincesLoading && filteredProvinces.length === 0"
      description="暂无提前批信息"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { BankOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import UniversityHeader from './components/UniversityHeader.vue'
import UniversityManagement from './components/UniversityManagement.vue'
import IntegratedFeedbackManagement from './components/IntegratedFeedbackManagement.vue'
import ProvinceFilter from './components/ProvinceFilter.vue'
import ProvinceCard from './components/ProvinceCard.vue'
import { advanceBatchApi } from '@/api/advance-batch'
import type { 
  UniversityInfo, 
  ProvinceAdvanceBatch, 
 
} from '@/api/types/advance-batch'

// 用户store
const userStore = useUserStore()

const universities = ref<UniversityInfo[]>([])
const provinces = ref<ProvinceAdvanceBatch[]>([])
const selectedProvince = ref<string>('')
const universitiesLoading = ref(false)
const provincesLoading = ref(false)
const universityManagementVisible = ref(false)
const feedbackManagementVisible = ref(false)

// 可用省份选项
const availableProvinces = computed(() => {
  const provinceNames = provinces.value.map(p => p.province)
  return Array.from(new Set(provinceNames)).map(name => ({ label: name, value: name }))
})

// 筛选后的省份列表
const filteredProvinces = computed(() => {
  if (!selectedProvince.value) return provinces.value
  return provinces.value.filter(p => p.province === selectedProvince.value)
})

// 权限控制 - 院校管理和反馈管理只有管理员和超级管理员可见
const canManageContent = computed(() => {
  return userStore.role === 'super_admin' || userStore.role === 'admin'
})


// 获取院校信息
const fetchUniversities = async (params?: { page?: number, size?: number, all?: boolean }) => {
  try {
    universitiesLoading.value = true
    const response = await advanceBatchApi.getUniversities(params)
    universities.value = response.data.universities
  } catch (error) {
    console.error('获取院校信息失败:', error)
    message.error('获取院校信息失败')
  } finally {
    universitiesLoading.value = false
  }
}

// 获取省份信息
const fetchProvinces = async (province?: string) => {
  try {
    provincesLoading.value = true
    const response = await advanceBatchApi.getProvinces({ province })
    provinces.value = response.data.provinces || []
    
    console.log('获取省份数据:', provinces.value)
  } catch (error) {
    console.error('获取省份信息失败:', error)
    message.error('获取省份信息失败')
    provinces.value = []
  } finally {
    provincesLoading.value = false
  }
}



// 省份筛选
const handleProvinceFilter = (province: string) => {
  selectedProvince.value = province
  if (province) {
    fetchProvinces(province)
  } else {
    fetchProvinces()
  }
}

// 院校管理操作
const handleManageUniversities = () => {
  universityManagementVisible.value = true
}

// 查看公告
const handleViewAnnouncement = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 查看反馈详情
const handleViewFeedback = (provinceId: number) => {
  message.info(`查看省份 ${provinceId} 的反馈详情`)
}

// 管理反馈
const handleManageFeedback = (provinceId: number) => {
  message.info(`管理省份 ${provinceId} 的反馈信息`)
}

// 全局管理反馈
const handleManageFeedbackGlobal = () => {
  feedbackManagementVisible.value = true
}

// 刷新数据
const handleRefreshData = async () => {
  try {
    // 并行刷新所有相关数据
    await Promise.all([
      fetchProvinces(),      // 刷新省份数据（包含最新的站点和反馈信息）
      fetchUniversities({ all: true })    // 刷新院校数据（可能有新增的院校）
    ])
    console.log('主页面数据刷新完成')
  } catch (error) {
    console.error('数据刷新失败:', error)
  }
}

onMounted(() => {
  fetchUniversities({ all: true }) // 获取所有院校数据用于展示
  fetchProvinces()
})
</script>

<style lang="less" scoped>
.advance-batch-container {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f5f5f5;

  .provinces-section {
    .provinces-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    .provinces-section .provinces-list {
      gap: 16px;
    }
  }
}
</style>