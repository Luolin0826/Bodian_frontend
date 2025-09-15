<template>
  <a-modal
    :open="visible"
    title="站点管理"
    :footer="null"
    width="800px"
    @cancel="handleCancel"
  >
    <div class="station-management">
      <!-- 操作工具栏 -->
      <div class="toolbar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索站点名称、地点"
          style="width: 300px"
          @search="handleSearch"
          allow-clear
        />
        <a-button type="primary" @click="handleAddStation">
          <PlusOutlined />
          新增站点
        </a-button>
      </div>

      <!-- 站点列表表格 -->
      <a-table
        :dataSource="filteredStations"
        :columns="columns"
        :loading="loading"
        :pagination="{
          total: filteredStations.length,
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'university_name'">
            <div class="university-name">
              {{ record.university_name }}
              <div class="university-venue" v-if="record.venue">{{ record.venue }}</div>
            </div>
          </template>
          
          <template v-else-if="column.key === 'province'">
            <span class="province-name">{{ record.province || '-' }}</span>
          </template>
          
          <template v-else-if="column.key === 'visit_date'">
            <span class="visit-date">{{ formatDate(record.visit_date) }}</span>
          </template>
          
          <template v-else-if="column.key === 'notice_info'">
            <div class="notice-info" v-if="record.notice_title || record.notice_content">
              <a-tooltip :title="record.notice_content">
                <div class="notice-title">{{ record.notice_title || '招聘公告' }}</div>
              </a-tooltip>
              <a v-if="record.notice_url" :href="record.notice_url" target="_blank" class="notice-link">
                <LinkOutlined />
                查看详情
              </a>
            </div>
            <span v-else class="no-notice">暂无公告</span>
          </template>
          
          <template v-else-if="column.key === 'actions'">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="handleEditStation(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个站点吗？"
                @confirm="handleDeleteStation(record.id)"
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

    <!-- 站点编辑表单模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      :title="editingStation?.id ? '编辑站点' : '新增站点'"
      width="600px"
      :confirm-loading="editLoading"
      @ok="handleSaveStation"
      @cancel="handleCancelEdit"
    >
      <a-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="院校名称" name="university_name">
              <a-input v-model:value="editForm.university_name" placeholder="请输入院校名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="省份" name="province">
              <a-auto-complete
                v-model:value="editForm.province"
                :options="provinceAutoCompleteOptions"
                placeholder="请输入或选择省份"
                @search="handleProvinceSearch"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="访问地点" name="venue">
          <a-input v-model:value="editForm.venue" placeholder="请输入访问地点" />
        </a-form-item>
        
        <a-form-item label="访问日期" name="visit_date">
          <a-date-picker v-model:value="editForm.visit_date" style="width: 100%" />
        </a-form-item>
        
        <a-form-item label="公告标题" name="notice_title">
          <a-input v-model:value="editForm.notice_title" placeholder="请输入公告标题" />
        </a-form-item>
        
        <a-form-item label="公告内容" name="notice_content">
          <a-textarea v-model:value="editForm.notice_content" :rows="4" placeholder="请输入公告内容" />
        </a-form-item>
        
        <a-form-item label="公告链接" name="notice_url">
          <a-input v-model:value="editForm.notice_url" placeholder="请输入公告链接" />
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
  LinkOutlined
} from '@ant-design/icons-vue'
import type { StationInfo } from '@/api/types/advance-batch'
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

const stations = ref<StationInfo[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedProvince = ref('')
const editModalVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()
const editingStation = ref<StationInfo | null>(null)

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

// 编辑表单
const editForm = ref({
  university_name: '',
  province: '',
  venue: '',
  visit_date: null as any,
  notice_title: '',
  notice_content: '',
  notice_url: ''
})

// 表单验证规则
const editRules = {
  university_name: [{ required: true, message: '请输入院校名称' }],
  province: [{ required: true, message: '请输入省份' }],
  visit_date: [{ required: true, message: '请选择访问日期' }]
}

// 省份自动完成选项
const allProvinces = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
  '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区'
]

const provinceSearchValue = ref('')
const provinceAutoCompleteOptions = computed(() => {
  if (!provinceSearchValue.value) {
    return allProvinces.map(province => ({ value: province }))
  }
  return allProvinces
    .filter(province => province.includes(provinceSearchValue.value))
    .map(province => ({ value: province }))
})

const handleProvinceSearch = (searchText: string) => {
  provinceSearchValue.value = searchText
}

// 过滤后的站点列表
const filteredStations = computed(() => {
  let filtered = stations.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(station =>
      station.university_name?.toLowerCase().includes(keyword) ||
      station.venue?.toLowerCase().includes(keyword)
    )
  }

  if (selectedProvince.value) {
    filtered = filtered.filter(station => station.province === selectedProvince.value)
  }

  return filtered
})

