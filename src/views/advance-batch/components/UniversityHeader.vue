<template>
  <div class="university-header">
    <div class="header-content">
      <div class="header-title">
        <BankOutlined />
        <span>院校就业信息</span>
      </div>
      <a-button 
        v-if="canManage"
        type="primary" 
        @click="$emit('manage')" 
        class="manage-btn"
      >
        <SettingOutlined />
        院校管理
      </a-button>
    </div>

    <!-- 院校列表 -->
    <a-spin :spinning="loading">
      <div class="universities-content">
        <div class="universities-tags">
          <div class="university-tag" v-for="university in displayedUniversities" :key="university.id">
            <a 
              :href="university.employment_website" 
              target="_blank" 
              class="university-link"
              @click="handleLinkClick"
            >
              {{ university.university_name }}
            </a>
          </div>
          
          <!-- 展开/收起按钮 -->
          <div v-if="universities.length > 30" class="expand-button-tag">
            <a-button 
              type="text" 
              size="small" 
              @click="toggleExpanded"
              class="expand-btn"
            >
              <template v-if="!isExpanded">
                <DownOutlined />
                展开更多 ({{ universities.length - 30 }}所)
              </template>
              <template v-else>
                <UpOutlined />
                收起
              </template>
            </a-button>
          </div>
        </div>
      </div>
    </a-spin>

    <!-- 空状态 -->
    <a-empty 
      v-if="!loading && universities.length === 0"
      description="暂无院校信息"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  BankOutlined,
  SettingOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import type { UniversityInfo } from '@/api/types/advance-batch'

interface Props {
  universities: UniversityInfo[]
  loading: boolean
  canManage: boolean
}

interface Emits {
  (e: 'manage'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 展开状态
const isExpanded = ref(false)

// 显示的院校列表（限制30条或全部显示）
const displayedUniversities = computed(() => {
  if (isExpanded.value || props.universities.length <= 30) {
    return props.universities
  }
  return props.universities.slice(0, 30)
})

// 切换展开状态
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 处理链接点击
const handleLinkClick = (event: Event) => {
  const target = event.currentTarget as HTMLAnchorElement
  if (!target.href || target.href === window.location.href) {
    event.preventDefault()
    message.warning('该院校暂无就业网站信息')
  }
}
</script>

<style lang="less" scoped>
.university-header {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .manage-btn {
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .manage-btn {
        flex-shrink: 1;
      }
    }
  }

  .universities-content {
    padding: 24px;

    .universities-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      .university-tag {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #e8e8e8;
        border-radius: 6px;
        padding: 8px 12px;
        transition: all 0.2s ease;
        gap: 8px;

        &:hover {
          border-color: #1890ff;
          box-shadow: 0 2px 6px rgba(24, 144, 255, 0.15);
        }

        .university-link {
          font-size: 14px;
          font-weight: 500;
          color: #1890ff;
          text-decoration: none;
          transition: color 0.2s ease;

          &:hover {
            color: #40a9ff;
          }
        }
      }
      
      .expand-button-tag {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f9ff;
        border: 1px dashed #1890ff;
        border-radius: 6px;
        padding: 8px 12px;
        transition: all 0.2s ease;

        &:hover {
          background: #e6f7ff;
          border-color: #40a9ff;
        }

        .expand-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 500;
          color: #1890ff;
          padding: 0;
          height: auto;

          &:hover {
            color: #40a9ff;
          }
        }
      }
    }

    @media (max-width: 768px) {
      padding: 16px;

      .universities-tags {
        gap: 8px;

        .university-tag {
          padding: 6px 8px;

          .university-link {
            font-size: 13px;
          }
        }
        
        .expand-button-tag {
          padding: 6px 8px;

          .expand-btn {
            font-size: 12px;
            gap: 2px;
          }
        }
      }
    }
  }
}
</style>