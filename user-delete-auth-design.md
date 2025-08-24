# 用户删除功能鉴权设计方案

## 当前问题分析

### 安全风险
1. **无鉴权删除**：任何用户都可以删除其他用户
2. **自删风险**：用户可以删除自己，导致账户丢失
3. **权限混乱**：普通用户可能删除管理员账户
4. **操作不可逆**：删除操作无额外保护机制

## 鉴权规则设计

### 角色权限层次
```
super_admin (超级管理员) > admin (系统管理员) > manager (部门经理) > sales/teacher/viewer (普通用户)
```

### 删除权限矩阵

| 操作者角色 | 可删除的用户角色 | 限制条件 |
|------------|------------------|----------|
| super_admin | admin, manager, sales, teacher, viewer | 不能删除自己 |
| admin | manager, sales, teacher, viewer | 不能删除自己，不能删除super_admin |
| manager | sales, teacher, viewer (限本部门) | 不能删除自己，仅限管理的部门用户 |
| sales/teacher/viewer | 无 | 无删除权限 |

### 核心鉴权规则

1. **基础权限检查**
   - 必须有 "user:delete" 操作权限
   - 仅管理员级别(admin/super_admin)拥有删除权限

2. **自删保护**
   - 任何用户都不能删除自己
   - 防止误操作和恶意删除

3. **角色层级保护**
   - 普通管理员(admin)不能删除超级管理员(super_admin)
   - 部门经理(manager)只能删除所管辖部门的普通用户

4. **特殊用户保护**
   - 系统内置账户不可删除
   - 最后一个超级管理员不可删除

## 实现方案

### 1. 权限检查函数
```typescript
// 检查用户删除权限
const canDeleteUser = (currentUser: User, targetUser: User): { 
  canDelete: boolean; 
  reason?: string 
} => {
  // 基础权限检查
  if (!hasOperationPermission('user', 'delete')) {
    return { canDelete: false, reason: '无用户删除权限' }
  }

  // 自删保护
  if (currentUser.id === targetUser.id) {
    return { canDelete: false, reason: '不能删除自己' }
  }

  // 角色层级检查
  const roleHierarchy = {
    'super_admin': 4,
    'admin': 3, 
    'manager': 2,
    'sales': 1,
    'teacher': 1,
    'viewer': 1
  }

  const currentUserLevel = roleHierarchy[currentUser.role] || 0
  const targetUserLevel = roleHierarchy[targetUser.role] || 0

  if (currentUserLevel <= targetUserLevel) {
    return { canDelete: false, reason: '权限不足，无法删除同级或更高级用户' }
  }

  // 部门权限检查（管理员级别）
  if (currentUser.role === 'manager') {
    if (currentUser.department_id !== targetUser.department_id) {
      return { canDelete: false, reason: '只能删除本部门用户' }
    }
  }

  return { canDelete: true }
}
```

### 2. UI层权限控制
```vue
<template>
  <a-button 
    v-if="showDeleteButton(record)"
    type="text" 
    size="small" 
    danger 
    @click="handleDelete(record)"
  >
    <DeleteOutlined />
  </a-button>
</template>

<script>
const showDeleteButton = (user: User) => {
  const authResult = canDeleteUser(userStore.userInfo!, user)
  return authResult.canDelete
}
</script>
```

### 3. 删除操作增强确认
```typescript
const handleDelete = (user: User) => {
  const authResult = canDeleteUser(userStore.userInfo!, user)
  
  if (!authResult.canDelete) {
    message.error(authResult.reason!)
    return
  }

  Modal.confirm({
    title: '危险操作确认',
    content: `您即将删除用户"${user.real_name}"(${user.username})，此操作不可恢复！`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteUser(user.id!)
        message.success('删除成功')
        loadUsers()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}
```

## 安全增强建议

### 1. 审计日志
- 记录所有删除操作，包括操作者、被删除用户、操作时间
- 保留删除记录便于追踪和恢复

### 2. 软删除机制
- 实现软删除而非物理删除
- 提供用户恢复功能
- 设置数据保留期限

### 3. 二次验证
- 删除重要用户时要求输入密码
- 发送邮件/短信通知相关人员

### 4. 批量操作限制
- 限制批量删除用户数量
- 批量操作需要更高权限

## 实施步骤

1. **阶段一**：实现基础鉴权逻辑
2. **阶段二**：UI权限控制和用户提示
3. **阶段三**：增强安全功能（审计日志、软删除）
4. **阶段四**：测试和优化

通过这个方案，可以有效解决用户删除功能的安全问题，确保系统的稳定性和数据安全。