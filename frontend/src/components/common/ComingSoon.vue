<template>
  <div class="coming-soon">
    <div class="background-animation">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>
    
    <div class="content">
      <div class="icon-container">
        <component :is="icon" class="main-icon" />
      </div>
      
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      
      <div class="description">
        <p>{{ description || '我们正在努力开发这个功能' }}</p>
        <p class="sub-desc">敬请期待更好的用户体验</p>
      </div>
      
      <div class="features" v-if="features && features.length > 0">
        <h3>即将推出的功能：</h3>
        <div class="features-grid">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="feature-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="feature-icon">
              <component :is="feature.icon" />
            </div>
            <div class="feature-content">
              <h4>{{ feature.title }}</h4>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">开发进度</span>
          <span class="progress-percentage">{{ progress }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
      
      <div class="action-buttons">
        <a-button type="primary" @click="handleNotifyMe" :loading="notifying">
          <BellOutlined />
          功能上线时通知我
        </a-button>
        <a-button @click="handleBackHome">
          <HomeOutlined />
          返回首页
        </a-button>
      </div>
      
      <div class="timeline">
        <p class="timeline-text">
          预计完成时间：
          <span class="timeline-date">{{ estimatedDate || '敬请期待' }}</span>
        </p>
      </div>
    </div>
    
    <!-- 成功通知 -->
    <a-modal
      v-model:open="notifyModal"
      title="通知设置"
      :footer="null"
      centered
    >
      <div class="notify-content">
        <div class="notify-icon">
          <CheckCircleOutlined style="color: #52c41a; font-size: 48px;" />
        </div>
        <h3>设置成功！</h3>
        <p>功能开发完成后，我们会第一时间通知您</p>
        <p class="notify-detail">
          通知方式：站内消息 + 邮件提醒
        </p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  BellOutlined, 
  HomeOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons-vue'

interface Feature {
  icon: any
  title: string
  description: string
}

interface Props {
  title: string
  subtitle?: string
  description?: string
  icon: any
  features?: Feature[]
  progress?: number
  estimatedDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '功能开发中',
  progress: 25,
  features: () => []
})

const router = useRouter()
const notifying = ref(false)
const notifyModal = ref(false)

const handleNotifyMe = async () => {
  notifying.value = true
  
  // 模拟API调用
  setTimeout(() => {
    notifying.value = false
    notifyModal.value = true
    message.success('通知设置成功')
  }, 1000)
}

const handleBackHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.coming-soon {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  padding: 24px;
}

.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 10%;
  right: 30%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 48px 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-container {
  margin-bottom: 24px;
}

.main-icon {
  font-size: 80px;
  color: #667eea;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 18px;
  color: #7f8c8d;
  margin-bottom: 32px;
  font-weight: 500;
}

.description {
  margin-bottom: 40px;
}

.description p {
  font-size: 16px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 8px;
}

.sub-desc {
  color: #999 !important;
  font-size: 14px !important;
}

.features {
  margin-bottom: 40px;
  text-align: left;
}

.features h3 {
  text-align: center;
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 24px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  color: #667eea;
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.feature-content p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.progress-section {
  margin-bottom: 32px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.progress-percentage {
  font-size: 16px;
  color: #667eea;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 1s ease-out;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.action-buttons .ant-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline {
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.timeline-text {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.timeline-date {
  color: #667eea;
  font-weight: 600;
}

.notify-content {
  text-align: center;
  padding: 20px 0;
}

.notify-icon {
  margin-bottom: 16px;
}

.notify-content h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.notify-content p {
  margin: 0 0 8px 0;
  color: #555;
}

.notify-detail {
  color: #999 !important;
  font-size: 12px !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content {
    padding: 32px 24px;
    margin: 16px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .main-icon {
    font-size: 60px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .ant-btn {
    width: 100%;
  }
}
</style>