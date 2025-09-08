// 测试三级政策管理接口的简单脚本
// 可以在浏览器控制台运行来验证接口

const testPolicyAPI = {
  baseURL: '/api/v1/policy-management',
  
  // 测试获取所有省份
  async testGetProvinces() {
    try {
      const response = await fetch(`${this.baseURL}/regions?region_level=province`)
      const data = await response.json()
      console.log('省份数据:', data)
      return data
    } catch (error) {
      console.error('获取省份失败:', error)
    }
  },
  
  // 测试获取指定省份下的城市
  async testGetCities(provinceId, provinceName) {
    try {
      const params = new URLSearchParams({
        region_level: 'city',
        parent_id: provinceId,
        province: provinceName
      })
      const response = await fetch(`${this.baseURL}/regions?${params}`)
      const data = await response.json()
      console.log('城市数据:', data)
      return data
    } catch (error) {
      console.error('获取城市失败:', error)
    }
  },
  
  // 测试获取指定城市下的公司
  async testGetCompanies(cityId, provinceName, cityName) {
    try {
      const params = new URLSearchParams({
        region_level: 'company',
        parent_id: cityId,
        province: provinceName,
        city: cityName
      })
      const response = await fetch(`${this.baseURL}/regions?${params}`)
      const data = await response.json()
      console.log('公司数据:', data)
      return data
    } catch (error) {
      console.error('获取公司失败:', error)
    }
  },
  
  // 测试获取省级政策
  async testGetProvincePolicy(regionId) {
    try {
      const response = await fetch(`${this.baseURL}/province-policies/${regionId}`)
      const data = await response.json()
      console.log('省级政策:', data)
      return data
    } catch (error) {
      console.error('获取省级政策失败:', error)
    }
  },
  
  // 测试获取公司政策
  async testGetCompanyPolicy(regionId) {
    try {
      const response = await fetch(`${this.baseURL}/company-policies/${regionId}`)
      const data = await response.json()
      console.log('公司政策:', data)
      return data
    } catch (error) {
      console.error('获取公司政策失败:', error)
    }
  }
}

// 使用示例
console.log('政策管理API测试工具已加载')
console.log('使用方法:')
console.log('1. testPolicyAPI.testGetProvinces() - 获取所有省份')
console.log('2. testPolicyAPI.testGetCities(provinceId, provinceName) - 获取指定省份的城市')
console.log('3. testPolicyAPI.testGetCompanies(cityId, provinceName, cityName) - 获取指定城市的公司')
console.log('4. testPolicyAPI.testGetProvincePolicy(regionId) - 获取省级政策')
console.log('5. testPolicyAPI.testGetCompanyPolicy(regionId) - 获取公司政策')

// 导出到window对象供浏览器控制台使用
if (typeof window !== 'undefined') {
  window.testPolicyAPI = testPolicyAPI
}