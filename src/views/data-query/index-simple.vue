<template>
  <div class="data-query-page">
    <!-- 页面头部统计 -->
    <div class="stats-header">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-number">1900</div>
          <div class="stat-label">总录取记录</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">15</div>
          <div class="stat-label">覆盖省份</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">29</div>
          <div class="stat-label">政策规则</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">今天</div>
          <div class="stat-label">数据更新</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-content" :bordered="false">
      <!-- 简单查询面板 -->
      <div class="simple-query-panel">
        <div class="query-form">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索省份、城市或区县"
            size="large"
            @search="handleSearch"
            style="width: 400px; margin-right: 16px"
          />
          <a-button type="primary" size="large" :loading="loading" @click="handleSearch">
            <search-outlined />
            查询
          </a-button>
          <a-button size="large" @click="handleReset" style="margin-left: 8px">
            重置
          </a-button>
        </div>
      </div>

      <!-- 结果展示区域 -->
      <div class="results-section">
        <div class="section-header">
          <h3>查询结果</h3>
        </div>
        
        <a-spin :spinning="loading" tip="正在查询...">
          <div v-if="searchResults.length === 0 && !loading" class="empty-state">
            <a-empty description="暂无查询结果">
              <p>请输入查询条件后点击查询</p>
            </a-empty>
          </div>
          
          <div v-else class="results-grid">
            <div
              v-for="(result, index) in searchResults"
              :key="index"
              class="result-card"
            >
              <div class="card-header">
                <h4>{{ result.region }}</h4>
                <a-tag :color="result.type === '市' ? 'blue' : 'green'">{{ result.type }}</a-tag>
              </div>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">本科薪资:</span>
                  <span class="value">{{ result.salary }}</span>
                </div>
                <div class="info-item">
                  <span class="label">面试分数:</span>
                  <span class="value">{{ result.score }}</span>
                </div>
                <div class="info-item">
                  <span class="label">录取难度:</span>
                  <a-tag :color="result.difficulty === '低' ? 'green' : result.difficulty === '中' ? 'orange' : 'red'">
                    {{ result.difficulty }}
                  </a-tag>
                </div>
              </div>
              <div class="card-actions">
                <a-button type="primary" size="small" @click="handleViewDetail(result)">
                  查看详情
                </a-button>
              </div>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- 功能提示 -->
      <div class="feature-tips">
        <a-alert
          message="数查一点通功能说明"
          description="本工具帮助销售人员查询不同二级单位在不同学校的录取情况，判断某个学校的学生是否能报这个省份的电网，方便查询某个区域的电网录取政策和相关的待遇、学历需求等情况。"
          type="info"
          show-icon
          closable
        />
      </div>
    </a-card>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="政策详情"
      :width="600"
      :footer="null"
    >
      <div v-if="selectedResult">
        <h4>{{ selectedResult.region }}</h4>
        <p><strong>类型:</strong> {{ selectedResult.type }}</p>
        <p><strong>薪资待遇:</strong> {{ selectedResult.salary }}</p>
        <p><strong>面试分数线:</strong> {{ selectedResult.score }}</p>
        <p><strong>录取难度:</strong> {{ selectedResult.difficulty }}</p>
        <p><strong>详细说明:</strong> 该地区录取政策相对{{ selectedResult.difficulty === '低' ? '宽松' : selectedResult.difficulty === '中' ? '适中' : '严格' }}，建议根据个人情况合理选择。</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const detailVisible = ref(false)
const selectedResult = ref<any>(null)

// 模拟数据
const searchResults = ref<any[]>([])

// 模拟查询数据
const mockData = [
  { region: '江苏省南京市', type: '市', salary: '6000-8000元', score: '65分', difficulty: '中' },
  { region: '广东省广州市', type: '市', salary: '7000-9000元', score: '70分', difficulty: '高' },
  { region: '四川省成都市', type: '市', salary: '5000-7000元', score: '60分', difficulty: '低' },
  { region: '重庆市渝中区', type: '区', salary: '5500-7500元', score: '62分', difficulty: '低' },
  { region: '北京市朝阳区', type: '区', salary: '8000-12000元', score: '75分', difficulty: '高' },
  { region: '上海市浦东新区', type: '区', salary: '8500-12000元', score: '78分', difficulty: '高' }
]

// 方法
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    // 如果没有搜索关键词，显示所有数据
    searchResults.value = [...mockData]
    return
  }

  loading.value = true
  
  // 模拟API调用延迟
  setTimeout(() => {
    searchResults.value = mockData.filter(item => 
      item.region.includes(searchKeyword.value.trim())
    )
    loading.value = false
    
    if (searchResults.value.length > 0) {
      message.success(`找到 ${searchResults.value.length} 条相关记录`)
    } else {
      message.info('未找到相关记录，请尝试其他关键词')
    }
  }, 1000)
}

const handleReset = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

const handleViewDetail = (result: any) => {
  selectedResult.value = result
  detailVisible.value = true
}
</script>

<style scoped lang="less">
.data-query-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

// 统计头部
.stats-header {
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border: 1px solid #d6f4ff;
    border-radius: 8px;
    padding: 16px;
    text-align: center;

    .stat-number {
      font-size: 24px;
      font-weight: 600;
      color: #1890ff;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
  }
}

// 主内容
.main-content {
  flex: 1;
  
  :deep(.ant-card-body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

// 查询面板
.simple-query-panel {
  .query-form {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #fafafa;
    border-radius: 8px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      
      .ant-input-search {
        width: 100% !important;
        margin-right: 0 !important;
      }
    }
  }
}

// 结果区域
.results-section {
  flex: 1;
  
  .section-header {
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      color: #333;
    }
  }
  
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .result-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #1890ff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      h4 {
        margin: 0;
        color: #333;
        font-size: 16px;
      }
    }
    
    .card-content {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .label {
          color: #666;
          font-size: 14px;
        }
        
        .value {
          color: #333;
          font-weight: 500;
        }
      }
    }
    
    .card-actions {
      text-align: right;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f5f5f5;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  
  p {
    color: #8c8c8c;
    margin-top: 16px;
  }
}

// 功能提示
.feature-tips {
  margin-top: 20px;
}
</style>