<template>
  <div class="region-manager" :class="{ 'no-toolbar': hideToolbar }">
    <!-- 管理工具栏 -->
    <div v-if="!hideToolbar" class="manager-toolbar">
      <div class="toolbar-left">
        <h3 class="manager-title">
          <global-outlined class="title-icon" />
          区域管理
        </h3>
        <a-tag v-if="selectedRegions.length > 0" color="blue">
          已选择 {{ selectedRegions.length }} 个区域
        </a-tag>
      </div>
      
      <div class="toolbar-right">
        <a-space>
          <a-button 
            type="primary" 
            @click="handleAdd"
            :disabled="!canAdd"
          >
            <plus-outlined />
            新增区域
          </a-button>
          
          <a-button 
            @click="handleEdit"
            :disabled="selectedRegions.length !== 1"
          >
            <edit-outlined />
            编辑
          </a-button>
          
          <a-button 
            danger
            @click="handleBatchDelete"
            :disabled="selectedRegions.length === 0"
          >
            <delete-outlined />
            删除
          </a-button>
          
          <a-dropdown>
            <a-button>
              <more-outlined />
              更多
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="move" @click="handleMove" :disabled="selectedRegions.length !== 1">
                  <drag-outlined />
                  移动区域
                </a-menu-item>
                <a-menu-item key="copy" @click="handleCopy" :disabled="selectedRegions.length !== 1">
                  <copy-outlined />
                  复制政策
                </a-menu-item>
                <a-menu-item key="stats" @click="handleStats">
                  <bar-chart-outlined />
                  统计信息
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </div>
    </div>

    <!-- 区域列表表格 -->
    <div class="manager-table">
      <a-table
        :columns="tableColumns"
        :data-source="regionList"
        :loading="tableLoading"
        :pagination="tablePagination"
        :row-selection="rowSelection"
        size="middle"
        @change="handleTableChange"
        :scroll="{ x: 1000 }"
      >
        <!-- 区域层级列 -->
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'region_level'">
            <a-tag :color="getLevelColor(text)">
              {{ getLevelText(text) }}
            </a-tag>
          </template>

          <!-- 区域名称列 -->
          <template v-else-if="column.key === 'region_name'">
            <div class="region-name-cell">
              <global-outlined v-if="record.region_level === 'province'" class="region-icon province" />
              <cluster-outlined v-else-if="record.region_level === 'city'" class="region-icon city" />
              <bank-outlined v-else class="region-icon company" />
              <span class="region-text">{{ getRegionName(record) }}</span>
            </div>
          </template>

          <!-- 完整路径列 -->
          <template v-else-if="column.key === 'full_path'">
            <a-breadcrumb class="region-path">
              <a-breadcrumb-item v-if="record.province">{{ record.province }}</a-breadcrumb-item>
              <a-breadcrumb-item v-if="record.city">{{ record.city }}</a-breadcrumb-item>
              <a-breadcrumb-item v-if="record.company">{{ record.company }}</a-breadcrumb-item>
            </a-breadcrumb>
          </template>

          <!-- 政策状态列 -->
          <template v-else-if="column.key === 'policy_status'">
            <a-tag v-if="record.has_policy" color="green">
              <check-circle-outlined />
              已配置
            </a-tag>
            <a-tag v-else color="orange">
              <exclamation-circle-outlined />
              未配置
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="text" size="small" @click="handleEditSingle(record)">
                <edit-outlined />
              </a-button>
              <a-button type="text" size="small" @click="handleViewPolicy(record)">
                <eye-outlined />
              </a-button>
              <a-button 
                type="text" 
                size="small" 
                danger 
                @click="handleDeleteSingle(record)"
              >
                <delete-outlined />
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑区域对话框 -->
    <a-modal
      v-model:open="editModalVisible"
      :title="editMode === 'add' ? '新增区域' : '编辑区域'"
      :width="600"
      @ok="handleEditConfirm"
      @cancel="handleEditCancel"
      :confirm-loading="editLoading"
    >
      <a-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="区域层级" name="region_level">
          <a-select
            v-model:value="editForm.region_level"
            :disabled="editMode === 'edit'"
            @change="handleLevelChange"
          >
            <a-select-option value="province">省级</a-select-option>
            <a-select-option value="city">市级</a-select-option>
            <a-select-option value="company">区县公司</a-select-option>
          </a-select>
        </a-form-item>

        <!-- 省份选择（市级和区县级需要） -->
        <a-form-item 
          v-if="editForm.region_level !== 'province'" 
          label="所属省份" 
          name="selected_province"
        >
          <a-select
            v-model:value="selectedProvinceId"
            placeholder="请选择省份"
            allow-clear
            @change="handleProvinceChange"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option 
              v-for="province in provinceOptions" 
              :key="province.region_id" 
              :value="province.region_id"
            >
              {{ getRegionName(province) }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 城市选择（仅非直辖市的区县级需要） -->
        <a-form-item 
          v-if="editForm.region_level === 'company' && !isSelectedProvinceMunicipality" 
          label="所属城市" 
          name="selected_city"
        >
          <a-select
            v-model:value="selectedCityId"
            placeholder="请先选择省份"
            allow-clear
            @change="handleCityChange"
            :disabled="!selectedProvinceId"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option 
              v-for="city in cityOptions" 
              :key="city.region_id" 
              :value="city.region_id"
            >
              {{ getRegionName(city) }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 直辖市提示 -->
        <a-form-item 
          v-if="editForm.region_level === 'company' && isSelectedProvinceMunicipality"
          label="提示"
        >
          <a-alert 
            message="直辖市区县级单位直接隶属于直辖市，无需选择城市" 
            type="info" 
            show-icon 
          />
        </a-form-item>

        <a-form-item label="区域名称" name="region_name">
          <a-input v-model:value="editForm.region_name" placeholder="请输入区域名称" />
        </a-form-item>

        <a-form-item label="区域代码" name="region_code">
          <a-input v-model:value="editForm.region_code" placeholder="请输入区域代码（可选）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="deleteModalVisible"
      title="确认删除"
      @ok="handleDeleteConfirm"
      @cancel="deleteModalVisible = false"
      :confirm-loading="deleteLoading"
    >
      <div class="delete-confirm-content">
        <a-alert
          message="删除警告"
          :description="deleteConfirmText"
          type="warning"
          show-icon
          class="delete-warning"
        />
        
        <div v-if="deleteRegionInfo" class="delete-info">
          <p><strong>将要删除的区域：</strong></p>
          <ul>
            <li v-for="region in deleteRegionInfo" :key="region.region_id">
              {{ getRegionName(region) }} ({{ getLevelText(region.region_level) }})
            </li>
          </ul>
          
          <div v-if="deleteRegionInfo.some(r => r.policy_count > 0)" class="policy-warning">
            <p><strong>注意：</strong>以下区域包含政策数据：</p>
            <ul>
              <li v-for="region in deleteRegionInfo.filter(r => r.policy_count > 0)" :key="region.region_id">
                {{ getRegionName(region) }} ({{ region.policy_count }} 个政策)
              </li>
            </ul>
          </div>
        </div>

        <a-form v-if="showDeleteOptions" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="处理方式">
            <a-radio-group v-model:value="deleteOptions.action">
              <a-radio value="soft">软删除（保留数据）</a-radio>
              <a-radio value="force">强制删除（删除所有数据）</a-radio>
              <a-radio value="migrate">迁移数据到其他区域</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item 
            v-if="deleteOptions.action === 'migrate'" 
            label="迁移到"
          >
            <a-tree-select
              v-model:value="deleteOptions.migrate_to"
              :tree-data="migrationTargetOptions"
              :field-names="{ label: 'title', value: 'key', children: 'children' }"
              placeholder="选择迁移目标区域"
              tree-default-expand-all
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 统计信息对话框 -->
    <a-modal
      v-model:open="statsModalVisible"
      title="区域统计信息"
      :footer="null"
      :width="800"
    >
      <div class="stats-content">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic
              title="省份数量"
              :value="stats.province_count"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <global-outlined />
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="城市数量"
              :value="stats.city_count"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <cluster-outlined />
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="区县数量"
              :value="stats.company_count"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <bank-outlined />
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="政策总数"
              :value="stats.policy_count"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <file-text-outlined />
              </template>
            </a-statistic>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch, defineProps, defineEmits, toRefs } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { policyManagementAPI } from '@/api/policies'

// 组件属性定义
interface Props {
  filters?: Record<string, any>
  hideToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => ({}),
  hideToolbar: false
})

