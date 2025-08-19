<template>
  <div class="role-card" :class="{ 'role-card-active': active, 'role-card-disabled': disabled }">
    <div class="role-header">
      <div class="role-avatar">
        <a-avatar :style="{ backgroundColor: getRoleColor(role.name), fontSize: '18px' }" :size="48">
          <component :is="getRoleIcon(role.name)" />
        </a-avatar>
      </div>
      
      <div class="role-info">
        <div class="role-title">
          <h3>{{ role.display_name }}</h3>
          <a-tag :color="getLevelColor(role.level)" size="small">
            L{{ role.level }}
          </a-tag>
        </div>
        <p class="role-description">{{ role.description }}</p>
      </div>
      
      <div class="role-actions" v-if="!hideActions">
        <a-dropdown>
          <a-button type="text" size="small">
            <MoreOutlined />
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="$emit('edit', role)">
                <EditOutlined />
                编辑角色
              </a-menu-item>
              <a-menu-item @click="$emit('configure', role)">
                <SettingOutlined />
                配置权限
              </a-menu-item>
              <a-menu-item @click="$emit('viewUsers', role)">
                <UserOutlined />
                查看用户
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item @click="$emit('duplicate', role)">
                <CopyOutlined />
                复制角色
              </a-menu-item>
              <a-menu-item @click="$emit('export', role)">
                <ExportOutlined />
                导出配置
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
    
    <div class="role-stats">
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">{{ role.user_count || 0 }}</div>
          <div class="stat-label">用户数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getPermissionCount(role) }}</div>
          <div class="stat-label">权限数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getLastModified(role) }}</div>
          <div class="stat-label">更新</div>
        </div>
      </div>
    </div>
    
    <div class="role-permissions-preview" v-if="showPreview">
      <div class="preview-header">
        <span>权限概览</span>
        <a-button type="link" size="small" @click="$emit('configure', role)">
          配置 <ArrowRightOutlined />
        </a-button>
      </div>
      <div class="permission-tags">
        <a-tag 
          v-for="permission in getTopPermissions(role)" 
          :key="permission"
          size="small"
        >
          {{ permission }}
        </a-tag>
        <span v-if="getPermissionCount(role) > 3" class="more-count">
          +{{ getPermissionCount(role) - 3 }}项
        </span>
      </div>
    </div>
    
    <div class="role-footer">
      <a-button 
        type="primary" 
        block 
        :size="compact ? 'small' : 'default'"
        @click="$emit('configure', role)"
      >
        <SettingOutlined />
        {{ compact ? '配置' : '配置权限' }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  MoreOutlined,
  EditOutlined,
  SettingOutlined,
  UserOutlined,
  CopyOutlined,
  ExportOutlined,
  ArrowRightOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ShopOutlined,
  ReadOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import type { Role } from '@/api/system'

interface Props {
  role: Role
  active?: boolean
  disabled?: boolean
  compact?: boolean
  hideActions?: boolean
  showPreview?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: [role: Role]
  configure: [role: Role]
  viewUsers: [role: Role]
  duplicate: [role: Role]
  export: [role: Role]
}>()

// 获取角色颜色
const getRoleColor = (roleName: string) => {
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

// 获取角色图标
const getRoleIcon = (roleName: string) => {
  const icons = {
    super_admin: CrownOutlined,
    admin: SafetyCertificateOutlined,
    manager: TeamOutlined,
    sales: ShopOutlined,
    teacher: ReadOutlined,
    viewer: EyeOutlined
  }
  return icons[roleName as keyof typeof icons] || SafetyCertificateOutlined
}

// 获取级别颜色
const getLevelColor = (level: number) => {
  if (level >= 9) return 'red'
  if (level >= 7) return 'orange'
  if (level >= 5) return 'blue'
  if (level >= 3) return 'green'
  return 'default'
}

// 获取权限数量
const getPermissionCount = (role: Role) => {
  if (!role.permissions) return 0
  let count = 0
  const countPermissions = (perms: any): number => {
    let total = 0
    Object.values(perms).forEach(value => {
      if (typeof value === 'boolean' && value) {
        total++
      } else if (typeof value === 'object' && value !== null) {
        total += countPermissions(value)
      } else if (Array.isArray(value)) {
        total += value.length
      }
    })
    return total
  }
  return countPermissions(role.permissions)
}

// 获取最后修改时间
const getLastModified = (role: Role) => {
  // 这里应该从role的更新时间获取，暂时返回占位符
  return '今天'
}

// 获取顶级权限预览
const getTopPermissions = (role: Role) => {
  const permissions = []
  if (role.permissions?.menu?.dashboard) permissions.push('工作台')
  if (role.permissions?.menu?.system) permissions.push('系统管理')
  if (role.permissions?.operation?.user_create) permissions.push('用户管理')
  return permissions.slice(0, 3)
}
</script>

<style scoped lang="less">
.role-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #d9d9d9;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
  
  &.role-card-active {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  }
  
  &.role-card-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
  
  .role-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    
    .role-avatar {
      flex-shrink: 0;
    }
    
    .role-info {
      flex: 1;
      
      .role-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #262626;
        }
      }
      
      .role-description {
        margin: 0;
        font-size: 13px;
        color: #8c8c8c;
        line-height: 1.4;
      }
    }
    
    .role-actions {
      flex-shrink: 0;
    }
  }
  
  .role-stats {
    margin-bottom: 16px;
    
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      
      .stat-item {
        text-align: center;
        
        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #262626;
          margin-bottom: 2px;
        }
        
        .stat-label {
          font-size: 11px;
          color: #8c8c8c;
        }
      }
    }
  }
  
  .role-permissions-preview {
    margin-bottom: 16px;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      span {
        font-size: 12px;
        font-weight: 500;
        color: #666;
      }
    }
    
    .permission-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
      
      .more-count {
        font-size: 11px;
        color: #999;
      }
    }
  }
  
  .role-footer {
    margin-top: auto;
  }
}
</style>