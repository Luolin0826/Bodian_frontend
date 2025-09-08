<template>
  <div class="script-library">
    <!-- 紧凑头部统计 -->
    <div class="compact-header">
      <div class="compact-stats">
        <div class="stat-item">
          <span class="stat-number">{{ scriptStats.total }}</span>
          <span class="stat-label">总话术数</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">
            {{ scriptStats.popular }}
            <a-tooltip title="复制10次以上可成为热门话术">
              <question-circle-outlined class="help-icon-corner" />
            </a-tooltip>
          </span>
          <span class="stat-label">热门话术</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ scriptStats.categories }}</span>
          <span class="stat-label">分类数</span>
        </div>
      </div>
    </div>


    <!-- 主要内容区域 -->
    <a-card class="main-card" :bordered="false">
      <!-- 搜索和操作区域 -->
      <div class="search-section">
        <div class="search-controls">
          <div class="search-inputs">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索问题场景、话术内容或关键词"
              class="search-input"
              @search="handleSearch"
              allow-clear
              size="large"
            >
              <template #prefix>
                <search-outlined class="search-icon" />
              </template>
            </a-input-search>
            
            <div class="filter-group desktop-only">
              <!-- v2.0新分类体系筛选器 - 级联选择器 -->
              <a-cascader
                v-model:value="selectedCascaderValue"
                :options="cascaderOptions"
                placeholder="选择话术分类"
                class="filter-select category-filter"
                size="large"
                :show-search="true"
                :filter-option="filterCascaderOption"
                @change="handleCascaderChange"
                allow-clear
                :field-names="{ label: 'label', value: 'value', children: 'children' }"
                expand-trigger="hover"
                :display-render="displayRender"
                change-on-select
              />

              <!-- 保留平台筛选器（常用功能） -->
              <a-select
                v-model:value="selectedPlatform"
                placeholder="适用平台"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option
                  v-for="platformOption in scriptPlatformOptions"
                  :key="platformOption.value"
                  :value="platformOption.value"
                >
                  <span class="option-text">
                    <mobile-outlined class="option-icon" />
                    {{ platformOption.label }} ({{ platformOption.count }})
                  </span>
                </a-select-option>
              </a-select>
              
              <a-select
                v-model:value="sortBy"
                placeholder="排序方式"
                class="filter-select"
                @change="handleSearch"
                size="large"
              >
                <a-select-option value="usage">
                  <span class="option-text">
                    <fire-outlined class="option-icon" />
                    按使用次数
                  </span>
                </a-select-option>
                <a-select-option value="date">
                  <span class="option-text">
                    <clock-circle-outlined class="option-icon" />
                    按创建日期
                  </span>
                </a-select-option>
                <a-select-option value="updated">
                  <span class="option-text">
                    <clock-circle-outlined class="option-icon" />
                    按更新时间排序
                  </span>
                </a-select-option>
              </a-select>
            </div>
          </div>
          
          <div class="action-buttons">
            <a-button class="filter-btn mobile-only" @click="showMobileFilters = true" size="large">
              <filter-outlined />
            </a-button>
            
            
            <!-- 展示模式切换 -->
            <a-button-group size="large" class="desktop-only">
              <a-button 
                :type="displayMode === 'question' ? 'primary' : 'default'"
                @click="switchDisplayMode('question')"
                title="问题列表模式"
              >
                <unordered-list-outlined />
              </a-button>
              <a-button 
                :type="displayMode === 'card' ? 'primary' : 'default'"
                @click="switchDisplayMode('card')"
                title="卡片模式"
              >
                <appstore-outlined />
              </a-button>
            </a-button-group>
            
            <a-button 
              v-if="userStore.role === 'super_admin'" 
              @click="showCategoryManager" 
              size="large" 
              title="分类管理"
            >
              <apartment-outlined />
              <span class="desktop-only">分类管理</span>
            </a-button>
            
            <a-button type="primary" @click="showCreateModal" size="large" class="add-btn">
              <plus-outlined />
              <span class="desktop-only">新增话术</span>
            </a-button>
          </div>
        </div>
      </div>
      

      <!-- 问题列表模式 -->
      <div v-if="displayMode === 'question'" class="question-list-mode">
        <div class="question-list">
          <div
            v-for="script in scriptList"
            :key="script.id"
            class="question-item"
            :class="{ 'pinned-item': script.is_pinned, 'favorited-item': script.is_favorited && !script.is_pinned }"
            @dblclick="showDetail(script)"
          >
            <div class="question-content">
              <span class="question-text">{{ script.question || script.title }}</span>
              <a-tag v-if="getCategoryLabel(script)" :color="getCategoryColor(script)" size="small" class="question-tag">
                {{ getCategoryLabel(script) }}
              </a-tag>
            </div>
            <div class="question-actions">
              <!-- 置顶按钮：仅管理员可见 -->
              <a-button 
                v-if="canManagePin"
                :type="script.is_pinned ? 'default' : 'text'"
                size="small" 
                @click.stop="togglePin(script)"
                class="pin-btn-question"
                :title="script.is_pinned ? '取消置顶' : '置顶话术'"
              >
                <pushpin-filled v-if="script.is_pinned" class="pinned" />
                <pushpin-outlined v-else />
              </a-button>
              <!-- 收藏按钮：所有用户可见 -->
              <a-button 
                :type="script.is_favorited ? 'default' : 'text'"
                size="small" 
                @click.stop="toggleFavorite(script)"
                class="favorite-btn-question"
                :title="script.is_favorited ? '取消收藏' : '收藏话术'"
              >
                <heart-filled v-if="script.is_favorited" class="favorited" />
                <heart-outlined v-else />
              </a-button>
              <a-button 
                type="primary" 
                size="small" 
                @click.stop="copyToClipboard(script.answer, script)"
                class="copy-btn-question"
                title="复制话术"
              >
                <copy-outlined />
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片模式 -->
      <div v-else class="compact-script-list">
        <div class="script-grid-compact">
          <div
            v-for="script in scriptList"
            :key="script.id"
            class="script-item-compact"
            :class="{ 'pinned-item': script.is_pinned, 'favorited-item': script.is_favorited && !script.is_pinned }"
            @dblclick="showDetail(script)"
          >
            <!-- 置顶标识 -->
            <div class="pin-corner" v-if="script.is_pinned">
              <pushpin-filled class="pin-icon" />
            </div>
            <!-- 收藏标识（仅在非置顶时显示） -->
            <div class="favorite-corner" v-else-if="script.is_favorited">
              <heart-filled class="favorite-icon" />
            </div>
            <!-- 问题 -->
            <div class="question-section" v-if="script.question">
              <div class="section-label">Q:</div>
              <div class="section-content">{{ script.question }}</div>
            </div>
            
            <!-- 答案 -->
            <div class="answer-section">
              <div class="section-label">A:</div>
              <div class="section-content">{{ script.answer }}</div>
            </div>
            
            <!-- 底部操作栏 -->
            <div class="item-footer">
              <div class="item-meta">
                <a-tag v-if="getCategoryLabel(script)" :color="getCategoryColor(script)" size="small">
                  {{ getCategoryLabel(script) }}
                </a-tag>
                <span class="usage-count" v-if="script.usage_count">
                  {{ script.usage_count }}次
                </span>
              </div>
              
              <div class="action-buttons">
                <!-- 置顶按钮：仅管理员可见 -->
                <a-button 
                  v-if="canManagePin"
                  :type="script.is_pinned ? 'default' : 'text'"
                  size="small" 
                  @click.stop="togglePin(script)"
                  class="pin-btn-compact"
                  :title="script.is_pinned ? '取消置顶' : '置顶话术'"
                >
                  <pushpin-filled v-if="script.is_pinned" class="pinned" />
                  <pushpin-outlined v-else />
                </a-button>
                <!-- 收藏按钮：所有用户可见 -->
                <a-button 
                  :type="script.is_favorited ? 'default' : 'text'"
                  size="small" 
                  @click.stop="toggleFavorite(script)"
                  class="favorite-btn-compact"
                  :title="script.is_favorited ? '取消收藏' : '收藏话术'"
                >
                  <heart-filled v-if="script.is_favorited" class="favorited" />
                  <heart-outlined v-else />
                </a-button>
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="copyToClipboard(script.answer, script)"
                  class="copy-btn-compact"
                  title="复制答案"
                >
                  <copy-outlined />
                </a-button>
                <!-- 删除按钮：仅超级管理员可见 -->
                <a-button 
                  v-if="canDeleteScript"
                  type="text" 
                  size="small" 
                  @click.stop="handleDelete(script)"
                  class="delete-btn-compact"
                  danger
                  title="删除话术"
                >
                  <delete-outlined />
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <a-pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :show-quick-jumper="true"
          :show-total="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
          :page-size-options="['10', '20', '50', '100', '300']"
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>

      <!-- 暂无数据 -->
      <div v-if="scriptList.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <message-outlined />
        </div>
        <h3>暂无话术数据</h3>
        <p>创建你的第一个话术，开始构建专业的话术库</p>
        <a-button type="primary" @click="showCreateModal" size="large" class="create-first-btn">
          <plus-outlined />
          创建第一个话术
        </a-button>
      </div>
    </a-card>

    <!-- 移动端筛选器 -->
    <a-drawer
      v-model:open="showMobileFilters"
      title="筛选条件"
      placement="right"
      :width="280"
      class="mobile-filters"
    >
      <div class="mobile-filter-content">
        <a-form layout="vertical">
          <!-- v2.0新分类体系筛选器 - 级联选择器 -->
          <a-form-item label="话术分类" name="category">
            <a-cascader
              v-model:value="selectedCascaderValue"
              :options="cascaderOptions"
              placeholder="选择话术分类"
              allow-clear
              :show-search="true"
              :filter-option="filterCascaderOption"
              @change="handleCascaderChange"
              :field-names="{ label: 'label', value: 'value', children: 'children' }"
              expand-trigger="hover"
              :display-render="displayRender"
              change-on-select
            />
          </a-form-item>

          <a-form-item label="适用平台" name="platform">
            <a-select
              v-model:value="selectedPlatform"
              placeholder="选择平台"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option
                v-for="platformOption in scriptPlatformOptions"
                :key="platformOption.value"
                :value="platformOption.value"
              >
                {{ platformOption.label }} ({{ platformOption.count }})
              </a-select-option>
            </a-select>
          </a-form-item>
          
          
          <a-form-item label="排序方式" name="sort_by">
            <a-select
              v-model:value="sortBy"
              placeholder="选择排序"
              @change="handleSearch"
            >
              <a-select-option value="usage">按使用次数</a-select-option>
              <a-select-option value="date">按创建日期</a-select-option>
              <a-select-option value="updated">按更新时间排序</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
        
        <div class="filter-actions">
          <a-button block @click="resetFilters">重置筛选</a-button>
          <a-button type="primary" block @click="showMobileFilters = false" class="apply-btn">
            应用筛选
          </a-button>
        </div>
      </div>
    </a-drawer>

    <!-- 话术详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="话术详情"
      width="600px"
      :footer="null"
      class="detail-modal-compact"
    >
      <div v-if="currentScript" class="script-detail-compact">
        <!-- 紧凑的问题场景 -->
        <div v-if="currentScript.question" class="detail-row">
          <div class="row-label">
            <question-circle-outlined />
            问题场景
          </div>
          <div class="row-content question-text">
            {{ currentScript.question }}
          </div>
        </div>

        <!-- 紧凑的话术内容 -->
        <div class="detail-row">
          <div class="row-label">
            <message-outlined />
            话术内容
          </div>
          <div class="row-content answer-text">
            {{ currentScript.answer }}
          </div>
        </div>

        <!-- 紧凑的关键词 -->
        <div v-if="currentScript.keywords" class="detail-row">
          <div class="row-label">
            <tags-outlined />
            关键词
          </div>
          <div class="row-content">
            <a-tag 
              v-for="keyword in currentScript.keywords.split(',')"
              :key="keyword.trim()"
              size="small"
              class="compact-keyword-tag"
            >
              {{ keyword.trim() }}
            </a-tag>
          </div>
        </div>

        <!-- 紧凑的统计信息 -->
        <div class="detail-row stats-row">
          <div class="row-label">
            <fire-outlined />
            使用次数
          </div>
          <div class="row-content stats-content">
            <span class="usage-number">{{ currentScript.usage_count || 0 }} 次</span>
          </div>
        </div>
        
        <!-- 时间信息 -->
        <div class="detail-row time-row">
          <div class="row-label">
            <clock-circle-outlined />
            时间信息
          </div>
          <div class="row-content time-content">
            <div class="time-item">
              <span class="time-label">创建时间：</span>
              <span class="time-value">{{ formatDate(currentScript.created_at) }}</span>
            </div>
            <div v-if="currentScript.updated_at && currentScript.updated_at !== currentScript.created_at" class="time-item">
              <span class="time-label">更新时间：</span>
              <span class="time-value">{{ formatDate(currentScript.updated_at) }}</span>
            </div>
          </div>
        </div>

        <!-- 紧凑的操作按钮 -->
        <div class="detail-actions-compact">
          <a-button 
            @click="copyToClipboard(currentScript.answer, currentScript)" 
            class="compact-copy-btn"
            size="small"
          >
            <copy-outlined />
            复制话术
          </a-button>
          <a-button 
            type="primary" 
            @click="handleEdit(currentScript); detailVisible = false"
            class="compact-edit-btn"
            size="small"
          >
            <edit-outlined />
            编辑话术
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 新增/编辑话术弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingScript ? '编辑话术' : '新增话术'"
      width="900px"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="submitLoading"
      class="script-modal"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        class="compact-form"
      >
        <!-- 第一行：话术分类和适用平台 -->
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="话术分类" name="category_id">
              <CategorySelector
                :key="categorySelectorKey"
                ref="categorySelectorRef"
                v-model="formData.category_id"
                placeholder="请选择话术分类"
                :allow-create="true"
                :show-count="false"
                @create="handleCategoryCreate"
                @change="handleCategoryChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="适用平台" name="platform_new">
              <a-select
                v-model:value="formData.platform_new"
                placeholder="选择适用平台"
                allow-clear
              >
                <a-select-option
                  v-for="option in scriptPlatformOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <mobile-outlined v-if="option.value === 'xiaohongshu'" />
                    <message-outlined v-else-if="option.value === 'wechat'" />
                    <phone-outlined v-else-if="option.value === 'phone'" />
                    <global-outlined v-else />
                    {{ option.label }}
                  </span>
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- 第二行：问题场景 -->
        <a-form-item label="问题场景" name="question">
          <a-input 
            v-model:value="formData.question" 
            placeholder="请输入客户问题或使用场景"
            show-count
            :maxlength="200"
          />
        </a-form-item>
        
        <a-form-item label="话术内容" name="answer">
          <a-textarea 
            v-model:value="formData.answer" 
            placeholder="请输入话术内容"
            :rows="6"
            show-count
            :maxlength="2000"
          />
        </a-form-item>
        
        <a-form-item label="关键词" name="keywords">
          <div class="keywords-input-section">
            <a-select
              v-model:value="selectedKeywords"
              mode="tags"
              placeholder="输入或选择关键词，回车添加"
              style="width: 100%"
              :options="suggestedKeywords"
              @change="handleKeywordsChange"
              :token-separators="[',', '、', ' ']"
            >
            </a-select>
            <div class="keywords-suggestions" v-if="popularKeywords.length > 0">
              <span class="suggestions-label">热门关键词：</span>
              <a-tag 
                v-for="keyword in popularKeywords.slice(0, 8)"
                :key="keyword"
                @click="addKeyword(keyword)"
                style="cursor: pointer; margin: 2px;"
                color="blue"
              >
                <plus-outlined style="margin-right: 4px;" />
                {{ keyword }}
              </a-tag>
            </div>
          </div>
        </a-form-item>
        
        <a-form-item label="客户信息" name="customer_info">
          <a-input 
            v-model:value="formData.customer_info" 
            placeholder="请输入相关客户信息或备注"
            show-count
            :maxlength="200"
          />
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 分类管理弹窗 -->
    <a-modal
      v-model:open="categoryManagerVisible"
      title="分类管理"
      :width="800"
      :footer="null"
      class="category-manager-modal"
    >
      <CategoryManager
        :height="500"
        @create="handleCategoryManagerCreate"
        @update="handleCategoryManagerUpdate"
        @delete="handleCategoryManagerDelete"
        @refresh="handleCategoryManagerRefresh"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useUserPreferences } from '@/composables/useUserPreferences'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CopyOutlined,
  MessageOutlined,
  FireOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  MobileOutlined,
  PhoneOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  PushpinOutlined,
  PushpinFilled,
  HeartOutlined,
  HeartFilled,
  RightOutlined,
  TagOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  FormOutlined,
  SolutionOutlined,
  CompassOutlined,
  ProjectOutlined,
  ShopOutlined,
  CustomerServiceOutlined,
  ReadOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  FolderOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useResponsive } from '@/composables/useResponsive'
