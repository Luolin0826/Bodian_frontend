<template>
  <a-modal
    v-model:open="visible"
    title="反馈管理"
    width="1000px"
    :footer="null"
    class="integrated-feedback-modal"
  >
    <div class="integrated-feedback-management">
      <!-- 操作工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索反馈内容、省份、站点"
            style="width: 300px"
            @search="handleSearch"
            @change="handleSearchInputChange"
            :loading="searchLoading"
            allow-clear
          />
          <div v-if="isSearchMode" class="search-status">
            <a-tag color="blue">
              搜索结果: {{ feedbacks.length }} 条
            </a-tag>
            <a-button type="link" size="small" @click="handleClearSearch">
              清除搜索
            </a-button>
          </div>
        </div>
        <a-button type="primary" @click="handleAddFeedback">
          <PlusOutlined />
          新增反馈
        </a-button>
      </div>

      <!-- 反馈列表表格 -->
      <a-table
        :dataSource="sortedFeedbacks"
        :columns="columns"
        :loading="loading"
        :pagination="{
          total: sortedFeedbacks.length,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }"
        row-key="id"
        size="middle"
        class="feedback-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'province_station'">
            <div class="province-station-info">
              <div class="province-name">{{ record.province || '-' }}</div>
              <div class="station-name" v-if="record.station_name">
                {{ record.station_name }}
              </div>
            </div>
          </template>
          
          <template v-else-if="column.key === 'content'">
            <div class="content-preview">
              <a @click="handleViewFeedback(record as any)" class="content-link">
                {{ truncateText(record.content, 80) }}
              </a>
            </div>
          </template>
          
          <template v-else-if="column.key === 'created_at'">
            <span class="create-date">{{ formatDate(record.created_at) }}</span>
          </template>
          
          <template v-else-if="column.key === 'actions'">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="handleViewFeedback(record as any)">
                <EyeOutlined />
                查看
              </a-button>
              <a-button type="link" size="small" @click="handleEditFeedback(record as any)">
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个反馈吗？"
                @confirm="handleDeleteFeedback((record as any).id)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 反馈详情查看模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      :title="selectedFeedback ? `${selectedFeedback.province || '未知省份'} - ${selectedFeedback.station_name || '未知站点'}` : '反馈详情'"
      width="800px"
      :footer="null"
      class="feedback-detail-modal"
    >
      <div v-if="selectedFeedback" class="feedback-detail-content">
        <div class="feedback-content">
          <div class="content-text" v-html="formatContent(selectedFeedback.content)"></div>
        </div>
      </div>
    </a-modal>

    <!-- 反馈编辑表单模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      :title="editingFeedback?.id ? '编辑反馈' : '新增反馈'"
      width="900px"
      :confirm-loading="editLoading"
      @ok="handleSaveFeedback"
      @cancel="handleCancelEdit"
    >
      <a-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        layout="vertical"
      >
        <!-- 省份选择区域 -->
        <div class="province-selection-section">
          <a-form-item label="省份选择" name="province">
            <a-auto-complete
              v-model:value="editForm.province"
              :options="provinceAutoCompleteOptions"
              placeholder="请选择现有省份或新建省份"
              @search="handleProvinceSearch"
              @change="(value: any) => handleProvinceChange(value as string)"
              allow-clear
              style="width: 100%;"
            />
            <div class="form-tip">
              💡 提示：请从现有省份中选择，或使用下方"新建省份"按钮添加新省份
            </div>
          </a-form-item>
          
          <!-- 省份管理按钮组 -->
          <div class="province-actions-section">
            <div class="province-actions-toolbar">
              <a-button 
                type="primary" 
                size="small" 
                ghost
                @click="handleCreateNewProvince"
                class="create-province-btn"
              >
                <PlusOutlined />
                新建省份
              </a-button>
              
              <template v-if="editForm.province">
                <a-button 
                  type="primary" 
                  size="small" 
                  ghost
                  @click="handleEditProvinceInfo"
                  class="edit-province-btn"
                >
                  <EditOutlined />
                  编辑省份信息
                </a-button>
                <a-popconfirm
                  title="确定要删除这个省份吗？"
                  description="删除后该省份的所有相关数据都会被清除，此操作不可恢复！"
                  @confirm="handleDeleteProvince"
                  ok-text="确定删除"
                  cancel-text="取消"
                  ok-type="danger"
                >
                  <a-button 
                    type="primary" 
                    size="small" 
                    danger
                    ghost
                    class="delete-province-btn"
                  >
                    <DeleteOutlined />
                    删除省份
                  </a-button>
                </a-popconfirm>
              </template>
            </div>
          </div>
        </div>

        <!-- 省份信息填写区域（当选择省份后显示） -->
        <div v-if="editForm.province" class="province-info-section">
          <div class="form-tip form-note">
            📝 提示：招聘要求和公告链接请在“编辑省份信息”中管理
          </div>
        </div>

        <a-divider>反馈信息</a-divider>
        
        <a-form-item label="站点名称" name="station_name">
          <a-input 
            v-model:value="editForm.station_name" 
            placeholder="请输入站点名称（如：北京大学、清华大学等）" 
          />
          <div class="form-tip">
            💡 提示：如果输入的站点不存在，系统将自动创建
          </div>
        </a-form-item>
        
        <a-form-item label="学员反馈内容" name="content">
          <a-textarea 
            v-model:value="editForm.content" 
            :rows="6" 
            placeholder="请输入学员的真实反馈内容，如面试经历、工作环境、薪资待遇等" 
          />
        </a-form-item>
        
      </a-form>
    </a-modal>

    <!-- 新省份创建模态框 -->
    <a-modal
      v-model:open="newProvinceModalVisible"
      title="新建省份信息"
      width="600px"
      :confirm-loading="newProvinceLoading"
      @ok="handleSaveNewProvince"
      @cancel="handleCancelNewProvince"
    >
      <a-form
        ref="newProvinceFormRef"
        :model="newProvinceForm"
        :rules="newProvinceRules"
        layout="vertical"
      >
        <a-form-item label="省份名称" name="province">
          <a-input v-model:value="newProvinceForm.province" placeholder="请输入省份名称（如：北京市、河北省等）" />
        </a-form-item>
        
        <a-form-item label="招聘要求" name="recruitment_requirements">
          <a-textarea 
            v-model:value="newProvinceForm.recruitment_requirements" 
            :rows="4" 
            placeholder="请输入该省份的招聘要求，如学历要求、专业要求、年龄限制等" 
          />
        </a-form-item>
        
        <a-form-item label="提前批公告链接" name="announcement_url">
          <a-input 
            v-model:value="newProvinceForm.announcement_url" 
            placeholder="请输入该省份提前批招聘的官方公告链接" 
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 省份编辑模态框 -->
    <a-modal
      v-model:open="editProvinceModalVisible"
      title="编辑省份信息"
      width="600px"
      :confirm-loading="editProvinceLoading"
      @ok="handleSaveProvinceEdit"
      @cancel="handleCancelProvinceEdit"
    >
      <a-form
        ref="editProvinceFormRef"
        :model="editProvinceForm"
        :rules="editProvinceRules"
        layout="vertical"
      >
        <a-form-item label="省份名称" name="province">
          <a-input 
            v-model:value="editProvinceForm.province" 
            placeholder="请输入省份名称（如：北京市、河北省等）"
            disabled
          />
          <div class="form-tip">
            💡 提示：省份名称不可修改，如需更改请删除后重新创建
          </div>
        </a-form-item>
        
        <a-form-item label="招聘要求" name="recruitment_requirements">
          <a-textarea 
            v-model:value="editProvinceForm.recruitment_requirements" 
            :rows="4" 
            placeholder="请输入该省份的招聘要求，如学历要求、专业要求、年龄限制等" 
          />
        </a-form-item>
        
        <a-form-item label="提前批公告链接" name="announcement_url">
          <a-input 
            v-model:value="editProvinceForm.announcement_url" 
            placeholder="请输入该省份提前批招聘的官方公告链接" 
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import type { FeedbackInfo, IntegratedFeedbackInfo } from '@/api/types/advance-batch'
import { advanceBatchApi } from '@/api/advance-batch'
import type { FormInstance } from 'ant-design-vue'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// 配置dayjs时区插件
dayjs.extend(utc)
dayjs.extend(timezone)

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'refresh'): void
}

