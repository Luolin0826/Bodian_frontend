<template>
  <div class="tree-test">
    <h3>三级政策管理树形组件测试</h3>
    
    <div class="test-controls">
      <a-button @click="logTreeData" type="primary">输出树数据</a-button>
      <a-button @click="logExpandedKeys" type="default">输出展开状态</a-button>
      <a-button @click="testExpand" type="default">测试展开福建</a-button>
      <a-button @click="testAPI" type="default">直接测试API</a-button>
    </div>

    <div class="test-content">
      <PolicyNavigationTree 
        :selectedRegion="selectedRegion"
        @region-selected="handleRegionSelected"
        @region-expanded="handleRegionExpanded"
      />
    </div>
    
    <div class="debug-info">
      <h4>调试信息:</h4>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import PolicyNavigationTree from '@/views/data-query/components/PolicyNavigationTree.vue'

const selectedRegion = ref(null)
const debugInfo = reactive({
  selectedRegion: null,
  lastExpanded: null,
  events: []
})

const handleRegionSelected = (region: any) => {
  console.log('Region selected:', region)
  selectedRegion.value = region
  debugInfo.selectedRegion = region
  debugInfo.events.unshift(`Selected: ${region?.province || ''} ${region?.city || ''} ${region?.company || ''}`)
  if (debugInfo.events.length > 10) debugInfo.events.pop()
}

const handleRegionExpanded = (regionId: number) => {
  console.log('Region expanded:', regionId)
  debugInfo.lastExpanded = regionId
  debugInfo.events.unshift(`Expanded: Region ${regionId}`)
  if (debugInfo.events.length > 10) debugInfo.events.pop()
}

const logTreeData = () => {
  console.log('当前树数据状态:', {
    selectedRegion: selectedRegion.value,
    debugInfo: debugInfo
  })
}

const logExpandedKeys = () => {
  console.log('展开状态检查')
}

const testExpand = () => {
  console.log('测试展开福建省节点')
  // 这里可以添加程序化展开测试
}

const testAPI = async () => {
  console.log('开始测试API调用...')
  
  try {
    // 导入API
    const { policyManagementAPI } = await import('@/api/policies')
    
    // 测试1: 获取省份
    console.log('测试1: 获取所有省份')
    const provinces = await policyManagementAPI.getRegions({ region_level: 'province' })
    console.log('省份数据:', provinces)
    
    // 测试2: 获取福建省的城市 (假设福建省ID是29)
    console.log('测试2: 获取福建省城市')
    const cities = await policyManagementAPI.getRegions({
      parent_id: 29,
      region_level: 'city',
      province: '福建'
    })
    console.log('城市数据:', cities)
    
    // 测试3: 如果有城市，获取第一个城市的公司
    if (cities.length > 0) {
      const firstCity = cities[0]
      console.log('测试3: 获取' + firstCity.city + '的公司')
      const companies = await policyManagementAPI.getRegions({
        parent_id: firstCity.region_id,
        region_level: 'company',
        province: firstCity.province,
        city: firstCity.city
      })
      console.log('公司数据:', companies)
    }
    
  } catch (error) {
    console.error('API测试失败:', error)
  }
}
</script>

<style scoped lang="less">
.tree-test {
  padding: 20px;
  
  .test-controls {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
  }
  
  .test-content {
    height: 400px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .debug-info {
    margin-top: 20px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
    
    pre {
      font-size: 12px;
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
</style>