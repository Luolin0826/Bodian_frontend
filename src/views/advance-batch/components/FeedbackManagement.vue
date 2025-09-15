<template>
  <a-modal
    v-model:open="visible"
    title="反馈管理"
    width="800px"
    :footer="null"
  >
    <div class="feedback-management">
      <!-- 操作工具栏 -->
      <div class="toolbar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索反馈标题、内容"
          style="width: 300px"
          @search="handleSearch"
          allow-clear
        />
        <a-button type="primary" @click="handleAddFeedback">
          <PlusOutlined />
          新增反馈
        </a-button>
      </div>

      <!-- 反馈列表 -->
      <a-table
        :dataSource="filteredFeedbacks"
        :columns="columns"
        :loading="loading"
        :pagination="{
          total: filteredFeedbacks.length,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }"
        row-key="id"
        size="small"
        class="feedbacks-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <a @click="handleViewFeedback(record)" class="feedback-title-link">
              {{ record.title }}
            </a>
          </template>
          
          <template v-else-if="column.key === 'feedback_type'">
            <a-tag :color="getTypeColor(record.feedback_type)">
              {{ getTypeText(record.feedback_type) }}
            </a-tag>
          </template>
          
          <template v-else-if="column.key === 'station_info'">
            <div class="station-info" v-if="getStationInfo(record.station_id)">
              <div class="station-name">{{ getStationInfo(record.station_id)?.university_name }}</div>
              <div class="station-province" v-if="getStationInfo(record.station_id)?.province">
                {{ getStationInfo(record.station_id)?.province }}
              </div>
            </div>
            <span v-else class="no-station">暂未关联</span>
          </template>
          
          
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewFeedback(record)">
                <EyeOutlined />
                查看
              </a-button>
              <a-button type="link" size="small" @click="handleEditFeedback(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个反馈吗？"
                @confirm="handleDeleteFeedback(record.id)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 反馈详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="反馈详情"
      width="800px"
      :footer="null"
      class="feedback-detail-modal"
    >
      <div v-if="selectedFeedback" class="feedback-detail-content">
        <div class="feedback-header">
          <h3 class="feedback-title">{{ selectedFeedback.title }}</h3>
          <div class="feedback-meta">
            <span class="feedback-author">
              <UserOutlined />
              {{ selectedFeedback.author || '匿名用户' }}
            </span>
            <span class="feedback-time">{{ formatDate(selectedFeedback.created_at) }}</span>
            <a-tag :color="getTypeColor(selectedFeedback.feedback_type)">
              {{ getTypeText(selectedFeedback.feedback_type) }}
            </a-tag>
          </div>
        </div>
        
        <div class="feedback-content">
          <div class="content-text" v-html="formatContent(selectedFeedback.content)"></div>
        </div>
        
        <div class="feedback-footer" v-if="selectedFeedback.tags && selectedFeedback.tags.length">
          <div class="feedback-tags">
            <span class="tags-label">标签：</span>
            <a-tag
              v-for="tag in selectedFeedback.tags"
              :key="tag"
              color="blue"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>
        
        <div class="feedback-stats">
          <div class="stats-item">
            <EyeOutlined />
            浏览 {{ selectedFeedback.views_count || 0 }} 次
          </div>
          <div class="stats-item">
            <HeartOutlined />
            获得 {{ selectedFeedback.likes_count || 0 }} 个赞
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 反馈编辑表单模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      :title="editingFeedback?.id ? '编辑反馈' : '新增反馈'"
      width="800px"
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
        <a-form-item label="反馈标题" name="title">
          <a-input v-model:value="editForm.title" placeholder="请输入反馈标题" />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="反馈类型" name="feedback_type">
              <a-select v-model:value="editForm.feedback_type" placeholder="请选择反馈类型">
                <a-select-option value="experience">经验分享</a-select-option>
                <a-select-option value="question">问题咨询</a-select-option>
                <a-select-option value="suggestion">建议反馈</a-select-option>
                <a-select-option value="complaint">投诉举报</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="关联站点" name="station_id">
              <a-select 
                v-model:value="editForm.station_id" 
                placeholder="请选择关联站点" 
                allow-clear
                show-search
                :filter-option="filterStationOption"
              >
                <a-select-option
                  v-for="station in stationOptions"
                  :key="station.id"
                  :value="station.id"
                  :title="`${station.university_name} - ${station.province || ''}`"
                >
                  {{ station.university_name }} {{ station.province ? `(${station.province})` : '' }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="反馈内容" name="content">
          <a-textarea v-model:value="editForm.content" :rows="4" placeholder="请输入反馈内容" />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="作者信息" name="author">
              <a-input v-model:value="editForm.author" placeholder="请输入作者姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="标签" name="tags">
              <a-select
                v-model:value="editForm.tags"
                mode="tags"
                placeholder="添加标签"
                :max-tag-count="3"
              >
                <a-select-option value="求职心得">求职心得</a-select-option>
                <a-select-option value="面试经验">面试经验</a-select-option>
                <a-select-option value="薪资福利">薪资福利</a-select-option>
                <a-select-option value="工作环境">工作环境</a-select-option>
                <a-select-option value="发展前景">发展前景</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
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
  EyeOutlined,
  HeartOutlined,
  UserOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import type { FeedbackInfo, StationInfo } from '@/api/types/advance-batch'
import { advanceBatchApi } from '@/api/advance-batch'
import type { FormInstance } from 'ant-design-vue'
import dayjs from 'dayjs'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const feedbacks = ref<FeedbackInfo[]>([])
const stations = ref<StationInfo[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const detailModalVisible = ref(false)
const selectedFeedback = ref<FeedbackInfo | null>(null)
const editModalVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editingFeedback = ref<FeedbackInfo | null>(null)

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

// 编辑表单
const editForm = ref({
  title: '',
  content: '',
  feedback_type: '',
  station_id: null as number | null,
  author: '',
  tags: [] as string[],
  is_featured: false,
  is_verified: false,
  is_pinned: false
})

// 表单验证规则
const editRules = {
  title: [{ required: true, message: '请输入反馈标题' }],
  content: [{ required: true, message: '请输入反馈内容' }],
  feedback_type: [{ required: true, message: '请选择反馈类型' }]
}

// 站点选项
const stationOptions = computed(() => stations.value)

// 过滤后的反馈列表
const filteredFeedbacks = computed(() => {
  if (!searchKeyword.value.trim()) {
    return feedbacks.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return feedbacks.value.filter(feedback =>
    feedback.title.toLowerCase().includes(keyword) ||
    feedback.content.toLowerCase().includes(keyword)
  )
})

// 表格列配置
const columns = [
  {
    title: '标题',
    key: 'title',
    width: 180,
    ellipsis: true
  },
  {
    title: '关联站点',
    key: 'station_info',
    width: 150
  },
  {
    title: '类型',
    key: 'feedback_type',
    width: 100
  },
  {
    title: '操作',
    key: 'actions',
    width: 120
  }
]


// 获取反馈列表
const fetchFeedbacks = async () => {
  try {
    loading.value = true
    const response = await advanceBatchApi.getFeedback({ size: 200 })
    feedbacks.value = response.data.feedback || []
  } catch (error) {
    console.error('获取反馈信息失败:', error)
    message.error('获取反馈信息失败')
  } finally {
    loading.value = false
  }
}

// 获取站点列表
const fetchStations = async () => {
  try {
    const response = await advanceBatchApi.getStations()
    stations.value = response.data.stations || []
  } catch (error) {
    console.error('获取站点信息失败:', error)
  }
}

// 根据站点ID获取站点信息
const getStationInfo = (stationId?: number) => {
  if (!stationId) return null
  return stations.value.find(s => s.id === stationId)
}

// 搜索处理
const handleSearch = (value: string) => {
  searchKeyword.value = value
}

// 查看反馈详情
const handleViewFeedback = (feedback: FeedbackInfo) => {
  selectedFeedback.value = feedback
  detailModalVisible.value = true
  
  // 增加浏览次数
  if (feedback.id) {
    advanceBatchApi.viewFeedback(feedback.id).catch(console.error)
  }
}

// 新增反馈
const handleAddFeedback = () => {
  editingFeedback.value = null
  editForm.value = {
    title: '',
    content: '',
    feedback_type: '',
    station_id: null,
    author: '',
    tags: [],
    is_featured: false,
    is_verified: false,
    is_pinned: false
  }
  editModalVisible.value = true
}

// 编辑反馈
const handleEditFeedback = (feedback: FeedbackInfo) => {
  editingFeedback.value = feedback
  editForm.value = {
    title: feedback.title || '',
    content: feedback.content || '',
    feedback_type: feedback.feedback_type || '',
    station_id: feedback.station_id || null,
    author: feedback.author || '',
    tags: feedback.tags || [],
    is_featured: feedback.is_featured || false,
    is_verified: feedback.is_verified || false,
    is_pinned: feedback.is_pinned || false
  }
  editModalVisible.value = true
}

// 删除反馈
const handleDeleteFeedback = async (feedbackId: number) => {
  try {
    await advanceBatchApi.deleteFeedback(feedbackId)
    message.success('删除成功')
    fetchFeedbacks()
    emit('refresh')
  } catch (error) {
    console.error('删除反馈失败:', error)
    message.error('删除失败')
  }
}

// 站点选项过滤
const filterStationOption = (input: string, option: any) => {
  const station = stationOptions.value.find(s => s.id === option.value)
  if (!station) return false
  const searchText = input.toLowerCase()
  return (
    station.university_name.toLowerCase().includes(searchText) ||
    (station.province && station.province.toLowerCase().includes(searchText))
  )
}

// 保存反馈
const handleSaveFeedback = async () => {
  try {
    await editFormRef.value?.validate()
    editLoading.value = true

    const formData = { ...editForm.value }

    if (editingFeedback.value?.id) {
      // 编辑反馈时不传递feedback_type参数
      delete formData.feedback_type
      await advanceBatchApi.updateFeedback(editingFeedback.value.id, formData)
      message.success('更新成功')
    } else {
      await advanceBatchApi.createFeedback(formData)
      message.success('新增成功')
    }

    editModalVisible.value = false
    fetchFeedbacks()
    emit('refresh')
  } catch (error) {
    console.error('保存反馈失败:', error)
    message.error('保存失败')
  } finally {
    editLoading.value = false
  }
}

// 取消编辑
const handleCancelEdit = () => {
  editModalVisible.value = false
  editFormRef.value?.resetFields()
}

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 格式化内容（处理换行）
const formatContent = (content: string) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('MM-DD HH:mm')
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'experience': 'green',
    'question': 'blue',
    'suggestion': 'orange',
    'complaint': 'red'
  }
  return colorMap[type] || 'default'
}

// 获取类型文本
const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'experience': '经验分享',
    'question': '问题咨询',
    'suggestion': '建议反馈',
    'complaint': '投诉举报'
  }
  return textMap[type] || type
}

