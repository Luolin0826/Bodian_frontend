<template>
  <div class="knowledge-page">
    <div class="page-header">
      <div class="page-title">
        <BookOutlined class="title-icon" />
        <h1>知识库管理</h1>
        <span class="title-desc">校园招聘信息管理系统</span>
      </div>
      <div class="page-actions">
        <a-button type="primary" size="large" @click="showCreateModal" class="create-btn">
          <PlusOutlined />
          <span class="button-text">新增招聘信息</span>
        </a-button>
      </div>
    </div>

    <!-- 统计仪表盘 -->
    <div class="stats-dashboard">
      <div class="stats-grid">
        <div class="stat-card knowledge-card">
          <div class="stat-icon">
            <BookOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ knowledgeStats.total }}</div>
            <div class="stat-label">招聘信息条目</div>
          </div>
        </div>
        <div class="stat-card popular-card">
          <div class="stat-icon">
            <FireOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ knowledgeStats.popular }}</div>
            <div class="stat-label">热门招聘</div>
          </div>
        </div>
        <div class="stat-card category-card">
          <div class="stat-icon">
            <FolderOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ knowledgeStats.categories }}</div>
            <div class="stat-label">省份电网</div>
          </div>
        </div>
        <div class="stat-card recent-card">
          <div class="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ knowledgeStats.recent }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-content">
      <!-- 搜索和控制栏 -->
      <div class="search-section">
        <!-- 桌面端搜索 -->
        <div class="desktop-search">
          <div class="search-filters">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索问题、答案或标签"
              class="search-input"
              @search="handleSearch"
              allow-clear
              size="large"
            />
            <a-select
              v-model:value="selectedType"
              placeholder="选择类型"
              class="filter-select"
              allow-clear
              @change="handleSearch"
              size="large"
            >
              <a-select-option
                v-for="type in knowledgeTypes"
                :key="type"
                :value="type"
              >
                {{ type }}
              </a-select-option>
            </a-select>
            <a-select
              v-model:value="selectedCategory"
              placeholder="选择分类"
              class="filter-select"
              allow-clear
              @change="handleSearch"
              :disabled="!selectedType"
              size="large"
            >
              <a-select-option
                v-for="category in categories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </a-select-option>
            </a-select>
            <a-select
              v-model:value="selectedUnit"
              placeholder="选择省份电网"
              class="filter-select"
              allow-clear
              @change="handleSearch"
              size="large"
            >
              <a-select-option
                v-for="unit in unitOptions"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }} ({{ unit.count }})
              </a-select-option>
            </a-select>
          </div>
          <div class="view-controls">
            <a-radio-group v-model:value="viewMode" button-style="solid" size="large">
              <a-radio-button value="list">
                <UnorderedListOutlined />
                <span class="view-text">列表</span>
              </a-radio-button>
              <a-radio-button value="grid">
                <AppstoreOutlined />
                <span class="view-text">网格</span>
              </a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <!-- 移动端搜索按钮 -->
        <div class="mobile-search">
          <a-button 
            block 
            size="large" 
            @click="showMobileFilters = true"
            class="mobile-search-btn"
          >
            <SearchOutlined />
            搜索和筛选
            <span v-if="hasActiveFilters" class="filter-indicator"></span>
          </a-button>
        </div>
      </div>

      <!-- 知识内容区域 -->
      <div class="knowledge-content">
        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="knowledge-list">
          <div 
            v-for="knowledge in knowledgeList" 
            :key="knowledge.id" 
            class="knowledge-item list-item"
            @click="showDetail(knowledge)"
          >
            <div class="item-header">
              <div class="item-tags">
                <a-tag :color="getTypeColor(knowledge.type)" class="type-tag">
                  {{ knowledge.type }}
                </a-tag>
                <a-tag v-if="knowledge.category" color="blue" class="category-tag">
                  {{ knowledge.category }}
                </a-tag>
                <a-tag v-if="knowledge.unit" color="green" class="unit-tag">
                  {{ knowledge.unit }}电网
                </a-tag>
                <a-tag v-if="knowledge.site" color="purple" size="small" class="site-tag">
                  {{ knowledge.site }}
                </a-tag>
                <span class="view-count">
                  <EyeOutlined />
                  {{ knowledge.view_count || 0 }}
                </span>
              </div>
              <a-dropdown @click.stop>
                <a class="action-trigger" @click.prevent>
                  <MoreOutlined />
                </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="showDetail(knowledge)">
                      <EyeOutlined />
                      查看详情
                    </a-menu-item>
                    <a-menu-item @click="handleEdit(knowledge)">
                      <EditOutlined />
                      编辑
                    </a-menu-item>
                    <a-menu-item @click="copyToClipboard(knowledge.answer, knowledge)">
                      <CopyOutlined />
                      复制答案
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item danger @click="handleDelete(knowledge)">
                      <DeleteOutlined />
                      删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            
            <div class="item-content">
              <h3 class="question-title">{{ knowledge.question }}</h3>
              <p class="answer-preview">{{ knowledge.answer }}</p>
            </div>
            
            <div class="item-footer">
              <div class="tags-section">
                <a-tag 
                  v-for="tag in getTagList(knowledge.tags)" 
                  :key="tag" 
                  size="small" 
                  color="orange"
                >
                  {{ tag }}
                </a-tag>
              </div>
              <span class="created-time">{{ formatDate(knowledge.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="knowledge-grid">
          <div 
            v-for="knowledge in knowledgeList" 
            :key="knowledge.id" 
            class="knowledge-item grid-item"
            @click="showDetail(knowledge)"
          >
            <div class="grid-card">
              <div class="card-header">
                <div class="header-tags">
                  <a-tag :color="getTypeColor(knowledge.type)" size="small">
                    {{ knowledge.type }}
                  </a-tag>
                  <a-tag v-if="knowledge.category" color="blue" size="small">
                    {{ knowledge.category }}
                  </a-tag>
                  <a-tag v-if="knowledge.unit" color="green" size="small">
                    {{ knowledge.unit }}电网
                  </a-tag>
                  <a-tag v-if="knowledge.site" color="purple" size="small">
                    {{ knowledge.site }}
                  </a-tag>
                </div>
                <a-dropdown @click.stop>
                  <a class="card-action" @click.prevent>
                    <MoreOutlined />
                  </a>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="showDetail(knowledge)">
                        <EyeOutlined />
                        查看详情
                      </a-menu-item>
                      <a-menu-item @click="handleEdit(knowledge)">
                        <EditOutlined />
                        编辑
                      </a-menu-item>
                      <a-menu-item @click="copyToClipboard(knowledge.answer, knowledge)">
                        <CopyOutlined />
                        复制答案
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item danger @click="handleDelete(knowledge)">
                        <DeleteOutlined />
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
              
              <div class="card-content">
                <h4 class="card-question">{{ knowledge.question }}</h4>
                <p class="card-answer">{{ knowledge.answer }}</p>
              </div>
              
              <div class="card-footer">
                <div class="footer-stats">
                  <span class="stat-item">
                    <EyeOutlined />
                    {{ knowledge.view_count || 0 }}
                  </span>
                  <span class="stat-item">
                    <ClockCircleOutlined />
                    {{ formatDate(knowledge.created_at) }}
                  </span>
                </div>
                <div class="footer-actions">
                  <div class="footer-tags">
                    <span 
                      v-for="tag in getTagList(knowledge.tags).slice(0, 4)" 
                      :key="tag" 
                      class="mini-tag"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="getTagList(knowledge.tags).length > 4" class="more-tags">
                      +{{ getTagList(knowledge.tags).length - 4 }}
                    </span>
                  </div>
                  <a-button 
                    type="primary" 
                    size="small" 
                    @click.stop="copyToClipboard(knowledge.answer, knowledge)"
                    class="copy-btn"
                  >
                    <CopyOutlined />
                    复制
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="knowledgeList.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <BookOutlined />
        </div>
        <h3 class="empty-title">暂无知识数据</h3>
        <p class="empty-desc">开始创建您的第一条知识问答</p>
        <a-button type="primary" size="large" @click="showCreateModal" class="empty-action">
          <PlusOutlined />
          创建知识
        </a-button>
      </div>

      <!-- 分页 -->
      <div v-if="knowledgeList.length > 0" class="pagination-wrapper">
        <a-pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :show-quick-jumper="!isMobile"
          :show-total="!isMobile ? (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条` : undefined"
          :simple="isMobile"
          @change="handlePageChange"
          size="default"
        />
      </div>
    </a-card>

    <!-- 移动端筛选抽屉 -->
    <a-drawer
      v-model:open="showMobileFilters"
      title="搜索和筛选"
      placement="bottom"
      height="400px"
      class="mobile-filter-drawer"
    >
      <div class="mobile-filter-content">
        <a-form layout="vertical">
          <a-form-item label="搜索关键词">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索问题、答案或标签"
              @search="handleMobileSearch"
              allow-clear
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="知识类型">
            <a-select
              v-model:value="selectedType"
              placeholder="选择类型"
              allow-clear
              @change="loadCategories"
              size="large"
            >
              <a-select-option
                v-for="type in knowledgeTypes"
                :key="type"
                :value="type"
              >
                {{ type }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="分类">
            <a-select
              v-model:value="selectedCategory"
              placeholder="选择分类"
              allow-clear
              :disabled="!selectedType"
              size="large"
            >
              <a-select-option
                v-for="category in categories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="省份电网">
            <a-select
              v-model:value="selectedUnit"
              placeholder="选择省份电网"
              allow-clear
              size="large"
            >
              <a-select-option
                v-for="unit in unitOptions"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }} ({{ unit.count }})
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="视图模式">
            <a-radio-group v-model:value="viewMode" size="large">
              <a-radio-button value="list">
                <UnorderedListOutlined />
                列表视图
              </a-radio-button>
              <a-radio-button value="grid">
                <AppstoreOutlined />
                网格视图
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-form>
        
        <div class="mobile-filter-actions">
          <a-button @click="clearMobileFilters" class="clear-btn">
            清空筛选
          </a-button>
          <a-button type="primary" @click="handleMobileSearch" class="search-btn">
            应用筛选
          </a-button>
        </div>
      </div>
    </a-drawer>

    <!-- 新增/编辑知识弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingKnowledge ? '编辑知识' : '新增知识'"
      width="1000px"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="submitLoading"
      class="knowledge-modal"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <!-- 基本信息 -->
        <a-divider orientation="left">
          <template #default>
            <span style="font-size: 16px; font-weight: 600;">
              <BookOutlined style="margin-right: 8px; color: #52c41a;" />
              基本信息
            </span>
          </template>
        </a-divider>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="知识类型" name="type">
              <a-select
                v-model:value="formData.type"
                placeholder="选择知识类型"
                allow-clear
                @change="handleTypeChange"
              >
                <a-select-option
                  v-for="option in knowledgeTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }} ({{ option.count }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="分类" name="category">
              <a-select
                v-model:value="formData.category"
                placeholder="选择分类"
                allow-clear
                :disabled="!formData.type"
                show-search
                :filter-option="(input, option) => 
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                "
              >
                <a-select-option
                  v-for="option in categoryOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="省份电网" name="unit">
              <a-select
                v-model:value="formData.unit"
                placeholder="选择省份电网"
                allow-clear
                show-search
              >
                <a-select-option
                  v-for="option in unitOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }} ({{ option.count }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- 内容信息 -->
        <a-divider orientation="left">
          <template #default>
            <span style="font-size: 16px; font-weight: 600;">
              <EditOutlined style="margin-right: 8px; color: #1890ff;" />
              内容信息
            </span>
          </template>
        </a-divider>
        
        <a-form-item label="问题标题" name="question">
          <a-input 
            v-model:value="formData.question" 
            placeholder="请输入问题标题"
            show-count
            :maxlength="200"
          />
        </a-form-item>
        
        <a-form-item label="详细答案" name="answer">
          <a-textarea 
            v-model:value="formData.answer" 
            placeholder="请输入详细答案内容"
            :rows="8"
            show-count
            :maxlength="5000"
          />
        </a-form-item>
        
        <a-form-item label="相关问题" name="related_questions">
          <a-textarea 
            v-model:value="formData.related_questions" 
            placeholder="请输入相关问题，每行一个问题"
            :rows="4"
            show-count
            :maxlength="1000"
          />
          <div class="form-tip">
            <InfoCircleOutlined style="margin-right: 4px;" />
            每行输入一个相关问题，系统会自动识别并分组显示
          </div>
        </a-form-item>
        
        <!-- 额外信息 -->
        <a-divider orientation="left">
          <template #default>
            <span style="font-size: 16px; font-weight: 600;">
              <TagsOutlined style="margin-right: 8px; color: #fa8c16;" />
              标签和元数据
            </span>
          </template>
        </a-divider>
        
        <a-form-item label="标签" name="tags">
          <div class="tags-input-section">
            <a-select
              v-model:value="selectedTags"
              mode="tags"
              placeholder="输入或选择标签，回车添加"
              style="width: 100%"
              :options="suggestedTags"
              @change="handleTagsChange"
              :token-separators="[',', '、', ' ']"
            >
            </a-select>
            <div class="tags-suggestions" v-if="popularTags.length > 0">
              <span class="suggestions-label">热门标签：</span>
              <a-tag 
                v-for="tag in popularTags.slice(0, 10)"
                :key="tag"
                @click="addTag(tag)"
                style="cursor: pointer; margin: 2px;"
                color="blue"
              >
                <PlusOutlined style="margin-right: 4px;" />
                {{ tag }}
              </a-tag>
            </div>
          </div>
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="站点/地点" name="site">
              <a-input 
                v-model:value="formData.site" 
                placeholder="请输入具体站点或地点"
                show-count
                :maxlength="100"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="数据来源" name="source">
              <a-input 
                v-model:value="formData.source" 
                placeholder="请输入数据来源"
                show-count
                :maxlength="100"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="发布状态" name="is_published">
          <a-switch 
            v-model:checked="formData.is_published"
            checked-children="已发布"
            un-checked-children="草稿"
          />
          <div class="form-tip">
            <InfoCircleOutlined style="margin-right: 4px;" />
            开启后，此知识将对所有用户可见
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 详情查看弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="知识详情"
      :width="isMobile ? '95vw' : '800px'"
      :footer="null"
      class="knowledge-detail-modal"
    >
      <div v-if="currentKnowledge" class="detail-content">
        <!-- 头部信息 -->
        <div class="detail-header">
          <div class="header-left">
            <a-tag :color="getTypeColor(currentKnowledge.type)" class="type-tag">
              {{ currentKnowledge.type }}
            </a-tag>
            <a-tag v-if="currentKnowledge.category" color="blue" class="category-tag">
              {{ currentKnowledge.category }}
            </a-tag>
          </div>
          <div class="header-right">
            <span class="view-stat">
              <EyeOutlined />
              {{ currentKnowledge.view_count || 0 }} 次查看
            </span>
          </div>
        </div>

        <!-- 问题 -->
        <div class="detail-section">
          <h3 class="section-title">
            <QuestionCircleOutlined />
            问题
          </h3>
          <div class="section-content question-content">
            {{ currentKnowledge.question }}
          </div>
        </div>

        <!-- 答案 -->
        <div class="detail-section">
          <h3 class="section-title">
            <CheckCircleOutlined />
            答案
          </h3>
          <div class="section-content answer-content">
            {{ currentKnowledge.answer }}
          </div>
        </div>

        <!-- 相关问题 -->
        <div v-if="currentKnowledge.related_questions" class="detail-section">
          <h3 class="section-title">
            <LinkOutlined />
            相关问题
          </h3>
          <div class="section-content related-content">
            <div 
              v-for="question in currentKnowledge.related_questions.split('\n').filter(q => q.trim())"
              :key="question"
              class="related-item"
            >
              {{ question.trim() }}
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div v-if="currentKnowledge.tags" class="detail-section">
          <h3 class="section-title">
            <TagsOutlined />
            标签
          </h3>
          <div class="section-content tags-content">
            <a-tag
              v-for="tag in getTagList(currentKnowledge.tags)"
              :key="tag"
              color="orange"
              class="detail-tag"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>

        <!-- 元信息 -->
        <div class="detail-meta">
          <div class="meta-item">
            <ClockCircleOutlined />
            <span>创建时间：{{ formatDate(currentKnowledge.created_at) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <a-button @click="copyToClipboard(currentKnowledge.answer, currentKnowledge)" class="copy-action">
            <CopyOutlined />
            复制答案
          </a-button>
          <a-button @click="handleEdit(currentKnowledge)" type="primary">
            <EditOutlined />
            编辑知识
          </a-button>
          <a-button @click="detailVisible = false">
            关闭
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed, createVNode, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useUserPreferences } from '@/composables/useUserPreferences'
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  BookOutlined,
  FireOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  TagsOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useResponsive } from '@/composables/useResponsive'
import { 
  searchKnowledge, 
  getKnowledgeTypes,
  getKnowledgeCategories,
  createKnowledge, 
  updateKnowledge, 
  deleteKnowledge,
  getKnowledgeStats,
  getKnowledgeTypeStats,
  getKnowledgeUnitStats,
  getPopularTags,
  getCategoryOptions,
  incrementViewCount,
  type Knowledge,
  type KnowledgeQuery 
} from '@/api/knowledge'

// 引入响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const modalVisible = ref(false)
const detailVisible = ref(false)
const showMobileFilters = ref(false)
const viewMode = ref<'list' | 'grid'>('grid')
const knowledgeList = ref<Knowledge[]>([])
const knowledgeTypes = ref<string[]>([])
const categories = ref<string[]>([])
const editingKnowledge = ref<Knowledge | null>(null)
const currentKnowledge = ref<Knowledge | null>(null)
const formRef = ref()

// 统计数据
const knowledgeStats = reactive({
  total: 122,    // 更新为校招信息数据量
  popular: 35,   // 热门校招信息
  categories: 10, // 省份电网分类
  recent: 8      // 最近添加
})

// 搜索参数
const searchKeyword = ref('')
const selectedType = ref<string>()
const selectedCategory = ref<string>()
const selectedUnit = ref<string>()

// 动态选项数据（从后端获取）
const knowledgeTypeOptions = ref<Array<{ value: string; label: string; count: number }>>([])
const categoryOptions = ref<Array<{ value: string; label: string }>>([])
const unitOptions = ref<Array<{ value: string; label: string; count: number }>>([])

// 标签管理
const selectedTags = ref<string[]>([])
const popularTags = ref<string[]>([])
const suggestedTags = computed(() => {
  return popularTags.value.map(tag => ({
    label: tag,
    value: tag
  }))
})

// 用户偏好设置
const { itemsPerPage, loadPreferencesOnce } = useUserPreferences()

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 24,
  total: 0
})

