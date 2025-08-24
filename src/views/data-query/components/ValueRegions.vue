<template>
  <div class="value-regions">
    <!-- 推荐头部 -->
    <div class="regions-header">
      <div class="header-title">
        <trophy-outlined class="title-icon" />
        <span class="title-text">性价比推荐</span>
        <a-tooltip title="基于薪资待遇、录取难度、重点学校录取率等因素综合评估">
          <question-circle-outlined class="help-icon" />
        </a-tooltip>
      </div>
      <div class="header-actions">
        <a-select
          v-model:value="filterLevel"
          style="width: 120px"
          size="small"
          @change="handleFilterChange"
        >
          <a-select-option value="all">全部推荐</a-select-option>
          <a-select-option value="city">仅城市级</a-select-option>
          <a-select-option value="county">仅县区级</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <a-spin size="large" tip="正在分析性价比数据...">
        <div class="loading-placeholder"></div>
      </a-spin>
    </div>

    <!-- 推荐内容 -->
    <div v-else class="regions-content">
      <!-- 顶级推荐区域 -->
      <div v-if="topRecommendations.length > 0" class="top-recommendations">
        <div class="section-title">
          <crown-outlined class="section-icon" />
          <span class="section-text">顶级推荐</span>
        </div>
        <div class="top-cards">
          <div
            v-for="(region, index) in topRecommendations.slice(0, 3)"
            :key="`top-${index}`"
            class="top-card"
            :class="`rank-${index + 1}`"
            @click="handleSelectRegion(region)"
          >
            <div class="rank-badge">
              <span class="rank-number">{{ index + 1 }}</span>
            </div>
            <div class="region-info">
              <div class="region-name">
                {{ region.province }}
                <span v-if="region.city">{{ region.city }}</span>
                <span v-if="region.company">{{ region.company }}</span>
              </div>
              <div class="region-tags">
                <a-tag v-if="region.value_tags?.is_best_value_city" color="gold" size="small">
                  最佳性价比市
                </a-tag>
                <a-tag v-if="region.value_tags?.is_best_value_county" color="orange" size="small">
                  最佳性价比县
                </a-tag>
              </div>
            </div>
            <div class="key-metrics">
              <div class="metric-item">
                <span class="metric-label">本科薪资</span>
                <span class="metric-value">{{ region.salary_info?.bachelor_salary || '-' }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">重点学校录取率</span>
                <span class="metric-value">{{ region.recruitment_data?.key_school_ratio || 0 }}%</span>
              </div>
            </div>
            <div class="select-btn">
              <a-button type="primary" size="small">选择此地区</a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类推荐 -->
      <div class="category-recommendations">
        <a-tabs v-model:activeKey="activeCategory" type="card">
          <!-- 城市推荐 -->
          <a-tab-pane key="cities" tab="城市推荐">
            <div class="recommendations-grid">
              <div
                v-for="(city, index) in filteredCities"
                :key="`city-${index}`"
                class="recommendation-card"
                @click="handleSelectRegion(city)"
              >
                <div class="card-header">
                  <div class="location-info">
                    <environment-outlined class="location-icon" />
                    <span class="location-name">
                      {{ city.province }}{{ city.city ? ` - ${city.city}` : '' }}
                    </span>
                  </div>
                  <div class="score-badge">
                    <span class="score">{{ calculateScore(city) }}</span>
                    <span class="score-label">综合评分</span>
                  </div>
                </div>
                
                <div class="card-content">
                  <div class="highlight-metrics">
                    <div class="metric-row">
                      <wallet-outlined class="metric-icon" />
                      <span class="metric-text">
                        本科: {{ city.salary_info?.bachelor_salary || '-' }}
                      </span>
                    </div>
                    <div class="metric-row">
                      <team-outlined class="metric-icon" />
                      <span class="metric-text">
                        硕士: {{ city.salary_info?.master_salary || '-' }}
                      </span>
                    </div>
                    <div class="metric-row">
                      <rise-outlined class="metric-icon" />
                      <span class="metric-text">
                        重点学校录取: {{ city.recruitment_data?.key_school_recruitment || 0 }}人
                      </span>
                    </div>
                  </div>
                  
                  <div class="advantages-list">
                    <div class="advantages-title">主要优势</div>
                    <div class="advantage-tags">
                      <a-tag v-if="city.salary_info?.bachelor_salary" color="blue" size="small">
                        薪资优势
                      </a-tag>
                      <a-tag v-if="city.recruitment_data?.key_school_ratio && city.recruitment_data.key_school_ratio > 30" color="green" size="small">
                        录取友好
                      </a-tag>
                      <a-tag v-if="city.admission_policies?.second_choice_available === '有二志愿'" color="purple" size="small">
                        二志愿支持
                      </a-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>

          <!-- 县区推荐 -->
          <a-tab-pane key="counties" tab="县区推荐">
            <div class="recommendations-grid">
              <div
                v-for="(county, index) in filteredCounties"
                :key="`county-${index}`"
                class="recommendation-card"
                @click="handleSelectRegion(county)"
              >
                <div class="card-header">
                  <div class="location-info">
                    <environment-outlined class="location-icon" />
                    <span class="location-name">
                      {{ county.province }} - {{ county.city }} - {{ county.company }}
                    </span>
                  </div>
                  <div class="score-badge">
                    <span class="score">{{ calculateScore(county) }}</span>
                    <span class="score-label">综合评分</span>
                  </div>
                </div>
                
                <div class="card-content">
                  <div class="highlight-metrics">
                    <div class="metric-row">
                      <wallet-outlined class="metric-icon" />
                      <span class="metric-text">
                        本科面试线: {{ county.salary_info?.bachelor_interview_line || '-' }}
                      </span>
                    </div>
                    <div class="metric-row">
                      <aim-outlined class="metric-icon" />
                      <span class="metric-text">
                        稳定分数: {{ county.detailed_info?.stable_score_range || '-' }}
                      </span>
                    </div>
                    <div class="metric-row">
                      <pie-chart-outlined class="metric-icon" />
                      <span class="metric-text">
                        录取比例: {{ county.detailed_info?.admission_ratio || '-' }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="special-features">
                    <div class="features-title">特色政策</div>
                    <div class="feature-list">
                      <div
                        v-if="county.basic_requirements?.household_priority"
                        class="feature-item"
                      >
                        <check-circle-outlined class="feature-icon" />
                        <span class="feature-text">{{ county.basic_requirements.household_priority }}</span>
                      </div>
                      <div
                        v-if="county.admission_policies?.first_batch_fail_second_batch"
                        class="feature-item"
                      >
                        <check-circle-outlined class="feature-icon" />
                        <span class="feature-text">{{ county.admission_policies.first_batch_fail_second_batch }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 综合排名列表 -->
      <div v-if="allRankings.length > 0" class="comprehensive-ranking">
        <div class="section-title">
          <bar-chart-outlined class="section-icon" />
          <span class="section-text">综合排名</span>
          <span class="ranking-count">(共{{ allRankings.length }}个地区)</span>
        </div>
        
        <div class="ranking-list">
          <div
            v-for="(region, index) in allRankings.slice(0, showAllRankings ? allRankings.length : 10)"
            :key="`ranking-${index}`"
            class="ranking-item"
            @click="handleSelectRegion(region)"
          >
            <div class="ranking-number">
              <span :class="getRankClass(index)">{{ index + 1 }}</span>
            </div>
            <div class="ranking-info">
              <div class="region-name">
                {{ region.province }}
                <span v-if="region.city"> - {{ region.city }}</span>
                <span v-if="region.company"> - {{ region.company }}</span>
              </div>
              <div class="region-metrics">
                <span class="metric-item">
                  薪资: {{ region.salary_info?.bachelor_salary || '-' }}
                </span>
                <span class="metric-separator">|</span>
                <span class="metric-item">
                  录取: {{ region.recruitment_data?.key_school_ratio || 0 }}%
                </span>
                <span class="metric-separator">|</span>
                <span class="metric-item">
                  评分: {{ calculateScore(region) }}
                </span>
              </div>
            </div>
            <div class="ranking-actions">
              <a-button type="text" size="small" @click.stop="handleSelectRegion(region)">
                选择
              </a-button>
            </div>
          </div>
        </div>
        
        <div v-if="allRankings.length > 10" class="show-more">
          <a-button
            type="link"
            @click="showAllRankings = !showAllRankings"
          >
            {{ showAllRankings ? '收起' : `查看全部 ${allRankings.length} 个地区` }}
          </a-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && allRankings.length === 0" class="empty-state">
      <a-empty description="暂无推荐数据">
        <template #image>
          <inbox-outlined class="empty-icon" />
        </template>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  TrophyOutlined,
  QuestionCircleOutlined,
  CrownOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  TeamOutlined,
  RiseOutlined,
  AimOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'
import type { BestValueResponse, PolicyInfo } from '@/api/recruitment'

// Props
interface Props {
  regions: BestValueResponse | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits(['select'])

// 响应式数据
const filterLevel = ref('all')
const activeCategory = ref('cities')
const showAllRankings = ref(false)

// 计算属性
const topRecommendations = computed(() => {
  if (!props.regions) return []
  return props.regions.comprehensive_ranking?.slice(0, 3) || []
})

const filteredCities = computed(() => {
  if (!props.regions?.best_value_cities) return []
  if (filterLevel.value === 'county') return []
  return props.regions.best_value_cities
})

const filteredCounties = computed(() => {
  if (!props.regions?.best_value_counties) return []
  if (filterLevel.value === 'city') return []
  return props.regions.best_value_counties
})

const allRankings = computed(() => {
  if (!props.regions?.comprehensive_ranking) return []
  
  let rankings = props.regions.comprehensive_ranking
  
  if (filterLevel.value === 'city') {
    rankings = rankings.filter(r => r.value_tags?.is_best_value_city)
  } else if (filterLevel.value === 'county') {
    rankings = rankings.filter(r => r.value_tags?.is_best_value_county)
  }
  
  return rankings
})

// 方法
const calculateScore = (region: any) => {
  // 简单的评分算法，可以根据实际需求调整
  let score = 0
  
  // 薪资评分 (0-40分)
  const salaryStr = region.salary_info?.bachelor_salary || ''
  const salaryMatch = salaryStr.match(/(\d+)/g)
  if (salaryMatch && salaryMatch.length > 0) {
    const minSalary = parseInt(salaryMatch[0])
    score += Math.min(40, minSalary / 200) // 最高40分
  }
  
  // 录取友好度 (0-30分)
  const keySchoolRatio = region.recruitment_data?.key_school_ratio || 0
  score += Math.min(30, keySchoolRatio / 3) // 最高30分
  
  // 政策优惠 (0-20分)
  if (region.admission_policies?.second_choice_available === '有二志愿') score += 10
  if (region.basic_requirements?.household_priority?.includes('优先')) score += 10
  
  // 性价比标识加分 (0-10分)
  if (region.value_tags?.is_best_value_city) score += 5
  if (region.value_tags?.is_best_value_county) score += 5
  
  return Math.round(score)
}

const getRankClass = (index: number) => {
  if (index < 3) return `top-${index + 1}`
  return 'normal-rank'
}

const handleFilterChange = () => {
  showAllRankings.value = false
}

const handleSelectRegion = (region: any) => {
  emit('select', region)
}

// 监听数据变化
watch(() => props.regions, () => {
  showAllRankings.value = false
})
</script>

<style scoped lang="less">
.value-regions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 推荐头部
.regions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff2d4 100%);
  border: 1px solid #ffe7ba;
  border-radius: 8px;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #d48806;
    
    .title-icon {
      color: #faad14;
    }
    
    .help-icon {
      color: #8c8c8c;
      font-size: 14px;
      cursor: help;
    }
  }
}

// 加载状态
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  
  .loading-placeholder {
    width: 100%;
    height: 200px;
  }
}

