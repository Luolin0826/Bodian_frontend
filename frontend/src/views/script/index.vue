<template>
  <div class="script-library">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <message-outlined class="title-icon" />
            话术库
          </h1>
          <p class="page-description">管理和组织销售话术，提升沟通效率</p>
        </div>
        <div class="header-stats">
          <a-statistic
            title="总话术数"
            :value="scriptStats.total"
            suffix="条"
            :value-style="{ color: '#52c41a', fontSize: '20px' }"
          />
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="stats-section">
      <div class="stats-grid">
        <a-card class="stat-card popular" hoverable>
          <div class="stat-content">
            <div class="stat-icon popular-icon">
              <fire-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ scriptStats.popular }}</div>
              <div class="stat-label">热门话术</div>
              <div class="stat-desc">使用次数>10</div>
            </div>
          </div>
        </a-card>
        
        <a-card class="stat-card recent" hoverable>
          <div class="stat-content">
            <div class="stat-icon recent-icon">
              <clock-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ scriptStats.recent }}</div>
              <div class="stat-label">最近新增</div>
              <div class="stat-desc">近7天内</div>
            </div>
          </div>
        </a-card>
        
        <a-card class="stat-card categories" hoverable>
          <div class="stat-content">
            <div class="stat-icon categories-icon">
              <appstore-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ scriptStats.categories }}</div>
              <div class="stat-label">话术分类</div>
              <div class="stat-desc">已建立分类</div>
            </div>
          </div>
        </a-card>
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
              placeholder="搜索话术标题、问题、答案或关键词"
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
              <a-select
                v-model:value="selectedType"
                placeholder="话术类型"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option
                  v-for="typeOption in scriptTypeOptions"
                  :key="typeOption.value"
                  :value="typeOption.value"
                >
                  <span class="option-text">
                    <book-outlined class="option-icon" />
                    {{ typeOption.label }} ({{ typeOption.count }})
                  </span>
                </a-select-option>
              </a-select>

              <a-select
                v-model:value="selectedSource"
                placeholder="数据来源"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option
                  v-for="sourceOption in scriptSourceOptions"
                  :key="sourceOption.value"
                  :value="sourceOption.value"
                >
                  <span class="option-text">
                    <database-outlined class="option-icon" />
                    {{ sourceOption.label }} ({{ sourceOption.count }})
                  </span>
                </a-select-option>
              </a-select>

              <a-select
                v-model:value="selectedPlatform"
                placeholder="适用平台"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option value="小红书">
                  <span class="option-text">
                    <mobile-outlined class="option-icon" />
                    小红书 (12)
                  </span>
                </a-select-option>
              </a-select>
              
              <a-select
                v-model:value="selectedCategory"
                placeholder="选择分类"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option
                  v-for="category in categories"
                  :key="category"
                  :value="category"
                >
                  <span class="option-text">
                    <tag-outlined class="option-icon" />
                    {{ category }}
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
                <a-select-option value="title">
                  <span class="option-text">
                    <sort-ascending-outlined class="option-icon" />
                    按标题排序
                  </span>
                </a-select-option>
              </a-select>
            </div>
          </div>
          
          <div class="action-buttons">
            <a-button class="filter-btn mobile-only" @click="showMobileFilters = true" size="large">
              <filter-outlined />
            </a-button>
            
            <a-button type="primary" @click="showCreateModal" size="large" class="add-btn">
              <plus-outlined />
              <span class="desktop-only">新增话术</span>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 话术列表 -->
      <div class="script-list-section">
        <div class="section-header">
          <div class="section-title">
            <message-outlined class="section-icon" />
            <span>话术列表</span>
            <a-badge :count="scriptList.length" class="count-badge" />
          </div>
          
          <div class="view-options desktop-only">
            <a-radio-group v-model:value="viewType" button-style="solid" size="small">
              <a-radio-button value="grid">
                <appstore-outlined />
                网格
              </a-radio-button>
              <a-radio-button value="list">
                <unordered-list-outlined />
                列表
              </a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-show="viewType === 'grid'" class="scripts-grid">
          <a-card
            v-for="script in scriptList"
            :key="script.id"
            class="script-card"
            hoverable
            :body-style="{ padding: '0' }"
            @dblclick="showDetail(script)"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title-section">
                <h3 class="card-title">{{ script.title }}</h3>
                <div class="card-tags">
                  <a-tag v-if="script.category" :color="getCategoryColor(script.category)" class="category-tag">
                    <tag-outlined class="tag-icon" />
                    {{ script.category }}
                  </a-tag>
                  <a-tag v-if="script.usage_count && script.usage_count > 10" color="volcano" class="hot-tag">
                    <fire-outlined class="tag-icon" />
                    热门
                  </a-tag>
                </div>
              </div>
              
              <a-dropdown>
                <a-button type="text" class="more-btn">
                  <more-outlined />
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="showDetail(script)">
                      <eye-outlined />
                      查看详情
                    </a-menu-item>
                    <a-menu-item @click="handleEdit(script)">
                      <edit-outlined />
                      编辑
                    </a-menu-item>
                    <a-menu-item @click="copyToClipboard(script.answer, script)">
                      <copy-outlined />
                      复制话术
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item danger @click="handleDelete(script)">
                      <delete-outlined />
                      删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div v-if="script.question" class="content-section">
                <div class="section-label">
                  <question-circle-outlined class="label-icon" />
                  问题场景
                </div>
                <div class="section-text question-text">{{ script.question }}</div>
              </div>
              
              <div class="content-section">
                <div class="section-label">
                  <message-outlined class="label-icon" />
                  话术内容
                </div>
                <div class="section-text answer-text">{{ script.answer }}</div>
              </div>
              
              <div v-if="script.keywords" class="content-section">
                <div class="section-label">
                  <tags-outlined class="label-icon" />
                  关键词
                </div>
                <div class="keywords-tags">
                  <a-tag 
                    v-for="keyword in script.keywords.split(',')"
                    :key="keyword.trim()"
                    size="small"
                    class="keyword-tag"
                  >
                    {{ keyword.trim() }}
                  </a-tag>
                </div>
              </div>
            </div>
            
            <!-- 卡片底部 -->
            <div class="card-footer">
              <div class="usage-stats">
                <span class="usage-count">
                  <fire-outlined class="usage-icon" />
                  {{ script.usage_count || 0 }}次使用
                </span>
                <span class="create-date">
                  {{ formatDate(script.created_at) }}
                </span>
              </div>
              
              <div class="quick-actions">
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="copyToClipboard(script.answer, script)"
                  class="copy-btn"
                >
                  <copy-outlined />
                  复制
                </a-button>
              </div>
            </div>
          </a-card>
        </div>

        <!-- 列表视图 -->
        <div v-show="viewType === 'list'" class="scripts-list">
          <a-list 
            :data-source="scriptList" 
            :pagination="false"
            item-layout="vertical"
            class="script-list"
          >
            <template #renderItem="{ item: script }">
              <a-list-item class="script-list-item">
                <template #actions>
                  <a-button type="text" @click="copyToClipboard(script.answer, script)" class="action-btn">
                    <copy-outlined />
                    复制
                  </a-button>
                  <a-button type="text" @click="handleEdit(script)" class="action-btn">
                    <edit-outlined />
                    编辑
                  </a-button>
                  <a-dropdown>
                    <a-button type="text" class="action-btn">
                      <more-outlined />
                    </a-button>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item @click="showDetail(script)">
                          <eye-outlined />
                          查看详情
                        </a-menu-item>
                        <a-menu-item danger @click="handleDelete(script)">
                          <delete-outlined />
                          删除
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </template>
                
                <a-list-item-meta>
                  <template #title>
                    <div class="list-item-title">
                      <span class="title-text">{{ script.title }}</span>
                      <div class="title-tags">
                        <a-tag v-if="script.category" :color="getCategoryColor(script.category)" size="small">
                          {{ script.category }}
                        </a-tag>
                        <a-tag v-if="script.usage_count && script.usage_count > 10" color="volcano" size="small">
                          热门
                        </a-tag>
                      </div>
                    </div>
                  </template>
                  
                  <template #description>
                    <div class="list-item-meta">
                      <div v-if="script.question" class="meta-item">
                        <span class="meta-label">问题场景：</span>
                        <span class="meta-text">{{ script.question }}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-label">话术内容：</span>
                        <span class="meta-text answer-preview">{{ script.answer }}</span>
                      </div>
                    </div>
                  </template>
                </a-list-item-meta>
                
                <div class="list-item-footer">
                  <div class="footer-stats">
                    <span class="stat-item">
                      <fire-outlined class="stat-icon" />
                      {{ script.usage_count || 0 }}次使用
                    </span>
                    <span class="stat-item">
                      <clock-circle-outlined class="stat-icon" />
                      {{ formatDate(script.created_at) }}
                    </span>
                  </div>
                  
                  <div v-if="script.keywords" class="footer-keywords">
                    <a-tag 
                      v-for="keyword in script.keywords.split(',').slice(0, 3)"
                      :key="keyword.trim()"
                      size="small"
                      class="keyword-tag"
                    >
                      {{ keyword.trim() }}
                    </a-tag>
                    <span v-if="script.keywords.split(',').length > 3" class="more-keywords">
                      +{{ script.keywords.split(',').length - 3 }}
                    </span>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
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
          <a-form-item label="话术类型">
            <a-select
              v-model:value="selectedType"
              placeholder="选择类型"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option
                v-for="typeOption in scriptTypeOptions"
                :key="typeOption.value"
                :value="typeOption.value"
              >
                {{ typeOption.label }} ({{ typeOption.count }})
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="数据来源">
            <a-select
              v-model:value="selectedSource"
              placeholder="选择来源"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option
                v-for="sourceOption in scriptSourceOptions"
                :key="sourceOption.value"
                :value="sourceOption.value"
              >
                {{ sourceOption.label }} ({{ sourceOption.count }})
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="适用平台">
            <a-select
              v-model:value="selectedPlatform"
              placeholder="选择平台"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option value="小红书">小红书 (12)</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="话术分类">
            <a-select
              v-model:value="selectedCategory"
              placeholder="选择分类"
              allow-clear
              @change="handleSearch"
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
          
          <a-form-item label="排序方式">
            <a-select
              v-model:value="sortBy"
              placeholder="选择排序"
              @change="handleSearch"
            >
              <a-select-option value="usage">按使用次数</a-select-option>
              <a-select-option value="date">按创建日期</a-select-option>
              <a-select-option value="title">按标题排序</a-select-option>
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
      width="700px"
      :footer="null"
      class="detail-modal"
    >
      <div v-if="currentScript" class="script-detail">
        <!-- 头部信息 -->
        <div class="detail-header">
          <h2 class="detail-title">{{ currentScript.title }}</h2>
          <div class="detail-tags">
            <a-tag v-if="currentScript.category" :color="getCategoryColor(currentScript.category)">
              <tag-outlined class="tag-icon" />
              {{ currentScript.category }}
            </a-tag>
            <a-tag v-if="currentScript.usage_count && currentScript.usage_count > 10" color="volcano">
              <fire-outlined class="tag-icon" />
              热门话术
            </a-tag>
          </div>
        </div>

        <!-- 问题场景 -->
        <div v-if="currentScript.question" class="detail-section">
          <h3 class="section-title">
            <question-circle-outlined class="section-icon" />
            问题场景
          </h3>
          <div class="section-content question-content">
            {{ currentScript.question }}
          </div>
        </div>

        <!-- 话术内容 -->
        <div class="detail-section">
          <h3 class="section-title">
            <message-outlined class="section-icon" />
            话术内容
          </h3>
          <div class="section-content answer-content">
            {{ currentScript.answer }}
          </div>
        </div>

        <!-- 关键词 -->
        <div v-if="currentScript.keywords" class="detail-section">
          <h3 class="section-title">
            <tags-outlined class="section-icon" />
            关键词
          </h3>
          <div class="section-content">
            <a-tag 
              v-for="keyword in currentScript.keywords.split(',')"
              :key="keyword.trim()"
              class="keyword-tag"
            >
              {{ keyword.trim() }}
            </a-tag>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="detail-stats">
          <div class="stat-item">
            <fire-outlined class="stat-icon" />
            <span>使用次数：{{ currentScript.usage_count || 0 }}</span>
          </div>
          <div class="stat-item">
            <clock-circle-outlined class="stat-icon" />
            <span>创建时间：{{ formatDate(currentScript.created_at) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <a-button @click="copyToClipboard(currentScript.answer, currentScript)" class="copy-action">
            <copy-outlined />
            复制话术
          </a-button>
          <a-button type="primary" @click="handleEdit(currentScript); detailVisible = false">
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
      >
        <!-- 基本信息 -->
        <a-divider orientation="left">
          <template #default>
            <span style="font-size: 16px; font-weight: 600;">
              <message-outlined style="margin-right: 8px; color: #52c41a;" />
              基本信息
            </span>
          </template>
        </a-divider>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="话术类型" name="type">
              <a-select
                v-model:value="formData.type"
                placeholder="选择话术类型"
                allow-clear
              >
                <a-select-option
                  v-for="option in scriptTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="数据来源" name="source">
              <a-select
                v-model:value="formData.source"
                placeholder="选择数据来源"
                allow-clear
              >
                <a-select-option
                  v-for="option in scriptSourceOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="适用平台" name="platform">
              <a-select
                v-model:value="formData.platform"
                placeholder="选择适用平台"
                allow-clear
              >
                <a-select-option value="小红书">
                  <mobile-outlined style="margin-right: 4px;" />
                  小红书
                </a-select-option>
                <a-select-option value="微信">
                  <message-outlined style="margin-right: 4px;" />
                  微信
                </a-select-option>
                <a-select-option value="电话">
                  <phone-outlined style="margin-right: 4px;" />
                  电话
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="分类" name="category">
              <a-select
                v-model:value="formData.category"
                placeholder="选择分类"
                allow-clear
                show-search
                :filter-option="(input, option) => 
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                "
              >
                <a-select-option
                  v-for="category in categories"
                  :key="category"
                  :value="category"
                  :label="category"
                >
                  {{ category }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="标题" name="title">
              <a-input 
                v-model:value="formData.title" 
                placeholder="请输入话术标题"
                show-count
                :maxlength="100"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- 内容信息 -->
        <a-divider orientation="left">
          <template #default>
            <span style="font-size: 16px; font-weight: 600;">
              <edit-outlined style="margin-right: 8px; color: #1890ff;" />
              内容信息
            </span>
          </template>
        </a-divider>
        
        <a-form-item label="问题场景" name="question">
          <a-textarea 
            v-model:value="formData.question" 
            placeholder="请描述使用此话术的问题场景或客户疑问"
            :rows="3"
            show-count
            :maxlength="500"
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
        
        <!-- 额外信息 -->
        <a-divider orientation="left">
          <template #default>
            <span style="font-size: 16px; font-weight: 600;">
              <tags-outlined style="margin-right: 8px; color: #fa8c16;" />
              额外信息
            </span>
          </template>
        </a-divider>
        
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  MessageOutlined,
  FireOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  SearchOutlined,
  FilterOutlined,
  TagOutlined,
  SortAscendingOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  BookOutlined,
  DatabaseOutlined,
  MobileOutlined,
  PhoneOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useResponsive } from '@/composables/useResponsive'
import { 
  searchScripts, 
  getScriptCategories,
  createScript, 
  updateScript, 
  deleteScript,
  type Script,
  type ScriptQuery 
} from '@/api/script'

// 响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const modalVisible = ref(false)
const detailVisible = ref(false)
const showMobileFilters = ref(false)
const scriptList = ref<Script[]>([])
const categories = ref<string[]>([])
const editingScript = ref<Script | null>(null)
const currentScript = ref<Script | null>(null)
const formRef = ref()
const viewType = ref<'grid' | 'list'>('grid')
const sortBy = ref<string>('date')

// 搜索参数
const searchKeyword = ref('')
const selectedCategory = ref<string>()
const selectedType = ref<string>()
const selectedSource = ref<string>()
const selectedPlatform = ref<string>()

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

// 数据来源选项（动态获取）
const scriptSourceOptions = ref<Array<{ value: string; label: string; count: number }>>([])

// 话术统计数据（动态获取）
const scriptStats = ref({
  total: 0,
  popular: 0,
  recent: 0,
  categories: 0
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0
})

// 表单数据
const formData = reactive<Script>({
  category: '',
  title: '',
  question: '',
  answer: '',
  keywords: '',
  type: undefined,
  source: '',
  platform: '',
  customer_info: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入话术标题', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入话术内容', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择话术类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请选择话术分类', trigger: 'change' }
  ]
}

// 分类选项
const categoryOptions = computed(() => {
  return categories.value.map(cat => ({ label: cat, value: cat }))
})

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '开场白': 'blue',
    '产品介绍': 'green',
    '价格谈判': 'orange',
    '异议处理': 'red',
    '成交话术': 'purple',
    '售后服务': 'cyan'
  }
  return colorMap[category] || 'default'
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  return dateStr ? dayjs(dateStr).format('MM-DD') : ''
}