// 表单数据
const formData = reactive<Knowledge>({
  type: '校招',
  category: '',
  question: '',
  answer: '',
  related_questions: '',
  tags: '',
  unit: '',
  site: '',
  source: '校招信息',
  is_published: true
})

// 表单验证规则
const rules = {
  type: [
    { required: true, message: '请选择知识类型', trigger: 'change', type: 'string' }
  ],
  question: [
    { required: true, message: '请输入问题内容', trigger: 'blur', type: 'string' }
  ],
  answer: [
    { required: true, message: '请输入答案内容', trigger: 'blur', type: 'string' }
  ]
} as any

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '电网考试': 'blue',
    '考研': 'green',
    '校招': 'orange',
    '其他': 'purple'
  }
  return colorMap[type] || 'default'
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm') : ''
}

// 加载知识列表
const loadKnowledge = async () => {
  loading.value = true
  try {
    const params: KnowledgeQuery = {
      page: pagination.current,
      per_page: pagination.pageSize
    }
    
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (selectedType.value) {
      params.type = selectedType.value
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    if (selectedUnit.value) {
      params.unit = selectedUnit.value
    }
    
    const response = await searchKnowledge(params)
    knowledgeList.value = response.data
    pagination.total = response.total
  } catch (error) {
    console.error('加载知识库失败:', error)
    // 检查是否是网络错误或API未实现
    if (error?.response?.status === 404) {
      message.warning('知识库API暂未实现，请联系后端开发人员')
    } else {
      message.error('加载知识库失败')
    }
    knowledgeList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载知识类型
const loadTypes = async () => {
  try {
    knowledgeTypes.value = await getKnowledgeTypes()
  } catch (error) {
    console.error('加载知识类型失败:', error)
    knowledgeTypes.value = [] // 设置空类型
  }
}

// 加载分类列表
const loadCategories = async () => {
  if (!selectedType.value) {
    categories.value = []
    return
  }
  
  try {
    categories.value = await getKnowledgeCategories(selectedType.value)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 监听类型变化，重新加载分类
watch(selectedType, () => {
  selectedCategory.value = undefined
  loadCategories()
})

// 计算是否有活跃筛选条件
const hasActiveFilters = computed(() => {
  return !!(searchKeyword.value || selectedType.value || selectedCategory.value || selectedUnit.value)
})

// 处理标签列表
const getTagList = (tags: string | undefined) => {
  if (!tags) return []
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag)
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadKnowledge()
}

// 分页变化
const handlePageChange = () => {
  loadKnowledge()
}

// 显示新增弹窗
const showCreateModal = () => {
  resetForm()
  modalVisible.value = true
}

// 编辑知识
const handleEdit = (knowledge: Knowledge) => {
  editingKnowledge.value = knowledge
  Object.assign(formData, {
    type: knowledge.type,
    category: knowledge.category,
    question: knowledge.question,
    answer: knowledge.answer,
    related_questions: knowledge.related_questions,
    tags: knowledge.tags
  })
  modalVisible.value = true
}

// 显示详情
const showDetail = (knowledge: Knowledge) => {
  currentKnowledge.value = knowledge
  detailVisible.value = true
}

// 删除知识
const handleDelete = (knowledge: Knowledge) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除知识「${knowledge.question}」吗？此操作不可恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    okType: 'danger',
    icon: createVNode(ExclamationCircleOutlined, { style: { color: '#ff4d4f' } }),
    async onOk() {
      try {
        await deleteKnowledge(knowledge.id!)
        message.success('删除知识成功')
        // 重新加载列表
        await loadKnowledge()
        // 更新统计数据
        await loadStats()
      } catch (error: any) {
        console.error('删除知识失败:', error)
        message.error(error.response?.data?.message || '删除知识失败')
      }
    }
  })
}

// 移动端搜索
const handleMobileSearch = () => {
  showMobileFilters.value = false
  handleSearch()
}

// 清空移动端筛选
const clearMobileFilters = () => {
  searchKeyword.value = ''
  selectedType.value = undefined
  selectedCategory.value = undefined
  selectedUnit.value = undefined
  categories.value = []
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (editingKnowledge.value) {
      await updateKnowledge(editingKnowledge.value.id!, formData)
      message.success('更新知识成功')
    } else {
      await createKnowledge(formData)
      message.success('创建知识成功')
    }
    
    modalVisible.value = false
    detailVisible.value = false
    loadKnowledge()
  } catch (error) {
    if (error?.errorFields) return // 表单验证错误
    message.error(editingKnowledge.value ? '更新知识失败' : '创建知识失败')
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
  // 先清空编辑状态
  editingKnowledge.value = null
  
  // 重置表单数据
  Object.assign(formData, {
    type: '电网考试',
    category: '',
    question: '',
    answer: '',
    related_questions: '',
    tags: ''
  })
  
  // 在下一个 tick 中重置表单字段
  nextTick(() => {
    formRef.value?.resetFields()
  })
}

// 类型变化处理
const handleTypeChange = () => {
  formData.category = ''
  loadCategoryOptions()
}

// 标签变化处理
const handleTagsChange = (value: any) => {
  const tags = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : [])
  selectedTags.value = tags
  formData.tags = tags.join(', ')
}

