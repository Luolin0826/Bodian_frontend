<template>
  <div class="user-profile">
    <a-card title="个人信息" :loading="loading">
      <template #extra>
        <a-button type="primary" @click="handleEdit" :disabled="editMode">
          <EditOutlined />
          编辑
        </a-button>
      </template>

      <a-form
        :model="form"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
        @finish="handleSubmit"
        ref="formRef"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="用户名">
              <a-input :value="userInfo?.username" disabled />
            </a-form-item>

            <a-form-item label="真实姓名" name="real_name">
              <a-input 
                v-model:value="form.real_name" 
                :disabled="!editMode"
                placeholder="请输入真实姓名"
              />
            </a-form-item>

            <a-form-item label="邮箱" name="email">
              <a-input 
                v-model:value="form.email" 
                :disabled="!editMode"
                placeholder="请输入邮箱"
              />
            </a-form-item>

            <a-form-item label="手机号" name="phone">
              <a-input 
                v-model:value="form.phone" 
                :disabled="!editMode"
                placeholder="请输入手机号"
              />
            </a-form-item>

            <a-form-item label="角色">
              <a-input :value="userInfo?.role_display_name" disabled />
            </a-form-item>

            <a-form-item label="部门">
              <a-input :value="userInfo?.department_name" disabled />
            </a-form-item>
          </a-col>

          <a-col :span="12">
            <a-form-item label="头像" name="avatar">
              <div class="avatar-section">
                <a-avatar :size="100" :src="form.avatar || userInfo?.avatar">
                  <template #icon><UserOutlined /></template>
                </a-avatar>
                <div class="avatar-actions" v-if="editMode">
                  <a-upload
                    name="avatar"
                    :show-upload-list="false"
                    :before-upload="beforeUpload"
                    :custom-request="uploadAvatar"
                    accept="image/*"
                  >
                    <a-button size="small" type="link">
                      <UploadOutlined />
                      上传头像
                    </a-button>
                  </a-upload>
                </div>
              </div>
            </a-form-item>

            <a-form-item label="员工编号">
              <a-input :value="userInfo?.employee_no" disabled />
            </a-form-item>

            <a-form-item label="入职日期">
              <a-input :value="userInfo?.hire_date" disabled />
            </a-form-item>

            <a-form-item label="最后登录">
              <a-input :value="formatDateTime(userInfo?.last_login)" disabled />
            </a-form-item>

            <a-form-item label="登录次数">
              <a-input :value="userInfo?.login_count" disabled />
            </a-form-item>

            <a-form-item label="账户状态">
              <a-tag :color="userInfo?.is_active ? 'green' : 'red'">
                {{ userInfo?.is_active ? '正常' : '禁用' }}
              </a-tag>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :wrapper-col="{ offset: 4, span: 20 }" v-if="editMode">
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              保存
            </a-button>
            <a-button @click="handleCancel">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="修改密码" style="margin-top: 24px;">
      <a-form
        :model="passwordForm"
        :rules="passwordRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 12 }"
        @finish="handlePasswordSubmit"
        ref="passwordFormRef"
      >
        <a-form-item label="当前密码" name="old_password">
          <a-input-password 
            v-model:value="passwordForm.old_password"
            placeholder="请输入当前密码"
          />
        </a-form-item>

        <a-form-item label="新密码" name="new_password">
          <a-input-password 
            v-model:value="passwordForm.new_password"
            placeholder="请输入新密码"
          />
        </a-form-item>

        <a-form-item label="确认密码" name="confirm_password">
          <a-input-password 
            v-model:value="passwordForm.confirm_password"
            placeholder="请再次输入新密码"
          />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 12 }">
          <a-button type="primary" html-type="submit" :loading="passwordSubmitting">
            修改密码
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { EditOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { getUserProfile, updateUserProfile, changePassword, type UserProfile, type UpdateProfileRequest, type ChangePasswordRequest } from '@/api/user-center'
import dayjs from 'dayjs'

const loading = ref(false)
const editMode = ref(false)
const submitting = ref(false)
const passwordSubmitting = ref(false)
const userInfo = ref<UserProfile>()
const formRef = ref()
const passwordFormRef = ref()

const form = reactive<UpdateProfileRequest>({
  real_name: '',
  email: '',
  phone: '',
  avatar: ''
})

const passwordForm = reactive<ChangePasswordRequest>({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const rules = {
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  old_password: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== passwordForm.new_password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ]
}

const formatDateTime = (datetime?: string) => {
  return datetime ? dayjs(datetime).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const fetchUserProfile = async () => {
  try {
    loading.value = true
    const response = await getUserProfile()
    if (response.code === 0) {
      userInfo.value = response.data
      // 初始化表单数据
      form.real_name = response.data.real_name
      form.email = response.data.email
      form.phone = response.data.phone
      form.avatar = response.data.avatar
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

const handleEdit = () => {
  editMode.value = true
}

const handleCancel = () => {
  editMode.value = false
  // 重置表单数据
  if (userInfo.value) {
    form.real_name = userInfo.value.real_name
    form.email = userInfo.value.email
    form.phone = userInfo.value.phone
    form.avatar = userInfo.value.avatar
  }
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    const response = await updateUserProfile(form)
    if (response.code === 0) {
      message.success('个人信息更新成功')
      editMode.value = false
      await fetchUserProfile() // 重新获取用户信息
    }
  } catch (error) {
    console.error('更新个人信息失败:', error)
  } finally {
    submitting.value = false
  }
}

const handlePasswordSubmit = async () => {
  try {
    passwordSubmitting.value = true
    const response = await changePassword(passwordForm)
    if (response.code === 0) {
      message.success('密码修改成功')
      passwordForm.old_password = ''
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
      passwordFormRef.value?.resetFields()
    }
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    passwordSubmitting.value = false
  }
}

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const uploadAvatar = async (options: any) => {
  const formData = new FormData()
  formData.append('file', options.file)
  
  try {
    // 这里需要实现文件上传的API
    // const response = await uploadFile(formData)
    // form.avatar = response.data.url
    
    // 临时实现：创建本地预览URL
    const url = URL.createObjectURL(options.file)
    form.avatar = url
    message.success('头像上传成功')
  } catch (error) {
    message.error('头像上传失败')
    console.error('上传失败:', error)
  }
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.user-profile {
  padding: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-actions {
  display: flex;
  justify-content: center;
}
</style>