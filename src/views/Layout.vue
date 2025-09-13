<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowDown, User, Setting, SwitchButton, Fold, Expand, House, UserFilled, Lock, Monitor, OfficeBuilding, Folder } from '@element-plus/icons-vue';
import { currentUser } from '../stores/auth';
import { userLogout } from '../service/auth';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();

// 侧边栏折叠状态
const isCollapse = ref(false);

// 获取当前登录用户
const user = computed(() => currentUser.value);

// 当前激活的菜单
const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith('/management/users')) return '/management/users';
  if (path.startsWith('/management/roles')) return '/management/roles';
  if (path.startsWith('/management/permissions')) return '/management/permissions';
  if (path.startsWith('/management/companies')) return '/management/companies';
  if (path.startsWith('/management/projects')) return '/management/projects';
  if (path.startsWith('/test/permissions')) return '/test/permissions';
  return path;
});

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      handleProfile();
      break;
    case 'settings':
      handleSettings();
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

// 处理登出
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要登出系统吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 执行登出
    userLogout();
    ElMessage.success('已成功登出');
    
    // 跳转到登录页面
    router.push('/login');
  } catch {
    // 用户取消登出
  }
};

// 处理个人信息
const handleProfile = () => {
  // TODO: 跳转到个人信息页面
  ElMessage.info('个人信息功能待开发');
};

// 处理设置
const handleSettings = () => {
  // TODO: 跳转到设置页面
  ElMessage.info('设置功能待开发');
};

// 处理菜单点击
const handleMenuSelect = (index: string) => {
  router.push(index);
};
</script>

<template>
    <el-container class="layout-container">
        <!-- 侧边栏 -->
        <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
            <div class="sidebar">
                <!-- Logo 区域 -->
                <div class="sidebar-header">
                    <div class="logo">
                        <img src="/vite.svg" alt="Logo" class="logo-icon" />
                        <span v-show="!isCollapse" class="logo-text">ERP-PMS</span>
                    </div>
                </div>
                
                <!-- 导航菜单 -->
                <el-menu
                    :default-active="activeMenu"
                    :collapse="isCollapse"
                    :unique-opened="true"
                    class="sidebar-menu"
                    @select="handleMenuSelect"
                >
                    <!-- 首页 -->
                    <el-menu-item index="/">
                        <el-icon><House /></el-icon>
                        <template #title>首页</template>
                    </el-menu-item>
                    
                    <!-- 公司管理 -->
                    <el-menu-item index="/management/companies" v-permission="'company:view'">
                        <el-icon><OfficeBuilding /></el-icon>
                        <template #title>公司管理</template>
                    </el-menu-item>
                    
                    <!-- 项目管理 -->
                    <el-menu-item index="/management/projects" v-permission="'project:view'">
                        <el-icon><Folder /></el-icon>
                        <template #title>项目管理</template>
                    </el-menu-item>
                    
                    <!-- 系统管理 -->
                    <el-sub-menu index="management" v-permission="{ permissions: ['user:view', 'role:view', 'permission:view'], mode: 'any' }">
                        <template #title>
                            <el-icon><Setting /></el-icon>
                            <span>系统管理</span>
                        </template>
                        
                        <el-menu-item index="/management/users" v-permission="'user:view'">
                            <el-icon><User /></el-icon>
                            <template #title>用户管理</template>
                        </el-menu-item>
                        
                        <el-menu-item index="/management/roles" v-permission="'role:view'">
                            <el-icon><UserFilled /></el-icon>
                            <template #title>角色管理</template>
                        </el-menu-item>
                        
                        <el-menu-item index="/management/permissions" v-permission="'permission:view'">
                            <el-icon><Lock /></el-icon>
                            <template #title>权限管理</template>
                        </el-menu-item>
                    </el-sub-menu>
                    
                    <!-- 测试页面 -->
                    <el-sub-menu index="test" v-super-admin>
                        <template #title>
                            <el-icon><Monitor /></el-icon>
                            <span>测试页面</span>
                        </template>
                        
                        <el-menu-item index="/test/permissions">
                            <el-icon><Lock /></el-icon>
                            <template #title>权限测试</template>
                        </el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </div>
        </el-aside>
        
        <!-- 主体区域 -->
        <el-container class="layout-main">
            <!-- 顶部导航栏 -->
            <el-header class="layout-header">
                <div class="header-left">
                    <el-button
                        :icon="isCollapse ? Expand : Fold"
                        @click="toggleCollapse"
                        class="collapse-btn"
                        text
                    />
                    <span class="page-title">企业资源规划系统</span>
                </div>
                
                <div class="header-right">
                    <el-dropdown placement="bottom-end" @command="handleCommand">
                        <span class="user-dropdown">
                            <el-icon class="user-icon">
                                <User />
                            </el-icon>
                            <span class="username">{{ user?.username || '未知用户' }}</span>
                            <el-icon class="dropdown-icon">
                                <ArrowDown />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">
                                    <el-icon><User /></el-icon>
                                    个人信息
                                </el-dropdown-item>
                                <el-dropdown-item command="settings">
                                    <el-icon><Setting /></el-icon>
                                    系统设置
                                </el-dropdown-item>
                                <el-dropdown-item divided command="logout">
                                    <el-icon><SwitchButton /></el-icon>
                                    登出系统
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>
            
            <!-- 主内容区域 -->
            <el-main class="layout-content">
                <RouterView />
            </el-main>
        </el-container>
    </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

/* 侧边栏样式 */
.layout-aside {
  background-color: #001529;
  transition: width 0.3s;
}

.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f1f1f;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  border: none;
  background-color: transparent;
}

:deep(.el-menu) {
  background-color: #001529;
  border: none;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item:hover) {
  background-color: #1890ff;
  color: #fff;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: #fff;
}

:deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.65);
  height: 48px;
  line-height: 48px;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #1f1f1f;
  color: #fff;
}

:deep(.el-sub-menu.is-opened .el-sub-menu__title) {
  color: #fff;
}

/* 主体区域样式 */
.layout-main {
  display: flex;
  flex-direction: column;
}

.layout-header {
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  color: #666;
  font-size: 18px;
}

.collapse-btn:hover {
  color: #1890ff;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f5f5;
}

.user-icon {
  margin-right: 8px;
  color: #1890ff;
}

.username {
  margin-right: 8px;
  color: #333;
  font-weight: 500;
}

.dropdown-icon {
  color: #666;
  transition: transform 0.3s;
}

.user-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.layout-content {
  padding: 0;
  background-color: #f5f5f5;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-aside {
    position: fixed;
    z-index: 1000;
    height: 100%;
  }
  
  .page-title {
    display: none;
  }
}
</style>