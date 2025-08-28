import { getDatabase } from '../../db';
import { setCurrentUser, clearCurrentUser, getCurrentUser, checkAuthenticated, logout } from '../../stores/auth';
import type { UserInfo } from '../../types/auth';

// 导出权限管理服务
export { PermissionService } from './permission';
export { RoleService } from './role';
export { UserService } from './user';

// 导出类型定义
export * from '../../types/auth';

export interface User {
  id: number;
  username: string;
  password: string;
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录结果，成功返回用户信息，失败返回null
 */
export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    const database = await getDatabase();

    const data = await database.select<User[]>('SELECT * FROM users where username = $1 AND password = $2', [username, password]);

    if (!data || data.length === 0) {
      return null;
    }
    
    const user = data[0];
    // 登录成功，保存用户状态（不保存密码）
    const userInfo: User = {
      id: user.id,
      username: user.username,
      password: '' // 安全考虑，不保存密码
    };
    
    setCurrentUser(userInfo);
    return userInfo;
  } catch (error) {
    console.error('登录失败:', error);
    return null;
  }
};

/**
 * 获取当前登录用户的详细信息（包括角色和权限）
 */
export const getCurrentUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return null;
    }
    
    // 导入 UserService 获取完整用户信息
    const { UserService } = await import('./user');
    const result = await UserService.getUserById(currentUser.id);
    
    if (result.success) {
      return result.data!;
    }
    
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 检查当前用户是否有指定权限
 */
export const hasPermission = async (permissionName: string): Promise<boolean> => {
  try {
    const userInfo = await getCurrentUserInfo();
    if (!userInfo || !userInfo.permissions) {
      return false;
    }
    
    return userInfo.permissions.some(permission => permission.name === permissionName);
  } catch (error) {
    console.error('权限检查失败:', error);
    return false;
  }
};

/**
 * 检查当前用户是否有指定角色
 */
export const hasRole = async (roleName: string): Promise<boolean> => {
  try {
    const userInfo = await getCurrentUserInfo();
    if (!userInfo || !userInfo.roles) {
      return false;
    }
    
    return userInfo.roles.some(role => role.name === roleName);
  } catch (error) {
    console.error('角色检查失败:', error);
    return false;
  }
};

/**
 * 用户登出
 */
export const userLogout = () => {
  logout();
};

/**
 * 检查用户是否已登录
 */
export const isUserLoggedIn = () => {
  return checkAuthenticated();
};

// 导出状态管理函数供其他模块使用
export { setCurrentUser, clearCurrentUser, checkAuthenticated };