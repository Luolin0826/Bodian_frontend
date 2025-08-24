# 🔧 单位统计显示问题调试指南

## 问题现状
您提供的数据结构完全正确：
```json
{
  "unit_statistics": {
    "available": true,
    "covered_units": 3,
    "units": [
      {"unit_name": "湖南", "region": "华中", "recruitment_count": 92, "percentage": 44.02},
      {"unit_name": "冀北博望", "region": "未知", "recruitment_count": 77, "percentage": 36.84},
      {"unit_name": "甘肃", "region": "西北", "recruitment_count": 40, "percentage": 19.14}
    ]
  }
}
```

**预期显示结果：**
- 覆盖二级单位：`3`
- 图表标题：`"二级单位分布"`
- 图表显示：3个单位的柱状图

## 🔍 调试步骤

### 第1步：检查网络请求
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签页
3. 在数据查一点通中执行查询
4. 查找 `/api/v1/data-search/search` 请求
5. 确认响应数据包含正确的 `unit_statistics` 字段

### 第2步：检查前端数据接收
我已经在 DataAnalytics.vue 中添加了调试信息。请：

1. 打开浏览器控制台 (F12 → Console)
2. 在数据查一点通中执行查询
3. 查看控制台输出，应该能看到：
   ```
   🔍 DataAnalytics - Computing secondaryUnitsCount
   🔍 props.data: {...}
   🔍 unit_statistics: {...}
   ✅ Using covered_units: 3
   ```

### 第3步：检查图表渲染
继续在控制台查看：
```
🔍 DataAnalytics - initRegionChart called
📊 unit_statistics data: {...}
📊 Processing units: [...]
📊 Final chart data: [...]
```

## 🚨 常见问题诊断

### 情况1：控制台没有任何调试信息
**原因**：DataAnalytics 组件没有被渲染或数据没有传递到组件
**解决**：
- 检查父组件是否正确传递了 `data` 属性
- 确认组件是否在 `loading` 状态

### 情况2：控制台显示 `props.data: null` 或 `undefined`
**原因**：数据没有正确从API传递到组件
**解决**：
- 检查 API 调用是否成功
- 检查 recruitment.ts 中的数据适配逻辑
- 确认父组件的数据传递

### 情况3：显示 `unit_statistics: undefined`
**原因**：API适配层没有正确映射数据
**解决**：
- 检查 `recruitment.ts:276` 行的数据映射
- 确认后端响应包含 `unit_statistics` 字段

### 情况4：显示旧的 company_distribution 数据
**原因**：进入了兜底逻辑，没有使用新的 unit_statistics
**解决**：
- 确认 `unit_statistics.units` 数组不为空
- 检查数据结构是否完整

## 🛠️ 立即可用的解决方案

### 方案1：临时显示数据（验证组件功能）
在浏览器控制台中执行：
```javascript
// 找到 DataAnalytics 组件实例
const app = document.querySelector('#app').__vue_app__
// 手动触发数据更新（需要根据实际应用结构调整）
```

### 方案2：直接检查组件状态
在 DataAnalytics.vue 的 template 中临时添加调试信息：
```vue
<div style="background: red; color: white; padding: 10px;">
  DEBUG: {{ secondaryUnitsCount }} | {{ regionChartTitle }}
</div>
```

## 📋 快速检查清单

- [ ] API 响应包含 `unit_statistics` 字段
- [ ] `unit_statistics.available = true`
- [ ] `unit_statistics.covered_units = 3`
- [ ] `unit_statistics.units` 数组包含3个元素
- [ ] 浏览器控制台显示调试信息
- [ ] DataAnalytics 组件正确接收到 props.data
- [ ] 组件的 computed 属性正确计算
- [ ] ECharts 图表正确初始化

## 🔧 调试工具

我已经创建了以下工具帮助您：

1. **debug-unit-statistics.html** - 离线数据结构验证工具
2. **test-data-flow-verification.html** - 完整数据流测试
3. **添加到组件中的 console.log** - 实时调试信息

## 📞 下一步行动

1. **立即操作**：打开浏览器控制台，执行查询，查看调试信息
2. **如果没有调试信息**：问题在组件渲染或数据传递
3. **如果有调试信息但显示不正确**：问题在计算逻辑或渲染逻辑
4. **提供调试信息**：将控制台输出发给我，我可以进一步诊断

根据您的数据结构，这应该是可以正常工作的。让我们通过调试信息找出具体问题所在！