import { useUserStore } from '@/stores/user'
import { 
  searchScripts, 
  createScript, 
  updateScript, 
  deleteScript,
  pinScript,
  unpinScript,
  favoriteScript,
  unfavoriteScript,
  // 新分类管理API
  getScriptCategoriesTree,
  type Script,
  type ScriptQuery,
  type ScriptCategory
} from '@/api/script'
import { CategorySelector, CategoryManager } from '@/components/script'
import request from '@/api/request'

// 响应式工具
const { isMobile } = useResponsive()
const userStore = useUserStore()

// 权限验证
const canManagePin = computed(() => {
  // 只有超级管理员和管理员可以操作置顶功能
  return userStore.userInfo?.role === 'super_admin' || userStore.userInfo?.role === 'admin'
})

const canDeleteScript = computed(() => {
  // 只有超级管理员可以删除话术
  return userStore.userInfo?.role === 'super_admin'
})

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const modalVisible = ref(false)
const detailVisible = ref(false)
const showMobileFilters = ref(false)
const displayMode = ref('question') // 默认为问题列表模式
const scriptList = ref<Script[]>([])
const editingScript = ref<Script | null>(null)
const currentScript = ref<Script | null>(null)
const formRef = ref()
const categorySelectorRef = ref()
const categorySelectorKey = ref(0) // 用于强制刷新CategorySelector
const viewType = ref<'grid' | 'list'>('list')
const sortBy = ref<string>('updated')