interface ExtendedFeedbackInfo extends IntegratedFeedbackInfo {
  // 已在 IntegratedFeedbackInfo 中定义了所需字段
  // 额外保留的ID字段，用于自动创建检测
  province_plan_id?: number
  station_id?: number
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 数据状态
const feedbacks = ref<ExtendedFeedbackInfo[]>([])
const provinces = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const searchLoading = ref(false)
const isSearchMode = ref(false) // 标记当前是否在搜索模式

// 模态框状态
const detailModalVisible = ref(false)
const selectedFeedback = ref<ExtendedFeedbackInfo | null>(null)
const editModalVisible = ref(false)
const editLoading = ref(false)
const newProvinceModalVisible = ref(false)
const newProvinceLoading = ref(false)
const editProvinceModalVisible = ref(false)
const editProvinceLoading = ref(false)

// 表单引用
const editFormRef = ref<FormInstance>()
const newProvinceFormRef = ref<FormInstance>()
const editProvinceFormRef = ref<FormInstance>()
const editingFeedback = ref<ExtendedFeedbackInfo | null>(null)
const currentEditingProvince = ref<any>(null)

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

// 编辑表单
const editForm = ref({
  province: '',
  station_name: '',
  content: ''
})

// 新省份表单
const newProvinceForm = ref({
  province: '',
  recruitment_requirements: '',
  announcement_url: ''
})

// 编辑省份表单
const editProvinceForm = ref({
  province: '',
  recruitment_requirements: '',
  announcement_url: ''
})

// 表单验证规则
const editRules = {
  province: [{ required: true, message: '请选择或输入省份' }],
  station_name: [{ required: true, message: '请输入站点名称' }],
  content: [{ required: true, message: '请输入学员反馈内容' }]
}

const newProvinceRules = {
  province: [{ required: true, message: '请输入省份名称' }],
  recruitment_requirements: [{ required: true, message: '请输入招聘要求' }]
}

// 编辑省份验证规则
const editProvinceRules = {
  recruitment_requirements: [{ required: true, message: '请输入招聘要求' }]
}

// 省份自动完成 - 从后端API获取
const availableProvinceNames = ref<string[]>([])
const provinceSearchValue = ref('')

const provinceAutoCompleteOptions = computed(() => {
  const baseProvinces = availableProvinceNames.value.length > 0 ? availableProvinceNames.value : []
  
  if (!provinceSearchValue.value) {
    return baseProvinces.map(province => ({ value: province }))
  }
  return baseProvinces
    .filter(province => province.includes(provinceSearchValue.value))
    .map(province => ({ value: province }))
})

// 获取可用的省份名称列表
const fetchAvailableProvinceNames = async () => {
  try {
    const response = await advanceBatchApi.getProvincesList()
    if (response.data && response.data.provinces) {
      availableProvinceNames.value = response.data.provinces
    }
  } catch (error) {
    console.error('获取省份名称列表失败:', error)
    // 如果API失败，使用基础的省份列表作为后备
    availableProvinceNames.value = [
      '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
      '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
      '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省'
    ]
  }
}



// 显示的反馈列表（不再需要前端过滤）
const filteredFeedbacks = computed(() => {
  return feedbacks.value
})

// 按创建日期排序的反馈列表
const sortedFeedbacks = computed(() => {
  return [...filteredFeedbacks.value].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

// 表格列配置
const columns = [
  {
    title: '省份/站点',
    key: 'province_station',
    width: 200
  },
  {
    title: '反馈内容',
    key: 'content',
    ellipsis: true
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 120
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right' as const
  }
]

// 获取反馈列表
const fetchFeedbacks = async () => {
  // 如果在搜索模式下，不重新获取所有数据
  if (isSearchMode.value) return
  
  try {
    loading.value = true
    const response = await advanceBatchApi.getIntegratedFeedback({ size: 200 })
    if (!response.data) return
    
    // 使用集成化反馈数据，映射字段名并保留关联ID
    feedbacks.value = (response.data.feedback || []).map((feedback: any) => ({
      ...feedback,
      // 字段名映射：后端使用 province_name/station_name_text，前端使用 province/station_name
      province: feedback.province_name || feedback.province || '未指定省份',
      station_name: feedback.station_name_text || feedback.station_name || '未指定站点',
      // 保留关联ID，用于后续编辑和自动创建检测
      province_plan_id: feedback.province_plan_id,
      station_id: feedback.station_id
    } as ExtendedFeedbackInfo))
  } catch (error) {
    console.error('获取反馈信息失败:', error)
    message.error('获取反馈信息失败')
  } finally {
    loading.value = false
  }
}


// 获取省份列表
const fetchProvinces = async () => {
  try {
    // 获取详细的省份信息用于自动填充
    const response = await advanceBatchApi.getProvinces()
    if (response.data) {
      provinces.value = response.data.provinces || []
    }
  } catch (error) {
    console.error('获取省份信息失败:', error)
    message.error('获取省份信息失败')
  }
}

// 省份变化处理
const handleProvinceChange = (province: string) => {
  // 反馈编辑只需要选择省份，不需要处理省份级别的数据
  // 省份级别的招聘要求和公告链接通过省份管理功能处理
  console.log('选择了省份:', province)
}

// 省份搜索处理
const handleProvinceSearch = (searchText: string) => {
  provinceSearchValue.value = searchText
}

// 搜索处理
const handleSearch = async (keyword?: string) => {
  const searchValue = keyword || searchKeyword.value
  
  if (!searchValue.trim()) {
    // 清空搜索，回到正常模式
    isSearchMode.value = false
    await fetchFeedbacks()
    return
  }
  
  try {
    searchLoading.value = true
    isSearchMode.value = true
    
    const response = await advanceBatchApi.searchFeedback({
      keyword: searchValue,
      size: 200 // 设置较大的数量以获取更多结果
    })
    
    if (response.data && response.data.feedback) {
      feedbacks.value = response.data.feedback.map((item: any) => ({
        ...item,
        province: item.province_name || item.province,
        station_name: item.station_name_text || item.station_name
      }))
    } else {
      feedbacks.value = []
    }
    
    console.log(`搜索 "${searchValue}" 返回 ${feedbacks.value.length} 条结果`)
  } catch (error) {
    console.error('搜索失败:', error)
    message.error('搜索失败，请稍后重试')
  } finally {
    searchLoading.value = false
  }
}

// 搜索输入框变化处理
const handleSearchInputChange = (e: any) => {
  // 如果输入框被清空，自动清除搜索
  if (!e.target.value.trim() && isSearchMode.value) {
    handleClearSearch()
  }
}

// 清除搜索
const handleClearSearch = async () => {
  searchKeyword.value = ''
  isSearchMode.value = false
  await fetchFeedbacks()
}

// 查看反馈详情
const handleViewFeedback = (feedback: ExtendedFeedbackInfo) => {
  selectedFeedback.value = feedback
  detailModalVisible.value = true
}

// 新增反馈
const handleAddFeedback = () => {
  editingFeedback.value = null
  editForm.value = {
    province: '',
    station_name: '',
    content: ''
  }
  editModalVisible.value = true
}

// 编辑反馈
const handleEditFeedback = (feedback: ExtendedFeedbackInfo) => {
  editingFeedback.value = feedback
  editForm.value = {
    province: feedback.province || '',
    station_name: feedback.station_name || '',
    content: feedback.content || ''
  }
  editModalVisible.value = true
}

// 删除反馈
const handleDeleteFeedback = async (feedbackId: number) => {
  try {
    await advanceBatchApi.deleteFeedback(feedbackId)
    message.success('删除成功')
    
    // 根据当前状态决定如何刷新数据
    if (isSearchMode.value && searchKeyword.value.trim()) {
      // 搜索模式下重新执行搜索以更新搜索结果
      await Promise.all([
        handleSearch(searchKeyword.value.trim()), // 重新搜索
        fetchProvinces()                          // 刷新省份列表
      ])
    } else {
      // 正常模式下刷新所有数据
      await Promise.all([
        fetchFeedbacks(),           // 刷新反馈列表
        fetchProvinces()            // 刷新省份列表（反馈删除可能影响省份统计）
      ])
    }
    
    emit('refresh')               // 刷新主页面
  } catch (error) {
    console.error('删除反馈失败:', error)
    message.error('删除失败')
  }
}

// 创建新省份
const handleCreateNewProvince = () => {
  newProvinceForm.value = {
    province: '',
    recruitment_requirements: '',
    announcement_url: ''
  }
  newProvinceModalVisible.value = true
}

// 保存新省份
const handleSaveNewProvince = async () => {
  try {
    await newProvinceFormRef.value?.validate()
    newProvinceLoading.value = true

    const formData = {
      province: newProvinceForm.value.province,
      batch_id: 1, // 默认批次ID，可以后续优化
      other_requirements: newProvinceForm.value.recruitment_requirements,
      notice_url: newProvinceForm.value.announcement_url,
      notice_title: '招聘公告',
      notice_content: newProvinceForm.value.recruitment_requirements || '详细招聘要求请参考官方公告'
    }

    // 调用创建省份的API
    await advanceBatchApi.createProvince(formData)
    message.success('新省份信息保存成功')
    
    // 刷新所有相关数据
    await Promise.all([
      fetchProvinces(),           // 刷新省份列表
      fetchAvailableProvinceNames() // 刷新可用省份名称
    ])
    emit('refresh')              // 刷新主页面
    
    // 自动选择新创建的省份
    editForm.value.province = newProvinceForm.value.province
    
    newProvinceModalVisible.value = false
  } catch (error) {
    console.error('创建省份失败:', error)
    message.error('创建省份失败')
  } finally {
    newProvinceLoading.value = false
  }
}

// 取消新省份创建
const handleCancelNewProvince = () => {
  newProvinceModalVisible.value = false
  newProvinceFormRef.value?.resetFields()
}

// 编辑省份信息
const handleEditProvinceInfo = () => {
  if (!editForm.value.province) {
    message.warning('请先选择一个省份')
    return
  }
  
  // 获取当前省份的详细信息
  const currentProvince = provinces.value.find(p => p.province === editForm.value.province)
  if (!currentProvince) {
    message.error('未找到省份信息')
    return
  }
  
  // 初始化编辑表单
  editProvinceForm.value = {
    province: currentProvince.province,
    recruitment_requirements: currentProvince.other_requirements || '',
    announcement_url: currentProvince.notice_url || ''
  }
  
  currentEditingProvince.value = currentProvince
  editProvinceModalVisible.value = true
}

// 保存省份编辑
const handleSaveProvinceEdit = async () => {
  try {
    await editProvinceFormRef.value?.validate()
    editProvinceLoading.value = true
    
    const updateData = {
      other_requirements: editProvinceForm.value.recruitment_requirements,
      notice_url: editProvinceForm.value.announcement_url,
      notice_title: '招聘公告',
      notice_content: editProvinceForm.value.recruitment_requirements || '详细招聘要求请参考官方公告'
    }
    
    // 调用更新省份的API
    await advanceBatchApi.updateProvince(currentEditingProvince.value.id, updateData)
    message.success('省份信息更新成功')
    
    // 刷新所有相关数据
    await Promise.all([
      fetchProvinces(),           // 刷新省份列表
      fetchFeedbacks()            // 刷新反馈列表（可能包含新的省份信息）
    ])
    emit('refresh')              // 刷新主页面
    
    editProvinceModalVisible.value = false
    editProvinceFormRef.value?.resetFields()
  } catch (error) {
    console.error('更新省份信息失败:', error)
    message.error('更新省份信息失败')
  } finally {
    editProvinceLoading.value = false
  }
}

// 取消省份编辑
const handleCancelProvinceEdit = () => {
  editProvinceModalVisible.value = false
  editProvinceFormRef.value?.resetFields()
  currentEditingProvince.value = null
}

// 删除省份
const handleDeleteProvince = async () => {
  if (!editForm.value.province) {
    message.warning('请先选择一个省份')
    return
  }
  
  const currentProvince = provinces.value.find(p => p.province === editForm.value.province)
  if (!currentProvince) {
    message.error('未找到省份信息')
    return
  }
  
  try {
    // 调用删除省份的API
    await advanceBatchApi.deleteProvince(currentProvince.id)
    message.success('省份删除成功')
    
    // 刷新所有相关数据
    await Promise.all([
      fetchProvinces(),           // 刷新省份列表
      fetchAvailableProvinceNames(), // 刷新可用省份名称
      fetchFeedbacks()            // 刷新反馈列表（可能有反馈被影响）
    ])
    emit('refresh')              // 刷新主页面
    
    // 清空当前编辑表单
    editForm.value = {
      province: '',
      station_name: '',
      content: ''
    }
    
  } catch (error) {
    console.error('删除省份失败:', error)
    message.error('删除省份失败，请稍后重试')
  }
}

// 保存反馈
const handleSaveFeedback = async () => {
  try {
    await editFormRef.value?.validate()
    
    // 验证省份是否存在
    const provinceExists = provinces.value.some(p => p.province === editForm.value.province)
    if (!provinceExists && editForm.value.province) {
      message.error('所选省份不存在，请先使用"新建省份"按钮创建该省份')
      return
    }
    
    editLoading.value = true
    
    console.log('开始保存反馈，原始数据:', {
      编辑中的反馈: editingFeedback.value,
      表单数据: editForm.value
    })
    
    const formData = {
      // 使用后端期望的字段名
      province_name: editForm.value.province,
      station_name_text: editForm.value.station_name,
      content: editForm.value.content,
      title: editForm.value.station_name + ' - 学员反馈',
      author: '匿名学员', // 默认作者
      author_background: '在校学生' // 默认背景
    }
    
    // 新增时才添加feedback_type，编辑时不传递
    if (!editingFeedback.value?.id) {
      formData.feedback_type = 'experience'
    }
    
    console.log('发送到后端的数据:', formData)

    let response: any
    if (editingFeedback.value?.id) {
      console.log('更新反馈 ID:', editingFeedback.value.id)
      response = await advanceBatchApi.updateFeedback(editingFeedback.value.id, formData)
      console.log('更新响应:', response)
      
      // 检查是否有自动创建的省份或站点
      const createdMessages = []
      if (response.data?.province_plan_id && response.data.province_plan_id !== editingFeedback.value.province_plan_id) {
        createdMessages.push(`自动创建了省份: ${editForm.value.province}`)
      }
      if (response.data?.station_id && response.data.station_id !== editingFeedback.value.station_id) {
        createdMessages.push(`自动创建了站点: ${editForm.value.station_name}`)
      }
      
      if (createdMessages.length > 0) {
        message.success(`更新成功！${createdMessages.join('；')}`)
      } else {
        message.success('更新成功')
      }
    } else {
      response = await advanceBatchApi.createFeedback(formData)
      
      // 检查是否有自动创建的省份或站点
      const createdMessages = []
      if (response.data?.province_plan_id) {
        createdMessages.push(`省份: ${editForm.value.province}`)
      }
      if (response.data?.station_id) {
        createdMessages.push(`站点: ${editForm.value.station_name}`)
      }
      
      if (createdMessages.length > 0) {
        message.success(`新增成功！自动创建了${createdMessages.join('和')}`)
      } else {
        message.success('新增成功')
      }
    }

    editModalVisible.value = false
    
    // 并行刷新所有相关数据
    await Promise.all([
      fetchFeedbacks(),           // 刷新反馈列表
      fetchProvinces()            // 刷新省份列表（可能有新的站点或省份）
    ])
    emit('refresh')               // 刷新主页面
  } catch (error) {
    console.error('保存反馈失败:', error)
    console.error('详细错误信息:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      config: error?.config
    })
    
    // 显示更详细的错误信息
    const errorMessage = error?.response?.data?.message || error?.message || '保存失败'
    message.error(`保存失败: ${errorMessage}`)
  } finally {
    editLoading.value = false
  }
}

// 取消编辑
const handleCancelEdit = () => {
  editModalVisible.value = false
  editFormRef.value?.resetFields()
}

// 工具函数
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const formatContent = (content: string) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  // 转换为北京时间 (UTC+8)
  return dayjs(dateString).tz('Asia/Shanghai').format('MM-DD HH:mm')
}

// 监听模态框显示状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    fetchFeedbacks()
    fetchProvinces()
    fetchAvailableProvinceNames()
  }
})

