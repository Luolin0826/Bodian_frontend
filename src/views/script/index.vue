<template>
  <div class="script-library">
    <!-- 项目分类筛选 -->
    <div class="project-filter-header">
      <div class="project-categories">
        <div class="category-title">
          <ProjectOutlined />
          项目分类
        </div>
        <div class="category-tabs">
          <div 
            class="category-tab"
            :class="{ active: !selectedProjectCategory }"
            @click="handleProjectCategoryChange(null)"
          >
            <span class="tab-label">全部项目</span>
            <span class="tab-count">{{ totalScriptsCount }}</span>
          </div>
          <div 
            v-for="category in projectCategories"
            :key="category.id || category.value"
            class="category-tab"
            :class="{ active: selectedProjectCategory === category.id }"
            @click="handleProjectCategoryChange(category.id)"
          >
            <span class="tab-label">{{ category.label }}</span>
            <span class="tab-count">{{ category.count }}</span>
          </div>
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
                :get-popup-container="(triggerNode) => triggerNode.parentNode"
                :dropdown-style="{ zIndex: 9999 }"
              />

              
              <a-select
                v-model:value="sortBy"
                placeholder="排序方式"
                class="filter-select"
                @change="handleSearch"
                size="large"
              >
                <a-select-option value="category_id">
                  <span class="option-text">
                    <apartment-outlined class="option-icon" />
                    按分类排序
                  </span>
                </a-select-option>
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
              v-if="userStore.role === 'super_admin' || userStore.role === 'admin'" 
              @click="showCategoryManager" 
              size="large" 
              title="分类管理"
            >
              <apartment-outlined />
              <span class="desktop-only">分类管理</span>
            </a-button>
            
            <a-button 
              v-if="userStore.role === 'super_admin' || userStore.role === 'admin'"
              type="primary" 
              @click="showCreateModal" 
              size="large" 
              class="add-btn"
            >
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
            v-for="columnIndex in actualColumnCount" 
            :key="columnIndex" 
            class="question-column"
          >
            <div
              v-for="script in getColumnScripts(columnIndex - 1)"
              :key="script.id"
              class="question-item"
              :class="{ 
                'pinned-item': script.is_pinned, 
                'favorited-item': script.is_favorited && !script.is_pinned,
                'recently-clicked': lastClickedScriptId === script.id
              }"
              @click="showDetail(script)"
            >
              <!-- 置顶标识 -->
              <div class="pin-corner" v-if="script.is_pinned">
                <pushpin-filled class="pin-icon" />
              </div>
              <div class="question-content">
                <span class="question-text">{{ script.question || script.title }}</span>
              </div>
              <div class="question-actions">
                <a-tag v-if="getCategoryLabel(script)" :color="getCategoryColor(script)" size="small" class="question-tag">
                  {{ getCategoryLabel(script) }}
                </a-tag>
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
                <!-- 待改进标识：仅当is_pending_revision为true时显示 -->
                <a-button 
                  v-if="script.is_pending_revision"
                  type="text"
                  size="small"
                  class="pending-btn-question"
                  title="待改进话术"
                  disabled
                >
                  <edit-outlined class="pending-icon" />
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
      </div>

      <!-- 卡片模式 -->
      <div v-else class="compact-script-list">
        <div class="script-grid-compact">
          <div 
            v-for="columnIndex in actualColumnCount" 
            :key="columnIndex" 
            class="script-column"
          >
            <div
              v-for="script in getColumnScripts(columnIndex - 1)"
              :key="script.id"
              class="script-item-compact"
              :class="{ 
                'pinned-item': script.is_pinned, 
                'favorited-item': script.is_favorited && !script.is_pinned,
                'recently-clicked': lastClickedScriptId === script.id
              }"
              @click="showDetail(script)"
            >
            <!-- 置顶标识 -->
            <div class="pin-corner" v-if="script.is_pinned">
              <pushpin-filled class="pin-icon" />
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
                <!-- 待改进标识：仅当is_pending_revision为true时显示 -->
                <a-button 
                  v-if="script.is_pending_revision"
                  type="text"
                  size="small"
                  class="pending-btn-compact"
                  title="待改进话术"
                  disabled
                >
                  <edit-outlined class="pending-icon" />
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
      </div>

      <!-- 暂无数据占位符 - 移到上面 -->
      <div v-if="scriptList.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <message-outlined />
        </div>
        <h3>暂无话术数据</h3>
        <p v-if="userStore.role === 'super_admin' || userStore.role === 'admin'">创建你的第一个话术，开始构建专业的话术库</p>
        <p v-else>暂无可查看的话术数据</p>
        <a-button 
          v-if="userStore.role === 'super_admin' || userStore.role === 'admin'"
          type="primary" 
          @click="showCreateModal" 
          size="large" 
          class="create-first-btn"
        >
          <plus-outlined />
          创建第一个话术
        </a-button>
      </div>

      <!-- 分页 - 移到下面，只在有数据时显示 -->
      <div v-if="scriptList.length > 0 || pagination.total > 0" class="pagination-section">
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

          
          
          <a-form-item label="排序方式" name="sort_by">
            <a-select
              v-model:value="sortBy"
              placeholder="选择排序"
              @change="handleSearch"
            >
              <a-select-option value="category_id">按分类排序</a-select-option>
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
      <div v-if="currentScript" class="script-detail-enhanced">
        <!-- 突出的问题场景 -->
        <div v-if="currentScript.question" class="question-section-enhanced">
          <div class="section-header">
            <div class="section-title-wrapper">
              <question-circle-outlined />
              <span class="section-title">问题场景</span>
            </div>
          </div>
          <div class="section-content-enhanced question-content">
            {{ currentScript.question }}
          </div>
        </div>
        
        <!-- 多回复话术内容 -->
        <div class="answer-section-enhanced">
          <div class="section-header">
            <div class="section-title-wrapper">
              <message-outlined />
              <span class="section-title">话术内容</span>
            </div>
            <span v-if="currentScriptAnswers.length > 1" class="answer-count-badge">
              {{ currentScriptAnswers.length }} 个回复
            </span>
          </div>
          
          
          <!-- 单个回复模式 -->
          <div v-if="currentScriptAnswers.length === 1" class="single-answer-mode">
            <div class="section-content-enhanced answer-content">
              {{ currentScriptAnswers[0] || currentScript.answer }}
            </div>
          </div>
          
          <!-- 多回复模式 -->
          <div v-else-if="currentScriptAnswers.length > 1" class="multi-answer-mode">
            <!-- 垂直显示所有回复 -->
            <div 
              v-for="(answer, index) in currentScriptAnswers" 
              :key="index"
              class="answer-item"
            >
              <div class="answer-header">
                <span class="answer-label">回复{{ index + 1 }}</span>
                <a-button 
                  type="text" 
                  size="small" 
                  @click="copyToClipboard(answer, currentScript, index)"
                  class="copy-answer-btn"
                >
                  <copy-outlined />
                  复制
                </a-button>
              </div>
              <div class="section-content-enhanced answer-content">
                {{ answer || '回复内容为空' }}
              </div>
            </div>
          </div>
          
          <!-- 无回复模式 -->
          <div v-else class="no-answer-mode">
            <div class="section-content-enhanced answer-content">
              暂无回复内容
            </div>
          </div>
        </div>
        
        <!-- 操作按钮区域 -->
        <div class="action-section">
          <a-space>
            <!-- 复制按钮 -->
            <a-button size="small" @click="copyAllAnswers()">
              <copy-outlined />
              复制话术
            </a-button>
            
            <!-- 编辑按钮：仅管理员可见 -->
            <a-button 
              v-if="canManageContent" 
              type="primary" 
              size="small" 
              @click="handleEdit(currentScript); detailVisible = false"
            >
              <edit-outlined />
              编辑话术
            </a-button>
            <!-- 删除按钮：仅管理员可见 -->
            <a-button 
              v-if="canManageContent" 
              type="primary" 
              danger 
              size="small" 
              @click="handleDeleteScript(currentScript)"
            >
              <delete-outlined />
              删除话术
            </a-button>
          </a-space>
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
        <!-- 第一行：项目分类和话术分类 -->
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="项目分类" name="project_category_id" required>
              <a-select
                v-model:value="formData.project_category_id"
                placeholder="请选择项目分类"
                @change="handleFormProjectCategoryChange"
              >
                <a-select-option 
                  v-for="category in projectCategories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  <span style="display: flex; align-items: center; justify-content: space-between;">
                    <span>{{ category.label }}</span>
                    <span style="color: #999; font-size: 12px;">({{ category.count }})</span>
                  </span>
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="话术分类" name="category_id" required>
              <a-select
                v-model:value="formData.category_id"
                placeholder="请先选择项目分类"
                :disabled="!formData.project_category_id"
                @change="handleSubCategoryChange"
              >
                <a-select-option 
                  v-for="subCategory in availableSubCategories" 
                  :key="subCategory.id" 
                  :value="subCategory.id"
                >
                  <span style="display: flex; align-items: center; justify-content: space-between;">
                    <span>{{ subCategory.name }}</span>
                    <span style="color: #999; font-size: 12px;">({{ subCategory.script_count || 0 }})</span>
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
        
        <!-- 多回复编辑器 -->
        <a-form-item-rest>
          <a-form-item label="话术内容">
            <div class="multi-answer-editor">
            <div 
              v-for="(answer, index) in formAnswers" 
              :key="index"
              class="answer-editor-item"
            >
              <!-- 回复标题栏 -->
              <div class="answer-header">
                <div class="answer-title">
                  <span class="answer-label">回复{{ index + 1 }}</span>
                </div>
                <div class="answer-actions">
                  <a-button 
                    v-if="formAnswers.length > 1"
                    size="small" 
                    type="text" 
                    danger
                    @click="removeAnswer(index)"
                    title="删除回复"
                  >
                    <delete-outlined />
                  </a-button>
                </div>
              </div>
              
              <!-- 回复内容编辑区 -->
              <a-textarea 
                v-model:value="formAnswers[index]" 
                :placeholder="index === 0 ? '请输入主要话术内容' : `请输入回复${index + 1}的内容`"
                :rows="4"
                show-count
                :maxlength="2000"
                class="answer-textarea"
              />
            </div>
            
            <!-- 添加回复按钮 -->
            <div v-if="formAnswers.length < 5" class="add-answer-section">
              <a-button 
                type="dashed" 
                block 
                @click="addAnswer"
                class="add-answer-btn"
              >
                <plus-outlined />
                添加回复 ({{ formAnswers.length }}/5)
              </a-button>
            </div>
            
            <!-- 提示信息 -->
            <div class="editor-tips">
              <a-typography-text type="secondary" class="tip-text">
                💡 最多支持5个不同回复。
              </a-typography-text>
            </div>
          </div>
          </a-form-item>
        </a-form-item-rest>
        
        <!-- 待修改状态切换 -->
        <a-form-item v-if="editingScript" label="话术状态">
          <a-switch 
            v-model:checked="formData.is_pending_revision"
            checked-children="待修改"
            un-checked-children="正常"
          >
            <template #checkedChildren>
              <edit-outlined />
              待修改
            </template>
            <template #unCheckedChildren>
              正常
            </template>
          </a-switch>
          <div class="form-help-text">
            标记为待修改后，该话术会在列表中显示橙色编辑图标标识
          </div>
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
      @after-close="handleCategoryManagerClose"
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
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
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
  StarOutlined,
  StarFilled,
  DownOutlined,
  TagOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  LaptopOutlined,
  MedicineBoxOutlined,
  BuildOutlined,
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
  markScriptPending,
  unmarkScriptPending,
  // 新分类管理API
  getScriptCategoriesTree,
  // 项目分类API
  getProjectCategories,
  // 多回复管理API
  addScriptAnswer,
  updateScriptAnswer,
  deleteScriptAnswer,
  type Script,
  type ScriptQuery,
  type ScriptCategory,
  type ProjectCategory
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