// 表格列配置
const columns = [
  {
    title: '院校名称',
    key: 'university_name',
    width: 180,
    ellipsis: true
  },
  {
    title: '省份',
    key: 'province',
    width: 100
  },
  {
    title: '日期',
    key: 'visit_date',
    width: 80
  },
  {
    title: '公告信息',
    key: 'notice_info',
    width: 180,
    ellipsis: true
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right'
  }
]

// 分页配置
const paginationConfig = {
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSize: 20,
  pageSizeOptions: ['10', '20', '50', '100']
}

// 获取站点列表
const fetchStations = async () => {
  try {
    loading.value = true
    const response = await advanceBatchApi.getStations()
    stations.value = response.data.stations || []
  } catch (error) {
    console.error('获取站点信息失败:', error)
    message.error('获取站点信息失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 省份筛选处理
const handleProvinceFilter = () => {
  // 筛选逻辑已在 computed 中处理
}

// 新增站点
const handleAddStation = () => {
  editingStation.value = null
  editForm.value = {
    university_name: '',
    province: '',
    venue: '',
    visit_date: null,
    notice_title: '',
    notice_content: '',
    notice_url: ''
  }
  editModalVisible.value = true
}

// 编辑站点
const handleEditStation = (station: StationInfo) => {
  editingStation.value = station
  editForm.value = {
    university_name: station.university_name || '',
    province: station.province || '',
    venue: station.venue || '',
    visit_date: station.visit_date ? dayjs(station.visit_date) : null,
    notice_title: station.notice_title || '',
    notice_content: station.notice_content || '',
    notice_url: station.notice_url || ''
  }
  editModalVisible.value = true
}


// 删除站点
const handleDeleteStation = async (stationId: number) => {
  try {
    await advanceBatchApi.deleteStation(stationId)
    message.success('删除成功')
    fetchStations()
    emit('refresh')
  } catch (error) {
    console.error('删除站点失败:', error)
    message.error('删除失败')
  }
}

// 保存站点
const handleSaveStation = async () => {
  try {
    await editFormRef.value?.validate()
    editLoading.value = true

    const formData = {
      ...editForm.value,
      visit_date: editForm.value.visit_date ? editForm.value.visit_date.format('YYYY-MM-DD') : ''
    }

    if (editingStation.value?.id) {
      await advanceBatchApi.updateStation(editingStation.value.id, formData)
      message.success('更新成功')
    } else {
      await advanceBatchApi.createStation(formData)
      message.success('新增成功')
    }

    editModalVisible.value = false
    fetchStations()
    emit('refresh')
  } catch (error) {
    console.error('保存站点失败:', error)
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

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('MM-DD')
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'pending': 'orange',
    'ongoing': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  }
  return colorMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'pending': '待开始',
    'ongoing': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return textMap[status] || status
}

// 监听模态框显示状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    fetchStations()
  }
})

onMounted(() => {
  if (props.visible) {
    fetchStations()
  }
})
</script>

<style lang="less" scoped>
.station-management {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .ant-btn {
      margin-left: 12px;
    }
  }

  .stations-table {
    .university-info {
      .university-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .university-name {
          font-weight: 500;
          color: #1a1a1a;
          flex: 1;
        }

        .visit-date {
          font-weight: 500;
          color: #1890ff;
          font-size: 12px;
          white-space: nowrap;
          margin-left: 8px;
        }
      }

      .university-venue {
        font-size: 12px;
        color: #999;
      }
    }

    .visit-info {
      .visit-time {
        font-weight: 500;
        color: #666;
        margin-bottom: 2px;
      }

      .visit-duration {
        font-size: 12px;
        color: #999;
      }
    }

    .notice-info {
      .notice-title {
        font-weight: 500;
        color: #1565c0;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notice-link {
        font-size: 12px;
        color: #1890ff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .no-notice {
      color: #ccc;
      font-style: italic;
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

:deep(.station-management-modal) {
  .ant-modal-header {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f9ff 100%);
    border-bottom: 1px solid #e6f7ff;
    
    .ant-modal-title {
      color: #1565c0;
      font-weight: 600;
    }
  }
}

@media (max-width: 768px) {
  .station-management-content {
    .management-toolbar {
      flex-direction: column;
      gap: 12px;

      .toolbar-left {
        width: 100%;
        flex-direction: column;
        gap: 8px;

        .ant-input-search,
        .ant-select {
          width: 100% !important;
        }
      }

      .toolbar-right {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>