// 搜索参数
const searchKeyword = ref('')
// 新分类系统相关数据
const categories = ref<ScriptCategory[]>([])
const categoryManagerVisible = ref(false)
const selectedType = ref<string>()
const selectedContentType = ref<string>()
const selectedPlatform = ref<string>()
// v2.0新分类体系搜索参数 - 改为多选
const selectedCategories = ref<string[]>([])
const selectedCascaderValue = ref<(string | number)[]>([]) // 级联选择器的值

// 关键词管理
const selectedKeywords = ref<string[]>([])
const popularKeywords = ref<string[]>([
  '考试', '报名', '费用', '课程', '时间', '地点', 
  '证书', '通过率', '难度', '复习', '资料', '老师',
  '优惠', '咨询', '电网', '考研', '小红书', '回复'
])
const suggestedKeywords = computed(() => {
  return popularKeywords.value.map(keyword => ({
    label: keyword,
    value: keyword
  }))
})

// 话术类型选项（动态获取）
const scriptTypeOptions = ref<Array<{ value: string; label: string; count: number }>>([])

// 内容类型选项（动态获取）
const scriptContentOptions = ref<Array<{ value: string; label: string; count: number }>>([])

// 适用平台选项（动态获取）
const scriptPlatformOptions = ref<Array<{ value: string; label: string; count: number }>>([])

// v2.0新分类体系选项 - 合并为综合分类选项
const categoryOptions = ref<Array<{
  label: string;
  value: string;
  options?: Array<{ value: string; label: string; count: number }>;
  count?: number;
}>>([])

// 级联选择器数据
const cascaderOptions = ref<Array<{
  label: string;
  value: string;
  children?: Array<{ value: string; label: string; count?: number }>;
  count?: number;
}>>([])

// 主分类选项（计算属性）
const primaryCategoryOptions = computed(() => {
  return [
    { value: 'project_category', label: '项目分类' },
    { value: 'product_intro', label: '产品介绍' },
    { value: 'marketing', label: '营销话术' },
    { value: 'faq', label: '常见问题' },
    { value: 'learning_guidance', label: '学习指导' },
    { value: 'study_planning', label: '学习规划' }
  ]
})

// 子分类选项（计算属性）
const secondaryCategoryOptions = computed(() => {
  const primaryCategory = formData.primary_category
  
  const categoryMap: Record<string, Array<{ value: string; label: string }>> = {
    'project_category': [
      { value: 'power_grid', label: '电网' },
      { value: 'electrical_exam', label: '电气考研' }
    ],
    'learning_guidance': [
      { value: 'application_guide', label: '网申' },
      { value: 'review_planning', label: '复习规划' },
      { value: 'consultation', label: '报考咨询' }
    ]
  }
  
  return categoryMap[primaryCategory] || []
})

// 检查主分类是否有子分类
const hasSubcategories = (primaryValue: string): boolean => {
  const categoriesWithSub = ['project_category', 'learning_guidance']
  return categoriesWithSub.includes(primaryValue)
}

// 判断是否应该显示子分类选择框
const shouldShowSubcategory = computed(() => {
  return formData.primary_category && hasSubcategories(formData.primary_category)
})

// 获取主分类的中文标签
const getPrimaryCategoryLabel = (primaryValue?: string): string => {
  if (!primaryValue) return ''
  const categoryMap: Record<string, string> = {
    'project_category': '项目分类',
    'product_intro': '产品介绍',
    'marketing': '营销话术',
    'faq': '常见问题',
    'learning_guidance': '学习指导',
    'study_planning': '学习规划'
  }
  return categoryMap[primaryValue] || primaryValue
}

// 话术统计数据（动态获取）
const scriptStats = ref({
  total: 0,
  popular: 0,
  recent: 0,
  categories: 0
})

// 用户偏好设置
const { itemsPerPage, loadPreferencesOnce } = useUserPreferences()

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20, // 初始值，会在onMounted中根据用户偏好设置
  total: 0
})

// 表单数据
const formData = reactive<Script>({
  title: '',
  question: '',
  answer: '',
  keywords: '',
  // 新分类系统字段
  category_id: null,
  // v2.0新分类体系字段
  primary_category: undefined,
  secondary_category: undefined,
  // 保留兼容字段
  script_type_new: undefined,
  content_type_new: undefined,
  platform_new: undefined,
  customer_info: ''
})

// 表单验证规则
const rules = {
  question: [
    { required: true, message: '请输入问题场景', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入话术内容', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择话术分类', trigger: 'change' }
  ]
} as any

// 分类选项
// const categoryOptions = computed(() => {
//   return categories.value.map(cat => ({ label: cat, value: cat }))
// })

// 获取分类标签文本
const getCategoryLabel = (script: Script): string => {
  // 优先显示主分类
  if (script.primary_category) {
    // 如果主分类是general，返回空字符串（不显示）
    if (script.primary_category === 'general') {
      return ''
    }
    
    const categoryMap: Record<string, string> = {
      'project_category': '项目分类',
      'product_intro': '产品介绍',
      'marketing': '营销话术',
      'faq': '常见问题',
      'learning_guidance': '学习指导',
      'study_planning': '学习规划'
    }
    
    // 如果有子分类，显示更具体的分类
    if (script.secondary_category) {
      // 如果子分类是general，返回主分类
      if (script.secondary_category === 'general') {
        return categoryMap[script.primary_category] || script.primary_category
      }
      
      const subCategoryMap: Record<string, string> = {
        // 项目分类的子分类
        'power_grid': '电网',
        'electrical_exam': '电气考研',
        // 学习指导的子分类
        'application_guide': '网申',
        'review_planning': '复习规划',
        'consultation': '报考咨询'
      }
      return subCategoryMap[script.secondary_category] || script.secondary_category
    }
    
    return categoryMap[script.primary_category] || script.primary_category
  }
  
  // 回退到原有分类，如果是general则不显示
  if (script.category === 'general') {
    return ''
  }
  
  // 处理旧的英文分类值，转换为中文显示
  if (script.category) {
    const legacyCategoryMap: Record<string, string> = {
      // 旧分类系统的英文值映射
      'power_grid': '电网',
      'electrical_exam': '电气考研',
      'product_intro': '产品介绍',
      'marketing': '营销话术',
      'faq': '常见问题',
      'learning_guidance': '学习指导',
      'application_guide': '网申',
      'review_planning': '复习规划',
      'consultation': '报考咨询',
      'study_planning': '学习规划',
      // 其他可能的旧分类值
      'opening': '开场白',
      'price_negotiation': '价格谈判',
      'objection_handling': '异议处理',
      'closing': '成交话术',
      'after_sales': '售后服务'
    }
    
    return legacyCategoryMap[script.category] || script.category
  }
  
  return ''
}

// 获取分类颜色
const getCategoryColor = (script: Script): string => {
  const category = getCategoryLabel(script)
  
  const colorMap: Record<string, string> = {
    // v2.0新分类体系颜色
    '项目分类': 'blue',
    '产品介绍': 'green', 
    '营销话术': 'purple',
    '常见问题': 'red',
    '学习指导': 'cyan',
    '学习规划': 'gold',
    // 项目分类子分类颜色
    '电网': 'orange',
    '电气考研': 'geekblue',
    // 学习指导子分类颜色
    '网申': 'volcano',
    '复习规划': 'magenta',
    '报考咨询': 'lime',
    // 兼容旧分类
    '开场白': 'blue',
    '价格谈判': 'orange',
    '异议处理': 'red',
    '成交话术': 'purple',
    '售后服务': 'cyan'
  }
  return colorMap[category] || 'default'
}

