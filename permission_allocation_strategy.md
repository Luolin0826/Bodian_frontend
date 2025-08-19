# 角色权限分配策略

## 角色层级设计

### 权限等级划分
- **Level 1-2**: 基础用户 (viewer, 实习生)
- **Level 3-4**: 业务用户 (sales, teacher)  
- **Level 5-6**: 管理用户 (manager, 主管)
- **Level 7-8**: 系统管理 (admin, 部门总监)
- **Level 9-10**: 超级管理 (super_admin, 系统架构师)

## 各角色权限分配

### 1. super_admin (超级管理员) - Level 10
**职责**: 系统架构设计、最高权限管理
**权限范围**:
- ✅ 所有菜单访问权限
- ✅ 所有操作权限（包括高风险操作）
- ✅ 全部数据访问权限
- ✅ 所有敏感信息查看权限
- ✅ 无时间限制
- ✅ 角色权限配置权限

**核心权限**:
```json
{
  "menu": ["*"], // 所有菜单
  "operation": {
    "user": ["*"],
    "department": ["*"], 
    "customer": ["*"],
    "sales": ["*"],
    "system": ["*"]
  },
  "data": {
    "scope": "all",
    "sensitive": ["*"]
  },
  "time": {
    "enable_login_time": false,
    "session_timeout": 480,
    "max_sessions": 10
  }
}
```

### 2. admin (系统管理员) - Level 8
**职责**: 日常系统管理、用户部门管理
**权限范围**:
- ✅ 系统管理相关菜单
- ✅ 用户/部门管理操作权限
- ✅ 全部业务数据访问
- ⚠️ 部分敏感信息查看权限
- ⚠️ 部分高风险操作受限

**核心权限**:
```json
{
  "menu": [
    "dashboard", "customer", "customer.list", "customer.follow",
    "sales", "sales.record", "sales.stats", 
    "system", "system.user", "system.department", "system.log"
  ],
  "operation": {
    "user": ["create", "edit", "delete", "reset_password", "change_status", "view_sensitive"],
    "department": ["create", "edit", "delete", "transfer"],
    "customer": ["create", "edit", "delete", "assign", "export"],
    "sales": ["create", "edit", "delete", "export"],
    "system": ["backup", "config", "clear_log"] // 不含restore
  },
  "data": {
    "scope": "all",
    "sensitive": ["phone", "id_card", "salary"]
  },
  "time": {
    "enable_login_time": false,
    "session_timeout": 480,
    "max_sessions": 5
  }
}
```

### 3. manager (部门经理) - Level 6
**职责**: 部门团队管理、业务数据分析
**权限范围**:
- ✅ 业务管理相关菜单
- ✅ 本部门用户管理权限
- ✅ 部门级数据访问权限
- ⚠️ 基础敏感信息查看
- ❌ 系统配置权限

**核心权限**:
```json
{
  "menu": [
    "dashboard", "customer", "customer.list", "customer.follow",
    "sales", "sales.record", "sales.stats"
  ],
  "operation": {
    "customer": ["create", "edit", "delete", "assign"],
    "sales": ["create", "edit", "delete", "export"],
    "user": ["edit", "view"] // 仅本部门
  },
  "data": {
    "scope": "department",
    "custom_scopes": ["student_data", "sales_data"],
    "sensitive": ["phone"]
  },
  "time": {
    "enable_login_time": false,
    "session_timeout": 240,
    "max_sessions": 3
  }
}
```

### 4. sales (销售人员) - Level 4
**职责**: 客户开发维护、销售业绩达成
**权限范围**:
- ✅ 客户管理相关菜单
- ✅ 客户基础操作权限
- ✅ 个人数据访问权限
- ❌ 敏感信息查看权限
- ❌ 管理类操作权限

**核心权限**:
```json
{
  "menu": [
    "dashboard", "customer", "customer.list", "customer.follow",
    "sales.record", "script", "knowledge"
  ],
  "operation": {
    "customer": ["create", "edit"],
    "sales": ["create", "edit"]
  },
  "data": {
    "scope": "self",
    "sensitive": []
  },
  "time": {
    "enable_login_time": true,
    "login_time_range": ["08:00", "20:00"],
    "login_weekdays": ["1", "2", "3", "4", "5", "6"],
    "session_timeout": 120,
    "max_sessions": 2
  }
}
```