// 解构props以便在模板中使用
const { hideToolbar } = toRefs(props)

// 组件事件
interface Emits {
  (e: 'region-selected', region: RegionItem): void
  (e: 'stats-updated', stats: any): void
}

const emit = defineEmits<Emits>()

import {
  GlobalOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  DragOutlined,
  CopyOutlined,
  BarChartOutlined,
  ClusterOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'

// 接口定义
interface RegionItem {
  region_id: number
  region_name: string
  region_level: 'province' | 'city' | 'company'
  region_code?: string
  province?: string
  city?: string
  company?: string
  parent_id?: number
  has_policy: boolean
  policy_count: number
  child_count: number
  created_at: string
  updated_at: string
}

interface EditFormData {
  region_name: string
  region_level: 'province' | 'city' | 'company'
  region_code: string
  parent_id?: number
  province: string
  city: string
  company: string
}

// 响应式数据
const tableLoading = ref(false)
const regionList = ref<RegionItem[]>([])
const selectedRegions = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)

// 编辑相关
const editModalVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editLoading = ref(false)
const editMode = ref<'add' | 'edit'>('add')
const currentEditId = ref<number>()

// 编辑表单数据
const editForm = reactive<EditFormData>({
  region_name: '',
  region_level: 'province',
  region_code: '',
  parent_id: undefined,
  province: '',
  city: '',
  company: ''
})