// 获取主分类图标
const getCategoryIcon = (categoryValue: string) => {
  const iconMap: Record<string, string> = {
    'project_category': 'ProjectOutlined',
    'product_intro': 'ShopOutlined', 
    'marketing': 'CustomerServiceOutlined',
    'faq': 'QuestionCircleOutlined',
    'learning_guidance': 'ReadOutlined',
    'study_planning': 'ScheduleOutlined'
  }
  return iconMap[categoryValue] || 'DatabaseOutlined'
}

// 获取主分类图标颜色
const getCategoryIconColor = (categoryValue: string) => {
  const colorMap: Record<string, string> = {
    'project_category': '#1890ff',
    'product_intro': '#52c41a',
    'marketing': '#722ed1',
    'faq': '#f5222d',
    'learning_guidance': '#13c2c2',
    'study_planning': '#faad14'
  }
  return colorMap[categoryValue] || '#666'
}

// 获取子分类图标
const getSubCategoryIcon = (subcategoryValue: string) => {
  const iconMap: Record<string, string> = {
    // 项目分类的子分类
    'power_grid': 'ThunderboltOutlined',
    'electrical_exam': 'ExperimentOutlined',
    // 学习指导的子分类
    'application_guide': 'FormOutlined',
    'review_planning': 'SolutionOutlined',
    'consultation': 'CompassOutlined'
  }
  return iconMap[subcategoryValue] || 'TagOutlined'
}

// 获取子分类图标颜色
const getSubCategoryIconColor = (subcategoryValue: string) => {
  const colorMap: Record<string, string> = {
    // 项目分类的子分类
    'power_grid': '#fa8c16',
    'electrical_exam': '#2f54eb',
    // 学习指导的子分类
    'application_guide': '#fa541c',
    'review_planning': '#eb2f96',
    'consultation': '#a0d911'
  }
  return colorMap[subcategoryValue] || '#666'
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm') : ''
}

// 切换展示模式
const switchDisplayMode = (mode: 'question' | 'card') => {
  displayMode.value = mode
  
  // 根据用户偏好设置分页大小（所有显示模式统一使用用户偏好）
  pagination.pageSize = itemsPerPage.value || 300
  
  // 重新加载数据
  loadScripts()
}

