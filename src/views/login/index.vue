<template>
      <div class="login-container">
        <!-- 动态背景 -->
        <div class="animated-bg">
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
            <div class="shape shape-5"></div>
          </div>
        </div>
        
        <!-- 登录表单 -->
        <div class="login-content">
          <div class="login-box">
            <!-- 头部装饰 -->
            <div class="login-header">
              <div class="logo-container">
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                    <path d="M19 15L19.91 18.26L23 19L19.91 19.74L19 23L18.09 19.74L15 19L18.09 18.26L19 15Z" fill="currentColor"/>
                    <path d="M5 15L5.91 18.26L9 19L5.91 19.74L5 23L4.09 19.74L1 19L4.09 18.26L5 15Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
              <h1 class="login-title">博电教育招生管理系统</h1>
              <p class="login-subtitle">欢迎回来，请登录您的账号</p>
            </div>
    
            <!-- 登录表单 -->
            <div class="login-form-container">
              <a-form
                ref="formRef"
                :model="formState"
                :rules="rules"
                @finish="handleLogin"
                layout="vertical"
              >
                <a-form-item name="username" class="form-item-custom">
                  <div class="input-wrapper">
                    <UserOutlined class="input-icon" />
                    <a-input
                      v-model:value="formState.username"
                      size="large"
                      placeholder="请输入用户名"
                      class="custom-input"
                    />
                  </div>
                </a-form-item>
    
                <a-form-item name="password" class="form-item-custom">
                  <div class="input-wrapper">
                    <LockOutlined class="input-icon" />
                    <a-input-password
                      v-model:value="formState.password"
                      size="large"
                      placeholder="请输入密码"
                      class="custom-input"
                      @pressEnter="handleLogin"
                    />
                  </div>
                </a-form-item>
    
                <a-form-item class="form-item-custom">
                  <div class="form-options">
                    <a-checkbox v-model:checked="rememberMe" class="remember-checkbox">
                      记住我
                    </a-checkbox>
                    <a class="forgot-password" @click="showForgotPassword">忘记密码？</a>
                  </div>
                </a-form-item>
    
                <a-form-item class="form-item-custom">
                  <a-button
                    type="primary"
                    size="large"
                    block
                    html-type="submit"
                    :loading="loading"
                    class="login-button"
                  >
                    <span>登录</span>
                  </a-button>
                </a-form-item>
              </a-form>
            </div>
    
            <!-- 底部信息 -->
            <div class="login-footer">
              © 2025 博电教育招生管理系统
            </div>
          </div>
        </div>

        <!-- 忘记密码对话框 -->
        <a-modal
          v-model:open="forgotPasswordVisible"
          title="忘记密码"
          :footer="null"
          centered
          width="400px"
        >
          <div class="forgot-password-content">
            <div class="forgot-icon">
              <QuestionCircleOutlined />
            </div>
            <h3>忘记密码了？</h3>
            <p>请联系系统管理员重置您的密码</p>
            <div class="contact-info">
              <p><strong>联系方式：</strong></p>
              <p>📞 电话：400-800-1234</p>
              <p>📧 邮箱：admin@bodian-edu.com</p>
              <p>💬 QQ：123456789</p>
            </div>
            <div class="forgot-actions">
              <a-button type="primary" block @click="forgotPasswordVisible = false">
                我知道了
              </a-button>
            </div>
          </div>
        </a-modal>
      </div>
    </template>
    
    <script setup lang="ts">
    import { ref, reactive, h, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { UserOutlined, LockOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
    import { useUserStore } from '@/stores/user'
    import type { Rule } from 'ant-design-vue/es/form'
    
    const router = useRouter()
    const userStore = useUserStore()
    
    const formRef = ref()
    const loading = ref(false)
    const rememberMe = ref(false)
    const forgotPasswordVisible = ref(false)
    
    const formState = reactive({
      username: 'admin',
      password: 'admin123'
    })
    
    // 从localStorage恢复记住的账号信息
    const loadRememberedCredentials = () => {
      const remembered = localStorage.getItem('rememberMe')
      if (remembered === 'true') {
        rememberMe.value = true
        const savedUsername = localStorage.getItem('savedUsername')
        const savedPassword = localStorage.getItem('savedPassword')
        if (savedUsername) formState.username = savedUsername
        if (savedPassword) formState.password = savedPassword
      }
    }
    
    // 保存或清除记住的账号信息
    const saveRememberedCredentials = () => {
      if (rememberMe.value) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('savedUsername', formState.username)
        localStorage.setItem('savedPassword', formState.password)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('savedUsername')
        localStorage.removeItem('savedPassword')
      }
    }
    
    const rules: Record<string, Rule[]> = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      try {
        loading.value = true
        await userStore.login(formState)
        
        // 保存或清除记住的账号信息
        saveRememberedCredentials()
        
        message.success('登录成功')
        router.push('/')
      } catch (error: any) {
        // 从axios错误中获取后端返回的错误信息
        const errorMessage = error.response?.data?.message || error.message || '登录失败'
        message.error(errorMessage)
      } finally {
        loading.value = false
      }
    }

    const showForgotPassword = () => {
      forgotPasswordVisible.value = true
    }
    
    // 组件挂载时恢复记住的账号信息
    onMounted(() => {
      loadRememberedCredentials()
    })
    </script>
    
    <style scoped lang="less">
    .login-container {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    // 动态背景
    .animated-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
        animation: backgroundFloat 20s ease-in-out infinite;
      }
    }

    @keyframes backgroundFloat {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    // 浮动装饰元素
    .floating-shapes {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      animation: float 6s ease-in-out infinite;
    }

    .shape-1 {
      width: 80px;
      height: 80px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 60px;
      height: 60px;
      top: 20%;
      right: 15%;
      animation-delay: 1s;
    }

    .shape-3 {
      width: 40px;
      height: 40px;
      bottom: 30%;
      left: 20%;
      animation-delay: 2s;
    }

    .shape-4 {
      width: 100px;
      height: 100px;
      bottom: 10%;
      right: 10%;
      animation-delay: 3s;
    }

    .shape-5 {
      width: 50px;
      height: 50px;
      top: 50%;
      left: 5%;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
      50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
    }

    // 登录内容区域
    .login-content {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 420px;
      margin: 0 20px;
    }

    .login-box {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.2);
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

    // 头部样式
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-container {
      margin-bottom: 20px;
    }

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      color: white;
      margin: 0 auto 16px;
      box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
      animation: logoFloat 3s ease-in-out infinite;
      
      svg {
        width: 32px;
        height: 32px;
      }
    }

    @keyframes logoFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    .login-title {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .login-subtitle {
      color: #64748b;
      font-size: 16px;
      margin: 0;
      font-weight: 400;
    }

    // 表单样式
    .login-form-container {
      margin-bottom: 32px;
    }

    .form-item-custom {
      margin-bottom: 24px;
      
      :deep(.ant-form-item-explain-error) {
        color: #ef4444;
        font-size: 14px;
      }
    }

    .input-wrapper {
      position: relative;
      
      .input-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        z-index: 10;
        font-size: 16px;
        transition: color 0.3s ease;
      }
    }

    :deep(.custom-input) {
      padding-left: 48px !important;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.8);
      
      &:hover {
        border-color: #cbd5e1;
        background: rgba(255, 255, 255, 0.9);
      }
      
      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        background: rgba(255, 255, 255, 1);
      }
    }

    :deep(.ant-input-affix-wrapper) {
      padding-left: 48px !important;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.8);
      
      &:hover {
        border-color: #cbd5e1;
        background: rgba(255, 255, 255, 0.9);
      }
      
      &:focus-within {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        background: rgba(255, 255, 255, 1);
      }
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0;
    }

    .remember-checkbox {
      color: #64748b;
      
      :deep(.ant-checkbox-checked .ant-checkbox-inner) {
        background-color: #667eea;
        border-color: #667eea;
      }
    }

    .forgot-password {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
      
      &:hover {
        color: #764ba2;
      }
    }

    .login-button {
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 35px -5px rgba(102, 126, 234, 0.5);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      :deep(.ant-btn-loading-icon) {
        color: white;
      }
    }

    // 底部样式
    .login-footer {
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      margin-top: 24px;
    }

    // 响应式设计
    @media (max-width: 640px) {
      .login-box {
        margin: 20px;
        padding: 32px 24px;
        border-radius: 20px;
      }
      
      .login-title {
        font-size: 24px;
      }
      
      .logo-icon {
        width: 56px;
        height: 56px;
        
        svg {
          width: 28px;
          height: 28px;
        }
      }
    }

    // 输入框聚焦时图标颜色变化
    .input-wrapper:focus-within .input-icon {
      color: #667eea;
    }

    // 忘记密码对话框样式
    .forgot-password-content {
      text-align: center;
      padding: 20px 0;

      .forgot-icon {
        font-size: 48px;
        color: #667eea;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: #1a202c;
      }

      p {
        color: #64748b;
        margin: 0 0 24px 0;
        font-size: 16px;
      }

      .contact-info {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        text-align: left;

        p {
          margin: 8px 0;
          color: #475569;
          
          &:first-child {
            margin-top: 0;
            font-weight: 600;
          }
        }
      }

      .forgot-actions {
        margin-top: 24px;
        
        .ant-btn {
          height: 40px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
        }
      }
    }
    </style>