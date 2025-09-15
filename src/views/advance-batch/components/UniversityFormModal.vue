<template>
  <a-modal
    :open="visible"
    :title="isEdit ? '编辑院校' : '新增院校'"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="600px"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
    >
      <a-form-item label="院校名称" name="university_name">
        <a-input v-model:value="formData.university_name" placeholder="请输入院校名称" />
      </a-form-item>
      
      <a-form-item label="就业网站" name="employment_website">
        <a-input v-model:value="formData.employment_website" placeholder="请输入就业网站地址，如：https://career.tsinghua.edu.cn" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { advanceBatchApi } from '@/api/advance-batch'
import type { UniversityInfo } from '@/api/types/advance-batch'

interface Props {
  visible: boolean
  data?: UniversityInfo | null
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

// 是否编辑模式
const isEdit = computed(() => !!props.data)

// 表单数据
const formData = reactive({
  university_name: '',
  employment_website: ''
})

// 表单验证规则
const rules = {
  university_name: [
    { required: true, message: '请输入院校名称', trigger: 'blur' }
  ],
  employment_website: [
    { required: true, message: '请输入就业网站地址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的网址格式', trigger: 'blur' }
  ]
}

// 重置表单
const resetForm = () => {
  formData.university_name = ''
  formData.employment_website = ''
  formRef.value?.resetFields()
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    // 编辑模式，填充表单
    formData.university_name = newData.university_name || ''
    formData.employment_website = newData.employment_website || ''
  } else {
    // 新增模式，清空表单
    resetForm()
  }
}, { immediate: true })

// 提交处理
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    loading.value = true
    
    if (isEdit.value && props.data) {
      // 编辑
      await advanceBatchApi.updateUniversity(props.data.id, formData)
      message.success('院校信息更新成功')
    } else {
      // 新增
      await advanceBatchApi.createUniversity(formData)
      message.success('院校添加成功')
    }
    
    emit('success')
    handleCancel()
  } catch (error) {
    console.error('操作失败:', error)
    message.error(isEdit.value ? '更新失败' : '添加失败')
  } finally {
    loading.value = false
  }
}

// 取消处理
const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}
</script>