const canManageContent = computed(() => {
  // 超级管理员和管理员可以编辑和删除话术
  return userStore.userInfo?.role === 'super_admin' || userStore.userInfo?.role === 'admin'
})

// 检查用户是否有访问指定项目分类的权限
const hasProjectCategoryAccess = (categoryId: number | string) => {
  return userStore.hasProjectCategoryAccess(categoryId)
}

// 多回复功能计算属性
const currentScriptAnswers = computed(() => {
  if (!currentScript.value) return []
  
  // 如果有answers数组，使用答案数组
  if (currentScript.value.answers && currentScript.value.answers.length > 0) {
    return currentScript.value.answers
  }
  
  // 否则使用answer字段作为单一回复
  return currentScript.value.answer ? [currentScript.value.answer] : []
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
const lastClickedScriptId = ref<number | null>(null)
// 多回复功能相关
const selectedAnswerIndex = ref(0) // 详情页面当前选中的回复索引
const formRef = ref()
const categorySelectorRef = ref()
const categorySelectorKey = ref(0) // 用于强制刷新CategorySelector
const viewType = ref<'grid' | 'list'>('list')
const sortBy = ref<string>('category_id')

// 搜索参数
const searchKeyword = ref('')
// 项目分类相关数据
const projectCategories = ref<ProjectCategory[]>([])
const selectedProjectCategory = ref<number | null>(null) // 改为使用分类ID
const totalScriptsCount = ref<number>(0)
const categoryTree = ref<ScriptCategory[]>([]) // 完整的分类树
const availableSubCategories = ref<ScriptCategory[]>([]) // 当前项目分类下的子分类
// 新分类系统相关数据
const categories = ref<ScriptCategory[]>([])
const categoryManagerVisible = ref(false)
const selectedType = ref<string>()
const selectedContentType = ref<string>()
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
  const primaryCategoryId = formData.project_category_id
  if (!primaryCategoryId) return []
  
  // 从动态加载的分类树中查找子分类
  const primaryCategory = categoryTree.value.find(cat => cat.id === primaryCategoryId)
  if (!primaryCategory?.children) return []
  
  return primaryCategory.children.map(child => ({
    value: child.id,
    label: child.name
  }))
})

// 检查主分类是否有子分类（动态检查）
const hasSubcategories = (primaryCategoryId?: number): boolean => {
  if (!primaryCategoryId) return false
  const category = categoryTree.value.find(cat => cat.id === primaryCategoryId)
  return !!(category?.children && category.children.length > 0)
}


// 获取分类的中文标签（从动态数据）
const getCategoryNameById = (categoryId?: number): string => {
  if (!categoryId) return ''
  const category = categoryTree.value.find(cat => cat.id === categoryId)
  return category?.name || ''
}

// 获取主分类的中文标签（保持向后兼容）
const getPrimaryCategoryLabel = (primaryValue?: string | number): string => {
  if (!primaryValue) return ''
  // 如果是数字ID，尝试从分类树查找
  const numericId = typeof primaryValue === 'number' ? primaryValue : parseInt(String(primaryValue))
  if (!isNaN(numericId)) {
    return getCategoryNameById(numericId)
  }
  // 向后兼容旧的字符串值
  return String(primaryValue)
}


// 用户偏好设置
const { itemsPerPage, loadPreferencesOnce } = useUserPreferences()

// 响应式窗口宽度
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)

