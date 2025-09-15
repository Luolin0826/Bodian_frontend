<template>
  <div class="permission-editor">
    <div class="editor-header">
      <div class="header-left">
        <h3>{{ role?.display_name }} - 权限配置</h3>
        <a-tag :color="getRoleColor(role?.name)">{{ role?.name }}</a-tag>
      </div>
      <div class="header-right">
        <a-space>
          <a-button @click="importTemplate">
            <ImportOutlined />
            导入模板
          </a-button>
          <a-button @click="exportConfig">
            <ExportOutlined />
            导出配置
          </a-button>
          <a-button type="primary" :loading="saving" @click="savePermissions">
            <SaveOutlined />
            保存配置
          </a-button>
        </a-space>
      </div>
    </div>

    <div class="editor-content">
      <a-tabs v-model:activeKey="activeTab" type="card" size="large">
        <!-- 菜单权限 -->
        <a-tab-pane key="menu" tab="菜单权限">
          <div class="permission-section">
            <div class="section-description">
              <InfoCircleOutlined />
              <span>配置用户可以访问的系统菜单和页面</span>
            </div>
            
            <PermissionTree
              v-model:value="permissions.menu"
              :tree-data="menuTreeData"
              @change="onMenuPermissionChange"
            />
          </div>
        </a-tab-pane>

        <!-- 操作权限 -->
        <a-tab-pane key="operation" tab="操作权限">
          <div class="permission-section">
            <div class="section-description">
              <InfoCircleOutlined />
              <span>配置用户可以执行的功能操作</span>
            </div>
            
            <div class="operation-modules">
              <div v-for="module in operationModules" :key="module.key" class="module-card">
                <div class="module-header">
                  <div class="module-title">
                    <component :is="module.icon" class="module-icon" />
                    <h4>{{ module.title }}</h4>
                    <a-tag color="blue" size="small">{{ module.permissions.length }}项</a-tag>
                  </div>
                  <div class="module-actions">
                    <a-checkbox
                      :indeterminate="getModuleIndeterminate(module.key)"
                      :checked="getModuleChecked(module.key)"
                      @change="onModuleChange($event, module.key)"
                    >
                      全选
                    </a-checkbox>
                  </div>
                </div>
                
                <div class="permissions-grid">
                  <div 
                    v-for="permission in module.permissions" 
                    :key="permission.key"
                    class="permission-card"
                    :class="{
                      'permission-checked': permissions.operation[module.key]?.includes(permission.key),
                      'permission-high-risk': permission.risk === 'high'
                    }"
                  >
                    <a-checkbox
                      :value="permission.key"
                      :checked="permissions.operation[module.key]?.includes(permission.key)"
                      @change="onOperationPermissionChange(module.key, permission.key, $event)"
                    >
                      <div class="permission-info">
                        <div class="permission-header">
                          <span class="permission-name">{{ permission.name }}</span>
                          <a-tag v-if="permission.risk" :color="getRiskColor(permission.risk)" size="small">
                            {{ permission.risk }}
                          </a-tag>
                        </div>
                        <div class="permission-description">
                          {{ permission.description }}
                        </div>
                      </div>
                    </a-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 数据权限 -->
        <a-tab-pane key="data" tab="数据权限">
          <div class="permission-section">
            <div class="section-description">
              <InfoCircleOutlined />
              <span>配置用户可以查看的数据范围和敏感信息访问权限</span>
            </div>
            
            <div class="data-permission-config">
              <div class="config-group">
                <h4>数据访问范围</h4>
                <a-radio-group v-model:value="permissions.data.scope" class="scope-options">
                  <a-radio value="all" class="scope-option">
                    <div class="option-content">
                      <strong>全部数据</strong>
                      <span>可以查看所有部门和用户的数据</span>
                    </div>
                  </a-radio>
                  <a-radio value="department" class="scope-option">
                    <div class="option-content">
                      <strong>部门数据</strong>
                      <span>仅可查看本部门及下级部门的数据</span>
                    </div>
                  </a-radio>
                  <a-radio value="own" class="scope-option">
                    <div class="option-content">
                      <strong>个人数据</strong>
                      <span>仅可查看自己创建或分配的数据</span>
                    </div>
                  </a-radio>
                  <a-radio value="custom" class="scope-option">
                    <div class="option-content">
                      <strong>自定义范围</strong>
                      <span>可自定义具体的数据访问范围</span>
                    </div>
                  </a-radio>
                </a-radio-group>
              </div>
              
              <!-- 区域权限配置 -->
              <div class="config-group">
                <h4>区域数据权限</h4>
                <div class="permission-group">
                  <a-checkbox-group v-model:value="permissions.data.regional_permissions">
                    <a-row :gutter="[16, 12]">
                      <a-col :span="6" v-for="region in regionalData" :key="region.code">
                        <a-checkbox :value="region.code" class="data-checkbox">
                          <div class="checkbox-info">
                            <span class="checkbox-name">{{ region.name }}</span>
                            <span class="checkbox-desc">{{ region.type }}</span>
                          </div>
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
              
              <!-- 部门权限配置 -->
              <div class="config-group">
                <h4>部门数据权限</h4>
                <div class="permission-group">
                  <a-checkbox-group v-model:value="permissions.data.department_permissions">
                    <a-row :gutter="[16, 12]">
                      <a-col :span="8" v-for="dept in departmentData" :key="dept.id">
                        <a-checkbox :value="dept.id.toString()" class="data-checkbox">
                          <div class="checkbox-info">
                            <span class="checkbox-name">{{ dept.name }}</span>
                            <span class="checkbox-desc">{{ dept.type }}</span>
                          </div>
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
              
              <!-- 项目分类权限配置 -->
              <div class="config-group">
                <h4>项目分类权限</h4>
                <div class="section-description">
                  <InfoCircleOutlined />
                  <span>配置用户可以访问的话术项目分类，限制用户只能查看指定分类下的话术内容</span>
                </div>
                <div class="permission-group">
                  <!-- 临时调试：显示当前状态 -->
                  <div style="margin-bottom: 12px; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px;">
                    <strong>调试状态:</strong> 项目分类数量: {{ projectCategoryData.length }} | 
                    权限数组: {{ permissions.data.project_category_permissions }}
                  </div>
                  
                  <!-- 项目分类权限配置区域 - 始终显示 -->
                  <div>
                    <div v-if="projectCategoryData.length === 0" style="margin-bottom: 16px; color: #666;">
                      <a-spin size="small" />
                      <span style="margin-left: 8px;">正在加载项目分类选项...</span>
                    </div>
                    
                    <a-checkbox-group v-model:value="permissions.data.project_category_permissions">
                      <a-row :gutter="[16, 12]">
                        <a-col :span="6" v-for="category in projectCategoryData" :key="category.id">
                          <a-checkbox :value="category.id.toString()" class="data-checkbox">
                            <div class="checkbox-info">
                              <span class="checkbox-name">{{ category.label }}</span>
                              <span class="checkbox-desc">{{ category.count }}个话术</span>
                            </div>
                          </a-checkbox>
                        </a-col>
                      </a-row>
                    </a-checkbox-group>
                    
                    <!-- 如果没有分类数据，显示提示 -->
                    <div v-if="projectCategoryData.length === 0" style="margin-top: 16px; text-align: center; color: #999; padding: 20px; border: 1px dashed #d9d9d9; border-radius: 4px;">
                      <InfoCircleOutlined style="font-size: 20px; margin-bottom: 8px;" />
                      <div>暂无项目分类可配置</div>
                      <div style="font-size: 12px; margin-top: 4px;">请先在话术管理中创建项目分类，或联系管理员配置分类数据</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 数据类型权限配置 -->
              <div class="config-group">
                <h4>数据类型权限</h4>
                <div class="permission-group">
                  <a-checkbox-group v-model:value="permissions.data.data_types">
                    <a-row :gutter="[16, 12]">
                      <a-col :span="6" v-for="dataType in dataTypeOptions" :key="dataType.key">
                        <a-checkbox :value="dataType.key" class="data-checkbox">
                          <div class="checkbox-info">
                            <span class="checkbox-name">{{ dataType.name }}</span>
                            <span class="checkbox-desc">{{ dataType.description }}</span>
                          </div>
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
              
              <div v-if="permissions.data.scope === 'custom'" class="config-group">
                <h4>自定义数据范围</h4>
                <div class="custom-scopes">
                  <a-checkbox-group v-model:value="permissions.data.custom_scopes">
                    <a-row :gutter="[16, 12]">
                      <a-col :span="8" v-for="scope in dataScopes" :key="scope.key">
                        <a-checkbox :value="scope.key" class="scope-checkbox">
                          <div class="scope-info">
                            <span class="scope-name">{{ scope.name }}</span>
                            <span class="scope-desc">{{ scope.description }}</span>
                          </div>
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
              
              <div class="config-group">
                <h4>敏感数据访问</h4>
                <div class="sensitive-permissions">
                  <a-checkbox-group v-model:value="permissions.data.sensitive">
                    <a-row :gutter="[16, 12]">
                      <a-col :span="12" v-for="sensitive in sensitiveData" :key="sensitive.key">
                        <a-checkbox :value="sensitive.key" class="sensitive-checkbox">
                          <div class="sensitive-info">
                            <div class="sensitive-header">
                              <span class="sensitive-name">{{ sensitive.name }}</span>
                              <a-tag color="red" size="small">敏感</a-tag>
                            </div>
                            <span class="sensitive-desc">{{ sensitive.description }}</span>
                          </div>
                        </a-checkbox>
                      </a-col>
                    </a-row>
                  </a-checkbox-group>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 时间权限 -->
        <a-tab-pane key="time" tab="时间权限">
          <div class="permission-section">
            <div class="section-description">
              <InfoCircleOutlined />
              <span>配置用户的登录时间和操作时间限制</span>
            </div>
            
            <div class="time-permission-config">
              <div class="config-group">
                <h4>登录时间限制</h4>
                <a-switch 
                  v-model:checked="permissions.time.enable_login_time"
                  checked-children="启用"
                  un-checked-children="禁用"
                />
                
                <div v-if="permissions.time.enable_login_time" class="time-config">
                  <div class="time-range">
                    <label>允许登录时间：</label>
                    <a-time-range-picker
                      v-model:value="permissions.time.login_time_range"
                      format="HH:mm"
                    />
                  </div>
                  
                  <div class="weekdays">
                    <label>允许登录日期：</label>
                    <a-checkbox-group v-model:value="permissions.time.login_weekdays">
                      <a-checkbox value="1">周一</a-checkbox>
                      <a-checkbox value="2">周二</a-checkbox>
                      <a-checkbox value="3">周三</a-checkbox>
                      <a-checkbox value="4">周四</a-checkbox>
                      <a-checkbox value="5">周五</a-checkbox>
                      <a-checkbox value="6">周六</a-checkbox>
                      <a-checkbox value="0">周日</a-checkbox>
                    </a-checkbox-group>
                  </div>
                </div>
              </div>
              
              <div class="config-group">
                <h4>会话超时设置</h4>
                <div class="session-config">
                  <a-row :gutter="16">
                    <a-col :span="12">
                      <label>会话超时时间（分钟）：</label>
                      <a-input-number
                        v-model:value="permissions.time.session_timeout"
                        :min="5"
                        :max="480"
                        style="width: 100%"
                      />
                    </a-col>
                    <a-col :span="12">
                      <label>最大并发会话数：</label>
                      <a-input-number
                        v-model:value="permissions.time.max_sessions"
                        :min="1"
                        :max="10"
                        style="width: 100%"
                      />
                    </a-col>
                  </a-row>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  InfoCircleOutlined,
  ImportOutlined,
  ExportOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import PermissionTree from './PermissionTree.vue'
