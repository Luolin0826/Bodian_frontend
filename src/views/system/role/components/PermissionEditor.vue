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
                  <a-radio value="self" class="scope-option">
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
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  InfoCircleOutlined,
  ImportOutlined,
  ExportOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import PermissionTree from './PermissionTree.vue'
import type { Role, RolePermissions, PermissionNode } from '@/api/system'
import { getPermissionTree, getPermissionTemplates, validatePermissions, updateRolePermissions, getRolePermissions } from '@/api/system'

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
    scope: 'department' as 'all' | 'department' | 'self' | 'custom',
    custom_scopes: [] as string[],
    sensitive: [] as string[]
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

// 加载权限树数据
const loadPermissionTree = async () => {
  try {
    const data = await getPermissionTree()
    menuTreeData.value = data.menu
    operationModules.value = data.operation_modules
    dataScopes.value = data.data_scopes
    sensitiveData.value = data.sensitive_data
  } catch (error) {
    console.error('加载权限树失败:', error)
    message.error('加载权限配置失败')
  }
}

// 监听角色变化，加载权限数据
watch(() => props.role, async (newRole) => {
  if (newRole) {
    await loadPermissionTree()
    await loadRolePermissions(newRole.name)
  }
}, { immediate: true })

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
  
  permissions.menu = rolePermissions.menu || []
  permissions.operation = rolePermissions.operation || {}
  permissions.data = {
    scope: rolePermissions.data?.scope || 'department',
    custom_scopes: rolePermissions.data?.custom_scopes || [],
    sensitive: rolePermissions.data?.sensitive || []
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
  console.log('  - 数据权限:', permissions.data.custom_scopes.length + permissions.data.sensitive.length, '项')
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
    .config-group {
      margin-bottom: 32px;
      
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: #262626;
        margin-bottom: 16px;
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