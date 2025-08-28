import { ref, computed, onMounted } from 'vue';
import { PermissionChecker } from '../service/auth/permission-checker';
import type { UserInfo } from '../types/auth';

/**
 * 权限检查组合式函数
 */
export function usePermissions() {
  const currentUser = ref<UserInfo | null>(null);
  const loading = ref(false);

  // 获取当前用户信息
  const loadCurrentUser = async () => {
    loading.value = true;
    try {
      currentUser.value = await PermissionChecker.getCurrentUser();
    } catch (error) {
      console.error('加载用户信息失败:', error);
      currentUser.value = null;
    } finally {
      loading.value = false;
    }
  };

  // 计算属性
  const isLoggedIn = computed(() => currentUser.value !== null);
  const isSuperAdmin = computed(() => {
    if (!currentUser.value?.roles) return false;
    return currentUser.value.roles.some(role => role.name === '超级管理员');
  });
  const isSystemAdmin = computed(() => {
    if (!currentUser.value?.roles) return false;
    return currentUser.value.roles.some(role => 
      role.name === '超级管理员' || role.name === '系统管理员'
    );
  });

  // 权限检查方法
  const hasPermission = async (permission: string): Promise<boolean> => {
    return await PermissionChecker.checkPermission(permission);
  };

  const hasRole = async (role: string): Promise<boolean> => {
    return await PermissionChecker.checkRole(role);
  };

  const hasAnyPermission = async (permissions: string[]): Promise<boolean> => {
    return await PermissionChecker.checkAnyPermission(permissions);
  };

  const hasAllPermissions = async (permissions: string[]): Promise<boolean> => {
    return await PermissionChecker.checkAllPermissions(permissions);
  };

  const hasAnyRole = async (roles: string[]): Promise<boolean> => {
    return await PermissionChecker.checkAnyRole(roles);
  };

  const hasAllRoles = async (roles: string[]): Promise<boolean> => {
    return await PermissionChecker.checkAllRoles(roles);
  };

  // 生命周期
  onMounted(() => {
    loadCurrentUser();
  });

  return {
    // 状态
    currentUser,
    loading,
    
    // 计算属性
    isLoggedIn,
    isSuperAdmin,
    isSystemAdmin,
    
    // 方法
    loadCurrentUser,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles
  };
}

/**
 * 响应式权限检查组合式函数
 */
export function useReactivePermissions() {
  const permissions = ref<Record<string, boolean>>({});
  const roles = ref<Record<string, boolean>>({});
  const loading = ref(false);

  // 检查权限并缓存结果
  const checkPermission = async (permission: string): Promise<boolean> => {
    if (permissions.value[permission] !== undefined) {
      return permissions.value[permission];
    }

    loading.value = true;
    try {
      const result = await PermissionChecker.checkPermission(permission);
      permissions.value[permission] = result;
      return result;
    } catch (error) {
      console.error(`检查权限 ${permission} 失败:`, error);
      permissions.value[permission] = false;
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 检查角色并缓存结果
  const checkRole = async (role: string): Promise<boolean> => {
    if (roles.value[role] !== undefined) {
      return roles.value[role];
    }

    loading.value = true;
    try {
      const result = await PermissionChecker.checkRole(role);
      roles.value[role] = result;
      return result;
    } catch (error) {
      console.error(`检查角色 ${role} 失败:`, error);
      roles.value[role] = false;
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 清除缓存
  const clearCache = () => {
    permissions.value = {};
    roles.value = {};
  };

  // 预加载常用权限
  const preloadPermissions = async (permissionList: string[]) => {
    loading.value = true;
    try {
      await Promise.all(
        permissionList.map(permission => checkPermission(permission))
      );
    } finally {
      loading.value = false;
    }
  };

  // 预加载常用角色
  const preloadRoles = async (roleList: string[]) => {
    loading.value = true;
    try {
      await Promise.all(
        roleList.map(role => checkRole(role))
      );
    } finally {
      loading.value = false;
    }
  };

  return {
    // 状态
    permissions: computed(() => permissions.value),
    roles: computed(() => roles.value),
    loading,
    
    // 方法
    checkPermission,
    checkRole,
    clearCache,
    preloadPermissions,
    preloadRoles
  };
}