// 推荐内容
.regions-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// 顶级推荐
.top-recommendations {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    
    .section-icon {
      color: #faad14;
    }
  }
  
  .top-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .top-card {
    position: relative;
    background: white;
    border: 2px solid #f0f0f0;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #faad14;
      box-shadow: 0 8px 24px rgba(250, 173, 20, 0.2);
      transform: translateY(-4px);
    }
    
    &.rank-1 {
      border-color: #faad14;
      background: linear-gradient(135deg, #fff7e6 0%, white 100%);
    }
    
    &.rank-2 {
      border-color: #d9d9d9;
      background: linear-gradient(135deg, #f9f9f9 0%, white 100%);
    }
    
    &.rank-3 {
      border-color: #d48806;
      background: linear-gradient(135deg, #fff1b8 0%, white 100%);
    }
    
    .rank-badge {
      position: absolute;
      top: -10px;
      left: -10px;
      width: 32px;
      height: 32px;
      background: #faad14;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .rank-number {
        color: white;
        font-size: 14px;
        font-weight: 600;
      }
    }
    
    .region-info {
      margin-bottom: 16px;
      
      .region-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
    }
    
    .key-metrics {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      
      .metric-item {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        
        .metric-label {
          color: #666;
        }
        
        .metric-value {
          color: #333;
          font-weight: 500;
        }
      }
    }
    
    .select-btn {
      text-align: center;
    }
  }
}

