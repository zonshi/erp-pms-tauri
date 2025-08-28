import { getDatabase } from '../../db';
import type {
  Role,
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  PaginationRequest,
  PaginationResponse,
  ApiResponse
} from '../../types/auth';

/**
 * 角色管理服务
 */
export class RoleService {
  /**
   * 获取角色列表（分页）
   */
  static async getRoles(params: PaginationRequest = {}): Promise<ApiResponse<PaginationResponse<Role>>> {
    try {
      const database = await getDatabase();
      const { page = 1, page_size = 10, search = '', sort_by = 'created_at', sort_order = 'desc' } = params;
      
      // 构建基础查询
      let whereClause = '';
      let queryParams: any[] = [];
      
      if (search) {
        whereClause = 'WHERE name LIKE ? OR description LIKE ?';
        queryParams = [`%${search}%`, `%${search}%`];
      }
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM roles ${whereClause}`;
      const countResult = await database.select<[{ total: number }]>(countQuery, queryParams);
      const total = countResult[0]?.total || 0;
      
      // 获取分页数据
      const offset = (page - 1) * page_size;
      const dataQuery = `
        SELECT id, name, description, created_at 
        FROM roles 
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      const dataParams = [...queryParams, page_size, offset];
      const roles = await database.select<Role[]>(dataQuery, dataParams);
      
      // 为每个角色获取权限信息
      const rolesWithPermissions: Role[] = [];
      for (const role of roles || []) {
        const permissions = await this.getRolePermissions(role.id);
        rolesWithPermissions.push({
          ...role,
          permissions: permissions.success ? permissions.data : []
        });
      }
      
      const totalPages = Math.ceil(total / page_size);
      
      return {
        success: true,
        data: {
          data: rolesWithPermissions,
          total,
          page,
          page_size,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('获取角色列表失败:', error);
      return {
        success: false,
        error: '获取角色列表失败'
      };
    }
  }
  
  /**
   * 获取所有角色（不分页）
   */
  static async getAllRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const database = await getDatabase();
      const roles = await database.select<Role[]>(
        'SELECT id, name, description, created_at FROM roles ORDER BY name'
      );
      
      return {
        success: true,
        data: roles || []
      };
    } catch (error) {
      console.error('获取所有角色失败:', error);
      return {
        success: false,
        error: '获取角色失败'
      };
    }
  }
  
  /**
   * 根据ID获取角色
   */
  static async getRoleById(id: number): Promise<ApiResponse<Role>> {
    try {
      const database = await getDatabase();
      const roles = await database.select<Role[]>(
        'SELECT id, name, description, created_at FROM roles WHERE id = ?',
        [id]
      );
      
      if (!roles || roles.length === 0) {
        return {
          success: false,
          error: '角色不存在'
        };
      }
      
      // 获取角色权限
      const permissions = await this.getRolePermissions(id);
      
      return {
        success: true,
        data: {
          ...roles[0],
          permissions: permissions.success ? permissions.data : []
        }
      };
    } catch (error) {
      console.error('获取角色失败:', error);
      return {
        success: false,
        error: '获取角色失败'
      };
    }
  }
  
  /**
   * 获取角色的权限列表
   */
  static async getRolePermissions(roleId: number): Promise<ApiResponse<Permission[]>> {
    try {
      const database = await getDatabase();
      const permissions = await database.select<Permission[]>(
        `SELECT p.id, p.name, p.description, p.created_at 
         FROM permissions p 
         INNER JOIN role_permissions rp ON p.id = rp.permission_id 
         WHERE rp.role_id = ?
         ORDER BY p.name`,
        [roleId]
      );
      
      return {
        success: true,
        data: permissions || []
      };
    } catch (error) {
      console.error('获取角色权限失败:', error);
      return {
        success: false,
        error: '获取角色权限失败'
      };
    }
  }
  