// 添加标签
const addTag = (tag: string) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
    formData.tags = selectedTags.value.join(', ')
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const stats = await getKnowledgeStats()
    Object.assign(knowledgeStats, stats)
  } catch (error) {
    console.warn('加载统计数据失败，使用默认数据:', error)
    // 保持默认数据用于展示
    Object.assign(knowledgeStats, {
      total: 122,    // 招聘信息条目
      popular: 35,   // 热门招聘
      categories: 10, // 省份电网
      recent: 8      // 今日新增
    })
  }
}

// 加载类型选项
const loadTypeOptions = async () => {
  try {
    const options = await getKnowledgeTypeStats()
    knowledgeTypeOptions.value = options
  } catch (error) {
    console.warn('加载类型选项失败，使用默认数据:', error)
    knowledgeTypeOptions.value = [
      { value: '电网考试', label: '电网考试', count: 45 },
      { value: '校招', label: '校园招聘', count: 32 },
      { value: '考研', label: '考研信息', count: 28 },
      { value: '其他', label: '其他信息', count: 17 }
    ]
  }
}

// 加载省份电网选项
const loadUnitOptions = async () => {
  try {
    const options = await getKnowledgeUnitStats()
    unitOptions.value = options
  } catch (error) {
    console.warn('加载省份电网选项失败，使用默认数据:', error)
    unitOptions.value = [
      { value: '浙江', label: '浙江电网', count: 12 },
      { value: '山东', label: '山东电网', count: 10 },
      { value: '冀北', label: '冀北电网', count: 9 },
      { value: '河南', label: '河南电网', count: 8 },
      { value: '江苏', label: '江苏电网', count: 7 },
      { value: '湖北', label: '湖北电网', count: 6 },
      { value: '安徽', label: '安徽电网', count: 5 },
      { value: '福建', label: '福建电网', count: 4 },
      { value: '广东', label: '广东电网', count: 4 },
      { value: '四川', label: '四川电网', count: 3 }
    ]
  }
}

