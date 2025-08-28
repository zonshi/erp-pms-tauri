/**
 * 权限管理相关的TypeScript类型定义
 */

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 权限接口
export interface Permission {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

// 角色接口
export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  permissions?: Permission[];
}

// 用户接口（扩展原有的User接口）
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
  permissions?: Permission[];
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  status?: UserStatus;
  role_ids?: number[];
}

// 更新用户请求
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  full_name?: string;
  status?: UserStatus;
  role_ids?: number[];
}

// 创建角色请求
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permission_ids?: number[];
}

// 更新角色请求
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

// 创建权限请求
export interface CreatePermissionRequest {
  name: string;
  description?: string;
}

// 更新权限请求
export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
}

// 分页请求参数
export interface PaginationRequest {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 分页响应
export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 用户角色分配
export interface UserRoleAssignment {
  user_id: number;
  role_id: number;
}

// 角色权限分配
export interface RolePermissionAssignment {
  role_id: number;
  permission_id: number;
}