import { getDatabase } from '../../db';
import type {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PaginationRequest,
  PaginationResponse,
  ApiResponse
} from '../../types/auth';

/**
 * 权限管理服务
 */
export class PermissionService {
  /**
   * 获取权限列表（分页）
   */
  static async getPermissions(params: PaginationRequest = {}): Promise<ApiResponse<PaginationResponse<Permission>>> {
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
      const countQuery = `SELECT COUNT(*) as total FROM permissions ${whereClause}`;
      const countResult = await database.select<[{ total: number }]>(countQuery, queryParams);
      const total = countResult[0]?.total || 0;
      
      // 获取分页数据
      const offset = (page - 1) * page_size;
      const dataQuery = `
        SELECT id, name, description, created_at 
        FROM permissions 
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      const dataParams = [...queryParams, page_size, offset];
      const permissions = await database.select<Permission[]>(dataQuery, dataParams);
      
      const totalPages = Math.ceil(total / page_size);
      
      return {
        success: true,
        data: {
          data: permissions || [],
          total,
          page,
          page_size,
          total_pages: totalPages
        }
      };
    } catch (error) {
      console.error('获取权限列表失败:', error);
      return {
        success: false,
        error: '获取权限列表失败'
      };
    }
  }
  
  /**
   * 获取所有权限（不分页）
   */
  static async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    try {
      const database = await getDatabase();
      const permissions = await database.select<Permission[]>(
        'SELECT id, name, description, created_at FROM permissions ORDER BY name'
      );
      
      return {
        success: true,
        data: permissions || []
      };
    } catch (error) {
      console.error('获取所有权限失败:', error);
      return {
        success: false,
        error: '获取权限失败'
      };
    }
  }
  
  /**
   * 根据ID获取权限
   */
  static async getPermissionById(id: number): Promise<ApiResponse<Permission>> {
    try {
      const database = await getDatabase();
      const permissions = await database.select<Permission[]>(
        'SELECT id, name, description, created_at FROM permissions WHERE id = ?',
        [id]
      );
      
      if (!permissions || permissions.length === 0) {
        return {
          success: false,
          error: '权限不存在'
        };
      }
      
      return {
        success: true,
        data: permissions[0]
      };
    } catch (error) {
      console.error('获取权限失败:', error);
      return {
        success: false,
        error: '获取权限失败'
      };
    }
  }
  
  /**
   * 创建权限
   */
  static async createPermission(request: CreatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      const database = await getDatabase();
      const now = new Date().toISOString();
      
      // 检查权限名是否已存在
      const existing = await database.select<Permission[]>(
        'SELECT id FROM permissions WHERE name = ?',
        [request.name]
      );
      
      if (existing && existing.length > 0) {
        return {
          success: false,
          error: '权限名已存在'
        };
      }
      
      // 插入新权限
      const result = await database.execute(
        'INSERT INTO permissions (name, description, created_at) VALUES (?, ?, ?)',
        [request.name, request.description || null, now]
      );
      
      if (result.lastInsertId) {
        const newPermission = await this.getPermissionById(Number(result.lastInsertId));
        if (newPermission.success) {
          return {
            success: true,
            data: newPermission.data!,
            message: '权限创建成功'
          };
        }
      }
      
      return {
        success: false,
        error: '权限创建失败'
      };
    } catch (error) {
      console.error('创建权限失败:', error);
      return {
        success: false,
        error: '创建权限失败'
      };
    }
  }
  
  /**
   * 更新权限
   */
  static async updatePermission(id: number, request: UpdatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      const database = await getDatabase();
      
      // 检查权限是否存在
      const existing = await this.getPermissionById(id);
      if (!existing.success) {
        return existing;
      }
      
      // 检查新名称是否与其他权限冲突
      if (request.name && request.name !== existing.data!.name) {
        const conflicting = await database.select<Permission[]>(
          'SELECT id FROM permissions WHERE name = ? AND id != ?',
          [request.name, id]
        );
        
        if (conflicting && conflicting.length > 0) {
          return {
            success: false,
            error: '权限名已存在'
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
      
      if (updateFields.length === 0) {
        return {
          success: true,
          data: existing.data!,
          message: '无需更新'
        };
      }
      
      updateParams.push(id);
      
      await database.execute(
        `UPDATE permissions SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams
      );
      
      const updatedPermission = await this.getPermissionById(id);
      if (updatedPermission.success) {
        return {
          success: true,
          data: updatedPermission.data!,
          message: '权限更新成功'
        };
      }
      
      return {
        success: false,
        error: '权限更新失败'
      };
    } catch (error) {
      console.error('更新权限失败:', error);
      return {
        success: false,
        error: '更新权限失败'
      };
    }
  }
  
  /**
   * 删除权限
   */
  static async deletePermission(id: number): Promise<ApiResponse<boolean>> {
    try {
      const database = await getDatabase();
      
      // 检查权限是否存在
      const existing = await this.getPermissionById(id);
      if (!existing.success) {
        return {
          success: false,
          error: '权限不存在'
        };
      }
      
      // 检查权限是否被角色使用
      const rolePermissions = await database.select<any[]>(
        'SELECT role_id FROM role_permissions WHERE permission_id = ?',
        [id]
      );
      
      if (rolePermissions && rolePermissions.length > 0) {
        return {
          success: false,
          error: '该权限正在被角色使用，无法删除'
        };
      }
      
      // 删除权限
      await database.execute('DELETE FROM permissions WHERE id = ?', [id]);
      
      return {
        success: true,
        data: true,
        message: '权限删除成功'
      };
    } catch (error) {
      console.error('删除权限失败:', error);
      return {
        success: false,
        error: '删除权限失败'
      };
    }
  }
}