// 加载分类选项
const loadCategoryOptions = async () => {
  if (!formData.type) {
    categoryOptions.value = []
    return
  }
  
  try {
    const options = await getCategoryOptions(formData.type)
    categoryOptions.value = options
  } catch (error) {
    console.warn('加载分类选项失败，使用默认数据:', error)
    // 根据类型提供默认分类
    const defaultCategories: Record<string, Array<{ value: string; label: string }>> = {
      '电网考试': [
        { value: '电力系统', label: '电力系统' },
        { value: '电气工程', label: '电气工程' },
        { value: '继电保护', label: '继电保护' },
        { value: '电力电子', label: '电力电子' }
      ],
      '校招': [
        { value: '技术岗', label: '技术岗位' },
        { value: '管理岗', label: '管理岗位' },
        { value: '营销岗', label: '营销岗位' },
        { value: '财务岗', label: '财务岗位' }
      ],
      '考研': [
        { value: '专业课', label: '专业课程' },
        { value: '院校信息', label: '院校信息' },
        { value: '复试', label: '复试指导' },
        { value: '调剂', label: '调剂信息' }
      ]
    }
    categoryOptions.value = defaultCategories[formData.type] || []
  }
}

// 加载热门标签
const loadPopularTags = async () => {
  try {
    const tags = await getPopularTags()
    popularTags.value = tags
  } catch (error) {
    console.warn('加载热门标签失败，使用默认数据:', error)
    popularTags.value = [
      '电网', '招聘', '考试', '技术', '管理', '营销', '财务',
      '电力系统', '继电保护', '变电', '配电', '输电',
      '校园招聘', '应届生', '实习', '培训', '发展',
      '考研', '专业课', '复试', '调剂', '院校'
    ]
  }
}