  /**
   * 创建角色
   */
  static async createRole(request: CreateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const database = await getDatabase();
      const now = new Date().toISOString();
      
      // 检查角色名是否已存在
      const existing = await database.select<Role[]>(
        'SELECT id FROM roles WHERE name = ?',
        [request.name]
      );
      
      if (existing && existing.length > 0) {
        return {
          success: false,
          error: '角色名已存在'
        };
      }
      
      // 插入新角色
      const result = await database.execute(
        'INSERT INTO roles (name, description, created_at) VALUES (?, ?, ?)',
        [request.name, request.description || null, now]
      );
      
      if (result.lastInsertId) {
        const roleId = Number(result.lastInsertId);
        
        // 分配权限
        if (request.permission_ids && request.permission_ids.length > 0) {
          await this.assignPermissionsToRole(roleId, request.permission_ids);
        }
        
        const newRole = await this.getRoleById(roleId);
        if (newRole.success) {
          return {
            success: true,
            data: newRole.data!,
            message: '角色创建成功'
          };
        }
      }
      
      return {
        success: false,
        error: '角色创建失败'
      };
    } catch (error) {
      console.error('创建角色失败:', error);
      return {
        success: false,
        error: '创建角色失败'
      };
    }
  }
  
  /**
   * 更新角色
   */
  static async updateRole(id: number, request: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const database = await getDatabase();
      
      // 检查角色是否存在
      const existing = await this.getRoleById(id);
      if (!existing.success) {
        return existing;
      }
      
      // 检查新名称是否与其他角色冲突
      if (request.name && request.name !== existing.data!.name) {
        const conflicting = await database.select<Role[]>(
          'SELECT id FROM roles WHERE name = ? AND id != ?',
          [request.name, id]
        );
        
        if (conflicting && conflicting.length > 0) {
          return {
            success: false,
            error: '角色名已存在'
          };
        }
      }
      
      // 构建更新字段
      const updateFields: string[] = [];
      const updateParams: any[] = [];
      
      if (request.name !== undefined) {
        updateFields.push('name = ?');
        updateParams.push(request.name);
      }
      
      if (request.description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(request.description);
      }
      
      if (updateFields.length > 0) {
        updateParams.push(id);
        await database.execute(
          `UPDATE roles SET ${updateFields.join(', ')} WHERE id = ?`,
          updateParams
        );
      }
      
      // 更新权限分配
      if (request.permission_ids !== undefined) {
        await this.assignPermissionsToRole(id, request.permission_ids);
      }
      
      const updatedRole = await this.getRoleById(id);
      if (updatedRole.success) {
        return {
          success: true,
          data: updatedRole.data!,
          message: '角色更新成功'
        };
      }
      
      return {
        success: false,
        error: '角色更新失败'
      };
    } catch (error) {
      console.error('更新角色失败:', error);
      return {
        success: false,
        error: '更新角色失败'
      };
    }
  }
  
  /**
   * 删除角色
   */
  static async deleteRole(id: number): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      
      // 检查角色是否存在
      const existing = await this.getRoleById(id);
      if (!existing.success) {
        return {
          success: false,
          error: '角色不存在'
        };
      }
      
      // 检查角色是否被用户使用
      const userRoles = await database.select<any[]>(
        'SELECT user_id FROM user_roles WHERE role_id = ?',
        [id]
      );
      
      if (userRoles && userRoles.length > 0) {
        return {
          success: false,
          error: '该角色正在被用户使用，无法删除'
        };
      }
      
      // 删除角色权限关联
      await database.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      
      // 删除角色
      await database.execute('DELETE FROM roles WHERE id = ?', [id]);
      
      return {
        success: true,
        data: true,
        message: '角色删除成功'
      };
    } catch (error) {
      console.error('删除角色失败:', error);
      return {
        success: false,
        error: '删除角色失败'
      };
    }
  }
  
  /**
   * 为角色分配权限
   */
  static async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      
      // 删除现有权限分配
      await database.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      
      // 添加新的权限分配
      if (permissionIds.length > 0) {
        const insertPromises = permissionIds.map(permissionId =>
          database.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permissionId]
          )
        );
        
        await Promise.all(insertPromises);
      }
      
      return {
        success: true,
        data: true,
        message: '权限分配成功'
      };
    } catch (error) {
      console.error('分配权限失败:', error);
      return {
        success: false,
        error: '分配权限失败'
      };
    }
  }
}