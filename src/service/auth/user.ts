import { getDatabase } from '../../db';
import type {
  UserInfo,
  Role,
  Permission,
  CreateUserRequest,
  UpdateUserRequest,
  PaginationRequest,
  PaginationResponse,
  ApiResponse
} from '../../types/auth';
import { UserStatus } from '../../types/auth';

/**
 * 用户管理服务
 */
export class UserService {
  /**
   * 获取用户列表（分页）
   */
  static async getUsers(params: PaginationRequest = {}): Promise<ApiResponse<PaginationResponse<UserInfo>>> {
    try {
      const database = await getDatabase();
      const { page = 1, page_size = 10, search = '', sort_by = 'created_at', sort_order = 'desc' } = params;
      
      // 构建基础查询
      let whereClause = '';
      let queryParams: any[] = [];
      
      if (search) {
        whereClause = 'WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?';
        queryParams = [`%${search}%`, `%${search}%`, `%${search}%`];
      }
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await database.select<[{ total: number }]>(countQuery, queryParams);
      const total = countResult[0]?.total || 0;
      
      // 获取分页数据
      const offset = (page - 1) * page_size;
      const dataQuery = `
        SELECT id, username, email, full_name, status, created_at, updated_at 
        FROM users 
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      const dataParams = [...queryParams, page_size, offset];
      const users = await database.select<UserInfo[]>(dataQuery, dataParams);
      
      // 为每个用户获取角色和权限信息
      const usersWithRoles: UserInfo[] = [];
      for (const user of users || []) {
        const roles = await this.getUserRoles(user.id);
        const permissions = await this.getUserPermissions(user.id);
        usersWithRoles.push({
          ...user,
          roles: roles.success ? roles.data : [],
          permissions: permissions.success ? permissions.data : []
        });
      }
      
      const totalPages = Math.ceil(total / page_size);
      
      return {
        success: true,
        data: {
          data: usersWithRoles,
          total,
          page,
          page_size,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return {
        success: false,
        error: '获取用户列表失败'
      };
    }
  }
  
  /**
   * 根据ID获取用户
   */
  static async getUserById(id: number): Promise<ApiResponse<UserInfo>> {
    try {
      const database = await getDatabase();
      const users = await database.select<UserInfo[]>(
        'SELECT id, username, email, full_name, status, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      
      if (!users || users.length === 0) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
      
      const user = users[0];
      
      // 获取用户角色和权限
      const roles = await this.getUserRoles(id);
      const permissions = await this.getUserPermissions(id);
      
      return {
        success: true,
        data: {
          ...user,
          roles: roles.success ? roles.data : [],
          permissions: permissions.success ? permissions.data : []
        }
      };
    } catch (error) {
      console.error('获取用户失败:', error);
      return {
        success: false,
        error: '获取用户失败'
      };
    }
  }
  
  /**
   * 获取用户的角色列表
   */
  static async getUserRoles(userId: number): Promise<ApiResponse<Role[]>> {
    try {
      const database = await getDatabase();
      const roles = await database.select<Role[]>(
        `SELECT r.id, r.name, r.description, r.created_at 
         FROM roles r 
         INNER JOIN user_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?
         ORDER BY r.name`,
        [userId]
      );
      
      return {
        success: true,
        data: roles || []
      };
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return {
        success: false,
        error: '获取用户角色失败'
      };
    }
  }
  
  /**
   * 获取用户的权限列表（通过角色）
   */
  static async getUserPermissions(userId: number): Promise<ApiResponse<Permission[]>> {
    try {
      const database = await getDatabase();
      const permissions = await database.select<Permission[]>(
        `SELECT DISTINCT p.id, p.name, p.description, p.created_at 
         FROM permissions p 
         INNER JOIN role_permissions rp ON p.id = rp.permission_id 
         INNER JOIN user_roles ur ON rp.role_id = ur.role_id 
         WHERE ur.user_id = ?
         ORDER BY p.name`,
        [userId]
      );
      
      return {
        success: true,
        data: permissions || []
      };
    } catch (error) {
      console.error('获取用户权限失败:', error);
      return {
        success: false,
        error: '获取用户权限失败'
      };
    }
  }
  
  /**
   * 创建用户
   */
  static async createUser(request: CreateUserRequest): Promise<ApiResponse<UserInfo>> {
    try {
      const database = await getDatabase();
      const now = new Date().toISOString();
      
      // 检查用户名是否已存在
      const existingUsername = await database.select<UserInfo[]>(
        'SELECT id FROM users WHERE username = ?',
        [request.username]
      );
      
      if (existingUsername && existingUsername.length > 0) {
        return {
          success: false,
          error: '用户名已存在'
        };
      }
      
      // 检查邮箱是否已存在
      const existingEmail = await database.select<UserInfo[]>(
        'SELECT id FROM users WHERE email = ?',
        [request.email]
      );
      
      if (existingEmail && existingEmail.length > 0) {
        return {
          success: false,
          error: '邮箱已存在'
        };
      }
      
      // 插入新用户
      const result = await database.execute(
        'INSERT INTO users (username, email, password, full_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          request.username,
          request.email,
          request.password, // 注意：实际应用中应该加密密码
          request.full_name || null,
          request.status || UserStatus.ACTIVE,
          now,
          now
        ]
      );
      
      if (result.lastInsertId) {
        const userId = Number(result.lastInsertId);
        
        // 分配角色
        if (request.role_ids && request.role_ids.length > 0) {
          await this.assignRolesToUser(userId, request.role_ids);
        }
        
        const newUser = await this.getUserById(userId);
        if (newUser.success) {
          return {
            success: true,
            data: newUser.data!,
            message: '用户创建成功'
          };
        }
      }
      
      return {
        success: false,
        error: '用户创建失败'
      };
    } catch (error) {
      console.error('创建用户失败:', error);
      return {
        success: false,
        error: '创建用户失败'
      };
    }
  }
  
  /**
   * 更新用户
   */
  static async updateUser(id: number, request: UpdateUserRequest): Promise<ApiResponse<UserInfo>> {
    try {
      const database = await getDatabase();
      const now = new Date().toISOString();
      
      // 检查用户是否存在
      const existing = await this.getUserById(id);
      if (!existing.success) {
        return existing;
      }
      
      // 检查新用户名是否与其他用户冲突
      if (request.username && request.username !== existing.data!.username) {
        const conflicting = await database.select<UserInfo[]>(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [request.username, id]
        );
        
        if (conflicting && conflicting.length > 0) {
          return {
            success: false,
            error: '用户名已存在'
          };
        }
      }
      
      // 检查新邮箱是否与其他用户冲突
      if (request.email && request.email !== existing.data!.email) {
        const conflicting = await database.select<UserInfo[]>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [request.email, id]
        );
        
        if (conflicting && conflicting.length > 0) {
          return {
            success: false,
            error: '邮箱已存在'
          };
        }
      }
      
      // 构建更新字段
      const updateFields: string[] = [];
      const updateParams: any[] = [];
      
      if (request.username !== undefined) {
        updateFields.push('username = ?');
        updateParams.push(request.username);
      }
      
      if (request.email !== undefined) {
        updateFields.push('email = ?');
        updateParams.push(request.email);
      }
      
      if (request.full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateParams.push(request.full_name);
      }
      
      if (request.status !== undefined) {
        updateFields.push('status = ?');
        updateParams.push(request.status);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = ?');
        updateParams.push(now);
        updateParams.push(id);
        
        await database.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateParams
        );
      }
      
      // 更新角色分配
      if (request.role_ids !== undefined) {
        await this.assignRolesToUser(id, request.role_ids);
      }
      
      const updatedUser = await this.getUserById(id);
      if (updatedUser.success) {
        return {
          success: true,
          data: updatedUser.data!,
          message: '用户更新成功'
        };
      }
      
      return {
        success: false,
        error: '用户更新失败'
      };
    } catch (error) {
      console.error('更新用户失败:', error);
      return {
        success: false,
        error: '更新用户失败'
      };
    }
  }
  
  /**
   * 删除用户
   */
  static async deleteUser(id: number): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      
      // 检查用户是否存在
      const existing = await this.getUserById(id);
      if (!existing.success) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
      
      // TODO: 检查用户是否有关联的业务数据
      // 实际项目中可能需要检查用户创建的项目、合同等数据
      
      // 删除用户角色关联
      await database.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      
      // 删除用户
      await database.execute('DELETE FROM users WHERE id = ?', [id]);
      
      return {
        success: true,
        data: true,
        message: '用户删除成功'
      };
    } catch (error) {
      console.error('删除用户失败:', error);
      return {
        success: false,
        error: '删除用户失败'
      };
    }
  }
  
  /**
   * 为用户分配角色
   */
  static async assignRolesToUser(userId: number, roleIds: number[]): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      
      // 删除现有角色分配
      await database.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      
      // 添加新的角色分配
      if (roleIds.length > 0) {
        const insertPromises = roleIds.map(roleId =>
          database.execute(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
          )
        );
        
        await Promise.all(insertPromises);
      }
      
      return {
        success: true,
        data: true,
        message: '角色分配成功'
      };
    } catch (error) {
      console.error('分配角色失败:', error);
      return {
        success: false,
        error: '分配角色失败'
      };
    }
  }
  
  /**
   * 重置用户密码
   */
  static async resetUserPassword(id: number, newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      const now = new Date().toISOString();
      
      // 检查用户是否存在
      const existing = await this.getUserById(id);
      if (!existing.success) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
      
      // 更新密码
      await database.execute(
        'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
        [newPassword, now, id] // 注意：实际应用中应该加密密码
      );
      
      return {
        success: true,
        data: true,
        message: '密码重置成功'
      };
    } catch (error) {
      console.error('重置密码失败:', error);
      return {
        success: false,
        error: '重置密码失败'
      };
    }
  }
  
  /**
   * 更新用户状态
   */
  static async updateUserStatus(id: number, status: UserStatus): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      const now = new Date().toISOString();
      
      // 检查用户是否存在
      const existing = await this.getUserById(id);
      if (!existing.success) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
      
      // 更新状态
      await database.execute(
        'UPDATE users SET status = ?, updated_at = ? WHERE id = ?',
        [status, now, id]
      );
      
      return {
        success: true,
        data: true,
        message: '用户状态更新成功'
      };
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return {
        success: false,
        error: '更新用户状态失败'
      };
    }
  }
}