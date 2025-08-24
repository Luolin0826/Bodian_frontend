# 话术库分页一致性修复

## 🐛 问题描述

用户报告话术库中也存在首次加载页面条数不对的问题，类似于知识库的问题。

## 🔍 问题分析

检查代码发现话术库存在分页大小设置不一致的问题：

1. **初始定义**: `pageSize: 300` (reactive初始值)
2. **onMounted设置**: `pagination.pageSize = itemsPerPage.value || 20`
3. **switchDisplayMode设置**: `pagination.pageSize = itemsPerPage.value || 300`

这种不一致导致：
- 首次访问页面时显示用户偏好或默认20条/页
- 切换显示模式时显示用户偏好或默认300条/页
- 用户体验不一致，容易造成困惑

## ✅ 修复方案

### 1. 统一默认分页大小
```javascript
// 修复前
const pagination = reactive({
  current: 1,
  pageSize: 300,  // 硬编码300
  total: 0
})

// 修复后
const pagination = reactive({
  current: 1,
  pageSize: 20,   // 合理的初始值
  total: 0
})
```

### 2. 统一onMounted中的逻辑
```javascript
// 修复前
pagination.pageSize = itemsPerPage.value || 20

// 修复后  
pagination.pageSize = itemsPerPage.value || 300
```

### 3. 简化switchDisplayMode逻辑
```javascript
// 修复前
if (mode === 'question') {
  pagination.pageSize = itemsPerPage.value || 300
} else {
  pagination.pageSize = itemsPerPage.value || 300
}

// 修复后
// 所有显示模式统一使用用户偏好
pagination.pageSize = itemsPerPage.value || 300
```

## 📋 修复内容

### 修改的文件
- `src/views/script/index.vue`

### 具体修改
1. **第829行**: 将初始`pageSize`从300改为20
2. **第1671行**: 将默认值从20改为300，与switchDisplayMode保持一致
3. **第1032-1033行**: 简化switchDisplayMode逻辑，移除重复的if-else判断

## 🎯 修复效果

### 修复前的问题
- ❌ 首次加载：用户偏好 || 20条/页
- ❌ 切换模式：用户偏好 || 300条/页  
- ❌ 行为不一致，用户困惑

### 修复后的效果
- ✅ 首次加载：用户偏好 || 300条/页
- ✅ 切换模式：用户偏好 || 300条/页
- ✅ 行为完全一致，用户体验统一

## 🔧 技术要点

1. **一致性原则**: 所有分页相关的逻辑都使用相同的默认值
2. **用户偏好优先**: 始终优先使用用户在偏好设置中的选择
3. **合理降级**: 当用户未设置偏好时，使用300条/页作为默认值（适合话术库的展示需求）

## 📊 影响范围

- **正面影响**: 话术库分页行为现在完全一致
- **用户体验**: 首次访问和切换模式的分页大小保持一致
- **兼容性**: 完全向后兼容，不影响现有功能
- **性能**: 无性能影响

## ✨ 验证要点

- [x] 首次访问话术库时的分页大小正确
- [x] 切换显示模式时分页大小保持一致  
- [x] 用户偏好设置生效
- [x] 默认值合理（300条适合话术展示）
- [x] 构建通过，无语法错误

现在话术库和知识库都已修复，分页行为完全一致且遵循用户偏好设置！