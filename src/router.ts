import { createMemoryHistory, createRouter } from 'vue-router';
import { checkAuthenticated } from './stores/auth';
import { PermissionChecker } from './service/auth/permission-checker';
import { ElMessage } from 'element-plus';

import Layout from './views/Layout.vue';
import LoginView from './views/auth/LoginView.vue';
import ForgotPasswordView from './views/auth/ForgotPasswordView.vue';

// 权限管理页面
import UserManagement from './views/management/user/UserManagement.vue';
import RoleManagement from './views/management/role/RoleManagement.vue';
import PermissionManagement from './views/management/permission/PermissionManagement.vue';
import Dashboard from './views/Dashboard.vue';
import PermissionTest from './views/test/PermissionTest.vue';

// 不需要登录验证的路由
const publicRoutes = ['/login', '/forgot-password'];

const routes = [
  { 
    path: '/',
    component: Layout,
    meta: { requiresAuth: true }, // 需要登录验证
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '首页' }
      },
      {
        path: 'management',
        name: 'Management',
        meta: { title: '系统管理' },
        children: [
          {
            path: 'users',
            name: 'UserManagement',
            component: UserManagement,
            meta: { 
              title: '用户管理',
              requiresPermission: 'user:manage'
            }
          },
          {
            path: 'roles',
            name: 'RoleManagement', 
            component: RoleManagement,
            meta: { 
              title: '角色管理',
              requiresPermission: 'role:manage'
            }
          },
          {
            path: 'permissions',
            name: 'PermissionManagement',
            component: PermissionManagement,
            meta: { 
              title: '权限管理',
              requiresPermission: 'permission:manage'
            }
          }
        ]
      },
      {
        path: 'test',
        name: 'Test',
        meta: { title: '测试页面' },
        children: [
          {
            path: 'permissions',
            name: 'PermissionTest',
            component: PermissionTest,
            meta: { 
              title: '权限测试',
              requiresPermission: 'dashboard:view'
            }
          }
        ]
      }
    ]
  },
  { 
    path: '/login', 
    component: LoginView,
    meta: { requiresAuth: false }
  },
  { 
    path: '/forgot-password', 
    component: ForgotPasswordView,
    meta: { requiresAuth: false }
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

// 路由守卫：检查登录状态和权限
router.beforeEach(async (to, from, next) => {
  // 检查目标路由是否需要登录验证
  const requiresAuth = to.meta?.requiresAuth !== false; // 默认需要登录验证
  
  // 如果是公开路由，直接放行
  if (publicRoutes.includes(to.path)) {
    next();
    return;
  }
  
  // 如果需要登录验证但用户未登录
  if (requiresAuth && !checkAuthenticated()) {
    // 保存用户原本想访问的路由
    const redirectPath = to.fullPath !== '/' ? to.fullPath : undefined;
    
    // 重定向到登录页面，并携带回调路径
    next({
      path: '/login',
      query: redirectPath ? { redirect: redirectPath } : undefined
    });
    return;
  }
  
  // 如果用户已登录但访问登录页面，重定向到首页
  if (to.path === '/login' && checkAuthenticated()) {
    next('/');
    return;
  }
  
  // 检查用户状态是否正常
  if (requiresAuth && checkAuthenticated()) {
    try {
      const userStatusOk = await PermissionChecker.checkUserStatus();
      if (!userStatusOk) {
        ElMessage.error('您的账户状态异常，请联系管理员');
        next('/login');
        return;
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
    }
  }
  
  // 检查路由权限（细粒度权限控制）
  if (requiresAuth && checkAuthenticated()) {
    try {
      const hasRoutePermission = await PermissionChecker.checkRoutePermission(to);
      
      if (!hasRoutePermission) {
        // 获取权限错误消息
        const errorMessage = PermissionChecker.getPermissionErrorMessage(
          to.meta?.requiresPermission as string,
          to.meta?.requiresRole as string
        );
        
        ElMessage.error(errorMessage);
        
        // 如果是从其他页面跳转过来的，返回上一页
        if (from.path !== '/') {
          next(false); // 阻止导航
        } else {
          // 否则跳转到首页
          next('/');
        }
        return;
      }
    } catch (error) {
      console.error('权限检查失败:', error);
      ElMessage.error('权限检查失败，请重试');
      next(false);
      return;
    }
  }
  
  // 其他情况正常放行
  next();
});

export default router;