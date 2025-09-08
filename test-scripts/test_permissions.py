#!/usr/bin/env python3
"""
测试权限配置 - 模拟后端权限函数返回的数据
"""

def get_user_permissions(role_name):
    """获取用户角色权限"""
    # 超级管理员和管理员的默认全部权限
    if role_name in ['super_admin', 'admin']:
        return {
            'menu': [
                '/dashboard',
                '/customer', '/customer/list', '/customer/follow', '/customer/reminders', '/customer/analytics',
                '/sales', '/sales/record', '/sales/stats',
                '/script',
                '/knowledge', 
                '/user-center', '/user-center/profile', '/user-center/preferences', '/user-center/security',
                '/system', '/system/user', '/system/department', '/system/role', '/system/log', '/system/test-api'
            ],
            'operation': {
                'dashboard': ['view', 'export'],
                'customer': ['create', 'read', 'update', 'delete', 'view_sensitive', 'import', 'export', 'assign', 'follow_up', 'reminder', 'analytics'],
                'sales': ['create', 'read', 'update', 'delete', 'approve', 'stats', 'commission'],
                'script': ['create', 'read', 'update', 'delete', 'copy', 'category_manage', 'export'],
                'knowledge': ['create', 'read', 'update', 'delete', 'copy', 'publish', 'category_manage', 'approve', 'export'],
                'system': ['user_manage', 'dept_manage', 'role_manage', 'permission_config', 'log_manage', 'system_config', 'backup']
            },
            'data': {
                'scope': 'all',
                'custom_scopes': [],
                'sensitive': ['all']
            }
        }
    
    # 销售角色权限 - 这是需要添加的部分
    if role_name == 'sales':
        return {
            'menu': [
                '/dashboard',
                '/customer', '/customer/list', '/customer/follow', '/customer/reminders', '/customer/analytics',
                '/sales', '/sales/record', '/sales/stats',
                '/script',
                '/knowledge',
                '/user-center', '/user-center/profile', '/user-center/preferences', '/user-center/security'
            ],
            'operation': {
                'dashboard': ['view'],
                'customer': ['create', 'read', 'update', 'follow_up', 'reminder', 'analytics'],
                'sales': ['create', 'read', 'update', 'stats'],
                'script': ['read', 'copy'],
                'knowledge': ['read', 'copy']
            },
            'data': {
                'scope': 'self',
                'custom_scopes': [],
                'sensitive': []
            }
        }
    
    # 从数据库获取角色权限
    # role = Role.query.filter_by(name=role_name).first()
    # if role and role.permissions:
    #     return role.permissions
    
    # 默认权限（基础权限）
    return {
        'menu': ['/dashboard', '/user-center/profile'],
        'operation': {},
        'data': {
            'scope': 'self',
            'custom_scopes': [],
            'sensitive': []
        }
    }

# 测试不同角色的权限
roles = ['super_admin', 'admin', 'sales', 'teacher', 'viewer']

for role in roles:
    permissions = get_user_permissions(role)
    print(f"\n=== {role} 角色权限 ===")
    print(f"菜单权限: {len(permissions['menu'])} 个")
    print(f"菜单列表: {permissions['menu']}")
    print(f"操作权限模块: {list(permissions['operation'].keys())}")