// 级联选择相关数据
const selectedProvinceId = ref<number>()
const selectedCityId = ref<number>()
const provinceOptions = ref<any[]>([])
const cityOptions = ref<any[]>([])

// 删除相关
const deleteModalVisible = ref(false)
const deleteLoading = ref(false)
const deleteRegionInfo = ref<RegionItem[]>([])
const showDeleteOptions = ref(false)
const deleteOptions = reactive({
  action: 'soft',
  migrate_to: undefined
})

// 统计信息
const statsModalVisible = ref(false)
const stats = reactive({
  province_count: 0,
  city_count: 0,
  company_count: 0,
  policy_count: 0
})

// 其他选项数据
const migrationTargetOptions = ref([])

// 计算属性
const canAdd = computed(() => {
  // 基于权限判断是否可以新增
  return true // 暂时允许所有用户新增
})

const isSelectedProvinceMunicipality = computed(() => {
  if (!selectedProvinceId.value) return false
  const selectedProvince = provinceOptions.value.find(p => p.region_id === selectedProvinceId.value)
  return selectedProvince?.is_municipality === 1
})

const deleteConfirmText = computed(() => {
  if (selectedRegions.value.length === 1) {
    return '确定要删除这个区域吗？删除后将无法恢复。'
  }
  return `确定要删除这 ${selectedRegions.value.length} 个区域吗？删除后将无法恢复。`
})

// 表格配置
const tableColumns = [
  {
    title: '区域ID',
    dataIndex: 'region_id',
    key: 'region_id',
    width: 80,
    sorter: true
  },
  {
    title: '区域名称',
    dataIndex: 'region_name',
    key: 'region_name',
    width: 200
  },
  {
    title: '层级',
    dataIndex: 'region_level',
    key: 'region_level',
    width: 80,
    filters: [
      { text: '省级', value: 'province' },
      { text: '市级', value: 'city' },
      { text: '区县', value: 'company' }
    ]
  },
  {
    title: '完整路径',
    key: 'full_path',
    width: 250
  },
  {
    title: '区域代码',
    dataIndex: 'region_code',
    key: 'region_code',
    width: 120
  },
  {
    title: '政策状态',
    key: 'policy_status',
    width: 100
  },
  {
    title: '子区域数',
    dataIndex: 'child_count',
    key: 'child_count',
    width: 80,
    sorter: true
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 150,
    sorter: true
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right'
  }
]

const tablePagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
}))

const rowSelection = {
  selectedRowKeys: selectedRegions,
  onChange: (selectedRowKeys: number[]) => {
    selectedRegions.value = selectedRowKeys
  },
  onSelectAll: (selected: boolean, selectedRows: RegionItem[], changeRows: RegionItem[]) => {
    // 处理全选逻辑
  }
}

// 表单验证规则
const editFormRules: Record<string, Rule[]> = {
  region_name: [
    { required: true, message: '请输入区域名称', trigger: 'blur' },
    { min: 2, max: 50, message: '区域名称长度在2-50个字符', trigger: 'blur' }
  ],
  region_level: [
    { required: true, message: '请选择区域层级', trigger: 'change' }
  ],
  selected_province: [
    { 
      required: true, 
      validator: (rule: any, value: any) => {
        if (editForm.region_level !== 'province' && !selectedProvinceId.value) {
          return Promise.reject('请选择所属省份')
        }
        return Promise.resolve()
      },
      trigger: 'change' 
    }
  ],
  selected_city: [
    { 
      required: true, 
      validator: (rule: any, value: any) => {
        // 如果是区县级单位且不是直辖市，则必须选择城市
        if (editForm.region_level === 'company' && !isSelectedProvinceMunicipality.value && !selectedCityId.value) {
          return Promise.reject('请选择所属城市')
        }
        return Promise.resolve()
      },
      trigger: 'change' 
    }
  ]
}

// 工具方法
const getLevelColor = (level: string) => {
  const colorMap = {
    province: 'blue',
    city: 'green',
    company: 'orange'
  }
  return colorMap[level as keyof typeof colorMap] || 'default'
}

const getLevelText = (level: string) => {
  const textMap = {
    province: '省级',
    city: '市级',
    company: '区县'
  }
  return textMap[level as keyof typeof textMap] || level
}

const getRegionName = (record: any) => {
  // 根据API返回的数据结构和区域层级获取区域名称
  if (record.region_name) {
    return record.region_name
  }
  
  // 根据区域层级返回对应的名称字段
  switch (record.region_level) {
    case 'province':
      return record.province || ''
    case 'city':
      return record.city || ''
    case 'company':
      return record.company || ''
    default:
      // 后备逻辑
      return record.province || record.city || record.company || ''
  }
}

// 主要方法
const loadRegionList = async () => {
  try {
    tableLoading.value = true
    
    // 合并外部过滤器和分页参数
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...props.filters
    }
    
    console.log('🔍 RegionManager 加载区域数据，参数:', params)
    
    const response = await policyManagementAPI.getRegions(params)
    
    regionList.value = response.data || []
    total.value = response.total || 0
    
    // 更新统计信息并发送事件
    if (response.stats) {
      emit('stats-updated', response.stats)
    }
  } catch (error) {
    console.error('加载区域列表失败:', error)
    message.error('加载区域列表失败')
  } finally {
    tableLoading.value = false
  }
}

const handleTableChange = (pagination: any, filters: any, sorter: any) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
  loadRegionList()
}

// 新增区域
const handleAdd = () => {
  editMode.value = 'add'
  resetEditForm()
  editModalVisible.value = true
  loadParentOptions()
}

// 编辑区域
const handleEdit = () => {
  if (selectedRegions.value.length !== 1) return
  handleEditSingle(regionList.value.find(r => r.region_id === selectedRegions.value[0])!)
}

const handleEditSingle = async (record: RegionItem) => {
  editMode.value = 'edit'
  currentEditId.value = record.region_id
  
  // 填充编辑表单
  Object.assign(editForm, {
    region_name: getRegionName(record),
    region_level: record.region_level,
    region_code: record.region_code || '',
    parent_id: record.parent_id,
    province: record.province || '',
    city: record.city || '',
    company: record.company || ''
  })
  
  // 重置级联选择数据
  selectedProvinceId.value = undefined
  selectedCityId.value = undefined
  cityOptions.value = []
  
  // 如果是编辑市级或区县级，需要回填级联选择数据
  if (record.region_level !== 'province') {
    await loadProvinceOptions()
    
    // 如果有上级区域，尝试找到对应的省份和城市
    if (record.parent_id) {
      // 这里可能需要额外的API来根据parent_id获取上级区域信息
      // 暂时简化处理，假设可以根据现有数据推断
    }
  }
  
  editModalVisible.value = true
}