// 分类推荐
.category-recommendations {
  .recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .recommendation-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #1890ff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
      transform: translateY(-2px);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
      
      .location-info {
        display: flex;
        align-items: center;
        gap: 6px;
        
        .location-icon {
          color: #1890ff;
        }
        
        .location-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
      }
      
      .score-badge {
        text-align: center;
        
        .score {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #1890ff;
          line-height: 1;
        }
        
        .score-label {
          font-size: 11px;
          color: #666;
        }
      }
    }
    
    .card-content {
      padding: 16px;
    }
    
    .highlight-metrics {
      margin-bottom: 16px;
      
      .metric-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;
        
        .metric-icon {
          color: #1890ff;
          font-size: 11px;
        }
      }
    }
    
    .advantages-list,
    .special-features {
      .advantages-title,
      .features-title {
        font-size: 12px;
        font-weight: 600;
        color: #666;
        margin-bottom: 8px;
      }
      
      .advantage-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      
      .feature-list {
        .feature-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          font-size: 12px;
          color: #666;
          
          .feature-icon {
            color: #52c41a;
            font-size: 11px;
          }
        }
      }
    }
  }
}

// 综合排名
.comprehensive-ranking {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    
    .section-icon {
      color: #1890ff;
    }
    
    .ranking-count {
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }
  }
  
  .ranking-list {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    
    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background: #f0f9ff;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .ranking-number {
        width: 40px;
        text-align: center;
        margin-right: 16px;
        
        .top-1 {
          color: #faad14;
          font-weight: 600;
          font-size: 16px;
        }
        
        .top-2 {
          color: #d9d9d9;
          font-weight: 600;
          font-size: 16px;
        }
        
        .top-3 {
          color: #d48806;
          font-weight: 600;
          font-size: 16px;
        }
        
        .normal-rank {
          color: #666;
          font-size: 14px;
        }
      }
      
      .ranking-info {
        flex: 1;
        
        .region-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        
        .region-metrics {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #666;
          
          .metric-separator {
            color: #d9d9d9;
          }
        }
      }
      
      .ranking-actions {
        margin-left: 16px;
      }
    }
  }
  
  .show-more {
    text-align: center;
    margin-top: 16px;
  }
}

// 空状态
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  
  .empty-icon {
    font-size: 64px;
    color: #d9d9d9;
  }
}
</style>