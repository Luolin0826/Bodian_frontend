<template>
      <a-breadcrumb>
        <a-breadcrumb-item>
          <router-link to="/">
            <home-outlined />
          </router-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          <router-link v-if="item.path && !item.isLast" :to="item.path">
            {{ item.title }}
          </router-link>
          <span v-else>{{ item.title }}</span>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </template>
    
    <script setup lang="ts">
    import { computed } from 'vue'
    import { useRoute } from 'vue-router'
    import { HomeOutlined } from '@ant-design/icons-vue'
    
    const route = useRoute()
    
    const breadcrumbs = computed(() => {
      const matched = route.matched.filter(item => item.meta?.title)
      return matched.map((item, index) => ({
        path: item.path,
        title: item.meta.title,
        isLast: index === matched.length - 1
      }))
    })
    </script>