<template>
  <div class="policy-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <a-button type="text" size="small" @click="handleBack" class="back-btn">
            <left-outlined />
            返回数查一点通
          </a-button>
          <h1 class="page-title">
            <setting-outlined class="title-icon" />
            三级政策管理系统
          </h1>
        </div>
        <div class="header-right">
          <a-space>
            <a-button type="text" @click="handleImport" :loading="importLoading">
              <import-outlined />
              批量导入
            </a-button>
            <a-button type="text" @click="handleExport" :loading="exportLoading">
              <export-outlined />
              导出数据
            </a-button>
            <a-button type="primary" @click="handleSave" :loading="saveLoading">
              <save-outlined />
              保存修改
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <a-row :gutter="16" class="content-row">
        <!-- 左侧：三级导航树 -->
        <a-col :xs="24" :sm="24" :md="8" :lg="6" class="navigation-col">
          <div class="navigation-panel">
            <PolicyNavigationTree
              :selected-region="selectedRegion"
              @region-selected="handleRegionSelected"
              @region-expanded="handleRegionExpanded"
            />
          </div>
        </a-col>

        <!-- 右侧：政策编辑区域 -->
        <a-col :xs="24" :sm="24" :md="16" :lg="18" class="editor-col">
          <div class="editor-panel">
            <!-- 当前选中区域信息 -->
            <div v-if="selectedRegion" class="selected-region-info">
              <a-breadcrumb class="region-breadcrumb">
                <a-breadcrumb-item v-if="selectedRegion.province">
                  {{ selectedRegion.province }}
                </a-breadcrumb-item>
                <a-breadcrumb-item v-if="selectedRegion.city">
                  {{ selectedRegion.city }}
                </a-breadcrumb-item>
                <a-breadcrumb-item v-if="selectedRegion.company">
                  {{ selectedRegion.company }}
                </a-breadcrumb-item>
              </a-breadcrumb>
              
              <a-tag :color="getRegionLevelColor(selectedRegion.region_level)" class="level-tag">
                {{ getRegionLevelText(selectedRegion.region_level) }}
              </a-tag>
            </div>

            <!-- 政策编辑表单区域 -->
            <div class="policy-editor">
              <!-- 省级政策编辑 -->
              <ProvincePolicy
                v-if="selectedRegion?.region_level === 'province'"
                :region="selectedRegion"
                :policy-data="currentPolicyData"
                @policy-changed="handlePolicyChanged"
                @form-valid="handleFormValid"
              />

              <!-- 公司级政策编辑 -->
              <CompanyPolicy
                v-else-if="selectedRegion?.region_level === 'company'"
                :region="selectedRegion"
                :policy-data="currentPolicyData"
                @policy-changed="handlePolicyChanged"
                @form-valid="handleFormValid"
              />

              <!-- 未选择或市级提示 -->
              <div v-else class="no-selection-hint">
                <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE" description="">
                  <template #description>
                    <span v-if="!selectedRegion" class="hint-text">
                      请从左侧选择要编辑的省份或区县公司
                    </span>
                    <span v-else class="hint-text">
                      市级主要起到连接作用，请选择具体的省份或区县公司进行编辑
                    </span>
                  </template>
                </a-empty>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 保存确认对话框 -->
    <a-modal
      v-model:open="saveConfirmVisible"
      title="确认保存"
      @ok="confirmSave"
      @cancel="saveConfirmVisible = false"
    >
      <p>确定要保存当前的政策修改吗？</p>
      <a-alert
        v-if="hasUnsavedChanges"
        message="检测到未保存的修改"
        type="warning"
        show-icon
        class="save-warning"
      />
    </a-modal>

    <!-- 导入对话框 -->
    <a-modal
      v-model:open="importVisible"
      title="批量导入政策数据"
      @ok="confirmImport"
      @cancel="importVisible = false"
      :ok-button-props="{ disabled: !importFile }"
    >
      <a-upload-dragger
        v-model:file-list="importFileList"
        :before-upload="beforeUpload"
        accept=".xlsx,.xls"
        :multiple="false"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">
          支持Excel文件格式(.xlsx, .xls)
        </p>
      </a-upload-dragger>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal, Empty } from 'ant-design-vue'
import {
  LeftOutlined,
  SettingOutlined,
  ImportOutlined,
  ExportOutlined,
  SaveOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue'

// 导入子组件
import PolicyNavigationTree from './components/PolicyNavigationTree.vue'
import ProvincePolicy from './components/ProvincePolicy.vue'
import CompanyPolicy from './components/CompanyPolicy.vue'

// 导入API
import { policyManagementAPI } from '@/api/policies'

// 类型定义
interface Region {
  region_id: number
  province?: string
  city?: string
  company?: string
  region_level: 'province' | 'city' | 'company'
  region_code: string
}

interface PolicyData {
  [key: string]: any
}

const router = useRouter()

// 响应式数据
const selectedRegion = ref<Region | null>(null)
const currentPolicyData = ref<PolicyData>({})
const hasUnsavedChanges = ref(false)
const formValid = ref(true)

// 加载状态
const saveLoading = ref(false)
const importLoading = ref(false)
const exportLoading = ref(false)

// 对话框状态
const saveConfirmVisible = ref(false)
const importVisible = ref(false)

// 导入文件相关
const importFileList = ref([])
const importFile = ref<File | null>(null)


// 方法
const handleBack = () => {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认离开',
      content: '您有未保存的修改，确定要离开吗？',
      onOk() {
        router.push({ name: 'DataQuery' })
      }
    })
  } else {
    router.push({ name: 'DataQuery' })
  }
}