// 加载话术列表
const loadScripts = async () => {
  loading.value = true
  try {
    const params: ScriptQuery = {
      page: pagination.current,
      per_page: pagination.pageSize,
      sort_by: sortBy.value, // 添加排序参数
      sort_order: 'desc' // 降序排列，最新的在前面
    }
    
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (selectedType.value) {
      params.script_type_new = selectedType.value
    }
    if (selectedContentType.value) {
      params.content_type_new = selectedContentType.value
    }
    if (selectedPlatform.value) {
      params.platform_new = selectedPlatform.value
    }
    // v2.0新分类体系查询参数 - 处理多选分类
    if (selectedCategories.value.length > 0) {
      // 将选中的分类解析为主分类和子分类
      const primaryCategories = new Set<string>()
      const secondaryCategories = new Set<string>()
      
      for (const category of selectedCategories.value) {
        if (category.includes(':')) {
          // 带有子分类的格式 "learning_guidance:application_guide"
          const [primary, secondary] = category.split(':')
          primaryCategories.add(primary)
          secondaryCategories.add(secondary)
        } else {
          // 纯主分类格式 "product_intro"
          primaryCategories.add(category)
        }
      }
      
      if (primaryCategories.size > 0) {
        params.primary_category = Array.from(primaryCategories).join(',')
      }
      if (secondaryCategories.size > 0) {
        params.secondary_category = Array.from(secondaryCategories).join(',')
      }
    }
    
    
    console.log('发送搜索请求，参数:', params)
    const response = await searchScripts(params)
    console.log('收到搜索响应:', response)
    
    // 只处理优先级排序，具体的时间/使用次数排序由后端完成
    let sortedData = [...(response.data || [])]
    
    // 前端只负责优先级排序：置顶 > 收藏 > 普通
    // 在相同优先级内保持后端返回的排序（已按sort_by参数排序）
    sortedData.sort((a, b) => {
      // 置顶的优先级最高
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      
      // 都置顶或都不置顶的情况下，再比较收藏状态
      if (!a.is_pinned && !b.is_pinned) {
        if (a.is_favorited && !b.is_favorited) return -1
        if (!a.is_favorited && b.is_favorited) return 1
      }
      
      // 相同优先级内保持后端排序，不再进行额外排序
      return 0
    })
    
    scriptList.value = sortedData
    pagination.total = response.total
    
    // 重新加载统计数据
    loadStats()
  } catch (error) {
    console.error('加载话术列表失败:', error)
    // 检查是否是网络错误或API未实现
    if (error?.response?.status === 404) {
      message.warning('话术库API暂未实现，请联系后端开发人员')
    } else {
      message.error('加载话术列表失败')
    }
    scriptList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}


// 加载统计数据
const loadStats = async () => {
  try {
    // 使用axios统一调用API
    const result = await request.get('/api/v1/scripts/stats')
    console.log('获取到的动态统计数据:', result)
    // 解析标准的 {code, data, message} 格式
    if (result.code === 200 && result.data) {
      scriptStats.value = result.data
      console.log('设置统计数据:', result.data)
    } else {
      throw new Error(`API返回错误码: ${result.code}`)
    }
  } catch (error) {
    console.warn('动态API调用失败，使用计算的统计数据:', error)
    // 如果API未实现，使用本地计算的统计
    const calculatedStats = {
      total: scriptList.value.length || 312,
      popular: scriptList.value.filter(s => (s.usage_count || 0) > 10).length,
      recent: scriptList.value.filter(s => {
        if (!s.created_at) return false
        return dayjs().diff(dayjs(s.created_at), 'day') <= 7
      }).length,
      categories: 3 // 三维分类体系
    }
    
    console.log('计算的统计数据:', calculatedStats)
    scriptStats.value = calculatedStats
  }
}

// 加载类型统计
const loadTypeStats = async () => {
  try {
    // 使用axios统一调用API
    const result = await request.get('/api/v1/scripts/script-type-new-stats')
    console.log('获取到的动态类型统计:', result)
    // 解析标准的 {code, data, message} 格式
    if (result.code === 200 && result.data) {
      scriptTypeOptions.value = result.data
      console.log('设置类型统计数据:', result.data)
    } else {
      throw new Error(`API返回错误码: ${result.code}`)
    }
  } catch (error) {
    console.warn('动态API调用失败，使用默认类型数据:', error)
    // 如果API未实现，使用默认数据
    const defaultTypeStats = [
      { value: 'sales_promotion', label: '销售转化', count: 27 },
      { value: 'expert_guidance', label: '专业指导', count: 16 },
      { value: 'service_support', label: '服务支持', count: 16 },
      { value: 'consultation', label: '咨询引导', count: 16 },
      { value: 'content_marketing', label: '内容营销', count: 12 }
    ]
    
    console.log('设置默认类型统计数据:', defaultTypeStats)
    scriptTypeOptions.value = defaultTypeStats
  }
}

// 加载内容类型统计
const loadContentTypeStats = async () => {
  try {
    // 使用axios统一调用API
    const result = await request.get('/api/v1/scripts/content-type-stats')
    console.log('获取到的动态内容类型统计:', result)
    // 解析标准的 {code, data, message} 格式
    if (result.code === 200 && result.data) {
      scriptContentOptions.value = result.data
      console.log('设置内容类型统计数据:', result.data)
    } else {
      throw new Error(`API返回错误码: ${result.code}`)
    }
  } catch (error) {
    console.warn('动态API调用失败，使用默认内容类型数据:', error)
    // 如果API未实现，使用默认数据
    const defaultContentStats = [
      { value: 'course_introduction', label: '课程介绍', count: 28 },
      { value: 'application_process', label: '申请流程', count: 19 },
      { value: 'career_planning', label: '职业规划', count: 12 },
      { value: 'exam_guidance', label: '考试指导', count: 7 },
      { value: 'general_support', label: '综合支持', count: 7 },
      { value: 'company_service', label: '公司服务', count: 2 }
    ]
    
    scriptContentOptions.value = defaultContentStats
  }
}

// 加载平台统计
const loadPlatformStats = async () => {
  try {
    // 使用axios统一调用API
    const result = await request.get('/api/v1/scripts/platform-new-stats')
    console.log('获取到的动态平台统计:', result)
    // 解析标准的 {code, data, message} 格式
    if (result.code === 200 && result.data) {
      scriptPlatformOptions.value = result.data
      console.log('设置平台统计数据:', result.data)
    } else {
      throw new Error(`API返回错误码: ${result.code}`)
    }
  } catch (error) {
    console.warn('动态API调用失败，使用默认平台数据:', error)
    // 如果API未实现，使用默认数据
    const defaultPlatformStats = [
      { value: 'wechat', label: '微信平台', count: 44 },
      { value: 'universal', label: '通用平台', count: 28 },
      { value: 'xiaohongshu', label: '小红书', count: 12 },
      { value: 'phone', label: '电话沟通', count: 8 },
      { value: 'qq', label: 'QQ平台', count: 3 }
    ]
    
    scriptPlatformOptions.value = defaultPlatformStats
  }
}

// 加载综合分类选项 - 将主分类和子分类合并为分组选项
const loadCategoryOptions = async () => {
  try {
    console.log('从接口加载分类数据构建级联选择器选项')
    await buildCategoryOptionsFromAPI()
  } catch (error) {
    console.warn('分类数据构建失败，使用默认数据:', error)
    buildDefaultCategoryOptions()
  }
}

// 从API构建分类选项
const buildCategoryOptionsFromAPI = async () => {
  try {
    // 获取新分类系统数据
    const response = await getScriptCategoriesTree()
    const apiCategories = response.data || []
    
    if (apiCategories.length === 0) {
      console.log('API返回空分类数据，使用默认分类')
      buildDefaultCategoryOptions()
      return
    }
    
    // 构建级联选择器选项
    const cascaderData = apiCategories.map((category: ScriptCategory) => {
      const option: any = {
        label: category.name,
        value: category.id,
        count: category.script_count || 0
      }
      
      // 如果有子分类，添加children
      if (category.children && category.children.length > 0) {
        option.children = category.children.map((child: ScriptCategory) => ({
          label: child.name,
          value: child.id,
          count: child.script_count || 0
        }))
      }
      
      return option
    })
    
    // 更新级联选择器数据
    cascaderOptions.value = cascaderData
    
    // 同时构建平铺的选项列表用于v2.0分类体系
    const flatOptions: Array<{ value: string; label: string; count: number; options?: Array<{ value: string; label: string; count: number }> }> = []
    
    apiCategories.forEach((category: ScriptCategory) => {
      const mainOption = {
        label: category.name,
        value: String(category.id),
        count: category.script_count || 0,
        options: [] as Array<{ value: string; label: string; count: number }>
      }
      
      if (category.children && category.children.length > 0) {
        category.children.forEach((child: ScriptCategory) => {
          mainOption.options.push({
            value: `${category.id}:${child.id}`,
            label: `${category.name} > ${child.name}`,
            count: child.script_count || 0
          })
        })
      }
      
      flatOptions.push(mainOption)
    })
    
    categoryOptions.value = flatOptions
    
    console.log('从API构建分类选项完成:', { cascaderData, flatOptions })
  } catch (error) {
    console.error('从API构建分类选项失败:', error)
    throw error
  }
}

// 构建默认分类选项
const buildDefaultCategoryOptions = () => {
  const defaultOptions = [
    {
      label: '项目分类',
      value: 'project_category',
      count: 46, // 电网46 + 电气考研0
      options: [
        { value: 'project_category:power_grid', label: '项目分类 > 电网', count: 46 },
        { value: 'project_category:electrical_exam', label: '项目分类 > 电气考研', count: 0 }
      ]
    },
    {
      label: '产品介绍',
      value: 'product_intro', 
      count: 48,
      options: [
        { value: 'product_intro:general', label: '产品介绍 > 通用', count: 48 }
      ]
    },
    {
      label: '营销话术',
      value: 'marketing',
      count: 30, // 估计值
      options: [
        { value: 'marketing', label: '营销话术', count: 30 }
      ]
    },
    {
      label: '常见问题',
      value: 'faq',
      count: 3,
      options: [
        { value: 'faq', label: '常见问题', count: 3 }
      ]
    },
    {
      label: '学习指导',
      value: 'learning_guidance',
      count: 151, // 网申54 + 复习规划57 + 报考咨询40
      options: [
        { value: 'learning_guidance:application_guide', label: '学习指导 > 网申', count: 54 },
        { value: 'learning_guidance:review_planning', label: '学习指导 > 复习规划', count: 57 },
        { value: 'learning_guidance:consultation', label: '学习指导 > 报考咨询', count: 40 }
      ]
    },
    {
      label: '学习规划',
      value: 'study_planning',
      count: 25, // 估计值
      options: [
        { value: 'study_planning', label: '学习规划', count: 25 }
      ]
    }
  ]
  
  categoryOptions.value = defaultOptions
  
  // 构建级联选择器数据
  const cascaderData = defaultOptions.map(category => ({
    label: category.label,
    value: category.value,
    count: category.count,
    children: category.options?.filter(option => option.value.includes(':')).map(option => {
      // 对于格式如 "learning_guidance:application_guide" 的值，提取子分类部分
      const parts = option.value.split(':')
      const childValue = parts.length > 1 ? parts[1] : option.value
      const childLabel = option.label.includes(' > ') ? option.label.split(' > ')[1] : option.label
      
      return {
        label: childLabel,
        value: childValue,
        count: option.count
      }
    }) || []
  }))
  
  cascaderOptions.value = cascaderData
}

// 新分类系统方法
const loadCategories = async () => {
  try {
    const response = await getScriptCategoriesTree()
    categories.value = response.data || []
  } catch (error) {
    console.error('获取分类失败:', error)
    message.error('获取分类失败')
  }
}


const handleCategoryCreate = (category: ScriptCategory) => {
  // CategorySelector组件已经显示了成功提示，这里不需要重复显示
  loadCategories()
  loadStats()
}

const handleCategoryUpdate = (category: ScriptCategory) => {
  message.success(`分类 "${category.name}" 更新成功`)
  loadCategories()
}

const handleCategoryDelete = (categoryId: number) => {
  loadCategories()
  loadStats()
}

const handleCategoryChange = (categoryId: number | null, category?: ScriptCategory) => {
  formData.category_id = categoryId
  
  if (category) {
    console.log('选择分类:', category.name)
    
    // 根据分类信息设置对应的主分类和子分类
    // 这里需要建立分类ID和主/子分类的映射关系
    // 暂时根据分类名称进行映射
    const categoryMappings: Record<string, { primary: string; secondary?: string }> = {
      '项目分类': { primary: 'project_category' },
      '电网': { primary: 'project_category', secondary: 'power_grid' },
      '电气考研': { primary: 'project_category', secondary: 'electrical_exam' },
      '产品介绍': { primary: 'product_intro' },
      '营销话术': { primary: 'marketing' },
      '常见问题': { primary: 'faq' },
      '学习指导': { primary: 'learning_guidance' },
      '网申': { primary: 'learning_guidance', secondary: 'application_guide' },
      '复习规划': { primary: 'learning_guidance', secondary: 'review_planning' },
      '报考咨询': { primary: 'learning_guidance', secondary: 'consultation' },
      '学习规划': { primary: 'study_planning' }
    }
    
    const mapping = categoryMappings[category.name]
    if (mapping) {
      formData.primary_category = mapping.primary
      formData.secondary_category = mapping.secondary
    } else {
      // 如果没有匹配到，设置为默认值
      formData.primary_category = 'other'
      formData.secondary_category = undefined
    }
  } else {
    // 清空分类时，同时清空主/子分类
    formData.primary_category = undefined
    formData.secondary_category = undefined
  }
}

// 分类管理相关方法
const showCategoryManager = () => {
  categoryManagerVisible.value = true
}

const handleCategoryManagerCreate = async (category: ScriptCategory) => {
  message.success(`分类 "${category.name}" 创建成功`)
  // 并行执行所有刷新操作
  await Promise.all([
    loadCategories(),
    loadStats(),
    loadCategoryOptions()
  ])
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerUpdate = async (category: ScriptCategory) => {
  message.success(`分类 "${category.name}" 更新成功`)
  // 并行执行所有刷新操作
  await Promise.all([
    loadCategories(),
    loadStats(),
    loadCategoryOptions()
  ])
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerDelete = async (categoryId: number) => {
  // 并行执行所有刷新操作
  await Promise.all([
    loadCategories(),
    loadStats(),
    loadCategoryOptions()
  ])
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerRefresh = async () => {
  // 并行执行所有刷新操作
  await Promise.all([
    loadCategories(),
    loadStats(),
    loadCategoryOptions()
  ])
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadScripts()
}

// 级联选择器变化处理
const handleCascaderChange = (values: (string | number)[]) => {
  if (!values || values.length === 0) {
    // 清空选择
    selectedCategories.value = []
    selectedCascaderValue.value = []
  } else if (values.length === 1) {
    // 只选择了主分类
    selectedCategories.value = [String(values[0])]
    selectedCascaderValue.value = values
  } else if (values.length === 2) {
    // 选择了主分类和子分类
    selectedCategories.value = [`${values[0]}:${values[1]}`]
    selectedCascaderValue.value = values
  }
  
  console.log('级联选择器值变化:', { values, categories: selectedCategories.value })
  handleSearch()
}

// 级联选择器显示渲染
const displayRender = ({ labels }: { labels?: string[] }) => {
  return labels ? labels.join(' > ') : ''
}

// 级联选择器搜索过滤
const filterCascaderOption = (inputValue: string, path: any[]) => {
  return path.some((option: any) => 
    option.label && String(option.label).toLowerCase().includes(inputValue.toLowerCase())
  )
}

// 分页变化
const handlePageChange = () => {
  loadScripts()
}

// 显示新增弹窗
const showCreateModal = () => {
  editingScript.value = null
  resetForm()
  modalVisible.value = true
}

// 编辑话术
const handleEdit = (script: Script) => {
  editingScript.value = script
  Object.assign(formData, {
    question: script.question,
    answer: script.answer,
    keywords: script.keywords,
    // 新分类系统字段
    category_id: script.category_id || null,
    // v2.0新分类体系字段
    primary_category: script.primary_category,
    secondary_category: script.secondary_category,
    // 兼容旧分类字段
    script_type_new: script.script_type_new,
    content_type_new: script.content_type_new,
    platform_new: script.platform_new,
    customer_info: script.customer_info
  })
  // 设置关键词选择
  if (script.keywords) {
    selectedKeywords.value = script.keywords.split(',').map(k => k.trim())
  } else {
    selectedKeywords.value = []
  }
  modalVisible.value = true
}

// 删除话术
const handleDelete = (script: Script) => {
  // 权限验证
  if (!canDeleteScript.value) {
    message.warning('您没有权限执行此操作')
    return
  }
  
  (Modal as any).confirm({
    title: '确认删除',
    content: `确定要删除话术「${script.question || script.title || '此话术'}」吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteScript(script.id!)
        message.success('删除话术成功')
        loadScripts() // 重新加载列表
        loadStats() // 重新加载统计数据
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除话术失败')
      }
    }
  })
}

// 复制到剪贴板并更新使用次数
const copyToClipboard = async (text: string, script?: Script) => {
  try {
    // 检查是否支持现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // 降级到传统方法（兼容HTTP环境）
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
      } finally {
        document.body.removeChild(textArea)
      }
    }
    
    message.success('话术已复制到剪贴板')
    
    // 如果提供了script对象，更新使用次数
    if (script && script.id) {
      const updatedScript = {
        ...script,
        usage_count: (script.usage_count || 0) + 1
      }
      
      try {
        await updateScript(script.id, updatedScript)
        // 更新本地数据
        const index = scriptList.value.findIndex(s => s.id === script.id)
        if (index !== -1) {
          scriptList.value[index].usage_count = updatedScript.usage_count
        }
      } catch (error) {
        console.error('更新使用次数失败:', error)
      }
    }
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败，请手动复制')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 准备提交数据，确保格式正确
    const now = new Date().toISOString()
    const submitData = {
      title: formData.question || '', // 使用问题场景作为标题
      question: formData.question || '',
      answer: formData.answer,
      keywords: formData.keywords || '',
      // 分类字段
      category_id: formData.category_id || null,
      // v2.0新分类体系字段
      primary_category: formData.primary_category,
      secondary_category: formData.secondary_category || undefined,
      // 兼容旧分类字段
      script_type_new: formData.script_type_new || undefined,
      content_type_new: formData.content_type_new || undefined,
      platform_new: formData.platform_new || undefined,
      customer_info: formData.customer_info || undefined,
      // 时间字段
      ...(editingScript.value ? {
        // 编辑时只更新updated_at
        updated_at: now
      } : {
        // 新建时设置created_at和updated_at
        created_at: now,
        updated_at: now
      })
    }
    
    console.log('提交数据:', submitData)
    
    let createdScript = null
    if (editingScript.value) {
      await updateScript(editingScript.value.id!, submitData)
      message.success('更新话术成功')
    } else {
      createdScript = await createScript(submitData)
      message.success('创建话术成功')
    }
    
    modalVisible.value = false
    
    if (createdScript && !editingScript.value) {
      // 新建话术：询问用户是否要查看新话术
      (Modal as any).confirm({
        title: '话术创建成功',
        content: '新话术已创建。是否跳转到第一页查看最新话术？',
        okText: '查看新话术',
        cancelText: '留在当前页',
        onOk: async () => {
          pagination.current = 1
          await loadScripts()
          message.success('已跳转到第一页显示新话术')
        },
        onCancel: async () => {
          // 保持在当前页刷新
          await loadScripts()
        }
      })
    } else if (editingScript.value) {
      // 编辑现有话术：保持在当前页刷新
      await loadScripts()
      message.info('话术已更新，当前页面已刷新')
    } else {
      // 其他情况：保持在当前页刷新
      await loadScripts()
    }
  } catch (error) {
    console.error('提交失败:', error)
    if (error?.errorFields) return // 表单验证错误
    message.error(editingScript.value ? '更新话术失败' : '创建话术失败')
  } finally {
    submitLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    question: '',
    answer: '',
    keywords: '',
    // 新分类系统字段
    category_id: null,
    // v2.0新分类体系字段
    primary_category: undefined,
    secondary_category: undefined,
    // 兼容旧分类字段
    script_type_new: undefined,
    content_type_new: undefined,
    platform_new: undefined,
    customer_info: ''
  })
  selectedKeywords.value = []
  formRef.value?.resetFields()
}

// 处理关键词变化
const handleKeywordsChange = (keywords: string[] | undefined) => {
  if (keywords && Array.isArray(keywords)) {
    selectedKeywords.value = keywords
    formData.keywords = keywords.join(', ')
  } else {
    selectedKeywords.value = []
    formData.keywords = ''
  }
}

// 添加关键词
const addKeyword = (keyword: string) => {
  if (!selectedKeywords.value.includes(keyword)) {
    selectedKeywords.value.push(keyword)
    formData.keywords = selectedKeywords.value.join(', ')
  }
}

// 显示详情
const showDetail = (script: Script) => {
  currentScript.value = script
  detailVisible.value = true
}

// 切换置顶状态
const togglePin = async (script: Script) => {
  if (!script.id || !canManagePin.value) {
    message.warning('您没有权限执行此操作')
    return
  }
  
  try {
    if (script.is_pinned) {
      await unpinScript(script.id)
      message.success('取消置顶成功')
      script.is_pinned = false
    } else {
      await pinScript(script.id)
      message.success('置顶成功')
      script.is_pinned = true
    }
    
    // 重新加载列表以显示正确的排序
    await loadScripts()
  } catch (error) {
    console.error('置顶操作失败:', error)
    message.error('置顶操作失败')
  }
}

// 切换收藏状态
const toggleFavorite = async (script: Script) => {
  if (!script.id) return
  
  try {
    if (script.is_favorited) {
      await unfavoriteScript(script.id)
      message.success('取消收藏成功')
      script.is_favorited = false
    } else {
      await favoriteScript(script.id)
      message.success('收藏成功')
      script.is_favorited = true
    }
    
    // 重新加载列表以显示正确的排序
    await loadScripts()
  } catch (error) {
    console.error('收藏操作失败:', error)
    message.error('收藏操作失败')
  }
}

// 重置筛选
const resetFilters = () => {
  selectedType.value = undefined
  selectedContentType.value = undefined
  selectedPlatform.value = undefined
  selectedCategories.value = []
  selectedCascaderValue.value = []
  sortBy.value = 'updated'
  searchKeyword.value = ''
  handleSearch()
}

// 监听主分类变化，清空子分类
watch(() => formData.primary_category, (newValue, oldValue) => {
  if (newValue !== oldValue && oldValue) {
    formData.secondary_category = undefined
  }
})

// 初始化
onMounted(async () => {
  console.log('页面初始化开始')
  
  try {
    // 首先加载用户偏好设置
    await loadPreferencesOnce()
    
    // 设置默认分页大小为用户偏好（与switchDisplayMode保持一致）
    pagination.pageSize = itemsPerPage.value || 100
    
    // 然后加载基础数据
    await loadScripts()
    
    // 然后加载统计数据（依赖基础数据）
    await Promise.all([
      loadStats(),
      loadTypeStats(),
      loadContentTypeStats(),
      loadPlatformStats(),
      loadCategoryOptions(),
      loadCategories() // 加载新分类系统数据
    ])
    
    console.log('所有数据加载完成')
  } catch (error) {
    console.error('初始化失败:', error)
  }
  
  // 移动端默认使用列表视图
  if (isMobile.value) {
    viewType.value = 'list'
  }
})
</script>

<style scoped lang="less">
.script-library {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 紧凑头部
.compact-header {
  padding: 8px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 8px;
  border: 1px solid #d6f4ff;
  margin-bottom: 8px;
  
  .compact-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
    }
    
    .stat-item {
      text-align: center;
      position: relative;
      
      .stat-number {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #1890ff;
        line-height: 1;
        
        @media (max-width: 768px) {
          font-size: 16px;
        }
      }
      
      .stat-label {
        display: block;
        font-size: 12px;
        color: #666;
        margin-top: 2px;
        
        @media (max-width: 768px) {
          font-size: 11px;
        }
      }
      
      .help-icon {
        margin-left: 4px;
        color: #999;
        font-size: 10px;
        cursor: help;
        
        &:hover {
          color: #1890ff;
         }
      }
      
      .help-icon-corner {
        position: absolute;
        top: 2px;
        right: 2px;
        color: #999;
        font-size: 10px;
        cursor: help;
        
        &:hover {
          color: #1890ff;
        }
      }
    }
  }
}


// 主卡片
.main-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  :deep(.ant-card-body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    
    @media (max-width: 768px) {
      padding: 12px;
    }
  }
}

// 搜索区域
.search-section {
  margin-bottom: 12px;
  
  @media (max-width: 768px) {
    margin-bottom: 12px;
  }
}

.search-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.search-inputs {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
}

.search-input {
  min-width: 400px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
}

.search-icon {
  color: #8c8c8c;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  min-width: 150px;
  
  &.category-filter {
    min-width: 200px;
    max-width: 280px;
  }
}

.option-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-icon {
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
}

.filter-btn,
.add-btn {
  height: 40px;
  
  @media (max-width: 768px) {
    flex: 1;
  }
}

// 紧凑话术列表区域
.compact-script-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  
  .section-icon {
    color: #52c41a;
  }
  
  .count-badge {
    :deep(.ant-badge-count) {
      background: #52c41a;
    }
  }
}

.view-options {
  :deep(.ant-radio-button-wrapper) {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

// 紧凑三栏网格
.script-grid-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.script-item-compact {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &.pinned-item {
    background: linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%);
    border-color: #faad14;
    box-shadow: 0 2px 8px rgba(250, 173, 20, 0.15);
    
    &:hover {
      border-color: #faad14;
      box-shadow: 0 4px 12px rgba(250, 173, 20, 0.25);
    }
  }
  
  &.favorited-item {
    background: linear-gradient(135deg, #fff0f6 0%, #fff5f5 100%);
    border-color: #eb2f96;
    box-shadow: 0 2px 8px rgba(235, 47, 150, 0.15);
    
    &:hover {
      border-color: #eb2f96;
      box-shadow: 0 4px 12px rgba(235, 47, 150, 0.25);
    }
  }
  
  .pin-corner {
    position: absolute;
    top: 8px;
    right: 8px;
    
    .pin-icon {
      color: #faad14;
      font-size: 14px;
      transform: rotate(45deg);
      filter: drop-shadow(0 1px 2px rgba(250, 173, 20, 0.3));
    }
  }
  
  .favorite-corner {
    position: absolute;
    top: 8px;
    right: 8px;
    
    .favorite-icon {
      color: #eb2f96;
      font-size: 14px;
      filter: drop-shadow(0 1px 2px rgba(235, 47, 150, 0.3));
      animation: heartbeat 2s infinite;
    }
  }
  
  .question-section,
  .answer-section {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    
    .section-label {
      font-weight: 600;
      font-size: 14px;
      color: #1890ff;
      flex-shrink: 0;
      margin-top: 1px;
    }
    
    .section-content {
      flex: 1;
      font-size: 13px;
      line-height: 1.4;
      color: #333;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .question-section {
    .section-label {
      color: #fa8c16;
    }
    
    .section-content {
      color: #fa8c16;
      font-style: italic;
    }
  }
  
  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid #f5f5f5;
    
    .item-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      
      .usage-count {
        color: #666;
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .pin-btn-compact {
      padding: 2px 6px;
      height: 24px;
      font-size: 12px;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.05);
      }
      
      // 未置顶状态：灰色空心图钉
      &[class*="text"] {
        color: #8c8c8c;
        border-color: transparent;
        
        &:hover {
          color: #faad14;
          background-color: #fff7e6;
          border-color: #faad14;
        }
      }
      
      // 置顶状态：橙色填充图钉
      &[class*="default"] {
        color: #faad14;
        background-color: #fff7e6;
        border-color: #faad14;
        
        .pinned {
          filter: drop-shadow(0 1px 2px rgba(250, 173, 20, 0.3));
        }
        
        &:hover {
          background-color: #ffd666;
          border-color: #d48806;
          color: #d48806;
        }
      }
    }
    
    .favorite-btn-compact {
      padding: 2px 6px;
      height: 24px;
      font-size: 12px;
      border-radius: 4px;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.05);
      }
      
      // 未收藏状态：灰色空心爱心
      &[class*="text"] {
        color: #8c8c8c;
        border-color: transparent;
        
        &:hover {
          color: #eb2f96;
          background-color: #fff0f6;
          border-color: #eb2f96;
        }
      }
      
      // 收藏状态：红色填充爱心
      &[class*="default"] {
        color: #eb2f96;
        background-color: #fff0f6;
        border-color: #eb2f96;
        
        .favorited {
          filter: drop-shadow(0 1px 2px rgba(235, 47, 150, 0.3));
        }
        
        &:hover {
          background-color: #ffadd2;
          border-color: #c41d7f;
          color: #c41d7f;
        }
      }
    }
    
    .copy-btn-compact {
      padding: 2px 8px;
      height: 24px;
      font-size: 12px;
      border-radius: 4px;
      
      &:hover {
        transform: scale(1.05);
      }
    }
    
    .delete-btn-compact {
      padding: 2px 6px;
      height: 24px;
      font-size: 12px;
      border-radius: 4px;
      color: #ff4d4f;
      
      &:hover {
        transform: scale(1.05);
        background-color: #fff2f0;
        border-color: #ff4d4f;
        color: #ff4d4f;
      }
    }
  }
}

// 问题列表模式 - 固定宽度三栏布局
.question-list-mode {
  .question-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    @media (max-width: 768px) {
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
    }
  }
  
  .question-item {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #1890ff;
      box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
    }
    
    &.pinned-item {
      background: linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%);
      border-color: #faad14;
      box-shadow: 0 1px 4px rgba(250, 173, 20, 0.15);
      
      &:hover {
        border-color: #faad14;
        box-shadow: 0 2px 6px rgba(250, 173, 20, 0.25);
      }
    }
    
    &.favorited-item {
      background: linear-gradient(135deg, #fff0f6 0%, #fff5f5 100%);
      border-color: #eb2f96;
      box-shadow: 0 1px 4px rgba(235, 47, 150, 0.15);
      
      &:hover {
        border-color: #eb2f96;
        box-shadow: 0 2px 6px rgba(235, 47, 150, 0.25);
      }
    }
    
    .question-content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      gap: 8px;
      
      .question-text {
        flex: 1;
        font-size: 14px;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .question-tag {
        flex-shrink: 0;
      }
    }
    
    .question-actions {
      flex-shrink: 0;
      margin-left: 12px;
      display: flex;
      gap: 4px;
      
      .pin-btn-question {
        padding: 2px 6px;
        height: 24px;
        font-size: 12px;
        border-radius: 4px;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.05);
        }
        
        // 未置顶状态：灰色空心图钉
        &[class*="text"] {
          color: #8c8c8c;
          border-color: transparent;
          
          &:hover {
            color: #faad14;
            background-color: #fff7e6;
            border-color: #faad14;
          }
        }
        
        // 置顶状态：橙色填充图钉
        &[class*="default"] {
          color: #faad14;
          background-color: #fff7e6;
          border-color: #faad14;
          
          .pinned {
            filter: drop-shadow(0 1px 2px rgba(250, 173, 20, 0.3));
          }
          
          &:hover {
            background-color: #ffd666;
            border-color: #d48806;
            color: #d48806;
          }
        }
      }
      
      .favorite-btn-question {
        padding: 2px 6px;
        height: 24px;
        font-size: 12px;
        border-radius: 4px;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.05);
        }
        
        // 未收藏状态：灰色空心爱心
        &[class*="text"] {
          color: #8c8c8c;
          border-color: transparent;
          
          &:hover {
            color: #eb2f96;
            background-color: #fff0f6;
            border-color: #eb2f96;
          }
        }
        
        // 收藏状态：红色填充爱心
        &[class*="default"] {
          color: #eb2f96;
          background-color: #fff0f6;
          border-color: #eb2f96;
          
          .favorited {
            filter: drop-shadow(0 1px 2px rgba(235, 47, 150, 0.3));
          }
          
          &:hover {
            background-color: #ffadd2;
            border-color: #c41d7f;
            color: #c41d7f;
          }
        }
      }
      
      .copy-btn-question {
        padding: 2px 8px;
        height: 24px;
        font-size: 12px;
        border-radius: 4px;
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .script-card:hover & {
    &::after {
      opacity: 1;
    }
  }
}

.card-title-section {
  flex: 1;
}

.card-title {
  margin: 0 0 10px 0;
  font-size: 17px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  
  &:hover {
    color: #52c41a;
  }
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.category-tag,
.hot-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .tag-icon {
    font-size: 12px;
  }
}

.more-btn {
  color: #8c8c8c;
  
  &:hover {
    color: #1890ff;
    background: #f0f9ff;
  }
}

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
}

.content-section {
  .section-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 4px;
    
    .label-icon {
      font-size: 11px;
    }
  }
  
  .section-text {
    font-size: 13px;
    line-height: 1.4;
    color: #666;
    
    &.question-text {
      background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #1890ff;
    }
    
    &.answer-text {
      background: linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%);
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #52c41a;
      max-height: 80px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
    }
  }
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.keyword-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.usage-count {
  font-size: 12px;
  color: #fa541c;
  display: flex;
  align-items: center;
  gap: 4px;
  
  .usage-icon {
    font-size: 11px;
  }
}

.create-date {
  font-size: 11px;
  color: #8c8c8c;
}

.copy-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #73d13d 0%, #95de64 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(82, 196, 26, 0.4);
  }
}

// 列表视图
.scripts-list {
  flex: 1;
}

.script-list {
  :deep(.ant-list-item) {
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:hover {
      background: #fafafa;
    }
  }
}

.script-list-item {
  .list-item-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .title-text {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .title-tags {
      display: flex;
      gap: 4px;
    }
  }
  
  .list-item-meta {
    .meta-item {
      margin-bottom: 4px;
      
      .meta-label {
        font-size: 12px;
        color: #8c8c8c;
      }
      
      .meta-text {
        font-size: 13px;
        color: #666;
        
        &.answer-preview {
          max-height: 40px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
    }
  }
  
  .list-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    
    .footer-stats {
      display: flex;
      gap: 16px;
      
      .stat-item {
        font-size: 12px;
        color: #8c8c8c;
        display: flex;
        align-items: center;
        gap: 4px;
        
        .stat-icon {
          font-size: 11px;
        }
      }
    }
    
    .footer-keywords {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .more-keywords {
        font-size: 11px;
        color: #8c8c8c;
      }
    }
  }
}

.action-btn {
  color: #8c8c8c;
  
  &:hover {
    color: #1890ff;
    background: #f0f9ff;
  }
}

// 分页
.pagination-section {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
  margin-top: 24px;
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  
  .empty-icon {
    font-size: 80px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 18px;
  }
  
  p {
    margin: 0 0 24px 0;
    color: #8c8c8c;
    font-size: 14px;
    line-height: 1.6;
  }
  
  .create-first-btn {
    height: 48px;
    padding: 0 24px;
    font-size: 16px;
  }
}

// 移动端筛选器
.mobile-filters {
  .mobile-filter-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .filter-actions {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .apply-btn {
        margin-top: 8px;
      }
    }
  }
}

// 紧凑的详情模态框
.detail-modal-compact {
  :deep(.ant-modal-body) {
    padding: 16px;
  }
}

.script-detail-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .detail-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .row-label {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 80px;
      font-size: 13px;
      font-weight: 600;
      color: #666;
      flex-shrink: 0;
      
      .anticon {
        font-size: 12px;
        color: #52c41a;
      }
    }
    
    .row-content {
      flex: 1;
      font-size: 13px;
      line-height: 1.5;
      
      &.question-text {
        color: #1890ff;
        font-style: italic;
        background: #f0f9ff;
        padding: 8px;
        border-radius: 4px;
      }
      
      &.answer-text {
        color: #333;
        background: #f6ffed;
        padding: 8px;
        border-radius: 4px;
      }
    }
    
    &.stats-row {
      .stats-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .usage-number {
          font-weight: 600;
          color: #fa8c16;
        }
      }
    }
    
    &.time-row {
      .time-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        .time-item {
          display: flex;
          align-items: center;
          font-size: 13px;
          
          .time-label {
            color: #666;
            min-width: 70px;
          }
          
          .time-value {
            color: #333;
            font-family: monospace;
          }
        }
      }
    }
  }
  
  .compact-keyword-tag {
    margin: 2px;
    font-size: 11px;
    padding: 2px 6px;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
  }
  
  .detail-actions-compact {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 12px;
    margin-top: 8px;
    border-top: 1px solid #f0f0f0;
    
    .compact-copy-btn,
    .compact-edit-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      font-size: 12px;
      height: 28px;
      border-radius: 4px;
    }
    
    .compact-copy-btn {
      &:hover {
        background: #f0f9ff;
        border-color: #1890ff;
        color: #1890ff;
      }
    }
  }
}

// 话术模态框
.script-modal {
  :deep(.ant-modal-body) {
    padding: 16px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .compact-form {
    :deep(.ant-form-item) {
      margin-bottom: 16px;
      
      .ant-form-item-label {
        padding-bottom: 4px;
        
        label {
          height: auto;
          line-height: 1.4;
          font-size: 13px;
          font-weight: 500;
        }
      }
      
      .ant-form-item-control-input {
        min-height: auto;
      }
    }
    
    :deep(.ant-row) {
      margin-bottom: 8px;
    }
    
    :deep(.ant-input),
    :deep(.ant-select-selector),
    :deep(.ant-select-selection-search-input) {
      font-size: 13px;
    }
    
    :deep(.ant-input),
    :deep(.ant-select-selector) {
      border-radius: 4px;
    }
  }
  
  .keywords-input-section {
    .keywords-suggestions {
      margin-top: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #f0f0f0;
      
      .suggestions-label {
        font-size: 12px;
        color: #8c8c8c;
        margin-right: 8px;
      }
      
      .ant-tag {
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
        }
      }
    }
  }
  
  :deep(.ant-divider-horizontal.ant-divider-with-text) {
    margin: 24px 0 16px 0;
    
    .ant-divider-inner-text {
      padding: 0 16px;
      font-weight: 600;
    }
  }
  
  :deep(.ant-form-item-label) {
    font-weight: 500;
  }
  
  :deep(.ant-input) {
    &:focus, &:hover {
      border-color: #52c41a;
      box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
    }
  }
  
  :deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
    border-color: #52c41a;
  }
  
  :deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector) {
    border-color: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  }
}

// 分类选择框美化样式
:deep(.category-option) {
  .category-option-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    
    .anticon {
      font-size: 14px;
      width: 16px;
      text-align: center;
    }
    
    .category-label {
      font-weight: 500;
      font-size: 13px;
    }
  }
  
  &:hover {
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%) !important;
  }
}

:deep(.subcategory-option) {
  .subcategory-option-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    
    .anticon {
      font-size: 12px;
      width: 14px;
      text-align: center;
    }
    
    .subcategory-label {
      font-weight: 500;
      font-size: 13px;
    }
  }
  
  &:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  }
}

// 优化选择框整体样式
:deep(.ant-select) {
  .ant-select-selector {
    border-radius: 6px !important;
    border: 1px solid #d9d9d9 !important;
    
    &:hover {
      border-color: #40a9ff !important;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1) !important;
    }
    
    &.ant-select-focused {
      border-color: #40a9ff !important;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
    }
  }
  
  .ant-select-selection-placeholder {
    color: #bfbfbf !important;
    font-style: italic;
  }
}

// 级联分类选择样式
.cascade-select {
  :deep(.ant-select-selector) {
    border-radius: 8px !important;
    border: 2px solid #e6f7ff !important;
    background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%) !important;
    transition: all 0.3s ease !important;
    
    &:hover {
      border-color: #40a9ff !important;
      box-shadow: 0 0 0 3px rgba(64, 169, 255, 0.1) !important;
      transform: translateY(-1px);
    }
    
    &.ant-select-focused {
      border-color: #1890ff !important;
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.15) !important;
    }
  }
}

.subcategory-row {
  margin-top: 16px;
  
  .subcategory-help {
    padding-top: 30px; // 与表单项标签对齐
    
    :deep(.ant-alert) {
      border: 1px solid #d6f4ff;
      background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
      border-radius: 8px;
      
      .ant-alert-icon {
        color: #1890ff;
      }
      
      .ant-alert-message {
        color: #1890ff;
        font-weight: 600;
        font-size: 12px;
      }
      
      .ant-alert-description {
        color: #666;
        font-size: 11px;
        line-height: 1.4;
      }
    }
  }
}

// 主分类选项的子分类提示样式
.subcategory-hint {
  .anticon {
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

// 爱心跳动动画
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
}
</style>
