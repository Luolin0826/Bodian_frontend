#!/bin/bash

# 进入项目目录
cd /workspace/frontend

# 创建缺失的客户管理页面
cat > src/views/customer/list.vue << 'EOF'
<template>
  <div class="customer-list">
    <h1>客户列表</h1>
    <p>客户管理功能待实现</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

cat > src/views/customer/follow.vue << 'EOF'
<template>
  <div class="customer-follow">
    <h1>跟进管理</h1>
    <p>跟进功能待实现</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

# 创建缺失的销售管理页面
cat > src/views/sales/record.vue << 'EOF'
<template>
  <div class="sales-record">
    <h1>销售记录</h1>
    <p>销售记录功能待实现</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

cat > src/views/sales/stats.vue << 'EOF'
<template>
  <div class="sales-stats">
    <h1>销售统计</h1>
    <p>统计功能待实现</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

# 创建缺失的话术库页面
cat > src/views/script/index.vue << 'EOF'
<template>
  <div class="script">
    <h1>话术库</h1>
    <p>话术库功能待实现</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

# 创建缺失的知识库页面
cat > src/views/knowledge/index.vue << 'EOF'
<template>
  <div class="knowledge">
    <h1>知识库</h1>
    <p>知识库功能待实现</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

# 创建错误页面目录和文件
mkdir -p src/views/error

cat > src/views/error/403.vue << 'EOF'
<template>
  <div class="error-403 flex-center min-h-screen">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800">403</h1>
      <p class="text-xl text-gray-600 mt-4">无权限访问</p>
      <router-link to="/" class="text-blue-500 hover:underline mt-4 inline-block">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

cat > src/views/error/404.vue << 'EOF'
<template>
  <div class="error-404 flex-center min-h-screen">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800">404</h1>
      <p class="text-xl text-gray-600 mt-4">页面未找到</p>
      <router-link to="/" class="text-blue-500 hover:underline mt-4 inline-block">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

echo "✅ All missing files have been created!"
echo "Now you can run: npm run dev"