// 复制到剪贴板
const copyToClipboard = async (text: string, knowledge?: any) => {
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
    
    message.success('知识内容已复制到剪贴板')
    
    // 如果提供了knowledge对象，可以在这里更新浏览次数或其他统计
    if (knowledge && knowledge.id) {
      try {
        // 这里可以调用API增加复制次数统计
        console.log('知识复制统计:', knowledge.id)
      } catch (error) {
        console.error('更新复制统计失败:', error)
      }
    }
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败，请手动复制')
  }
}

// 初始化
onMounted(async () => {
  console.log('知识库页面初始化开始')
  
  try {
    // 首先加载用户偏好设置
    await loadPreferencesOnce()
    
    // 设置默认分页大小为用户偏好
    pagination.pageSize = itemsPerPage.value || 20
    
    // 然后并行加载基础数据
    await Promise.all([
      loadKnowledge(),
      loadTypes(),
      loadTypeOptions(),
      loadUnitOptions(),
      loadPopularTags()
    ])
    
    // 加载统计数据
    await loadStats()
    
    console.log('知识库所有数据加载完成')
  } catch (error) {
    console.error('知识库初始化失败:', error)
  }
  
  // 设置默认视图模式
  if (isMobile.value) {
    viewMode.value = 'list'
  } else {
    viewMode.value = 'grid'  // 桌面端默认网格视图
  }
})
</script>

