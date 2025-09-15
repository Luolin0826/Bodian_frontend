<template>
  <div class="account-disabled-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-icons">
        <div class="icon-item icon-1">
          <StopOutlined />
        </div>
        <div class="icon-item icon-2">
          <ExclamationCircleOutlined />
        </div>
        <div class="icon-item icon-3">
          <LockOutlined />
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="error-card">
        <!-- 图标部分 -->
        <div class="error-icon">
          <div class="icon-wrapper">
            <StopOutlined class="main-icon" />
            <div class="warning-badge">
              <ExclamationOutlined />
            </div>
          </div>
        </div>

        <!-- 标题和描述 -->
        <div class="error-content">
          <h1 class="error-title">🚫 账号已被禁用</h1>
          <p class="error-message">
            很抱歉，您的账号目前已被管理员暂停使用，无法访问系统功能。
          </p>
          <p class="error-description">
            账号禁用可能的原因：安全策略调整、操作规范问题或管理员的统一管理操作。
          </p>
        </div>

        <!-- 联系信息 -->
        <div class="contact-section">
          <h3 class="contact-title">需要帮助？</h3>
          <div class="contact-info">
            <div class="contact-item">
              <PhoneOutlined class="contact-icon" />
              <span>联系电话：400-800-1234</span>
            </div>
            <div class="contact-item">
              <MailOutlined class="contact-icon" />
              <span>邮箱：admin@bodian-edu.com</span>
            </div>
            <div class="contact-item">
              <UserOutlined class="contact-icon" />
              <span>联系管理员解决账号问题</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <a-button type="primary" size="large" @click="handleReturnLogin">
            <LoginOutlined />
            返回登录页
          </a-button>
          <a-button size="large" @click="handleContactAdmin">
            <CustomerServiceOutlined />
            联系客服
          </a-button>
        </div>

        <!-- 帮助提示 -->
        <div class="help-tips">
          <a-alert
            type="info"
            show-icon
            :closable="false"
          >
            <template #message>
              <span>如果您认为这是误操作，请立即联系系统管理员进行申诉。</span>
            </template>
          </a-alert>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  StopOutlined,
  ExclamationCircleOutlined,
  ExclamationOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  LoginOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 返回登录页
const handleReturnLogin = () => {
  // 清除所有本地存储的认证信息
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('sessionId')
  localStorage.removeItem('permissions')
  
  router.push('/login')
  message.info('已清除本地登录信息')
}

// 联系客服
const handleContactAdmin = () => {
  Modal.info({
    title: '联系客服',
    width: 500,
    content: '请通过以下方式联系我们：\n\n📞 客服热线：400-800-1234\n📧 官方邮箱：admin@bodian-edu.com\n👤 工作时间：周一至周五 9:00-18:00\n\n请说明您的用户名和遇到的问题，我们会尽快为您处理。',
    okText: '我知道了'
  })
}
</script>

<style scoped lang="less">
.account-disabled-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

// 背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: backgroundPulse 4s ease-in-out infinite;
  }
}

@keyframes backgroundPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

// 浮动图标
.floating-icons {
  position: absolute;
  width: 100%;
  height: 100%;
}

.icon-item {
  position: absolute;
  color: rgba(255, 255, 255, 0.2);
  font-size: 60px;
  animation: float 8s ease-in-out infinite;

  &.icon-1 {
    top: 15%;
    left: 10%;
    animation-delay: 0s;
  }

  &.icon-2 {
    top: 25%;
    right: 15%;
    animation-delay: 2s;
  }

  &.icon-3 {
    bottom: 20%;
    left: 15%;
    animation-delay: 4s;
  }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg);
    opacity: 0.2;
  }
  50% { 
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.4;
  }
}

// 主要内容
.main-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 500px;
}

.error-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 错误图标
.error-icon {
  margin-bottom: 32px;
  
  .icon-wrapper {
    position: relative;
    display: inline-block;
    
    .main-icon {
      font-size: 80px;
      color: #ff6b6b;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .warning-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #faad14;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      border: 3px solid white;
      animation: bounce 1s ease-in-out infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

// 错误内容
.error-content {
  margin-bottom: 40px;
  
  .error-title {
    font-size: 32px;
    font-weight: 700;
    color: #ff6b6b;
    margin: 0 0 16px 0;
  }
  
  .error-message {
    font-size: 18px;
    color: #333;
    margin: 0 0 12px 0;
    font-weight: 500;
  }
  
  .error-description {
    font-size: 16px;
    color: #666;
    margin: 0;
    line-height: 1.6;
  }
}

// 联系信息
.contact-section {
  margin-bottom: 32px;
  text-align: left;
  
  .contact-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0 0 20px 0;
    text-align: center;
  }
  
  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    
    .contact-icon {
      color: #ff6b6b;
      font-size: 16px;
      min-width: 20px;
    }
    
    span {
      color: #333;
      font-size: 15px;
    }
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  .ant-btn {
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 140px;
    justify-content: center;
    
    &.ant-btn-primary {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      border: none;
      box-shadow: 0 8px 20px -5px rgba(255, 107, 107, 0.4);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px -5px rgba(255, 107, 107, 0.5);
      }
    }
  }
}

// 帮助提示
.help-tips {
  text-align: left;
  
  :deep(.ant-alert) {
    border-radius: 8px;
    border: 1px solid #d9f7be;
  }
  
  :deep(.ant-alert-message) {
    font-size: 14px;
    color: #52c41a;
  }
}

// 响应式设计
@media (max-width: 640px) {
  .error-card {
    padding: 32px 24px;
    margin: 16px;
  }
  
  .error-content .error-title {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
    
    .ant-btn {
      width: 100%;
      max-width: 280px;
    }
  }
  
  .contact-section {
    .contact-item {
      font-size: 14px;
    }
  }
}
</style>