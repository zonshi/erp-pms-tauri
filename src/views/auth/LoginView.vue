<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { login } from '../../service/auth';
import { ElMessage } from 'element-plus';


const router = useRouter()

const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false
});

// 处理登录
const handleLogin = () => {

  if(!loginForm.value.username) {
    ElMessage.error("用户名不可为空");
    return;
  }

  if(!loginForm.value.password) {
    ElMessage.error("密码不可为空");
    return;
  }

  login(loginForm.value.username, loginForm.value.password).then((users) => {
    if (users && users.length != 0) {
      router.push('/');
    } else {
      ElMessage.error("用户名或密码无效，请重试！");
    }
  });

}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="/vite.svg" alt="Logo" class="login-logo" />
        <h2>系统登录</h2>
        <p>欢迎使用企业资源规划系统</p>
      </div>
      
      <el-form 
        :model="loginForm" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
            <el-link type="primary" :underline="false" @click="goToForgotPassword">忘记密码？</el-link>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>© 2025 南京悠华软件科技有限公司 - 版权所有</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
  text-align: center;
}

.login-header {
  margin-bottom: 30px;
}

.login-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 15px;
}

.login-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

.login-footer p {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>