// 监听模态框显示状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    fetchFeedbacks()
    fetchStations()
  }
})

onMounted(() => {
  if (props.visible) {
    fetchFeedbacks()
    fetchStations()
  }
})
</script>

<style lang="less" scoped>
.feedback-management {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .ant-input-search {
        width: 100% !important;
      }
    }
  }

  .feedback-title-link {
    color: #1890ff;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      color: #40a9ff;
      text-decoration: underline;
    }
  }

  .station-info {
    .station-name {
      font-weight: 500;
      color: #1a1a1a;
      margin-bottom: 2px;
      font-size: 13px;
    }

    .station-province {
      font-size: 12px;
      color: #1890ff;
      background: #f0f9ff;
      padding: 1px 6px;
      border-radius: 10px;
      display: inline-block;
    }
  }

  .no-station {
    color: #ccc;
    font-style: italic;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 12px;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
  }
}

.feedback-detail-content {
  .feedback-header {
    margin-bottom: 20px;

    .feedback-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
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

  .feedback-footer {
    margin: 16px 0;

    .feedback-tags {
      display: flex;
      align-items: center;
      gap: 8px;

      .tags-label {
        font-weight: 500;
        color: #666;
      }
    }
  }

  .feedback-stats {
    display: flex;
    gap: 20px;
    padding-top: 16px;
    border-top: 1px solid #e8e8e8;

    .stats-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #666;
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

:deep(.danger-item) {
  color: #ff4d4f !important;
}

</style>