onMounted(() => {
  if (props.visible) {
    fetchFeedbacks()
    fetchProvinces()
    fetchAvailableProvinceNames()
  }
})
</script>

<style lang="less" scoped>
.integrated-feedback-management {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;

    .toolbar-left {
      display: flex;
      gap: 12px;
      align-items: center;
      
      .search-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 8px;
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .toolbar-left {
        flex-direction: column;
        gap: 8px;

        .ant-input-search,
        .ant-select {
          width: 100% !important;
        }
      }
    }
  }

  .province-selection-section {
    margin-bottom: 24px;
    
    .province-actions-section {
      margin-top: 12px;
      
      .province-actions-toolbar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        
        .create-province-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          height: 28px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
          }
          
          .anticon {
            font-size: 12px;
          }
        }
        
        .edit-province-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          height: 28px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
          }
          
          .anticon {
            font-size: 12px;
          }
        }
        
        .delete-province-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          height: 28px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
          }
          
          .anticon {
            font-size: 12px;
          }
        }
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    padding: 4px 8px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .form-note {
    background: #fff7e6;
    border: 1px solid #ffd591;
    color: #d48806;
    margin-bottom: 16px;
  }

  .province-info-section {
    background: #f9f9f9;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    border: 1px solid #e8e8e8;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .section-title {
        font-weight: 600;
        color: #1a1a1a;
        font-size: 16px;
      }
      
      .province-actions {
        display: flex;
        gap: 8px;
        
        // 原有的链接按钮样式（保持兼容性）
        .ant-btn-link {
          padding: 0 4px;
          height: auto;
          font-size: 12px;
          
          &:hover {
            background: rgba(255, 77, 79, 0.1);
            border-radius: 4px;
          }
        }
      }
    }
  }

  .feedback-table {
    .province-station-info {
      .province-name {
        font-weight: 500;
        color: #1890ff;
        margin-bottom: 2px;
      }

      .station-name {
        font-size: 12px;
        color: #666;
      }
    }

    .content-preview {
      .content-link {
        color: #1a1a1a;
        text-decoration: none;
        line-height: 1.4;

        &:hover {
          color: #1890ff;
          text-decoration: underline;
        }
      }
    }

    .create-date {
      font-size: 13px;
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 0;

      .ant-btn-link {
        padding: 0 4px;
        height: auto;
      }
    }
  }
}

.feedback-detail-content {
  .feedback-header {
    margin-bottom: 20px;

    .location-info {
      margin-bottom: 8px;
      
      .ant-tag {
        margin-right: 8px;
      }
    }

    .feedback-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: #666;

      .feedback-author {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .feedback-content {
    .content-text {
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e8e8e8;
      line-height: 1.6;
      color: #333;
      font-size: 14px;
    }
  }
}

:deep(.integrated-feedback-modal) {
  .ant-modal-header {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f9ff 100%);
    border-bottom: 1px solid #e6f7ff;
    
    .ant-modal-title {
      color: #1565c0;
      font-weight: 600;
    }
  }
}

:deep(.feedback-detail-modal) {
  .ant-modal-header {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f9ff 100%);
    border-bottom: 1px solid #e6f7ff;
    
    .ant-modal-title {
      color: #1565c0;
      font-weight: 600;
    }
  }
}
</style>