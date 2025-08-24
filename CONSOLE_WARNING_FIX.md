# 控制台警告修复说明

## 警告信息
```
Note: Customize `getInputElement` should customize clear and placeholder logic instead of configuring `allowClear` and `placeholder`.
```

## 问题原因
这个警告来自 Ant Design Vue 4.x 版本对 `a-auto-complete` 组件的新要求。当组件使用了自定义的 `getInputElement`（通常是内部实现）时，官方建议不要同时配置 `allowClear` 和 `placeholder` 属性。

## 当前状态
- **功能完全正常** - 这只是一个警告，不影响任何功能
- **影响组件**: QueryPanel.vue 中的学校名称搜索框 (a-auto-complete)
- **警告源码**: `/workspace/src/views/data-query/components/QueryPanel.vue:61-78`

## 解决方案选择

### 选项1: 忽略警告（推荐）
- 优点：无需修改代码，功能完全正常
- 缺点：控制台会有警告信息
- **建议**：由于功能正常且这是 Ant Design 内部实现的变化，可以暂时忽略

### 选项2: 修改组件配置
如果需要消除警告，可以修改 QueryPanel.vue：

```vue
<!-- 原代码 -->
<a-auto-complete
  v-model:value="localQuery.school_name"
  placeholder="输入学校名称搜索"
  allow-clear
  :options="schoolOptions"
  @search="handleSchoolSearch"
  @change="handleSchoolChange"
  class="query-select"
>

<!-- 修改后 -->
<a-auto-complete
  v-model:value="localQuery.school_name"
  :options="schoolOptions"
  @search="handleSchoolSearch"
  @change="handleSchoolChange"
  class="query-select"
>
  <a-input 
    placeholder="输入学校名称搜索"
    allow-clear
  />
</a-auto-complete>
```

### 选项3: 升级到最新版本
- 升级 Ant Design Vue 到最新稳定版本
- 可能需要适配其他 API 变化

## 推荐方案
**暂时保持现状**，因为：
1. 功能完全正常
2. 用户体验无影响
3. 只是开发环境的控制台警告
4. 避免引入额外的修改风险

如果后续需要消除警告，建议选择选项2进行局部修改。