<style scoped lang="less">
.knowledge-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
}

// 页面头部
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    font-size: 28px;
    color: #1890ff;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
    
    @media (max-width: 767px) {
      font-size: 20px;
    }
  }
  
  .title-desc {
    color: #8c8c8c;
    font-size: 14px;
    margin-left: 8px;
    
    @media (max-width: 767px) {
      display: none;
    }
  }
}

.page-actions {
  .create-btn {
    height: 44px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
    
    .button-text {
      @media (max-width: 639px) {
        display: none;
      }
    }
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
}

// 统计仪表盘
.stats-dashboard {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  @media (max-width: 767px) {
    padding: 16px 12px;
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    
    @media (max-width: 767px) {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }
  }
  
  .stat-content {
    flex: 1;
    min-width: 0;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
    
    @media (max-width: 767px) {
      font-size: 20px;
    }
  }
  
  .stat-label {
    font-size: 13px;
    color: #8c8c8c;
    font-weight: 500;
    
    @media (max-width: 767px) {
      font-size: 11px;
    }
  }
  
  &.knowledge-card {
    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .stat-value {
      color: #667eea;
    }
  }
  
  &.popular-card {
    .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .stat-value {
      color: #f5576c;
    }
  }
  
  &.category-card {
    .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    .stat-value {
      color: #4facfe;
    }
  }
  
  &.recent-card {
    .stat-icon {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
    .stat-value {
      color: #43e97b;
    }
  }
}

// 主要内容
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
}

// 搜索区域
.search-section {
  margin-bottom: 24px;
}

.desktop-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 767px) {
    display: none;
  }
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  
  .search-input {
    width: 300px;
    
    .ant-input-search {
      border-radius: 8px;
    }
  }
  
  .filter-select {
    width: 140px;
    
    .ant-select-selector {
      border-radius: 8px;
    }
  }
}