### 5. teacher (教师) - Level 4  
**职责**: 教学管理、学生跟踪
**权限范围**:
- ✅ 教学管理相关菜单
- ✅ 学生信息操作权限
- ✅ 个人教学数据权限
- ❌ 财务敏感信息
- ❌ 销售业务权限

**核心权限**:
```json
{
  "menu": [
    "dashboard", "customer", "customer.list", "customer.follow",
    "script", "knowledge"
  ],
  "operation": {
    "customer": ["create", "edit"], // 学生信息
    "teaching": ["create", "edit", "grade"]
  },
  "data": {
    "scope": "self", 
    "custom_scopes": ["student_data"],
    "sensitive": []
  },
  "time": {
    "enable_login_time": true,
    "login_time_range": ["07:00", "22:00"],
    "login_weekdays": ["1", "2", "3", "4", "5", "6", "0"],
    "session_timeout": 180,
    "max_sessions": 2
  }
}
```

### 6. viewer (访客/观察员) - Level 2
**职责**: 数据查看、报表浏览
**权限范围**:
- ✅ 基础查看菜单
- ✅ 只读操作权限
- ✅ 受限数据访问
- ❌ 所有敏感信息
- ❌ 修改类操作

**核心权限**:
```json
{
  "menu": [
    "dashboard", "sales.stats" // 仅统计页面
  ],
  "operation": {
    "view": ["dashboard", "reports"] // 仅查看
  },
  "data": {
    "scope": "custom",
    "custom_scopes": ["report_data"],
    "sensitive": []
  },
  "time": {
    "enable_login_time": true,
    "login_time_range": ["09:00", "18:00"],
    "login_weekdays": ["1", "2", "3", "4", "5"],
    "session_timeout": 60,
    "max_sessions": 1
  }
}
```

## 权限继承和冲突处理

### 继承原则
1. **向下继承**: 高级别角色包含低级别角色的所有权限
2. **模块隔离**: 不同业务模块的权限相互独立
3. **最小权限**: 默认拒绝，明确授权

### 冲突处理
1. **权限级别冲突**: 高级别权限覆盖低级别权限  
2. **时间权限冲突**: 最严格的时间限制生效
3. **数据权限冲突**: 最小数据范围生效
4. **敏感权限冲突**: 最保守的敏感权限生效

## 特殊权限控制

### 高风险操作权限
需要特殊审批或二次验证：
- `user.delete` - 删除用户
- `user.reset_password` - 重置密码  
- `department.delete` - 删除部门
- `system.backup` - 数据备份
- `system.restore` - 数据恢复
- `system.config` - 系统配置

### 敏感数据权限
分级管控：
- **Level 1**: `phone` - 手机号码
- **Level 2**: `id_card` - 身份证号  
- **Level 3**: `bank_info` - 银行信息
- **Level 4**: `salary` - 薪资信息
- **Level 5**: `commission` - 提成信息

### 时间权限策略
- **业务人员**: 工作时间限制，支持加班时段
- **管理人员**: 弹性时间，支持随时处理紧急事务
- **系统人员**: 24小时访问，支持系统维护

## 权限审计和监控

### 权限变更审计
- 记录所有权限配置变更
- 包含操作人、时间、变更内容
- 支持权限变更回滚

### 异常权限监控  
- 跨级权限分配告警
- 高风险权限使用监控
- 敏感数据访问追踪

### 权限合规检查
- 定期权限合规性扫描
- 最小权限原则检查  
- 权限过期自动回收

## 权限模板管理

### 预置模板
- **销售团队模板**: 适用于销售人员快速配置
- **管理团队模板**: 适用于各级管理人员
- **系统运维模板**: 适用于技术运维人员
- **访客用户模板**: 适用于临时访问用户

### 自定义模板
- 支持基于现有角色创建模板
- 支持模板导入导出
- 支持模板版本管理

## 实施建议

### 阶段性实施
1. **第一阶段**: 实现基础角色权限分配
2. **第二阶段**: 完善时间权限和数据权限
3. **第三阶段**: 增加权限模板和审计功能
4. **第四阶段**: 优化权限监控和告警

### 迁移策略  
1. 保留现有用户角色映射
2. 渐进式权限细化
3. 提供权限对比和验证工具
4. 建立权限变更通知机制