<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Iphone, QuestionFilled, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 步骤控制：1-验证用户信息，2-回答密保问题，3-重置密码
const currentStep = ref(1)

// 用户信息表单
const userInfoForm = ref({
  username: '',
  phone: ''
})

// 密保问题表单
const securityQuestions = ref([
  { question: '您的母亲姓名是？', answer: '' },
  { question: '您的出生地是？', answer: '' },
  { question: '您最喜欢的颜色是？', answer: '' }
])

// 密码重置表单
const resetPasswordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

// 验证用户信息
const validateUserInfo = () => {
  if (!userInfoForm.value.username || !userInfoForm.value.phone) {
    ElMessage.error('请填写完整的用户名和手机号')
    return
  }
  
  // 这里应该调用后端API验证用户信息
  // 模拟验证成功
  console.log('验证用户信息:', userInfoForm.value)
  ElMessage.success('用户信息验证成功')
  currentStep.value = 2
}

// 验证密保问题
const validateSecurityQuestions = () => {
  const allAnswered = securityQuestions.value.every(q => q.answer.trim() !== '')
  
  if (!allAnswered) {
    ElMessage.error('请回答所有密保问题')
    return
  }
  
  // 这里应该调用后端API验证密保问题答案
  // 模拟验证成功
  console.log('密保问题:', securityQuestions.value)
  ElMessage.success('密保问题验证成功')
  currentStep.value = 3
}

// 重置密码
const resetPassword = () => {
  if (!resetPasswordForm.value.newPassword || !resetPasswordForm.value.confirmPassword) {
    ElMessage.error('请输入新密码并确认')
    return
  }
  
  if (resetPasswordForm.value.newPassword !== resetPasswordForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  if (resetPasswordForm.value.newPassword.length < 6) {
    ElMessage.error('密码长度不能少于6位')
    return
  }
  
  // 这里应该调用后端API重置密码
  // 模拟重置成功
  console.log('重置密码:', resetPasswordForm.value)
  ElMessage.success('密码重置成功')
  
  // 重置表单并返回登录页
  setTimeout(() => {
    router.push('/login')
  }, 1500)
}

// 返回登录页面
const goBackToLogin = () => {
  router.push('/login')
}

// 返回上一步
const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="forgot-password-container">
    <div class="forgot-password-box">
      <div class="forgot-password-header">
        <h2>忘记密码</h2>
        <p>通过密保问题重置您的密码</p>
      </div>
      
      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <el-steps :active="currentStep" finish-status="success" simple>
          <el-step title="验证信息" />
          <el-step title="密保问题" />
          <el-step title="重置密码" />
        </el-steps>
      </div>
      
      <!-- 步骤1: 验证用户信息 -->
      <el-form 
        v-if="currentStep === 1"
        :model="userInfoForm" 
        class="forgot-password-form"
        @submit.prevent="validateUserInfo"
      >
        <el-form-item>
          <el-input
            v-model="userInfoForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="userInfoForm.phone"
            placeholder="请输入手机号码"
            :prefix-icon="Iphone"
            size="large"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="next-button"
            @click="validateUserInfo"
          >
            下一步
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 步骤2: 回答密保问题 -->
      <el-form 
        v-if="currentStep === 2"
        :model="securityQuestions" 
        class="forgot-password-form"
        @submit.prevent="validateSecurityQuestions"
      >
        <div v-for="(question, index) in securityQuestions" :key="index" class="security-question">
          <h4>{{ index + 1 }}. {{ question.question }}</h4>
          <el-form-item>
            <el-input
              v-model="question.answer"
              placeholder="请输入答案"
              :prefix-icon="QuestionFilled"
              size="large"
              clearable
            />
          </el-form-item>
        </div>
        
        <el-form-item>
          <el-button 
            type="info" 
            size="large" 
            class="back-button"
            @click="goBack"
          >
            上一步
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            class="next-button"
            @click="validateSecurityQuestions"
          >
            下一步
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 步骤3: 重置密码 -->
      <el-form 
        v-if="currentStep === 3"
        :model="resetPasswordForm" 
        class="forgot-password-form"
        @submit.prevent="resetPassword"
      >
        <el-form-item>
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="info" 
            size="large" 
            class="back-button"
            @click="goBack"
          >
            上一步
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            class="reset-button"
            @click="resetPassword"
          >
            重置密码
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="forgot-password-footer">
        <el-button 
          type="default" 
          size="small" 
          @click="goBackToLogin"
        >
          返回登录
        </el-button>
        <p>© 2025 南京悠华软件科技有限公司 - 版权所有</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
}

.forgot-password-box {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
  text-align: center;
}

.forgot-password-header {
  margin-bottom: 30px;
}

.forgot-password-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.forgot-password-header p {
  color: #666;
  font-size: 14px;
}

.step-indicator {
  margin-bottom: 30px;
}

.forgot-password-form {
  margin-bottom: 20px;
  text-align: left;
}

.security-question {
  margin-bottom: 20px;
}

.security-question h4 {
  margin-bottom: 10px;
  color: #333;
}

.next-button, .reset-button {
  width: 48%;
  margin: 0 5px;
}

.back-button {
  width: 48%;
  margin: 0 5px;
}

.forgot-password-footer .el-button {
  margin-bottom: 15px;
}

.forgot-password-footer p {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>