.view-controls {
  .ant-radio-group {
    .ant-radio-button-wrapper {
      border-radius: 8px;
      
      .view-text {
        margin-left: 4px;
        
        @media (max-width: 1023px) {
          display: none;
        }
      }
      
      &:first-child {
        border-radius: 8px 0 0 8px;
      }
      
      &:last-child {
        border-radius: 0 8px 8px 0;
      }
    }
  }
}

.mobile-search {
  display: none;
  
  @media (max-width: 767px) {
    display: block;
  }
  
  .mobile-search-btn {
    height: 48px;
    border-radius: 8px;
    border: 2px dashed #d9d9d9;
    background: #fafafa;
    position: relative;
    
    .filter-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: #ff4d4f;
      border-radius: 50%;
    }
  }
}

// 知识内容
.knowledge-content {
  min-height: 400px;
}

// 列表视图
.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
    transform: translateY(-1px);
  }
  
  @media (max-width: 767px) {
    padding: 16px;
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .item-tags {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .view-count {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #8c8c8c;
      font-size: 12px;
    }
  }
  
  .action-trigger {
    color: #8c8c8c;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    
    &:hover {
      color: #1890ff;
      background: #f6ffed;
    }
  }
  
  .item-content {
    margin-bottom: 12px;
    
    .question-title {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    
    .answer-preview {
      color: #595959;
      font-size: 14px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 767px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .tags-section {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    
    .created-time {
      color: #8c8c8c;
      font-size: 12px;
    }
  }
}

// 网格视图
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.grid-item {
  cursor: pointer;
  
  .grid-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border: 1px solid #e8e8e8;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    &:hover {
      border-color: #1890ff;
      box-shadow: 0 12px 32px rgba(24, 144, 255, 0.2);
      transform: translateY(-4px);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
      background: linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%);
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .grid-card:hover & {
        &::after {
          opacity: 1;
        }
      }
      
      .header-tags {
        display: flex;
        gap: 6px;
      }
      
      .card-action {
        color: #8c8c8c;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        
        &:hover {
          color: #1890ff;
          background: #f6ffed;
        }
      }
    }
    
    .card-content {
      padding: 20px;
      flex: 1;
      background: #ffffff;
      
      .card-question {
        font-size: 16px;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 16px 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        cursor: pointer;
        
        &:hover {
          color: #1890ff;
        }
      }
      
      .card-answer {
        color: #666;
        font-size: 14px;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0;
        background: linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%);
        padding: 12px;
        border-radius: 8px;
        border-left: 4px solid #52c41a;
      }
    }
    
    .card-footer {
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      
      .footer-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #8c8c8c;
          font-size: 11px;
        }
      }
      
      .footer-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .footer-tags {
          display: flex;
          gap: 4px;
          align-items: center;
          flex: 1;
          
          .mini-tag {
            background: #f6ffed;
            color: #52c41a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            border: 1px solid #d9f7be;
          }
          
          .more-tags {
            color: #8c8c8c;
            font-size: 10px;
          }
        }
        
        .copy-btn {
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          border: none;
          border-radius: 6px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
          margin-left: 12px;
          
          &:hover {
            background: linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
          }
        }
      }
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px 20px;
  
  .empty-icon {
    font-size: 64px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }
  
  .empty-title {
    font-size: 16px;
    color: #262626;
    margin: 0 0 8px 0;
  }
  
  .empty-desc {
    color: #8c8c8c;
    margin: 0 0 24px 0;
  }
  
  .empty-action {
    height: 44px;
    border-radius: 8px;
  }
}