// 表单相关方法
const resetEditForm = () => {
  Object.assign(editForm, {
    region_name: '',
    region_level: 'province',
    region_code: '',
    parent_id: undefined,
    province: '',
    city: '',
    company: ''
  })
}

const handleLevelChange = () => {
  // 清空级联选择数据
  selectedProvinceId.value = undefined
  selectedCityId.value = undefined
  cityOptions.value = []
  editForm.parent_id = undefined
  
  // 如果不是省级，加载省份选项
  if (editForm.region_level !== 'province') {
    loadProvinceOptions()
  }
}

// 搜索过滤器
const filterOption = (input: string, option: any) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 加载省份选项
const loadProvinceOptions = async () => {
  try {
    const response = await policyManagementAPI.getRegions({
      region_level: 'province',
      limit: 100 // 获取所有省份
    })
    provinceOptions.value = response.data
  } catch (error) {
    console.error('加载省份选项失败:', error)
    message.error('加载省份选项失败')
  }
}

// 处理省份选择变化
const handleProvinceChange = async (provinceId: number) => {
  selectedCityId.value = undefined
  cityOptions.value = []
  
  if (!provinceId) {
    return
  }
  
  // 如果是市级单位，直接设置parent_id为省份ID
  if (editForm.region_level === 'city') {
    editForm.parent_id = provinceId
    return
  }
  
  // 如果是区县级单位，检查是否为直辖市
  if (editForm.region_level === 'company') {
    const selectedProvince = provinceOptions.value.find(p => p.region_id === provinceId)
    const isMunicipality = selectedProvince?.is_municipality === 1
    
    if (isMunicipality) {
      // 直辖市：直接设置parent_id为省份ID（因为直辖市没有市级）
      editForm.parent_id = provinceId
      console.log('🏛️ 检测到直辖市，直接设置parent_id为省份ID')
    } else {
      // 普通省份：需要加载该省份下的城市
      await loadCityOptions(provinceId)
    }
  }
}

// 加载城市选项
const loadCityOptions = async (provinceId: number) => {
  try {
    const response = await policyManagementAPI.getRegions({
      parent_id: provinceId,
      region_level: 'city',
      limit: 100 // 获取该省份下的所有城市
    })
    cityOptions.value = response.data
  } catch (error) {
    console.error('加载城市选项失败:', error)
    message.error('加载城市选项失败')
  }
}

// 处理城市选择变化
const handleCityChange = (cityId: number) => {
  if (cityId) {
    editForm.parent_id = cityId
  }
}

// 已删除旧的loadParentOptions方法，使用新的级联选择逻辑

const handleEditConfirm = async () => {
  try {
    await editFormRef.value?.validate()
    editLoading.value = true
    
    // 根据级联选择结果构造提交数据
    const formData = { ...editForm }
    
    // 根据区域层级设置相应字段
    if (editForm.region_level === 'province') {
      formData.province = editForm.region_name
    } else if (editForm.region_level === 'city') {
      formData.city = editForm.region_name
      // 从选中的省份获取省份名称
      const selectedProvince = provinceOptions.value.find(p => p.region_id === selectedProvinceId.value)
      if (selectedProvince) {
        formData.province = getRegionName(selectedProvince)
      }
    } else if (editForm.region_level === 'company') {
      formData.company = editForm.region_name
      // 从选中的省份和城市获取名称
      const selectedProvince = provinceOptions.value.find(p => p.region_id === selectedProvinceId.value)
      const selectedCity = cityOptions.value.find(c => c.region_id === selectedCityId.value)
      if (selectedProvince) {
        formData.province = getRegionName(selectedProvince)
      }
      if (selectedCity) {
        formData.city = getRegionName(selectedCity)
      }
    }
    
    console.log('📤 提交区域数据:', formData)
    
    if (editMode.value === 'add') {
      await policyManagementAPI.createRegion(formData)
      message.success('创建区域成功')
    } else {
      await policyManagementAPI.updateRegion(currentEditId.value!, formData)
      message.success('更新区域成功')
    }
    
    editModalVisible.value = false
    await loadRegionList()
    
  } catch (error) {
    console.error('保存区域失败:', error)
    message.error('保存区域失败')
  } finally {
    editLoading.value = false
  }
}

