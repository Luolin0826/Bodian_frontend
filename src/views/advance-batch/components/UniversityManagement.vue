<template>
  <a-modal
    :open="visible"
    title="院校管理"
    :footer="null"
    width="800px"
    @cancel="handleCancel"
  >
    <div class="university-management">
      <!-- 操作工具栏 -->
      <div class="toolbar">
        <a-input-search
          placeholder="搜索院校名称"
          style="width: 300px"
          @search="handleSearch"
          allow-clear
        />
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增院校
        </a-button>
      </div>

      <!-- 院校列表表格 -->
      <a-table
        :dataSource="displayUniversities"
        :columns="columns"
        :loading="managementLoading || isSearching"
        :pagination="searchResults.length > 0 ? {
          total: searchResults.length,
          pageSize: 20,
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total) => `搜索结果：共 ${total} 条记录`
        } : {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageSizeChange
        }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'university_name'">
            <a 
              :href="record.employment_website" 
              target="_blank" 
              class="university-link"
            >
              {{ record.university_name }}
            </a>
          </template>
          
          <template v-if="column.key === 'employment_website'">
            <a 
              :href="record.employment_website" 
              target="_blank" 
              class="website-link"
            >
              {{ truncateUrl(record.employment_website) }}
            </a>
          </template>
          
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button 
                type="link" 
                size="small"
                @click="handleEdit(record)"
              >
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个院校吗？"
                @confirm="handleDelete(record)"
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

    <!-- 院校表单弹窗 -->
    <UniversityFormModal
      v-model:visible="formModalVisible"
      :data="currentUniversity"
      @success="handleFormSuccess"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import UniversityFormModal from './UniversityFormModal.vue'
import { advanceBatchApi } from '@/api/advance-batch'
import type { UniversityInfo } from '@/api/types/advance-batch'

interface Props {
  visible: boolean
  universities: UniversityInfo[]
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

const searchKeyword = ref('')
const formModalVisible = ref(false)
const currentUniversity = ref<UniversityInfo | null>(null)
const searchResults = ref<UniversityInfo[]>([])
const isSearching = ref(false)
const managementUniversities = ref<UniversityInfo[]>([])
const managementLoading = ref(false)
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

// 表格列配置
const columns = [
  {
    title: '院校名称',
    dataIndex: 'university_name',
    key: 'university_name',
    width: 180
  },
  {
    title: '就业网站',
    dataIndex: 'employment_website',
    key: 'employment_website',
    width: 300,
    ellipsis: true
  },
  {
    title: '操作',
    key: 'actions',
    width: 120
  }
]

// 获取管理页面的分页院校数据
const fetchManagementUniversities = async (page: number = 1, size: number = 20) => {
  try {
    managementLoading.value = true
    const response = await advanceBatchApi.getUniversities({ page, size })
    managementUniversities.value = response.data.universities || []
    pagination.value.total = response.data.total || 0
    pagination.value.current = page
  } catch (error) {
    console.error('获取院校数据失败:', error)
    message.error('获取院校数据失败')
    managementUniversities.value = []
  } finally {
    managementLoading.value = false
  }
}

// 显示的院校列表：如果有搜索结果则显示搜索结果，否则显示分页数据
const displayUniversities = computed(() => {
  return searchResults.value.length > 0 ? searchResults.value : managementUniversities.value
})

// 分页处理
const handlePageChange = (page: number) => {
  fetchManagementUniversities(page, pagination.value.pageSize)
}

const handlePageSizeChange = (current: number, size: number) => {
  pagination.value.pageSize = size
  fetchManagementUniversities(1, size)
}

// 后端搜索处理
const handleSearch = async (value: string) => {
  searchKeyword.value = value
  
  if (!value?.trim()) {
    // 清空搜索，回到分页模式
    searchResults.value = []
    return
  }
  
  try {
    isSearching.value = true
    const response = await advanceBatchApi.searchUniversities({ keyword: value.trim() })
    if (response.data) {
      searchResults.value = response.data.universities || []
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索院校失败:', error)
    message.error('搜索院校失败')
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 新增院校
const handleAdd = () => {
  currentUniversity.value = null
  formModalVisible.value = true
}

// 编辑院校
const handleEdit = (university: UniversityInfo) => {
  currentUniversity.value = university
  formModalVisible.value = true
}

// 删除院校
const handleDelete = async (university: UniversityInfo) => {
  try {
    await advanceBatchApi.deleteUniversity(university.id)
    message.success('院校删除成功')
    fetchManagementUniversities(pagination.value.current, pagination.value.pageSize)
    emit('refresh')
  } catch (error) {
    console.error('删除院校失败:', error)
    message.error('删除院校失败')
  }
}

// 表单操作成功回调
const handleFormSuccess = () => {
  fetchManagementUniversities(pagination.value.current, pagination.value.pageSize)
  emit('refresh')
}

// 关闭管理弹窗
const handleCancel = () => {
  emit('update:visible', false)
  searchKeyword.value = ''
  searchResults.value = []
}

// 截断URL显示
const truncateUrl = (url: string) => {
  if (!url) return ''
  if (url.length <= 40) return url
  return url.slice(0, 37) + '...'
}

// 监听visible变化，初始化或重置数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 打开时初始化分页数据
    fetchManagementUniversities(1, pagination.value.pageSize)
  } else {
    // 关闭时重置搜索
    searchKeyword.value = ''
    searchResults.value = []
  }
})
</script>

<style lang="less" scoped>
.university-management {
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

  .university-link {
    color: #1890ff;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      color: #40a9ff;
      text-decoration: underline;
    }
  }

  .website-link {
    color: #666;
    text-decoration: none;
    font-size: 13px;

    &:hover {
      color: #1890ff;
      text-decoration: underline;
    }
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 12px;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
  }
}
</style>