<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { User, UserFilled, Lock, Setting, Monitor } from '@element-plus/icons-vue';
import { currentUser } from '../stores/auth';

const router = useRouter();
const user = computed(() => currentUser.value);

const quickActions = [
  {
    title: '用户管理',
    description: '管理系统用户账户',
    icon: 'User',
    path: '/management/users',
    color: '#1890ff'
  },
  {
    title: '角色管理',
    description: '配置用户角色权限',
    icon: 'UserFilled',
    path: '/management/roles',
    color: '#52c41a'
  },
  {
    title: '权限管理',
    description: '定义系统访问权限',
    icon: 'Lock',
    path: '/management/permissions',
    color: '#fa8c16'
  }
];

const handleQuickAction = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="dashboard">
    <div class="welcome-section">
      <div class="welcome-header">
        <h1>欢迎使用企业资源规划系统</h1>
        <p>当前登录用户：<strong>{{ user?.username }}</strong></p>
      </div>
      
      <div class="system-info">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-card class="info-card">
              <div class="info-item">
                <div class="info-icon" style="background-color: #e6f7ff; color: #1890ff;">
                  <el-icon size="24"><User /></el-icon>
                </div>
                <div class="info-content">
                  <div class="info-title">在线用户</div>
                  <div class="info-value">1</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="info-card">
              <div class="info-item">
                <div class="info-icon" style="background-color: #f6ffed; color: #52c41a;">
                  <el-icon size="24"><Setting /></el-icon>
                </div>
                <div class="info-content">
                  <div class="info-title">系统模块</div>
                  <div class="info-value">权限管理</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="info-card">
              <div class="info-item">
                <div class="info-icon" style="background-color: #fff7e6; color: #fa8c16;">
                  <el-icon size="24"><Monitor /></el-icon>
                </div>
                <div class="info-content">
                  <div class="info-title">系统状态</div>
                  <div class="info-value">运行正常</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <div class="quick-actions">
      <h2>快速操作</h2>
      <el-row :gutter="24">
        <el-col :span="8" v-for="action in quickActions" :key="action.path">
          <el-card 
            class="action-card" 
            shadow="hover" 
            @click="handleQuickAction(action.path)"
          >
            <div class="action-content">
              <div class="action-icon" :style="{ backgroundColor: action.color + '20', color: action.color }">
                <el-icon size="32">
                  <User v-if="action.icon === 'User'" />
                  <UserFilled v-else-if="action.icon === 'UserFilled'" />
                  <Lock v-else-if="action.icon === 'Lock'" />
                </el-icon>
              </div>
              <div class="action-text">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-description">{{ action.description }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="recent-activity">
      <h2>系统说明</h2>
      <el-card>
        <div class="activity-content">
          <p>🎉 欢迎使用企业资源规划系统！</p>
          <p>✨ 当前已实现功能：</p>
          <ul>
            <li>用户认证和登录系统</li>
            <li>基于角色的权限控制</li>
            <li>用户管理：创建、编辑、删除用户</li>
            <li>角色管理：配置角色和权限分配</li>
            <li>权限管理：定义系统访问权限</li>
          </ul>
          <p>🔧 更多功能正在开发中...</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 32px;
}

.welcome-header h1 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-header p {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.info-card {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-content {
  flex: 1;
}

.info-title {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.info-value {
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.quick-actions {
  margin-bottom: 32px;
}

.quick-actions h2 {
  color: #333;
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 120px;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-text {
  flex: 1;
}

.action-title {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.action-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.recent-activity h2 {
  color: #333;
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.activity-content {
  line-height: 1.6;
}

.activity-content p {
  margin-bottom: 12px;
  color: #333;
}

.activity-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.activity-content li {
  margin-bottom: 8px;
  color: #666;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>