# 三级政策管理系统 - 层级API使用说明

## 正确的数据加载流程

### 1. 获取省份列表
```javascript
// 第一步：获取所有省份
const provinces = await policyManagementAPI.getRegions({
  region_level: 'province'
})

// 返回数据格式：
{
  "data": {
    "regions": [
      {
        "region_id": 1,
        "province": "四川",
        "region_level": "province",
        "region_code": "SC"
      }
    ]
  }
}
```

### 2. 获取省份下的城市
```javascript
// 第二步：根据省份ID获取城市列表
const cities = await policyManagementAPI.getRegions({
  parent_id: 1, // 省份ID
  region_level: 'city',
  province: '四川'
})

// 返回数据格式：
{
  "data": {
    "regions": [
      {
        "region_id": 30,
        "province": "四川",
        "city": "成都",
        "region_level": "city",
        "parent_region_id": 1
      },
      {
        "region_id": 31,
        "province": "四川", 
        "city": "天府",
        "region_level": "city",
        "parent_region_id": 1
      }
    ]
  }
}
```

### 3. 获取城市下的区县公司
```javascript
// 第三步：根据城市ID获取区县公司列表
const companies = await policyManagementAPI.getRegions({
  parent_id: 30, // 城市ID
  region_level: 'company',
  province: '四川',
  city: '成都'
})

// 返回数据格式：
{
  "data": {
    "regions": [
      {
        "region_id": 246,
        "province": "四川",
        "city": "成都", 
        "company": "城区+直管县",
        "region_level": "company",
        "parent_region_id": 30
      }
    ]
  }
}
```

### 4. 获取指定区域的政策数据
```javascript
// 第四步：获取省级或公司级的政策数据
const regionPolicies = await policyManagementAPI.getRegionPolicies(regionId)

// 省级区域返回：
{
  "data": {
    "region": {
      "region_id": 1,
      "province": "四川",
      "region_level": "province"
    },
    "policies": {
      "province": {
        // 17个省级政策字段
        "cet_requirement": "四级",
        "computer_requirement": "二级", 
        "overage_allowed": "否",
        // ...其他字段
      }
    }
  }
}

// 公司级区域返回：
{
  "data": {
    "region": {
      "region_id": 246,
      "province": "四川",
      "city": "成都",
      "company": "城区+直管县",
      "region_level": "company"
    },
    "policies": {
      "province": {
        // 继承的省级政策
      },
      "company": {
        // 25个公司级政策字段
        "bachelor_985": "要求",
        "bachelor_211": "要求",
        "bachelor_salary": "12-15",
        // ...其他字段
      }
    }
  }
}
```

## API端点说明

### 区域查询API
- **路径**: `/api/v1/policy-management/regions`
- **方法**: GET
- **参数**:
  - `region_level`: 'province' | 'city' | 'company' (必需)
  - `parent_id`: number (可选，用于获取子级区域)
  - `province`: string (可选，按省份过滤)
  - `city`: string (可选，按城市过滤)

### 区域政策API (新的层级API)
- **路径**: `/api/v1/policy-management/regions/{region_id}/policies`
- **方法**: GET
- **功能**: 一次性获取指定区域的所有相关政策

## 前端组件使用方式

### PolicyNavigationTree.vue
```javascript
// 1. 初始加载省份
const provinces = await policyManagementAPI.getRegions({ region_level: 'province' })

// 2. 展开省份时加载城市
const cities = await policyManagementAPI.getRegions({
  parent_id: provinceId,
  region_level: 'city',
  province: provinceName
})

// 3. 展开城市时加载公司
const companies = await policyManagementAPI.getRegions({
  parent_id: cityId,
  region_level: 'company',
  province: provinceName,
  city: cityName
})

// 4. 检查政策状态
const regionPolicies = await policyManagementAPI.getRegionPolicies(regionId)
const hasPolicy = Object.keys(regionPolicies.policies).some(key => 
  regionPolicies.policies[key] !== null
)
```

### 政策编辑组件
```javascript
// 加载政策数据
const loadPolicyData = async (region) => {
  const regionPolicies = await policyManagementAPI.getRegionPolicies(region.region_id)
  
  if (region.region_level === 'province') {
    return regionPolicies.policies.province || {}
  } else if (region.region_level === 'company') {
    return regionPolicies.policies.company || {}
  }
}
```

## 优势

### 1. 性能优化
- 减少API调用次数
- 避免N+1查询问题
- 智能数据合并（公司政策自动包含省级政策）

### 2. 数据一致性
- 单一数据源
- 统一的错误处理
- 完整的层级信息

### 3. 开发体验
- RESTful API设计
- 清晰的数据结构
- 更好的错误信息

### 4. 扩展性
- 支持批量操作
- 易于添加新的政策级别
- 支持复杂的查询场景

## 注意事项

1. **市级数据**: 市级主要起连接作用，不直接存储政策，但需要在树形结构中显示
2. **政策继承**: 公司级区域的政策数据会同时包含省级和公司级政策
3. **错误处理**: 使用层级API时要处理各种异常情况
4. **缓存策略**: 考虑对频繁访问的数据进行适当缓存