import type { Role, RolePermissions, PermissionNode } from '@/api/system'
import { getPermissionTree, getPermissionTemplates, validatePermissions, updateRolePermissions, getRolePermissions, getProjectCategoryPermissionOptions } from '@/api/system'

interface Props {
  role: Role | null
  visible?: boolean
}

interface Emits {
  (e: 'save', permissions: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('menu')
const saving = ref(false)

// 权限配置数据
const permissions = reactive<RolePermissions>({
  menu: [] as string[],
  operation: {} as Record<string, string[]>,
  data: {
    scope: 'department' as 'all' | 'department' | 'own' | 'custom',
    regional_permissions: [] as string[],
    department_permissions: [] as string[],
    customer_permissions: [] as string[],
    data_types: [] as string[],
    sensitive: [] as string[],
    custom_scopes: [] as string[],  // 兼容字段
    project_category_permissions: [] as string[]  // 项目分类权限
  },
  time: {
    enable_login_time: false,
    login_time_range: null,
    login_weekdays: ['1', '2', '3', '4', '5'] as string[],
    session_timeout: 60,
    max_sessions: 3
  }
})

// 权限数据
const menuTreeData = ref<PermissionNode[]>([])
const operationModules = ref<any[]>([])
const dataScopes = ref<any[]>([])
const sensitiveData = ref<any[]>([])

// 新增数据权限相关数据
const regionalData = ref<any[]>([])
const departmentData = ref<any[]>([])
const projectCategoryData = ref<any[]>([])
const dataTypeOptions = ref([  
  { key: 'customer_data', name: '客户数据', description: '客户信息、联系方式等' },
  { key: 'sales_data', name: '销售数据', description: '销售记录、业绩统计等' },
  { key: 'financial_data', name: '财务数据', description: '收入、支出、提成等' },
  { key: 'system_data', name: '系统数据', description: '用户信息、角色配置等' },
  { key: 'log_data', name: '日志数据', description: '操作日志、登录记录等' },
  { key: 'report_data', name: '报表数据', description: '各类统计报表数据' }
])

// 加载权限树数据
const loadPermissionTree = async () => {
  console.log('🔄 开始加载权限树数据...')
  try {
    const data = await getPermissionTree()
    console.log('✅ 权限树API调用成功:', data)
    menuTreeData.value = data.menu || []
    operationModules.value = data.operation_modules || []
    dataScopes.value = data.data_scopes || []
    sensitiveData.value = data.sensitive_data || []
    
    // 加载区域和部门数据
    await loadRegionalData()
    await loadDepartmentData()
    await loadProjectCategoryData()
  } catch (error) {
    console.error('加载权限树失败:', error)
    message.error('加载权限配置失败')
  }
}

// 加载区域数据
const loadRegionalData = async () => {
  try {
    // 这里假设有区域数据接口，实际应根据后端接口调整
    regionalData.value = [
      { code: 'north_china', name: '华北地区', type: '大区' },
      { code: 'east_china', name: '华东地区', type: '大区' },
      { code: 'south_china', name: '华南地区', type: '大区' },
      { code: 'beijing', name: '北京市', type: '省市' },
      { code: 'shanghai', name: '上海市', type: '省市' },
      { code: 'guangdong', name: '广东省', type: '省市' }
    ]
  } catch (error) {
    console.error('加载区域数据失败:', error)
  }
}

// 加载部门数据  
const loadDepartmentData = async () => {
  try {
    // 这里假设有部门数据接口，实际应根据后端接口调整
    departmentData.value = [
      { id: 1, name: '销售部', type: '销售团队' },
      { id: 2, name: '技术部', type: '技术支持' },
      { id: 3, name: '市场部', type: '市场推广' },
      { id: 4, name: '人事部', type: '管理部门' },
      { id: 5, name: '财务部', type: '管理部门' }
    ]
  } catch (error) {
    console.error('加载部门数据失败:', error)
  }
}

// 加载项目分类数据
const loadProjectCategoryData = async () => {
  try {
    console.log('🔄 开始加载项目分类数据...')
    
    // 优先尝试从script API获取项目分类（这个接口已经存在且可用）
    const { getProjectCategories } = await import('@/api/script')
    const scriptResponse = await getProjectCategories()
    
    if (scriptResponse && scriptResponse.data && scriptResponse.data.length > 0) {
      projectCategoryData.value = scriptResponse.data
      console.log('✅ 项目分类数据加载成功:', scriptResponse.data.length, '个分类')
      console.log('📋 分类详情:', scriptResponse.data)
      return
    }
  } catch (scriptError) {
    console.warn('脚本API接口失败:', scriptError)
  }
  
  try {
    // 备选方案：尝试权限系统专用接口
    const response = await getProjectCategoryPermissionOptions()
    
    if (response && response.categories && response.categories.length > 0) {
      projectCategoryData.value = response.categories
      console.log('✅ 项目分类权限选项加载成功:', response.categories.length, '个分类')
      return
    }
  } catch (permissionError) {
    console.warn('权限系统接口失败:', permissionError)
  }
  
  // 如果所有API都失败，使用默认数据确保UI能正常显示
  console.log('⚠️ 所有API都失败，使用默认项目分类数据')
  projectCategoryData.value = [
    { id: 1, label: '电网知识', count: 0, description: '电力系统相关知识话术' },
    { id: 2, label: '电工考试', count: 0, description: '电工考试辅导话术' },
    { id: 3, label: '产品介绍', count: 0, description: '产品相关介绍话术' },
    { id: 4, label: '市场营销', count: 0, description: '营销推广话术' },
    { id: 5, label: '常见问题', count: 0, description: 'FAQ问答话术' }
  ]
  
  console.log('📋 使用默认项目分类:', projectCategoryData.value)
}

// 监听角色变化，加载权限数据
watch(() => props.role, async (newRole) => {
  if (newRole) {
    console.log('🔄 开始为角色加载权限配置:', newRole.name)
    try {
      await loadPermissionTree()
    } catch (error) {
      console.error('权限树加载失败，但继续加载项目分类数据:', error)
      // 即使权限树加载失败，也要确保项目分类数据能加载
      await loadProjectCategoryData()
    }
    await loadRolePermissions(newRole.name)
  }
}, { immediate: true })

// 组件挂载时加载基础数据
onMounted(async () => {
  console.log('🔄 PermissionEditor组件已挂载，开始预加载项目分类数据')
  await loadProjectCategoryData()
})

// 加载角色权限数据
const loadRolePermissions = async (roleName: string) => {
  try {
    const rolePermissions = await getRolePermissions(roleName)
    loadPermissions(rolePermissions)
  } catch (error) {
    console.error('加载角色权限失败:', error)
    message.error('加载角色权限失败')
  }
}

// 加载权限数据
const loadPermissions = (rolePermissions: RolePermissions) => {
  console.log('🔍 加载权限数据:', rolePermissions)
  console.log('🔍 数据权限部分:', rolePermissions.data)
  console.log('🔍 项目分类权限:', rolePermissions.data?.project_category_permissions)
  
  permissions.menu = rolePermissions.menu || []
  permissions.operation = rolePermissions.operation || {}
  permissions.data = {
    scope: rolePermissions.data?.scope || 'department',
    regional_permissions: rolePermissions.data?.regional_permissions || [],
    department_permissions: rolePermissions.data?.department_permissions || [],
    customer_permissions: rolePermissions.data?.customer_permissions || [],
    data_types: rolePermissions.data?.data_types || [],
    sensitive: rolePermissions.data?.sensitive || [],
    custom_scopes: rolePermissions.data?.custom_scopes || [],
    project_category_permissions: rolePermissions.data?.project_category_permissions || []
  }
  permissions.time = {
    enable_login_time: rolePermissions.time?.enable_login_time || false,
    login_time_range: rolePermissions.time?.login_time_range || null,
    login_weekdays: rolePermissions.time?.login_weekdays || ['1', '2', '3', '4', '5'],
    session_timeout: rolePermissions.time?.session_timeout || 60,
    max_sessions: rolePermissions.time?.max_sessions || 3
  }
  
  console.log('✅ 权限数据加载完成:')
  console.log('  - 菜单权限:', permissions.menu.length, '项')
  console.log('  - 操作权限:', Object.keys(permissions.operation).length, '个模块')
  console.log('  - 数据权限:', permissions.data.custom_scopes.length + permissions.data.sensitive.length + permissions.data.project_category_permissions.length, '项')
  console.log('  - 项目分类权限:', permissions.data.project_category_permissions.length, '项')
}

// 获取角色颜色
const getRoleColor = (roleName?: string) => {
  const colors = {
    super_admin: '#f5222d',
    admin: '#fa541c',
    manager: '#faad14',
    sales: '#52c41a',
    teacher: '#1890ff',
    viewer: '#722ed1'
  }
  return colors[roleName as keyof typeof colors] || '#666666'
}

// 获取风险颜色
const getRiskColor = (risk: string) => {
  const colors = {
    safe: 'green',
    low: 'green',
    medium: 'orange',
    warning: 'orange', 
    high: 'red',
    danger: 'red'
  }
  return colors[risk as keyof typeof colors] || 'default'
}

// 菜单权限变化处理
const onMenuPermissionChange = (checkedKeys: string[], checkedNodes: any[]) => {
  permissions.menu = checkedKeys
}

// 模块全选状态
const getModuleChecked = (moduleKey: string) => {
  const module = operationModules.value.find(m => m.key === moduleKey)
  if (!module || !permissions.operation[moduleKey]) return false
  return permissions.operation[moduleKey].length === module.permissions.length
}

const getModuleIndeterminate = (moduleKey: string) => {
  const module = operationModules.value.find(m => m.key === moduleKey)
  if (!module || !permissions.operation[moduleKey]) return false
  const checkedCount = permissions.operation[moduleKey].length
  return checkedCount > 0 && checkedCount < module.permissions.length
}

// 模块全选变化
const onModuleChange = (checked: boolean, moduleKey: string) => {
  const module = operationModules.value.find(m => m.key === moduleKey)
  if (!module) return
  
  if (checked) {
    permissions.operation[moduleKey] = module.permissions.map(p => p.key)
  } else {
    permissions.operation[moduleKey] = []
  }
}

// 操作权限变化
const onOperationPermissionChange = (moduleKey: string, permissionKey: string, checked: boolean) => {
  if (!permissions.operation[moduleKey]) {
    permissions.operation[moduleKey] = []
  }
  
  if (checked) {
    if (!permissions.operation[moduleKey].includes(permissionKey)) {
      permissions.operation[moduleKey].push(permissionKey)
    }
  } else {
    const index = permissions.operation[moduleKey].indexOf(permissionKey)
    if (index > -1) {
      permissions.operation[moduleKey].splice(index, 1)
    }
  }
}

// 保存权限配置
const savePermissions = async () => {
  if (!props.role) return
  
  saving.value = true
  try {
    // 验证权限配置
    const validation = await validatePermissions(permissions)
    
    if (!validation.valid) {
      message.error('权限配置验证失败: ' + validation.errors.join(', '))
      return
    }
    
    if (validation.warnings.length > 0) {
      console.warn('权限配置警告:', validation.warnings)
    }
    
    // 保存权限配置
    await updateRolePermissions(props.role.name, permissions)
    emit('save', { ...permissions })
    message.success('权限配置保存成功')
  } catch (error: any) {
    console.error('保存权限配置失败:', error)
    message.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 导入模板
const importTemplate = async () => {
  try {
    const templates = await getPermissionTemplates()
    // 这里可以显示模板选择弹窗
    // 暂时使用第一个内置模板作为示例
    if (templates.builtin.length > 0) {
      const template = templates.builtin[0]
      loadPermissions(template.permissions)
      message.success(`已导入模板: ${template.name}`)
    } else {
      message.info('暂无可用模板')
    }
  } catch (error) {
    console.error('导入模板失败:', error)
    message.error('导入模板失败')
  }
}

// 导出配置
const exportConfig = () => {
  // 实现配置导出逻辑
  const config = JSON.stringify(permissions, null, 2)
  const blob = new Blob([config], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.role?.name || 'role'}_permissions.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('权限配置已导出')
}
</script>

<style scoped lang="less">
.permission-editor {
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: #262626;
      }
    }
  }
  
  .permission-section {
    .section-description {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f6f8fa;
      border-radius: 6px;
      color: #666;
      font-size: 13px;
    }
  }
  
  .operation-modules {
    .module-card {
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      
      .module-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #fafafa;
        border-bottom: 1px solid #f0f0f0;
        
        .module-title {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .module-icon {
            font-size: 16px;
            color: #666;
          }
          
          h4 {
            margin: 0;
            font-size: 16px;
            color: #262626;
          }
        }
      }
      
      .permissions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        padding: 20px;
        
        .permission-card {
          border: 1px solid #f0f0f0;
          border-radius: 6px;
          padding: 16px;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #d9d9d9;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          
          &.permission-checked {
            border-color: #1890ff;
            background: #f6ffed;
          }
          
          &.permission-high-risk {
            border-color: #ff7875;
            background: #fff2f0;
          }
          
          .permission-info {
            .permission-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
              
              .permission-name {
                font-weight: 500;
                color: #262626;
              }
            }
            
            .permission-description {
              font-size: 12px;
              color: #8c8c8c;
              line-height: 1.4;
            }
          }
        }
      }
    }
  }
  
  .data-permission-config {
    .permission-group {
      margin-bottom: 20px;
      
      .data-checkbox {
        width: 100%;
        margin-bottom: 8px;
        
        .checkbox-info {
          display: flex;
          flex-direction: column;
          margin-left: 8px;
          
          .checkbox-name {
            font-size: 14px;
            font-weight: 500;
            color: #262626;
            margin-bottom: 2px;
          }
          
          .checkbox-desc {
            font-size: 12px;
            color: #8c8c8c;
          }
        }
        
        &:hover {
          .checkbox-info .checkbox-name {
            color: #1890ff;
          }
        }
      }
    }
    
    .config-group {
      margin-bottom: 32px;
      
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #262626;
        margin-bottom: 16px;
        border-left: 3px solid #1890ff;
        padding-left: 12px;
      }
      
      .scope-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        
        .scope-option {
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          
          &:hover {
            border-color: #d9d9d9;
          }
          
          .option-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-left: 8px;
            
            strong {
              color: #262626;
            }
            
            span {
              font-size: 12px;
              color: #8c8c8c;
            }
          }
        }
      }
      
      .scope-checkbox,
      .sensitive-checkbox {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        
        &:hover {
          border-color: #d9d9d9;
        }
        
        .scope-info,
        .sensitive-info {
          margin-left: 8px;
          
          .scope-name,
          .sensitive-name {
            font-weight: 500;
            color: #262626;
            display: block;
          }
          
          .scope-desc,
          .sensitive-desc {
            font-size: 12px;
            color: #8c8c8c;
            margin-top: 2px;
          }
          
          .sensitive-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 2px;
          }
        }
      }
    }
  }
  
  .time-permission-config {
    .config-group {
      margin-bottom: 24px;
      
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #262626;
        margin-bottom: 16px;
      }
      
      .time-config,
      .session-config {
        margin-top: 16px;
        
        .time-range,
        .weekdays {
          margin-bottom: 16px;
          
          label {
            display: inline-block;
            width: 120px;
            font-weight: 500;
            color: #262626;
          }
        }
      }
    }
  }
}
</style>