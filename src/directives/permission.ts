import type { App, Directive, DirectiveBinding } from 'vue';
import { PermissionChecker } from '../service/auth/permission-checker';

interface PermissionBinding {
  permission?: string;
  role?: string;
  permissions?: string[];
  roles?: string[];
  mode?: 'all' | 'any'; // all: 需要所有权限，any: 需要任意一个权限
}

/**
 * 权限指令
 * 用法：
 * v-permission="'user:read'"
 * v-permission="{ permission: 'user:read' }"
 * v-permission="{ role: '管理员' }"
 * v-permission="{ permissions: ['user:read', 'user:write'], mode: 'any' }"
 * v-permission="{ roles: ['管理员', '超级管理员'], mode: 'any' }"
 */
const permissionDirective: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<string | PermissionBinding>) {
    await checkPermissionAndToggle(el, binding);
  },

  async updated(el: HTMLElement, binding: DirectiveBinding<string | PermissionBinding>) {
    await checkPermissionAndToggle(el, binding);
  }
};

/**
 * 检查权限并切换元素显示状态
 */
async function checkPermissionAndToggle(
  el: HTMLElement, 
  binding: DirectiveBinding<string | PermissionBinding>
) {
  try {
    const hasPermission = await checkElementPermission(binding.value);
    
    if (hasPermission) {
      // 有权限，显示元素
      el.style.display = '';
      el.style.visibility = '';
    } else {
      // 无权限，隐藏元素
      el.style.display = 'none';
    }
  } catch (error) {
    console.error('权限指令检查失败:', error);
    // 出错时隐藏元素（安全策略）
    el.style.display = 'none';
  }
}

/**
 * 检查元素权限
 */
async function checkElementPermission(value: string | PermissionBinding): Promise<boolean> {
  if (typeof value === 'string') {
    // 简单权限字符串
    return await PermissionChecker.checkPermission(value);
  }

  const { permission, role, permissions, roles, mode = 'all' } = value;

  // 检查单个权限
  if (permission) {
    return await PermissionChecker.checkPermission(permission);
  }

  // 检查单个角色
  if (role) {
    return await PermissionChecker.checkRole(role);
  }

  // 检查多个权限
  if (permissions && permissions.length > 0) {
    if (mode === 'any') {
      return await PermissionChecker.checkAnyPermission(permissions);
    } else {
      return await PermissionChecker.checkAllPermissions(permissions);
    }
  }

  // 检查多个角色
  if (roles && roles.length > 0) {
    if (mode === 'any') {
      return await PermissionChecker.checkAnyRole(roles);
    } else {
      return await PermissionChecker.checkAllRoles(roles);
    }
  }

  // 如果没有指定任何权限要求，默认允许
  return true;
}

/**
 * 角色指令
 * 用法：v-role="'管理员'"
 */
const roleDirective: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    await checkRoleAndToggle(el, binding);
  },

  async updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    await checkRoleAndToggle(el, binding);
  }
};

/**
 * 检查角色并切换元素显示状态
 */
async function checkRoleAndToggle(
  el: HTMLElement, 
  binding: DirectiveBinding<string>
) {
  try {
    const hasRole = await PermissionChecker.checkRole(binding.value);
    
    if (hasRole) {
      el.style.display = '';
      el.style.visibility = '';
    } else {
      el.style.display = 'none';
    }
  } catch (error) {
    console.error('角色指令检查失败:', error);
    el.style.display = 'none';
  }
}

/**
 * 超级管理员指令
 * 用法：v-super-admin
 */
const superAdminDirective: Directive = {
  async mounted(el: HTMLElement) {
    await checkSuperAdminAndToggle(el);
  },

  async updated(el: HTMLElement) {
    await checkSuperAdminAndToggle(el);
  }
};

/**
 * 检查超级管理员权限并切换元素显示状态
 */
async function checkSuperAdminAndToggle(el: HTMLElement) {
  try {
    const isSuperAdmin = await PermissionChecker.isSuperAdmin();
    
    if (isSuperAdmin) {
      el.style.display = '';
      el.style.visibility = '';
    } else {
      el.style.display = 'none';
    }
  } catch (error) {
    console.error('超级管理员指令检查失败:', error);
    el.style.display = 'none';
  }
}

/**
 * 安装权限指令
 */
export function setupPermissionDirectives(app: App) {
  app.directive('permission', permissionDirective);
  app.directive('role', roleDirective);
  app.directive('super-admin', superAdminDirective);
}

// 导出指令
export {
  permissionDirective,
  roleDirective,
  superAdminDirective
};