// 动态列数计算（基于屏幕宽度和CSS断点）
const actualColumnCount = computed(() => {
  const width = windowWidth.value
  if (width <= 768) return 1  // 移动端：1列
  if (width <= 1200) return 2  // 中等屏幕：2列
  return 3  // 大屏幕：3列
})

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth
  }
  window.addEventListener('resize', updateWindowWidth)
  
  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('resize', updateWindowWidth)
  })
}

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20, // 初始值，会在onMounted中根据用户偏好设置
  total: 0
})

// 表单数据
const formData = reactive<Script>({
  title: '',
  project_category_id: null, // 项目分类ID（新增）
  category_id: null, // 话术分类ID
  question: '',
  answer: '', // 保持兼容性，将作为主回复
  // 自动设置的字段，不在表单中显示
  keywords: ''
})

// 多回复表单数据
const formAnswers = ref<string[]>(['']) // 回复数组，默认一个空回复

// 表单验证规则
const rules = {
  project_category_id: [
    { required: true, message: '请选择项目分类', trigger: 'change' }
  ],
  category_id: [
    { required: true, message: '请选择话术分类', trigger: 'change' }
  ],
  question: [
    { required: true, message: '请输入问题场景', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入话术内容', trigger: 'blur' }
  ]
} as any

// 分类选项
// const categoryOptions = computed(() => {
//   return categories.value.map(cat => ({ label: cat, value: cat }))
// })

// 将话术分配到三列中
const getColumnScripts = (columnIndex: number): Script[] => {
  // 按列连续分配算法：确保每列内的数据是连续排序的
  const totalScripts = scriptList.value.length
  if (totalScripts === 0) return []
  
  const columnCount = actualColumnCount.value
  
  // 计算每列应分配的数据量
  const scriptsPerColumn = Math.ceil(totalScripts / columnCount)
  const startIndex = columnIndex * scriptsPerColumn
  const endIndex = Math.min(startIndex + scriptsPerColumn, totalScripts)
  
  // 连续分配：第1列取前N个，第2列取接下来N个，以此类推
  const result = scriptList.value.slice(startIndex, endIndex)
  
  // 调试信息：帮助诊断列分配问题
  if (totalScripts > 0) {
    console.log(`📊 列${columnIndex + 1}/${columnCount}分配: ${result.length}条数据 (索引${startIndex}-${endIndex-1}, 总计${totalScripts}条)`)
    if (result.length > 0) {
      console.log(`   首条: ${result[0].title || result[0].question || 'N/A'}`)
      console.log(`   末条: ${result[result.length-1].title || result[result.length-1].question || 'N/A'}`)
    }
  }
  
  return result
}

// 获取分类标签文本
const getCategoryLabel = (script: Script): string => {
  // 优先显示category_info中的name
  if (script.category_info?.name) {
    return script.category_info.name
  }
  
  // 如果有category_id，从categoryTree中查找对应的分类名称
  if (script.category_id && categoryTree.value.length > 0) {
    const category = categoryTree.value.find(cat => cat.id === script.category_id)
    if (category?.name) {
      return category.name
    }
  }
  
  // 备选：显示category字段内容（但先检查是否为数字）
  const categoryValue = script.category || ''
  // 如果是纯数字，尝试从分类树中查找
  if (/^\d+$/.test(categoryValue) && categoryTree.value.length > 0) {
    const numericId = parseInt(categoryValue)
    const category = categoryTree.value.find(cat => cat.id === numericId)
    if (category?.name) {
      return category.name
    }
  }
  
  return categoryValue
}

// 获取分类颜色
const getCategoryColor = (script: Script): string => {
  const category = getCategoryLabel(script)
  
  // 如果没有分类，返回默认颜色
  if (!category) return 'default'
  
  // 优化的颜色配置，确保所有颜色都有良好的可读性
  const colors = [
    // Ant Design 预设颜色（这些颜色已经过优化，具有良好的对比度）
    'processing', 'success', 'warning', 'error', 'purple', 'blue', 'green',
    'orange', 'cyan', 'geekblue', 'volcano', 'magenta', 'gold', 'lime',
    'pink', 'red',
    
    // 深色十六进制颜色，确保与白色文字有良好对比度
    '#f5222d', '#fa541c', '#fa8c16', '#faad14', '#52c41a', '#13c2c2', 
    '#1890ff', '#2f54eb', '#722ed1', '#eb2f96', '#cf1322', '#d4380d', 
    '#d46b08', '#d48806', '#389e0d', '#08979c', '#096dd9', '#0050b3',
    '#531dab', '#c41d7f', '#ad2102', '#871400', '#612500', '#ad6800',
    '#ad8b00', '#5b8c00', '#237804', '#00474f', '#006d75', '#10239e',
    '#391085', '#9e1068',
    
    // 中等深度的颜色，保证可读性
    '#ff4d4f', '#ff7a45', '#ffa940', '#73d13d', '#36cfc9',
    '#40a9ff', '#597ef7', '#9254de', '#f759ab'
  ]
  
  // 改进的哈希算法，减少颜色冲突
  const getColorIndex = (name: string): number => {
    // 使用DJB2哈希算法，分布更均匀
    let hash = 5381
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) + hash) + name.charCodeAt(i)
    }
    
    // 添加字符串长度作为额外的随机因子
    hash = hash + name.length * 31
    
    // 确保为正数并取模
    return Math.abs(hash) % colors.length
  }
  
  // 为当前分类动态分配颜色
  return colors[getColorIndex(category)]
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
      sort_by: sortBy.value === 'category_id' ? 'category_sort_order' : sortBy.value, // 使用更明确的参数名
      sort_order: sortBy.value === 'category_id' ? 'asc' : 'desc' // 分类排序用升序，其他用降序
    }
    
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    // 处理分类筛选 - 统一使用 category_id 参数
    const categoryIds = new Set<number>()
    let hasSubCategorySelection = false
    
    // 首先处理多分类选择（子分类等），检查是否有子分类选择
    if (selectedCategories.value.length > 0) {
      for (const category of selectedCategories.value) {
        if (typeof category === 'string' && category.includes(':')) {
          // 兼容旧格式 "parentId:childId"，只提取子分类ID
          const [, childStr] = category.split(':')
          const childId = parseInt(childStr)
          if (!isNaN(childId)) {
            categoryIds.add(childId)
            hasSubCategorySelection = true
          }
        } else if (typeof category === 'number') {
          // 直接使用数字ID（可能是子分类）
          categoryIds.add(category)
          hasSubCategorySelection = true
        } else if (typeof category === 'string') {
          // 尝试转换字符串为数字
          const numId = parseInt(category)
          if (!isNaN(numId)) {
            categoryIds.add(numId)
            hasSubCategorySelection = true
          }
        }
      }
    }
    
    // 只有在没有子分类选择时，才添加主分类
    if (!hasSubCategorySelection && selectedProjectCategory.value) {
      categoryIds.add(selectedProjectCategory.value)
    }
    
    // 应用项目分类权限过滤
    if (!userStore.isAdmin && userStore.permissions.data.scope !== 'all') {
      const userCategoryPermissions = userStore.permissions.data.project_category_permissions || []
      
      if (userCategoryPermissions.length > 0) {
        // 将权限数组转换为数字数组
        const permittedCategoryIds = userCategoryPermissions
          .map(id => parseInt(id))
          .filter(id => !isNaN(id))
        
        if (categoryIds.size > 0) {
          // 如果用户选择了分类，过滤掉没有权限的分类
          const filteredCategoryIds = Array.from(categoryIds).filter(id => 
            permittedCategoryIds.includes(id)
          )
          categoryIds.clear()
          filteredCategoryIds.forEach(id => categoryIds.add(id))
          
          console.log('🔒 分类权限过滤:', {
            原始选择: Array.from(categoryIds),
            用户权限: permittedCategoryIds,
            过滤结果: filteredCategoryIds
          })
        } else {
          // 如果用户没有选择分类，默认限制为用户有权限的分类
          permittedCategoryIds.forEach(id => categoryIds.add(id))
          console.log('🔒 应用默认分类权限限制:', permittedCategoryIds)
        }
      }
    }
    
    // 设置统一的 category_id 参数
    if (categoryIds.size > 0) {
      params.category_id = categoryIds.size === 1 
        ? Array.from(categoryIds)[0]  // 单个ID直接传数字
        : Array.from(categoryIds).join(',')  // 多个ID用逗号分隔的字符串
    }
    
    
    
    console.log('🔍 发送搜索请求，参数:', params)
    console.log('🏷️ 分类筛选逻辑:', {
      selectedProjectCategory: selectedProjectCategory.value,
      selectedCategories: selectedCategories.value,
      hasSubCategorySelection,
      finalCategoryIds: Array.from(categoryIds),
      requestParam: params.category_id
    })
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
  } catch (error: any) {
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


// 请求防重机制
let categoriesLoading = false

// 统一的分类数据加载函数（替代原有的重复请求）
const loadAllCategoriesData = async () => {
  // 防重机制：如果正在加载，则等待当前请求完成
  if (categoriesLoading) {
    console.log('🔄 分类数据正在加载中，跳过重复请求')
    return
  }
  
  categoriesLoading = true
  
  try {
    console.log('🚀 开始加载分类数据（统一请求）')
    const response = await getScriptCategoriesTree({ include_stats: true })
    console.log('🏗️ 分类API响应:', response)
    
    if (response.data) {
      // 处理原 loadCategoriesData 的逻辑
      await processCategoriesData(response.data)
      
      // 处理原 loadCategoryOptions 的逻辑 - 使用过滤后的数据
      await buildCategoryOptionsFromData(categories.value)
    }
    
    console.log('✅ 统一分类数据加载完成')
  } catch (error) {
    console.error('❌ 分类数据加载失败:', error)
    // 加载失败时使用默认数据
    buildDefaultCategoryOptions()
  } finally {
    categoriesLoading = false
  }
}

// 处理分类数据的核心逻辑（从原 loadCategoriesData 提取）
const processCategoriesData = async (responseData: ScriptCategory[]) => {
  // 应用项目分类权限过滤
  let filteredData = responseData || []
  
  // 如果用户不是管理员，需要根据项目分类权限进行过滤
  if (!userStore.isAdmin && userStore.permissions.data.scope !== 'all') {
    const userCategoryPermissions = userStore.permissions.data.project_category_permissions || []
    
    if (userCategoryPermissions.length > 0) {
      // 过滤根分类（父分类）
      filteredData = filteredData.filter(category => {
        if (!category.parent_id) {
          // 这是根分类，检查用户是否有权限访问
          return userCategoryPermissions.includes(category.id?.toString() || '')
        }
        return true // 暂时保留子分类，后续会进一步过滤
      })
      
      // 过滤每个根分类的子分类
      filteredData = filteredData.map(category => {
        if (!category.parent_id && category.children) {
          // 对于根分类，过滤其子分类
          const filteredChildren = category.children.filter(child => {
            // 子分类继承父分类权限，或者可以单独配置权限（如果需要更细粒度控制）
            return userCategoryPermissions.includes(category.id?.toString() || '')
          })
          return { ...category, children: filteredChildren }
        }
        return category
      })
      
      console.log('🔒 项目分类权限过滤完成:', {
        原始分类数: responseData.length,
        过滤后分类数: filteredData.length,
        用户权限: userCategoryPermissions
      })
    }
  }
  
  // 保存原始嵌套分类数据（已过滤）
  categories.value = filteredData
  
  // 将嵌套结构转换为扁平结构，确保项目分类联动能正常工作
  const flattenCategories = (categories: ScriptCategory[]): ScriptCategory[] => {
        const result: ScriptCategory[] = []
        
        // 首先按sort_order排序根分类
        const sortedCategories = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        
        sortedCategories.forEach(category => {
          // 添加父分类（清除children属性避免混乱）
          const parentCategory = { ...category }
          delete parentCategory.children
          result.push(parentCategory)
          
          // 如果有children，按sort_order排序后添加子分类
          if (category.children && category.children.length > 0) {
            const sortedChildren = [...category.children].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            result.push(...sortedChildren)
          }
        })
        
        return result
      }
      
  // 保存扁平化的分类树（已按sort_order排序）
  categoryTree.value = flattenCategories(responseData)
  const totalSubCategories = categoryTree.value.filter(c => c.parent_id !== null).length
  console.log(`🔧 扁平化完成: ${categoryTree.value.length} 个分类 (${totalSubCategories} 个子分类)`)
  
  // 提取父分类作为项目分类（parent_id为null的分类），并按sort_order排序
  // 注意：使用filteredData而不是responseData，确保权限过滤生效
  const parentCategories = filteredData
    .filter(cat => !cat.parent_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  
  // 转换为项目分类格式，包含统计信息
  projectCategories.value = parentCategories.map(cat => ({
    value: cat.name,
    label: cat.name, 
    count: cat.script_count || 0,
    description: cat.description,
    id: cat.id, // 保留ID便于后续使用
    sort_order: cat.sort_order || 0 // 保留排序值
  }))
  
  // 计算总话术数
  totalScriptsCount.value = parentCategories.reduce((sum, cat) => sum + (cat.script_count || 0), 0)
  console.log('✅ 分类数据处理完成:', projectCategories.value)
}

// 从已加载的分类数据构建级联选择器选项（避免重复API调用）
const buildCategoryOptionsFromData = async (responseData: ScriptCategory[]) => {
  if (responseData.length === 0) {
    console.log('分类数据为空，使用默认分类')
    buildDefaultCategoryOptions()
    return
  }
  
  // 构建级联选择器选项（按sort_order排序）
  const sortedApiCategories = [...responseData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  
  const cascaderData = sortedApiCategories.map((category: ScriptCategory) => {
    const option: any = {
      label: category.name,
      value: category.id,
      count: category.script_count || 0
    }
    
    // 如果有子分类，按sort_order排序后添加children
    if (category.children && category.children.length > 0) {
      const sortedChildren = [...category.children].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      option.children = sortedChildren.map((child: ScriptCategory) => ({
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
  
  sortedApiCategories.forEach(category => {
    if (category.children && category.children.length > 0) {
      // 有子分类的情况
      const sortedChildren = [...category.children].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      flatOptions.push({
        value: category.name,
        label: category.name,
        count: category.script_count || 0,
        options: sortedChildren.map(child => ({
          value: child.name,
          label: child.name,
          count: child.script_count || 0
        }))
      })
    } else {
      // 无子分类的情况
      flatOptions.push({
        value: category.name,
        label: category.name,
        count: category.script_count || 0
      })
    }
  })
  
  categoryOptions.value = flatOptions
  console.log('✅ 级联选择器选项构建完成:', cascaderOptions.value.length, '个主分类')
}

// ⚠️ 已弃用：保留原有的加载函数作为兼容（现在使用loadAllCategoriesData统一加载）
const loadCategoryOptions = async () => {
  console.warn('⚠️ loadCategoryOptions已弃用，请使用loadAllCategoriesData')
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
    
    // 构建级联选择器选项（按sort_order排序）
    const sortedApiCategories = [...apiCategories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    
    const cascaderData = sortedApiCategories.map((category: ScriptCategory) => {
      const option: any = {
        label: category.name,
        value: category.id,
        count: category.script_count || 0
      }
      
      // 如果有子分类，按sort_order排序后添加children
      if (category.children && category.children.length > 0) {
        const sortedChildren = [...category.children].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        option.children = sortedChildren.map((child: ScriptCategory) => ({
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

// 构建默认分类选项（已移除硬编码，改为从 buildCategoryOptionsFromAPI 动态获取）
const buildDefaultCategoryOptions = () => {
  console.warn('buildDefaultCategoryOptions: 硬编码分类选项已移除，请确保 buildCategoryOptionsFromAPI 正常工作')
  
  // 如果 API 调用失败，提供一个最基本的空分类结构以避免组件崩溃
  const fallbackOptions: any[] = []
  categoryOptions.value = fallbackOptions
  cascaderOptions.value = fallbackOptions
}

// 已合并到loadCategoriesData方法中，避免重复API调用


// 项目分类切换处理（改为使用分类ID）
const handleProjectCategoryChange = (categoryId: number | null) => {
  selectedProjectCategory.value = categoryId
  pagination.current = 1 // 重置到第一页
  loadScripts() // 重新加载话术列表
}



// 处理表单项目分类变化
const handleFormProjectCategoryChange = async (projectCategoryId: number) => {
  console.log('🔄 项目分类选择:', projectCategoryId)
  
  // 如果是编辑模式，保存原有的category_id
  const originalCategoryId = editingScript.value ? formData.category_id : null
  
  formData.project_category_id = projectCategoryId
  
  // 确保分类树数据已加载
  if (categoryTree.value.length === 0) {
    console.log('📥 分类树为空，重新加载...')
    await loadAllCategoriesData()
  }
  
  // 筛选子分类
  const subCategories = categoryTree.value.filter(cat => cat.parent_id === projectCategoryId)
  availableSubCategories.value = subCategories
  
  const parentCategory = categoryTree.value.find(cat => cat.id === projectCategoryId)
  console.log(`✅ 项目分类: ${parentCategory?.name} (ID: ${projectCategoryId})`)
  console.log(`📋 找到 ${subCategories.length} 个子分类:`, subCategories.map(c => c.name))
  
  // 如果是编辑模式且原有的子分类在新的子分类列表中，保持选中状态
  if (editingScript.value && originalCategoryId) {
    const isValidSubCategory = subCategories.some(cat => cat.id === originalCategoryId)
    if (isValidSubCategory) {
      formData.category_id = originalCategoryId
      console.log('✅ 保持原有子分类选中:', originalCategoryId)
    } else {
      formData.category_id = null // 如果原有子分类不在新列表中，清空选择
      console.log('⚠️ 原有子分类不在当前项目分类下，已清空')
    }
  } else if (!editingScript.value) {
    formData.category_id = null // 新增模式下重置子分类选择
  }
  
  // 强制更新表单字段以触发UI更新
  nextTick(() => {
    formRef.value?.validateFields(['category_id'])
  })
}

// 处理子分类变化
const handleSubCategoryChange = (categoryId: number) => {
  formData.category_id = categoryId
  const selectedSubCategory = availableSubCategories.value.find(cat => cat.id === categoryId)
  console.log('选择子分类:', selectedSubCategory?.name, 'ID:', categoryId)
}


// 分类管理相关方法
const showCategoryManager = () => {
  categoryManagerVisible.value = true
}

const handleCategoryManagerCreate = async (category: ScriptCategory) => {
  message.success(`分类 "${category.name}" 创建成功`)
  // 刷新分类数据
  await loadAllCategoriesData()
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerUpdate = async (category: ScriptCategory) => {
  message.success(`分类 "${category.name}" 更新成功`)
  // 刷新分类数据
  await loadAllCategoriesData()
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerDelete = async (categoryId: number) => {
  // 刷新分类数据
  await loadAllCategoriesData()
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerRefresh = async () => {
  // 刷新分类数据
  await loadAllCategoriesData()
  // 强制刷新CategorySelector组件
  categorySelectorKey.value += 1
}

const handleCategoryManagerClose = async () => {
  // 分类管理弹窗关闭时，重新加载话术列表和分类数据
  await Promise.all([
    loadScripts(),
    loadAllCategoriesData()
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
  console.log('🆕 打开新建话术弹窗')
  console.log('📋 清空前的表单数据:', JSON.parse(JSON.stringify(formData)))
  
  editingScript.value = null
  resetForm()
  
  // 强制确保表单完全清空（防止其他逻辑干扰）
  nextTick(() => {
    formData.title = ''
    formData.project_category_id = null
    formData.category_id = null
    formData.question = ''
    formData.answer = ''
    formData.is_pending_revision = false
    formData.keywords = ''
    availableSubCategories.value = []
    
    console.log('🔒 强制清空后的表单数据:', JSON.parse(JSON.stringify(formData)))
  })
  
  console.log('📋 清空后的表单数据:', JSON.parse(JSON.stringify(formData)))
  console.log('📋 可用子分类:', availableSubCategories.value)
  
  modalVisible.value = true
}

// 编辑话术
const handleEdit = async (script: Script) => {
  editingScript.value = script
  console.log('🔄 编辑话术:', script)
  
  // 确保所有必要的数据都已加载
  if (categoryTree.value.length === 0 || projectCategories.value.length === 0) {
    console.log('📥 编辑时分类数据为空，重新加载...')
    await loadAllCategoriesData()
  }
  
  // 先处理项目分类映射
  let mappedProjectCategoryId = script.project_category_id || null
  
  console.log('🔍 分析项目分类映射:', {
    project_category_id: script.project_category_id,
    primary_category: script.primary_category,
    available_projects: projectCategories.value.map(p => ({label: p.label, id: p.id}))
  })
  
  // 如果没有project_category_id，尝试从primary_category映射
  if (!mappedProjectCategoryId && script.primary_category) {
    console.log('🔍 尝试从primary_category映射:', script.primary_category)
    
    // 建立 primary_category 到项目分类的映射关系
    // 动态从分类数据中查找匹配的分类（移除硬编码映射）
    const matchedCategory = projectCategories.value.find(cat => {
      // 直接根据分类名称进行模糊匹配
      const primaryCategory = script.primary_category || ''
      return cat.label.includes(primaryCategory) || 
             cat.value.includes(primaryCategory) ||
             primaryCategory.includes(cat.label)
    })
    
    if (matchedCategory && matchedCategory.id) {
      mappedProjectCategoryId = matchedCategory.id
      console.log('✅ 映射的项目分类:', matchedCategory.label, 'ID:', mappedProjectCategoryId)
    } else {
      console.log('⚠️ 未找到匹配的项目分类:', script.primary_category)
    }
  }
  
  // 处理子分类映射
  let mappedCategoryId = script.category_id || null
  
  console.log('🔍 分析子分类映射:', {
    category_id: script.category_id,
    category_info_name: script.category_info?.name,
    category: script.category,
    available_subcategories: categoryTree.value.filter(cat => cat.parent_id !== null).map(c => ({name: c.name, id: c.id, parent_id: c.parent_id}))
  })
  
  // 如果没有category_id但有category_info或category，尝试映射
  if (!mappedCategoryId) {
    const categoryName = script.category_info?.name || script.category
    if (categoryName) {
      console.log('🔍 尝试从分类名映射:', categoryName)
      
      const matchedSubCategory = categoryTree.value.find(cat => 
        cat.name === categoryName && cat.parent_id !== null
      )
      
      if (matchedSubCategory) {
        mappedCategoryId = matchedSubCategory.id!
        console.log('✅ 映射的子分类:', matchedSubCategory.name, 'ID:', mappedCategoryId)
      } else {
        console.log('⚠️ 未找到匹配的子分类:', categoryName)
      }
    }
  }
  
  // 填充表单数据
  Object.assign(formData, {
    title: script.title || '',
    project_category_id: mappedProjectCategoryId,
    category_id: mappedCategoryId,
    question: script.question || '',
    answer: script.answer || '',
    is_pending_revision: script.is_pending_revision || false, // 待修改状态
    // 自动设置的字段
    keywords: ''
  })
  
  // 设置多回复数据
  if (script.answers && script.answers.length > 0) {
    formAnswers.value = [...script.answers]
    console.log('📝 设置多回复数据:', formAnswers.value)
  } else if (script.answer) {
    formAnswers.value = [script.answer]
    console.log('📝 设置单回复数据为数组:', formAnswers.value)
  } else {
    formAnswers.value = ['']
    console.log('📝 设置默认空回复')
  }
  
  console.log('📝 表单数据填充:', {
    project_category_id: mappedProjectCategoryId,
    category_id: mappedCategoryId,
    original_script: {
      project_category_id: script.project_category_id,
      category_id: script.category_id,
      primary_category: script.primary_category,
      category_info: script.category_info?.name,
      category: script.category
    }
  })
  
  console.log('✅ 编辑表单数据设置完成:', formData)
  
  // 如果有项目分类，加载对应的子分类
  if (mappedProjectCategoryId) {
    console.log('🏷️ 设置项目分类:', mappedProjectCategoryId)
    await handleFormProjectCategoryChange(mappedProjectCategoryId)
    
    // 等待子分类加载完成后再设置
    await nextTick()
    
    // 确保选中的子分类仍然正确
    if (mappedCategoryId) {
      formData.category_id = mappedCategoryId
      console.log('🏷️ 重新设置子分类:', mappedCategoryId)
    }
    
    console.log('✅ 可用子分类:', availableSubCategories.value)
    console.log('✅ 选中的项目分类:', formData.project_category_id)
    console.log('✅ 选中的子分类:', formData.category_id)
  } else {
    // 如果没有项目分类但有子分类ID，尝试反向查找项目分类
    if (mappedCategoryId) {
      const subCategory = categoryTree.value.find(cat => cat.id === mappedCategoryId)
      if (subCategory && subCategory.parent_id) {
        console.log('🔄 通过子分类反向查找项目分类:', subCategory.parent_id)
        const parentCategory = projectCategories.value.find(p => p.id === subCategory.parent_id)
        if (parentCategory) {
          formData.project_category_id = parentCategory.id
          await handleFormProjectCategoryChange(parentCategory.id)
          await nextTick()
          formData.category_id = mappedCategoryId
          console.log('✅ 反向映射成功 - 项目分类:', parentCategory.label, 'ID:', parentCategory.id)
        }
      }
    }
  }
  
  // 使用 nextTick 确保表单字段正确更新
  nextTick(() => {
    console.log('✅ 编辑表单数据设置完成:', formData)
    console.log('✅ 可用子分类:', availableSubCategories.value.map(c => c.name))
    console.log('✅ 选中的项目分类:', formData.project_category_id)
    console.log('✅ 选中的子分类:', formData.category_id)
  })
  
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
        loadAllCategoriesData() // 重新加载分类数据
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除话术失败')
      }
    }
  })
}

// 从详情页面删除话术
const handleDeleteScript = (script: Script) => {
  // 权限验证
  if (!canManageContent.value) {
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
        detailVisible.value = false // 关闭详情弹窗
        loadScripts() // 重新加载列表
        loadAllCategoriesData() // 重新加载分类数据
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除话术失败')
      }
    }
  })
}

// 复制到剪贴板并更新使用次数
const copyToClipboard = async (text: string, script?: Script, answerIndex?: number) => {
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
    
    // 根据answerIndex显示不同的成功消息
    if (answerIndex !== undefined && answerIndex >= 0) {
      message.success(`回复${answerIndex + 1}已复制到剪贴板`)
    } else {
      message.success('话术已复制到剪贴板')
    }
    
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
    
    // 准备提交数据，包含多回复字段
    // 过滤掉空的回复
    const validAnswers = formAnswers.value.filter(answer => answer.trim() !== '')
    
    if (validAnswers.length === 0) {
      message.error('至少需要一个非空回复')
      return
    }
    
    const submitData = {
      // 必填字段
      project_category_id: formData.project_category_id, // 项目分类ID
      category_id: formData.category_id, // 话术分类ID
      question: formData.question,
      answer: validAnswers[0], // 主回复（第一个回复）
      // 多回复字段
      answers: validAnswers,
      answer_count: validAnswers.length,
      // 可选字段
      title: formData.title || '未命名话术'
    }
    
    console.log('提交数据:', submitData)
    
    let createdScript = null
    if (editingScript.value) {
      await updateScript(editingScript.value.id!, submitData)
      
      // 处理待修改状态的变化
      const originalPendingStatus = editingScript.value.is_pending_revision
      const newPendingStatus = formData.is_pending_revision
      
      if (originalPendingStatus !== newPendingStatus) {
        try {
          if (newPendingStatus) {
            await markScriptPending(editingScript.value.id!)
          } else {
            await unmarkScriptPending(editingScript.value.id!)
          }
        } catch (pendingError) {
          console.warn('待修改状态更新失败，但话术内容已保存:', pendingError)
        }
      }
      
      message.success('更新话术成功')
    } else {
      createdScript = await createScript(submitData)
      message.success('创建话术成功')
    }
    
    const wasCreating = !editingScript.value // 保存是否为新建状态
    
    modalVisible.value = false
    resetForm() // 关闭弹窗时重置表单
    editingScript.value = null // 清空编辑状态
    
    if (createdScript && wasCreating) {
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
  } catch (error: any) {
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
  console.log('🔄 开始重置表单...')
  console.log('🔄 重置前formData:', JSON.parse(JSON.stringify(formData)))
  
  // 逐个字段重置，确保Vue响应式生效
  formData.title = ''
  formData.project_category_id = null
  formData.category_id = null
  formData.question = ''
  formData.answer = ''
  formData.is_pending_revision = false
  formData.keywords = ''
  
  availableSubCategories.value = [] // 重置可用子分类
  formAnswers.value = [''] // 重置多回复数组
  formRef.value?.resetFields()
  
  console.log('✅ 重置后formData:', JSON.parse(JSON.stringify(formData)))
  console.log('✅ 重置后可用子分类:', availableSubCategories.value)
  console.log('✅ 重置后多回复数组:', formAnswers.value)
}

// 处理关键词变化


// 显示详情
const showDetail = (script: Script) => {
  currentScript.value = script
  lastClickedScriptId.value = script.id
  selectedAnswerIndex.value = 0 // 默认显示第一个回复
  detailVisible.value = true
}

// 多回复管理函数


// 删除指定回复
const handleDeleteAnswer = async (index: number) => {
  if (!currentScript.value?.id || !currentScriptAnswers.value.length) return
  
  if (currentScriptAnswers.value.length <= 1) {
    message.warning('至少需要保留一个回复')
    return
  }
  
  try {
    await deleteScriptAnswer(currentScript.value.id, index)
    
    // 更新本地数据
    if (currentScript.value.answers) {
      currentScript.value.answers.splice(index, 1)
      currentScript.value.answer_count = currentScript.value.answers.length
      
    }
    
    // 调整当前选中的回复索引
    if (selectedAnswerIndex.value >= currentScriptAnswers.value.length) {
      selectedAnswerIndex.value = currentScriptAnswers.value.length - 1
    }
    
    message.success('删除回复成功')
  } catch (error) {
    console.error('删除回复失败:', error)
    message.error('删除回复失败')
  }
}

// 复制所有回复
const copyAllAnswers = () => {
  if (!currentScript.value || !currentScriptAnswers.value.length) return
  
  const allAnswers = currentScriptAnswers.value
    .map((answer, index) => `回复${index + 1}:\n${answer}`)
    .join('\n\n')
  
  const content = `问题: ${currentScript.value.question}\n\n${allAnswers}`
  
  copyToClipboard(content, currentScript.value)
}

// 多回复表单管理函数
// 添加新回复
const addAnswer = () => {
  if (formAnswers.value.length < 5) {
    formAnswers.value.push('')
  }
}

// 删除回复
const removeAnswer = (index: number) => {
  if (formAnswers.value.length <= 1) {
    message.warning('至少需要保留一个回复')
    return
  }
  
  formAnswers.value.splice(index, 1)
  
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
    
    // 先加载分类数据（统一请求，避免重复）
    await loadAllCategoriesData()
    
    // 再加载话术列表（不再重复加载分类数据）
    await loadScripts()
    
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
  padding: 0 16px; /* 默认页边距 */
}

// 项目分类筛选头部
.project-filter-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafe 0%, #f0f8ff 100%);
  border-radius: 12px;
  border: 1px solid #e6f2ff;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);
  
  .project-categories {
    .category-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
      margin-bottom: 16px;
      
      .anticon {
        font-size: 18px;
      }
    }
    
    .category-tabs {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      
      @media (max-width: 768px) {
        gap: 8px;
      }
      
      .category-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border: 2px solid #e6f2ff;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 80px;
        
        &:hover {
          background: #f0f8ff;
          border-color: #91d5ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
        }
        
        &.active {
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          border-color: #1890ff;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3);
          
          .tab-count {
            background: rgba(255, 255, 255, 0.2);
            color: white;
          }
        }
        
        .tab-label {
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          
          @media (max-width: 768px) {
            font-size: 12px;
          }
        }
        
        .tab-count {
          font-size: 12px;
          font-weight: 600;
          background: #f0f8ff;
          color: #1890ff;
          padding: 2px 8px;
          border-radius: 12px;
          min-width: 24px;
          text-align: center;
          
          @media (max-width: 768px) {
            font-size: 11px;
            padding: 1px 6px;
          }
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
  // 设置基础字体大小，让子组件继承缩放
  font-size: 14px;
  
  @media (min-width: 1600px) {
    font-size: 16px;
  }
  
  @media (min-width: 1200px) and (max-width: 1599px) {
    font-size: 15px;
  }
  
  @media (min-width: 768px) and (max-width: 1199px) {
    font-size: 14px;
  }
  
  @media (min-width: 480px) and (max-width: 767px) {
    font-size: 13px;
  }
  
  @media (max-width: 479px) {
    font-size: 12px;
    margin-bottom: 8px;
  }
}

.search-controls {
  display: flex;
  gap: 1em; // 使用相对单位
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.8em;
  }
}

.search-inputs {
  flex: 1;
  display: flex;
  gap: 0.8em; // 使用相对单位
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    gap: 0.6em;
  }
}

.search-input {
  min-width: 25em; // 使用相对单位，跟随字体大小缩放
  
  // 为了确保Ant Design组件继承字体大小
  :deep(.ant-input) {
    font-size: inherit;
  }
  
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
  align-items: center; // 确保筛选组件与按钮对齐
  gap: 0.8em; // 使用相对单位
}

.filter-select {
  min-width: 10em; // 使用相对单位
  
  // 确保Ant Design选择框组件继承字体大小
  :deep(.ant-select-selector) {
    font-size: inherit;
  }
  
  &.category-filter {
    min-width: 13em;
    max-width: 18em;
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
  align-items: center; // 确保按钮垂直居中对齐
  gap: 8px;
  
  // 确保所有按钮具有一致的尺寸，使用相对单位实现响应式缩放
  button, .ant-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    // 使用 em 单位，让按钮尺寸跟随内容区域缩放
    min-height: 2.5em;
    font-size: inherit; // 继承父容器的字体大小
  }
  
  @media (min-width: 1600px) {
    font-size: 16px;
    gap: 12px;
  }
  
  
  @media (min-width: 1200px) and (max-width: 1599px) {
    font-size: 15px;
    gap: 10px;
  }
  
  @media (min-width: 768px) and (max-width: 1199px) {
    font-size: 14px;
    gap: 8px;
  }
  
  @media (min-width: 480px) and (max-width: 767px) {
    font-size: 13px;
    gap: 6px;
  }
  
  @media (max-width: 479px) {
    font-size: 12px;
    gap: 4px;
    width: 100%;
    justify-content: space-between;
    
    button, .ant-btn {
      min-height: 3em; // 移动端更大的触摸目标
    }
  }
}

.filter-btn,
.add-btn {
  // 移除固定高度，让按钮自适应
  // height: 40px;
  
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
  gap: 8px;
  align-items: start;
  max-width: 100%;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

.script-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.script-item-compact {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
  
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
  
  &.recently-clicked {
    border-color: #52c41a;
    border-width: 2px;
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
    
    &:hover {
      border-color: #52c41a;
      box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
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
      word-break: break-all;
      min-width: 0;
      max-width: 100%;
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
    
    .pending-btn-compact {
      padding: 2px 6px;
      height: 24px;
      font-size: 12px;
      border-radius: 4px;
      cursor: default;
      color: #fa8c16 !important;
      background-color: #fff7e6 !important;
      border-color: #fa8c16 !important;
      
      .pending-icon {
        color: #fa8c16;
        font-size: 12px;
        filter: drop-shadow(0 1px 2px rgba(250, 140, 22, 0.3));
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
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    align-items: start;
    max-width: 100%;
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 6px;
    }
  }
  
  .question-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0; // 防止溢出
  }
  
  .question-item {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 0;
    max-width: 100%;
    width: 100%;
    overflow: hidden;
    position: relative;
    
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
    
    &.recently-clicked {
      border-color: #52c41a;
      border-width: 2px;
      box-shadow: 0 1px 4px rgba(82, 196, 26, 0.2);
      
      &:hover {
        border-color: #52c41a;
        box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
      }
    }
    
    // 角落图标在问题列表模式中的样式
    .pin-corner {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 2;
      
      .pin-icon {
        font-size: 12px;
      }
    }
    
    
    .question-content {
      flex: 1;
      min-width: 0;
      
      .question-text {
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
      }
    }
    
    .question-actions {
      flex-shrink: 0;
      margin-left: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
      
      .question-tag {
        flex-shrink: 0;
      }
      
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
      
      .pending-btn-question {
        padding: 2px 6px;
        height: 24px;
        font-size: 12px;
        border-radius: 4px;
        cursor: default;
        color: #fa8c16 !important;
        background-color: #fff7e6 !important;
        border-color: #fa8c16 !important;
        
        .pending-icon {
          color: #fa8c16;
          font-size: 12px;
          filter: drop-shadow(0 1px 2px rgba(250, 140, 22, 0.3));
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

// 增强版话术详情样式
.script-detail-enhanced {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .question-section-enhanced,
  .answer-section-enhanced {
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      
      .anticon {
        font-size: 16px;
        color: #1890ff;
      }
      
      .section-title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .anticon {
          font-size: 16px;
          color: #1890ff;
        }
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #1890ff;
      }
    }
    
    .section-content-enhanced {
      font-size: 16px;
      line-height: 1.8;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e6f7ff;
      
      &.question-content {
        background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
        color: #1565c0;
        font-style: italic;
        font-weight: 500;
      }
      
      &.answer-content {
        background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
        color: #262626;
        font-weight: 500;
        white-space: pre-wrap;
      }
    }
    
    // 多回复模式样式
    .multi-answer-mode {
      .answer-item {
        margin-bottom: 16px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .answer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .answer-label {
            font-size: 14px;
            font-weight: 600;
            color: #1890ff;
            display: inline-block;
            padding: 4px 12px;
            background: #f0f9ff;
            border-radius: 4px;
            border: 1px solid #d6f7ff;
          }
          
          .copy-answer-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #1890ff;
            
            &:hover {
              color: #40a9ff;
              background: #f0f9ff;
            }
          }
        }
      }
    }
  }
  
  .action-section {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 2px solid #f0f0f0;
    
    .ant-btn {
      height: 36px;
      padding: 0 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      
      &:not(.ant-btn-primary) {
        &:hover {
          background: #f0f9ff;
          border-color: #1890ff;
          color: #1890ff;
        }
      }
      
      &.ant-btn-primary {
        &:not(.ant-btn-dangerous) {
          background: #1890ff;
          border-color: #1890ff;
          
          &:hover {
            background: #40a9ff;
            border-color: #40a9ff;
          }
        }
        
        &.ant-btn-dangerous {
          background: #ff4d4f;
          border-color: #ff4d4f;
          
          &:hover {
            background: #ff7875;
            border-color: #ff7875;
          }
        }
      }
      
      .anticon {
        font-size: 14px;
      }
    }
  }
}

/* 修复话术分类选择框漂浮问题 */
:deep(.ant-select-dropdown) {
  z-index: 9999 !important;
}

:deep(.ant-modal .ant-select-dropdown) {
  z-index: 10000 !important;
  position: fixed !important;
}

/* 确保弹窗内的选择框下拉菜单正确定位 */
.ant-modal-wrap :deep(.ant-select-dropdown) {
  z-index: 10001 !important;
}

/* 防止选择框下拉菜单跟随滚动 */
:deep(.ant-select-dropdown) {
  transform-origin: 0 0;
}

/* 修复级联选择器漂浮问题 */
:deep(.ant-cascader-dropdown) {
  z-index: 9999 !important;
  position: fixed !important;
}

/* 级联选择器鼠标移出自动关闭 */
.category-filter {
  :deep(.ant-cascader-dropdown) {
    z-index: 9999 !important;
    position: fixed !important;
  }
}

/* 确保级联选择器下拉菜单不跟随页面滚动 */
:deep(.ant-cascader-dropdown .ant-cascader-menu-items) {
  max-height: 200px;
  overflow-y: auto;
}

/* 级联选择器悬停样式优化 */
.filter-group .category-filter {
  :deep(.ant-cascader-selector) {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
    
    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
}

/* ===== 增强响应式设计 ===== */

/* 超大屏幕优化 (>2560px) - 针对32寸及以上显示器 */
@media (min-width: 2560px) {
  .script-library {
    max-width: 2200px;
    margin: 0 auto;
    padding: 0 40px;
  }
  
  .search-input {
    min-width: 600px;
  }
  
  .filter-select.category-filter {
    max-width: 400px;
  }
  
  // 在超大屏幕上使用更多列
  .compact-scripts-grid,
  .question-list-grid {
    grid-template-columns: repeat(4, 1fr) !important;
  }
  
  .script-grid-view {
    grid-template-columns: repeat(5, 1fr) !important;
  }
}

/* 大屏幕优化 (1920px-2559px) - 针对27寸显示器 */
@media (min-width: 1920px) and (max-width: 2559px) {
  .script-library {
    max-width: none; // 移除固定最大宽度
    padding: 0 5vw; // 使用视口宽度的5%作为边距
  }
  
  .search-input {
    min-width: 550px;
  }
  
  .filter-select.category-filter {
    max-width: 380px;
  }
  
  // 在大屏幕上使用3列布局
  .compact-scripts-grid,
  .question-list-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
  
  .script-grid-view {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

/* 中等大屏幕优化 (1600px-1919px) - 针对24寸显示器 */
@media (min-width: 1600px) and (max-width: 1919px) {
  .script-library {
    max-width: 90vw; // 使用视口宽度的90%
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  .search-input {
    min-width: 500px;
  }
  
  .filter-select.category-filter {
    max-width: 350px;
  }
  
  .script-grid-view {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

/* 中等屏幕优化 (1200px-1599px) */
@media (min-width: 1200px) and (max-width: 1599px) {
  .script-library {
    padding: 0 20px;
  }
  
  .search-input {
    min-width: 450px;
  }
}

/* 平板横屏 (768px-1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .script-library {
    padding: 0 16px;
  }
  
  .search-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .search-inputs {
    flex-direction: row;
    gap: 12px;
  }
  
  .search-input {
    min-width: 300px;
    flex: 1;
  }
  
  .filter-group {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .project-filter-header {
    padding: 12px 16px;
  }
  
  .category-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 4px;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 2px;
    }
  }
}

/* 平板竖屏和手机横屏 (480px-767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .script-library {
    padding: 0 12px;
  }
  
  .project-filter-header {
    padding: 8px 12px;
    margin-bottom: 12px;
  }
  
  .category-tabs {
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    
    .category-tab {
      min-width: 80px;
      padding: 6px 12px;
      
      .tab-label {
        font-size: 13px;
      }
      
      .tab-count {
        font-size: 11px;
      }
    }
  }
  
  .search-section {
    margin-bottom: 8px;
  }
  
  .main-card {
    :deep(.ant-card-body) {
      padding: 8px;
    }
  }
  
  .script-item-card {
    margin-bottom: 8px;
    
    :deep(.ant-card-body) {
      padding: 12px;
    }
  }
  
  .keywords-section {
    margin-top: 8px;
    gap: 4px;
  }
}

/* 手机竖屏 (<480px) */
@media (max-width: 479px) {
  .script-library {
    gap: 8px;
    padding: 0 8px;
  }
  
  .project-filter-header {
    padding: 6px 8px;
    margin-bottom: 8px;
    
    .filter-title {
      font-size: 14px;
    }
  }
  
  .category-tabs {
    gap: 6px;
    
    .category-tab {
      min-width: 60px;
      padding: 4px 8px;
      
      .tab-label {
        font-size: 12px;
      }
      
      .tab-count {
        font-size: 10px;
      }
    }
  }
  
  .main-card {
    :deep(.ant-card-body) {
      padding: 6px;
    }
  }
  
  .search-input {
    :deep(.ant-input) {
      font-size: 14px;
    }
  }
  
  .script-item-card {
    :deep(.ant-card-body) {
      padding: 8px;
    }
    
    .script-content {
      .question {
        font-size: 13px;
        line-height: 1.4;
      }
      
      .answer {
        font-size: 12px;
        line-height: 1.4;
      }
    }
    
    .script-meta {
      font-size: 11px;
      gap: 8px;
      
      .meta-item {
        padding: 2px 6px;
      }
    }
  }
  
  .action-buttons {
    gap: 4px;
    
    .add-btn,
    .filter-btn {
      // 移除固定高度，让按钮更自然地适应
      // height: 36px;
      font-size: 13px;
    }
  }
}

/* 超小屏幕优化 (<360px) */
@media (max-width: 359px) {
  .category-tab {
    .tab-label {
      font-size: 11px !important;
    }
    
    .tab-count {
      font-size: 9px !important;
    }
  }
  
  .script-content .question {
    font-size: 12px !important;
  }
  
  .script-content .answer {
    font-size: 11px !important;
  }
}

/* 横屏手机特殊适配 */
@media (max-height: 500px) and (orientation: landscape) {
  .project-filter-header {
    padding: 4px 12px;
    margin-bottom: 6px;
  }
  
  .category-tabs {
    .category-tab {
      padding: 3px 8px;
      
      .tab-label {
        font-size: 12px;
      }
    }
  }
  
  .main-card {
    :deep(.ant-card-body) {
      padding: 8px;
    }
  }
}

/* Touch设备优化 */
@media (pointer: coarse) {
  .category-tab,
  .script-item-card,
  .action-buttons button {
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }
  
  /* 增大触摸目标 */
  .category-tab {
    min-height: 36px;
  }
  
  .script-actions {
    .action-btn {
      min-width: 36px;
      min-height: 36px;
    }
  }
}

// 待修改状态表单样式
.form-help-text {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>