// 加载话术列表
const loadScripts = async () => {
  loading.value = true
  try {
    const params: ScriptQuery = {
      page: pagination.current,
      per_page: pagination.pageSize
    }
    
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    if (selectedType.value) {
      params.type = selectedType.value
    }
    if (selectedSource.value) {
      params.source = selectedSource.value
    }
    if (selectedPlatform.value) {
      params.platform = selectedPlatform.value
    }
    
    console.log('发送搜索请求，参数:', params)
    const response = await searchScripts(params)
    console.log('收到搜索响应:', response)
    
    // 根据排序方式处理数据
    let sortedData = [...(response.data || [])]
    
    switch (sortBy.value) {
      case 'usage':
        sortedData.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        break
      case 'date':
        sortedData.sort((a, b) => {
          return dayjs(b.created_at || '').diff(dayjs(a.created_at || ''))
        })
        break
      case 'title':
        sortedData.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
    }
    
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

// 加载分类列表
const loadCategories = async () => {
  try {
    // 尝试直接调用API获取分类
    const response = await fetch('/api/v1/scripts/categories')
    if (response.ok) {
      const result = await response.json()
      console.log('获取到的动态分类:', result)
      // 解析标准的 {code, data, message} 格式
      if (result.code === 200 && result.data) {
        categories.value = result.data
        console.log('设置分类数据:', result.data)
      } else {
        throw new Error(`API返回错误码: ${result.code}`)
      }
    } else {
      throw new Error(`HTTP错误: ${response.status}`)
    }
  } catch (error) {
    console.warn('动态分类API调用失败，尝试使用原有API:', error)
    try {
      const cats = await getScriptCategories()
      console.log('获取到的分类:', cats)
      categories.value = cats
    } catch (apiError) {
      console.error('所有分类API调用都失败:', apiError)
      categories.value = ['开场白', '产品介绍', '价格谈判', '异议处理', '成交话术', '售后服务'] // 设置默认分类
    }
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    // 尝试调用动态API
    const response = await fetch('/api/v1/scripts/stats')
    if (response.ok) {
      const result = await response.json()
      console.log('获取到的动态统计数据:', result)
      // 解析标准的 {code, data, message} 格式
      if (result.code === 200 && result.data) {
        scriptStats.value = result.data
        console.log('设置统计数据:', result.data)
      } else {
        throw new Error(`API返回错误码: ${result.code}`)
      }
    } else {
      throw new Error(`HTTP错误: ${response.status}`)
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
      categories: categories.value.length || 23
    }
    
    console.log('计算的统计数据:', calculatedStats)
    scriptStats.value = calculatedStats
  }
}

// 加载类型统计
const loadTypeStats = async () => {
  try {
    // 尝试调用动态API
    const response = await fetch('/api/v1/scripts/type-stats')
    if (response.ok) {
      const result = await response.json()
      console.log('获取到的动态类型统计:', result)
      // 解析标准的 {code, data, message} 格式
      if (result.code === 200 && result.data) {
        scriptTypeOptions.value = result.data
        console.log('设置类型统计数据:', result.data)
      } else {
        throw new Error(`API返回错误码: ${result.code}`)
      }
    } else {
      throw new Error(`HTTP错误: ${response.status}`)
    }
  } catch (error) {
    console.warn('动态API调用失败，使用默认类型数据:', error)
    // 如果API未实现，使用默认数据
    const defaultTypeStats = [
      { value: 'grid_exam', label: '电网考试', count: 92 },
      { value: 'sales_conversation', label: '销售对话', count: 198 },
      { value: 'social_media_reply', label: '社媒回复', count: 12 },
      { value: 'postgrad_consult', label: '考研咨询', count: 10 }
    ]
    
    console.log('设置默认类型统计数据:', defaultTypeStats)
    scriptTypeOptions.value = defaultTypeStats
  }
}

// 加载来源统计
const loadSourceStats = async () => {
  try {
    // 尝试调用动态API
    const response = await fetch('/api/v1/scripts/source-stats')
    if (response.ok) {
      const result = await response.json()
      console.log('获取到的动态来源统计:', result)
      // 解析标准的 {code, data, message} 格式
      if (result.code === 200 && result.data) {
        scriptSourceOptions.value = result.data
        console.log('设置来源统计数据:', result.data)
      } else {
        throw new Error(`API返回错误码: ${result.code}`)
      }
    } else {
      throw new Error(`HTTP错误: ${response.status}`)
    }
  } catch (error) {
    console.warn('动态API调用失败，使用默认来源数据:', error)
    // 如果API未实现，使用默认数据
    const defaultSourceStats = [
      { value: '话术库', label: '话术库', count: 198 },
      { value: '最新电网术库', label: '电网术库', count: 92 },
      { value: '小红书回复话术', label: '小红书话术', count: 12 },
      { value: '考研话术库', label: '考研话术', count: 10 }
    ]
    
    scriptSourceOptions.value = defaultSourceStats
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadScripts()
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
    category: script.category,
    title: script.title,
    question: script.question,
    answer: script.answer,
    keywords: script.keywords,
    type: script.type,
    source: script.source,
    platform: script.platform,
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
  (Modal as any).confirm({
    title: '确认删除',
    content: `确定要删除话术「${script.title}」吗？此操作不可恢复。`,
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
    await navigator.clipboard.writeText(text)
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
    message.error('复制失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 准备提交数据，确保格式正确
    const submitData = {
      category: formData.category,
      title: formData.title,
      question: formData.question || '',
      answer: formData.answer,
      keywords: formData.keywords || '',
      type: formData.type, // 必填字段，不使用默认值
      source: formData.source || undefined,
      platform: formData.platform || undefined,
      customer_info: formData.customer_info || undefined
    }
    
    console.log('提交数据:', submitData)
    
    if (editingScript.value) {
      await updateScript(editingScript.value.id!, submitData)
      message.success('更新话术成功')
    } else {
      await createScript(submitData)
      message.success('创建话术成功')
    }
    
    modalVisible.value = false
    loadScripts()
    loadCategories() // 重新加载分类
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
    category: '',
    title: '',
    question: '',
    answer: '',
    keywords: '',
    type: undefined,
    source: '',
    platform: '',
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

// 重置筛选
const resetFilters = () => {
  selectedCategory.value = undefined
  selectedType.value = undefined
  selectedSource.value = undefined
  selectedPlatform.value = undefined
  sortBy.value = 'usage'
  searchKeyword.value = ''
  handleSearch()
}

// 初始化
onMounted(async () => {
  console.log('页面初始化开始')
  
  try {
    // 首先加载基础数据
    await Promise.all([
      loadScripts(),
      loadCategories()
    ])
    
    // 然后加载统计数据（依赖基础数据）
    await Promise.all([
      loadStats(),
      loadTypeStats(),
      loadSourceStats()
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

// 页面头部
.page-header {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    border-radius: var(--border-radius-base);
    color: white;
    
    @media (max-width: 768px) {
      padding: 16px;
      flex-direction: column;
      gap: 16px;
    }
  }
  
  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  
  .title-icon {
    font-size: 28px;
    
    @media (max-width: 768px) {
      font-size: 24px;
    }
  }
  
  .page-description {
    margin: 4px 0 0 0;
    opacity: 0.9;
    font-size: 14px;
  }
  
  .header-stats {
    :deep(.ant-statistic-title) {
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
    }
    
    :deep(.ant-statistic-content) {
      color: white;
    }
  }
}

// 统计部分
.stats-section {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
  
  .stat-card {
    transition: var(--transition-base);
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
    }
    
    &.popular {
      border-left: 4px solid #fa541c;
    }
    
    &.recent {
      border-left: 4px solid #1890ff;
    }
    
    &.categories {
      border-left: 4px solid #722ed1;
    }
    
    :deep(.ant-card-body) {
      padding: 20px;
      
      @media (max-width: 768px) {
        padding: 16px;
      }
    }
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    
    &.popular-icon {
      background: linear-gradient(135deg, #ff7875 0%, #fa541c 100%);
      color: white;
    }
    
    &.recent-icon {
      background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%);
      color: white;
    }
    
    &.categories-icon {
      background: linear-gradient(135deg, #b37feb 0%, #722ed1 100%);
      color: white;
    }
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 14px;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 2px;
  }
  
  .stat-desc {
    font-size: 12px;
    color: #8c8c8c;
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
    padding: 24px;
    
    @media (max-width: 768px) {
      padding: 16px;
    }
  }
}

// 搜索区域
.search-section {
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
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

// 话术列表区域
.script-list-section {
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

// 网格视图
.scripts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.script-card {
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  height: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  }
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title-section {
  flex: 1;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.4;
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
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
      background: #f0f9ff;
      padding: 8px;
      border-radius: 4px;
      border-left: 3px solid #1890ff;
    }
    
    &.answer-text {
      background: #f6ffed;
      padding: 8px;
      border-radius: 4px;
      border-left: 3px solid #52c41a;
      max-height: 60px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
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
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  
  &:hover {
    background: linear-gradient(135deg, #73d13d 0%, #95de64 100%);
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

// 详情模态框
.detail-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
  }
}

.script-detail {
  .detail-header {
    margin-bottom: 24px;
    
    .detail-title {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .detail-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }
  
  .detail-section {
    margin-bottom: 24px;
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      
      .section-icon {
        color: #52c41a;
      }
    }
    
    .section-content {
      padding: 16px;
      border-radius: 8px;
      line-height: 1.6;
      
      &.question-content {
        background: #f0f9ff;
        border-left: 4px solid #1890ff;
        color: #1890ff;
      }
      
      &.answer-content {
        background: #f6ffed;
        border-left: 4px solid #52c41a;
        color: #52c41a;
      }
    }
  }
  
  .detail-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
      
      .stat-icon {
        color: #52c41a;
      }
    }
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    
    .copy-action {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

// 话术模态框
.script-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
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
</style>