// 分页
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 24px 0;
  border-top: 1px solid #f0f0f0;
}

// 移动端筛选抽屉
.mobile-filter-drawer {
  .mobile-filter-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .mobile-filter-actions {
    display: flex;
    gap: 12px;
    margin-top: auto;
    padding-top: 16px;
    
    .clear-btn {
      flex: 1;
    }
    
    .search-btn {
      flex: 2;
    }
  }
}

// 详情弹窗
.knowledge-detail-modal {
  .detail-content {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
      
      .header-left {
        display: flex;
        gap: 8px;
      }
      
      .header-right {
        .view-stat {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #8c8c8c;
          font-size: 14px;
        }
      }
    }
    
    .detail-section {
      margin-bottom: 24px;
      
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #262626;
        margin: 0 0 12px 0;
      }
      
      .section-content {
        border-radius: 8px;
        padding: 16px;
        line-height: 1.6;
        
        &.question-content {
          background: #f6ffed;
          border: 1px solid #d9f7be;
          color: #262626;
          font-weight: 500;
        }
        
        &.answer-content {
          background: #e6f7ff;
          border: 1px solid #91d5ff;
          color: #262626;
          white-space: pre-wrap;
        }
        
        &.related-content {
          background: #fff7e6;
          border: 1px solid #ffd591;
          
          .related-item {
            padding: 8px 0;
            border-bottom: 1px solid #ffd591;
            
            &:last-child {
              border-bottom: none;
            }
          }
        }
        
        &.tags-content {
          background: #f9f0ff;
          border: 1px solid #d3adf7;
          
          .detail-tag {
            margin: 4px;
          }
        }
      }
    }
    
    .detail-meta {
      margin-bottom: 24px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #8c8c8c;
        font-size: 14px;
      }
    }
    
    .detail-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
  }
}

// 知识新增/编辑弹窗样式
.knowledge-modal {
  .ant-modal-body {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .ant-divider {
    margin: 24px 0 16px 0;
    
    .ant-divider-inner-text {
      padding: 0 16px;
      font-weight: 600;
      color: #262626;
    }
  }
  
  .form-tip {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 6px;
    color: #52c41a;
    font-size: 12px;
    display: flex;
    align-items: center;
  }
  
  .tags-input-section {
    .tags-suggestions {
      margin-top: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #f0f0f0;
      
      .suggestions-label {
        font-size: 12px;
        color: #8c8c8c;
        margin-right: 8px;
        font-weight: 500;
      }
      
      .ant-tag {
        margin: 2px 4px 2px 0;
        transition: all 0.2s;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
        }
      }
    }
  }
  
  .ant-form-item {
    margin-bottom: 20px;
    
    .ant-form-item-label > label {
      font-weight: 500;
      color: #262626;
    }
  }
  
  .ant-row {
    .ant-col {
      padding: 0 8px;
      
      &:first-child {
        padding-left: 0;
      }
      
      &:last-child {
        padding-right: 0;
      }
    }
  }
  
  .ant-select,
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-textarea {
    border-radius: 6px;
    
    &:hover {
      border-color: #40a9ff;
    }
    
    &:focus,
    &.ant-select-focused {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
  
  .ant-switch {
    &.ant-switch-checked {
      background-color: #52c41a;
    }
  }
}

// 响应式优化
@media (max-width: 767px) {
  .ant-card {
    margin: 0 !important;
  }
  
  .ant-modal {
    margin: 0 !important;
    max-width: none !important;
  }
  
  .ant-modal-content {
    border-radius: 12px 12px 0 0 !important;
  }
  
  .knowledge-modal {
    .ant-modal-body {
      padding: 16px;
      max-height: 75vh;
    }
    
    .ant-divider {
      margin: 16px 0 12px 0;
      
      .ant-divider-inner-text {
        font-size: 14px;
        padding: 0 12px;
      }
    }
    
    .ant-row .ant-col {
      margin-bottom: 16px;
      padding: 0 !important;
    }
    
    .tags-input-section .tags-suggestions {
      padding: 8px;
      
      .ant-tag {
        margin: 2px 2px 2px 0;
        font-size: 11px;
      }
    }
  }
}
</style>