const handleRegionSelected = async (region: Region) => {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认切换',
      content: '当前有未保存的修改，确定要切换到其他区域吗？',
      async onOk() {
        selectedRegion.value = region
        await loadPolicyData(region)
        hasUnsavedChanges.value = false
      }
    })
  } else {
    selectedRegion.value = region
    await loadPolicyData(region)
  }
}

const handleRegionExpanded = (regionId: number) => {
  // 处理树节点展开事件，可以在这里预加载数据
  console.log('Region expanded:', regionId)
}

const loadPolicyData = async (region: Region) => {
  try {
    console.log('加载政策数据 - 区域信息:', region)
    
    // 使用新的层级API获取政策数据
    const regionPoliciesResponse = await policyManagementAPI.getRegionPolicies(region.region_id)
    console.log('获取到的政策数据:', regionPoliciesResponse)
    
    let policyData: PolicyData = {}
    
    if (region.region_level === 'province' && regionPoliciesResponse.policies?.province) {
      // 省级政策数据
      policyData = regionPoliciesResponse.policies.province
    } else if (region.region_level === 'company' && regionPoliciesResponse.policies?.company) {
      // 公司级政策数据
      policyData = regionPoliciesResponse.policies.company
    }
    
    console.log('处理后的政策数据:', policyData)
    currentPolicyData.value = policyData
  } catch (error) {
    console.error('加载政策数据失败:', error)
    message.error(`加载${region.region_level === 'province' ? '省级' : '公司级'}政策数据失败`)
    currentPolicyData.value = {}
  }
}

const handlePolicyChanged = (policyData: PolicyData) => {
  currentPolicyData.value = { ...currentPolicyData.value, ...policyData }
  hasUnsavedChanges.value = true
}

const handleFormValid = (valid: boolean) => {
  formValid.value = valid
}

const handleSave = () => {
  if (!selectedRegion.value) {
    message.warning('请先选择要编辑的区域')
    return
  }
  
  if (!formValid.value) {
    message.error('表单验证失败，请检查输入')
    return
  }
  
  saveConfirmVisible.value = true
}

const confirmSave = async () => {
  try {
    saveLoading.value = true
    
    if (selectedRegion.value?.region_level === 'province') {
      await policyManagementAPI.updateProvincePolicy(
        selectedRegion.value.region_id, 
        currentPolicyData.value
      )
    } else if (selectedRegion.value?.region_level === 'company') {
      await policyManagementAPI.updateCompanyPolicyByRegion(
        selectedRegion.value.region_id, 
        currentPolicyData.value
      )
    }
    
    message.success('保存成功')
    hasUnsavedChanges.value = false
    saveConfirmVisible.value = false
  } catch (error) {
    console.error('保存失败:', error)
    message.error('保存失败，请重试')
  } finally {
    saveLoading.value = false
  }
}


const handleImport = () => {
  importVisible.value = true
}

const handleExport = async () => {
  try {
    exportLoading.value = true
    const response = await policyManagementAPI.exportPolicies()
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `政策数据导出_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

const beforeUpload = (file: File) => {
  importFile.value = file
  return false // 阻止自动上传
}

const confirmImport = async () => {
  if (!importFile.value) {
    message.error('请选择要导入的文件')
    return
  }
  
  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', importFile.value)
    
    await policyManagementAPI.importPolicies(formData)
    message.success('导入成功')
    importVisible.value = false
    
    // 刷新当前数据
    if (selectedRegion.value) {
      await loadPolicyData(selectedRegion.value)
    }
  } catch (error) {
    console.error('导入失败:', error)
    message.error('导入失败，请重试')
  } finally {
    importLoading.value = false
  }
}

const getRegionLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    province: 'blue',
    city: 'green',
    company: 'orange'
  }
  return colorMap[level] || 'default'
}

const getRegionLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    province: '省级',
    city: '市级',
    company: '区县公司'
  }
  return textMap[level] || level
}


// 页面卸载前提醒
onBeforeUnmount(() => {
  if (hasUnsavedChanges.value) {
    return '您有未保存的修改，确定要离开吗？'
  }
})

onMounted(() => {
  // 页面初始化逻辑
  console.log('政策管理页面已加载')
})
</script>

<style scoped lang="less">
.policy-management-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 16px 24px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .back-btn {
        color: #666;
        
        &:hover {
          color: #1890ff;
        }
      }
      
      .page-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .title-icon {
          color: #1890ff;
          font-size: 18px;
        }
      }
    }
  }
}

.main-content {
  flex: 1;
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  
  .content-row {
    height: 100%;
  }
  
  .navigation-col,
  .editor-col {
    height: 100%;
  }
}

.navigation-panel {
  background: white;
  border-radius: 8px;
  height: 100%;
  overflow: hidden;
}

.editor-panel {
  background: white;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .selected-region-info {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .region-breadcrumb {
      :deep(.ant-breadcrumb-link) {
        font-weight: 500;
        color: #333;
      }
    }
    
    .level-tag {
      font-size: 12px;
      font-weight: 500;
    }
  }
  
  .policy-editor {
    flex: 1;
    overflow-y: auto;
  }
  
  .no-selection-hint {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .hint-text {
      color: #999;
      font-size: 14px;
    }
  }
}

.save-warning {
  margin-top: 16px;
}

// 响应式适配
@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
    
    .header-content {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      
      .header-left {
        justify-content: center;
        
        .page-title {
          font-size: 18px;
        }
      }
      
      .header-right {
        :deep(.ant-space) {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
  
  .main-content {
    padding: 12px;
    
    .navigation-col {
      margin-bottom: 16px;
    }
  }
  
  .navigation-panel {
    height: 300px;
  }
}
</style>