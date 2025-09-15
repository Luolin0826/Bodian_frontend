<template>
  <a-modal
    v-model:open="visible"
    title="Data-Query内容管理"
    width="1200px"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="content-manager">
      <!-- 省份选择器 -->
      <div class="province-selector">
        <a-select
          v-model:value="selectedProvince"
          placeholder="请选择省份"
          style="width: 200px"
          @change="handleProvinceChange"
        >
          <a-select-option
            v-for="province in provinces"
            :key="province.unit_id"
            :value="province.province"
          >
            {{ province.province }} ({{ province.content_count }}项)
          </a-select-option>
        </a-select>
        
        <a-button @click="loadProvinces" :loading="loading" style="margin-left: 8px">
          <reload-outlined />
          刷新
        </a-button>
      </div>

      <!-- 内容展示区 -->
      <div v-if="selectedProvince" class="content-sections">
        <a-tabs v-model:activeKey="activeTab" type="card">
          <a-tab-pane key="基本政策信息" tab="基本政策信息">
            <ContentSection 
              :province="selectedProvince"
              section="基本政策信息"
              :contents="contentData['基本政策信息'] || []"
              @refresh="loadContent"
              @content-updated="loadContent"
            />
          </a-tab-pane>
          
          <a-tab-pane key="提前批" tab="提前批">
            <ContentSection 
              :province="selectedProvince"
              section="提前批"
              :contents="contentData['提前批'] || []"
              @refresh="loadContent"
              @content-updated="loadContent"
            />
          </a-tab-pane>
          
          <a-tab-pane key="农网" tab="农网">
            <ContentSection 
              :province="selectedProvince"
              section="农网"
              :contents="contentData['农网'] || []"
              @refresh="loadContent"
              @content-updated="loadContent"
            />
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <a-empty description="请选择省份查看内容" />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineEmits, defineProps } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue'
import {
  dataQueryContentAPI,
  type DataQueryContent,
  type ProvinceContentSummary
} from '@/api/data-query-content'
import ContentSection from './ContentSection.vue'

// Props
const props = defineProps<{
  modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 数据
const visible = ref(props.modelValue)
const loading = ref(false)
const provinces = ref<ProvinceContentSummary[]>([])
const selectedProvince = ref('')
const activeTab = ref('基本政策信息')
const contentData = reactive<{
  '基本政策信息': DataQueryContent[]
  '提前批': DataQueryContent[]
  '农网': DataQueryContent[]
}>({
  '基本政策信息': [],
  '提前批': [],
  '农网': []
})

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
  if (newValue && provinces.value.length === 0) {
    loadProvinces()
  }
})

// 加载省份列表
const loadProvinces = async () => {
  try {
    loading.value = true
    const data = await dataQueryContentAPI.getProvincesList()
    provinces.value = data
    
    if (data.length > 0 && !selectedProvince.value) {
      selectedProvince.value = data[0].province
      await loadContent()
    }
  } catch (error) {
    console.error('加载省份列表失败:', error)
    message.error('加载省份列表失败')
  } finally {
    loading.value = false
  }
}

// 省份变化处理
const handleProvinceChange = async (province: string) => {
  selectedProvince.value = province
  await loadContent()
}

// 加载内容
const loadContent = async () => {
  if (!selectedProvince.value) return

  try {
    const data = await dataQueryContentAPI.getContentByProvince(selectedProvince.value)
    
    // 重置数据
    contentData['基本政策信息'] = []
    contentData['提前批'] = []
    contentData['农网'] = []
    
    // 分配内容到对应的tab
    Object.keys(data.content).forEach(section => {
      if (section in contentData) {
        contentData[section as keyof typeof contentData] = data.content[section] || []
      }
    })
    
    console.log('内容加载完成:', contentData)
  } catch (error) {
    console.error('加载内容失败:', error)
    message.error('加载内容失败')
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  emit('update:modelValue', false)
}

// 初始化
onMounted(() => {
  if (visible.value) {
    loadProvinces()
  }
})
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import { watch } from 'vue'

export default defineComponent({
  name: 'DataQueryContentManager'
})
</script>

<style scoped lang="less">
.content-manager {
  .province-selector {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
  }

  .content-sections {
    min-height: 500px;
    
    :deep(.ant-tabs-content-holder) {
      padding: 16px 0;
    }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }
}
</style>