const handleEditCancel = () => {
  editModalVisible.value = false
  resetEditForm()
}

// 删除相关方法
const handleBatchDelete = async () => {
  if (selectedRegions.value.length === 0) return
  
  try {
    // 检查删除条件
    const checkResults = await Promise.all(
      selectedRegions.value.map(id => 
        policyManagementAPI.checkRegionDeletable(id)
      )
    )
    
    deleteRegionInfo.value = selectedRegions.value.map((id, index) => ({
      ...regionList.value.find(r => r.region_id === id)!,
      ...checkResults[index]
    }))
    
    showDeleteOptions.value = checkResults.some(result => 
      result.policy_count > 0 || result.child_count > 0
    )
    
    deleteModalVisible.value = true
    
  } catch (error) {
    console.error('检查删除条件失败:', error)
    message.error('检查删除条件失败')
  }
}

const handleDeleteSingle = (record: RegionItem) => {
  selectedRegions.value = [record.region_id]
  handleBatchDelete()
}

const handleDeleteConfirm = async () => {
  try {
    deleteLoading.value = true
    
    if (selectedRegions.value.length === 1) {
      await policyManagementAPI.deleteRegion(selectedRegions.value[0], deleteOptions)
    } else {
      await policyManagementAPI.batchDeleteRegions(selectedRegions.value, deleteOptions)
    }
    
    message.success('删除成功')
    deleteModalVisible.value = false
    selectedRegions.value = []
    await loadRegionList()
    
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 其他功能方法
const handleMove = () => {
  message.info('移动功能开发中...')
}

const handleCopy = () => {
  message.info('复制政策功能开发中...')
}

const handleViewPolicy = (record: RegionItem) => {
  // 发出区域选择事件，让父组件处理跳转逻辑
  emit('region-selected', record)
  message.info(`查看 ${getRegionName(record)} 的政策配置`)
}

const handleStats = async () => {
  try {
    const statsData = await policyManagementAPI.getRegionStats()
    Object.assign(stats, statsData)
    statsModalVisible.value = true
  } catch (error) {
    console.error('获取统计信息失败:', error)
    message.error('获取统计信息失败')
  }
}

// 监听外部过滤器变化
watch(() => props.filters, () => {
  currentPage.value = 1 // 重置到第一页
  loadRegionList()
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  loadRegionList,
  handleAdd
})

// 生命周期
onMounted(() => {
  loadRegionList()
})
</script>

<style scoped lang="less">
.region-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .manager-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .manager-title {
        margin: 0;
        font-size: 16px;
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
  
  // 当工具栏隐藏时，调整表格样式
  &.no-toolbar {
    .manager-table {
      margin-top: 0;
    }
  }
  
  .manager-table {
    flex: 1;
    
    .region-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .region-icon {
        font-size: 16px;
        
        &.province {
          color: #1890ff;
        }
        
        &.city {
          color: #52c41a;
        }
        
        &.company {
          color: #faad14;
        }
      }
      
      .region-text {
        font-weight: 500;
      }
    }
    
    .region-path {
      :deep(.ant-breadcrumb-separator) {
        margin: 0 4px;
      }
      
      :deep(.ant-breadcrumb-link) {
        font-size: 12px;
        color: #666;
      }
    }
  }
}

.delete-confirm-content {
  .delete-warning {
    margin-bottom: 16px;
  }
  
  .delete-info {
    margin-bottom: 16px;
    
    ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    .policy-warning {
      margin-top: 12px;
      padding: 8px 12px;
      background: #fff7e6;
      border: 1px solid #ffd591;
      border-radius: 4px;
    }
  }
}

.stats-content {
  .ant-statistic {
    text-align: center;
  }
}
</style>