import { getCurrentUserInfo, hasPermission, hasRole } from '../auth';
import type { UserInfo } from '../../types/auth';

/**
 * 权限检查服务
 * 提供各种权限验证功能
 */
export class PermissionChecker {
  /**
   * 检查用户是否有指定权限
   */
  static async checkPermission(permissionName: string): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户拥有所有权限
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      return await hasPermission(permissionName);
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有指定角色
   */
  static async checkRole(roleName: string): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户拥有所有角色
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      return await hasRole(roleName);
    } catch (error) {
      console.error('角色检查失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有任意一个指定权限
   */
  static async checkAnyPermission(permissionNames: string[]): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户拥有所有权限
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      for (const permission of permissionNames) {
        if (await hasPermission(permission)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否拥有所有指定权限
   */
  static async checkAllPermissions(permissionNames: string[]): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户拥有所有权限
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      for (const permission of permissionNames) {
        if (!(await hasPermission(permission))) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有任意一个指定角色
   */
  static async checkAnyRole(roleNames: string[]): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户拥有所有角色
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      for (const role of roleNames) {
        if (await hasRole(role)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('角色检查失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否拥有所有指定角色
   */
  static async checkAllRoles(roleNames: string[]): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户拥有所有角色
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      for (const role of roleNames) {
        if (!(await hasRole(role))) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('角色检查失败:', error);
      return false;
    }
  }

  /**
   * 检查路由权限
   */
  static async checkRoutePermission(to: any): Promise<boolean> {
    const meta = to.meta || {};
    
    // 如果路由没有权限要求，则允许访问
    if (!meta.requiresPermission && !meta.requiresRole) {
      return true;
    }

    try {
      // 检查权限要求
      if (meta.requiresPermission) {
        const hasRequiredPermission = await this.checkPermission(meta.requiresPermission);
        if (!hasRequiredPermission) {
          console.warn(`用户缺少权限: ${meta.requiresPermission}`);
          return false;
        }
      }

      // 检查角色要求
      if (meta.requiresRole) {
        const hasRequiredRole = await this.checkRole(meta.requiresRole);
        if (!hasRequiredRole) {
          console.warn(`用户缺少角色: ${meta.requiresRole}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('路由权限检查失败:', error);
      return false;
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<UserInfo | null> {
    try {
      return await getCurrentUserInfo();
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否是超级管理员
   */
  static async isSuperAdmin(): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户默认为超级管理员
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      return await this.checkRole('超级管理员');
    } catch (error) {
      console.error('检查超级管理员权限失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否是系统管理员
   */
  static async isSystemAdmin(): Promise<boolean> {
    try {
      // 检查是否是admin用户，admin用户默认为系统管理员
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.username === 'admin') {
        return true;
      }
      
      return await this.checkAnyRole(['超级管理员', '系统管理员']);
    } catch (error) {
      console.error('检查系统管理员权限失败:', error);
      return false;
    }
  }

  /**
   * 检查用户状态是否正常
   */
  static async checkUserStatus(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return false;
      }
      
      return user.status === 'active';
    } catch (error) {
      console.error('检查用户状态失败:', error);
      return false;
    }
  }

  /**
   * 格式化权限错误消息
   */
  static getPermissionErrorMessage(permissionName?: string, roleName?: string): string {
    if (permissionName) {
      return `您没有 "${permissionName}" 权限，无法访问此功能`;
    }
    if (roleName) {
      return `您没有 "${roleName}" 角色，无法访问此功能`;
    }
    return '您没有足够的权限访问此功能';
  }
}

/**
 * 导出便捷方法
 */
export const checkPermission = (permission: string) => PermissionChecker.checkPermission(permission);
export const checkRole = (role: string) => PermissionChecker.checkRole(role);
export const checkAnyPermission = (permissions: string[]) => PermissionChecker.checkAnyPermission(permissions);
export const checkAllPermissions = (permissions: string[]) => PermissionChecker.checkAllPermissions(permissions);
export const checkAnyRole = (roles: string[]) => PermissionChecker.checkAnyRole(roles);
export const checkAllRoles = (roles: string[]) => PermissionChecker.checkAllRoles(roles);
export const checkRoutePermission = (to: any) => PermissionChecker.checkRoutePermission(to);
export const isSuperAdmin = () => PermissionChecker.isSuperAdmin();
export const isSystemAdmin = () => PermissionChecker.isSystemAdmin();
export const checkUserStatus = () => PermissionChecker.checkUserStatus();