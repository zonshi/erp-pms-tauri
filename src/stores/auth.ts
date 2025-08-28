import { ref, computed } from 'vue';
import type { User } from '../service/auth';

// 当前登录用户信息
const currentUser = ref<User | null>(null);

// 登录状态
const isAuthenticated = computed(() => currentUser.value !== null);

// 存储key
const AUTH_STORAGE_KEY = 'erp_pms_auth_user';

/**
 * 设置当前登录用户
 * @param user 用户信息
 */
export const setCurrentUser = (user: User) => {
  currentUser.value = user;
  // 持久化到localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

/**
 * 清除当前登录用户
 */
export const clearCurrentUser = () => {
  currentUser.value = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * 从localStorage恢复登录状态
 */
export const restoreAuthState = () => {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      currentUser.value = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('恢复登录状态失败:', error);
    // 清除无效的存储数据
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => currentUser.value;

/**
 * 检查是否已登录
 */
export const checkAuthenticated = () => isAuthenticated.value;

/**
 * 用户登出
 */
export const logout = () => {
  clearCurrentUser();
};

// 在模块加载时恢复认证状态
restoreAuthState();

export { isAuthenticated, currentUser };