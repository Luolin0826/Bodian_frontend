<template>
  <div class="test-api-page">
    <h2>API 测试页面</h2>
    
    <a-space direction="vertical" style="width: 100%">
      <!-- 基础连接测试 -->
      <a-card title="基础连接测试">
        <a-button @click="testConnection" :loading="testingConnection">
          测试连接
        </a-button>
        <div v-if="connectionResult" style="margin-top: 12px">
          <a-alert 
            :message="connectionResult.success ? '连接成功' : '连接失败'"
            :description="connectionResult.message"
            :type="connectionResult.success ? 'success' : 'error'"
          />
        </div>
      </a-card>

      <!-- 角色API测试 -->
      <a-card title="角色API测试">
        <a-space>
          <a-button @click="testGetRoles" :loading="testingRoles">
            获取角色列表
          </a-button>
          <a-button @click="testGetPermissionTree" :loading="testingPermissions">
            获取权限树
          </a-button>
          <a-button @click="testGetTemplates" :loading="testingTemplates">
            获取模板
          </a-button>
        </a-space>
        
        <div v-if="roleResult" style="margin-top: 12px">
          <a-alert 
            message="角色列表API测试结果"
            :description="roleResult"
            :type="roleResultType"
          />
        </div>
        
        <div v-if="permissionResult" style="margin-top: 12px">
          <a-alert 
            message="权限树API测试结果"
            :description="permissionResult"
            :type="permissionResultType"
          />
        </div>
        
        <div v-if="templateResult" style="margin-top: 12px">
          <a-alert 
            message="模板API测试结果"
            :description="templateResult"
            :type="templateResultType"
          />
        </div>
      </a-card>

      <!-- 详细响应数据 -->
      <a-card title="响应数据" v-if="responseData">
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; max-height: 400px; overflow-y: auto;">{{ JSON.stringify(responseData, null, 2) }}</pre>
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { getRoles, getPermissionTree, getPermissionTemplates } from '@/api/system'
import request from '@/api/request'

const testingConnection = ref(false)
const testingRoles = ref(false)
const testingPermissions = ref(false)
const testingTemplates = ref(false)

const connectionResult = ref<{success: boolean, message: string} | null>(null)
const roleResult = ref('')
const roleResultType = ref<'success' | 'error'>('success')
const permissionResult = ref('')
const permissionResultType = ref<'success' | 'error'>('success')
const templateResult = ref('')
const templateResultType = ref<'success' | 'error'>('success')
const responseData = ref<any>(null)

// 测试基础连接
const testConnection = async () => {
  testingConnection.value = true
  try {
    const response = await request.get('/api/v1/roles/')
    connectionResult.value = {
      success: true,
      message: `连接成功 - 状态码: ${response.status || 'OK'}`
    }
  } catch (error: any) {
    console.error('连接测试失败:', error)
    connectionResult.value = {
      success: false,
      message: `连接失败 - ${error.response?.status || error.code || error.message}`
    }
  } finally {
    testingConnection.value = false
  }
}

// 测试获取角色列表
const testGetRoles = async () => {
  testingRoles.value = true
  try {
    const roles = await getRoles()
    roleResult.value = `成功获取 ${roles.length} 个角色`
    roleResultType.value = 'success'
    responseData.value = roles
    console.log('角色列表:', roles)
  } catch (error: any) {
    console.error('获取角色列表失败:', error)
    roleResult.value = `失败: ${error.response?.data?.message || error.message}`
    roleResultType.value = 'error'
    responseData.value = error.response?.data || error
  } finally {
    testingRoles.value = false
  }
}

// 测试获取权限树
const testGetPermissionTree = async () => {
  testingPermissions.value = true
  try {
    const tree = await getPermissionTree()
    permissionResult.value = `成功获取权限树 - 菜单: ${tree.menu?.length || 0}个, 操作模块: ${tree.operation_modules?.length || 0}个`
    permissionResultType.value = 'success'
    responseData.value = tree
    console.log('权限树:', tree)
  } catch (error: any) {
    console.error('获取权限树失败:', error)
    permissionResult.value = `失败: ${error.response?.data?.message || error.message}`
    permissionResultType.value = 'error'
    responseData.value = error.response?.data || error
  } finally {
    testingPermissions.value = false
  }
}

// 测试获取模板
const testGetTemplates = async () => {
  testingTemplates.value = true
  try {
    const templates = await getPermissionTemplates()
    templateResult.value = `成功获取模板 - 内置: ${templates.builtin?.length || 0}个, 自定义: ${templates.custom?.length || 0}个`
    templateResultType.value = 'success'
    responseData.value = templates
    console.log('模板:', templates)
  } catch (error: any) {
    console.error('获取模板失败:', error)
    templateResult.value = `失败: ${error.response?.data?.message || error.message}`
    templateResultType.value = 'error'
    responseData.value = error.response?.data || error
  } finally {
    testingTemplates.value = false
  }
}
</script>

<style scoped lang="less">
.test-api-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>