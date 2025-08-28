import { getDatabase } from '../../db';
import { PermissionService } from './permission';
import { RoleService } from './role';
import { UserService } from './user';
import { UserStatus } from '../../types/auth';

/**
 * 初始化基础数据
 */
export class DataInitializer {
  /**
   * 初始化所有基础数据
   */
  static async initializeAll(): Promise<void> {
    console.log('🚀 开始初始化基础数据...');
    
    try {
      // 先测试数据库连接
      console.log('📊 测试数据库连接...');
      const database = await getDatabase();
      console.log('✅ 数据库连接成功');
      
      // 检查数据库表是否存在
      try {
        await database.select('SELECT name FROM sqlite_master WHERE type="table"');
        console.log('✅ 数据库表结构检查通过');
      } catch (error) {
        console.error('❌ 数据库表结构检查失败:', error);
        throw new Error('数据库表结构不存在，请确保数据库迁移已完成');
      }
      
      // 检查是否已经初始化过
      console.log('🔍 检查是否已有基础数据...');
      const hasData = await this.checkIfDataExists();
      if (hasData) {
        console.log('ℹ️ 基础数据已存在，跳过初始化');
        return;
      }
      
      console.log('📝 开始创建基础数据...');
      
      // 按顺序初始化数据
      await this.initializePermissions();
      await this.initializeRoles();
      await this.initializeUsers();
      
      console.log('🎉 基础数据初始化完成！');
    } catch (error) {
      console.error('💥 初始化基础数据失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * 检查是否已有基础数据
   */
  private static async checkIfDataExists(): Promise<boolean> {
    try {
      const database = await getDatabase();
      
      // 检查是否有用户数据
      console.log('🔍 检查用户表数据...');
      const users = await database.select<any[]>('SELECT COUNT(*) as count FROM users');
      const userCount = users[0]?.count || 0;
      
      console.log(`📊 当前用户数量: ${userCount}`);
      
      return userCount > 0;
    } catch (error) {
      console.error('❌ 检查数据存在性失败:', error);
      
      // 如果是表不存在错误，返回 false（需要初始化）
      if (error.message && error.message.includes('no such table')) {
        console.log('📝 表不存在，需要初始化数据');
        return false;
      }
      
      // 其他错误，也返回 false 尝试初始化
      return false;
    }
  }
  
  /**
   * 初始化权限数据
   */
  private static async initializePermissions(): Promise<void> {
    console.log('初始化权限数据...');
    
    const permissions = [
      // 用户管理权限
      { name: 'user:read', description: '查看用户信息' },
      { name: 'user:write', description: '创建和编辑用户' },
      { name: 'user:delete', description: '删除用户' },
      { name: 'user:manage', description: '用户管理（包含所有用户操作）' },
      
      // 角色管理权限
      { name: 'role:read', description: '查看角色信息' },
      { name: 'role:write', description: '创建和编辑角色' },
      { name: 'role:delete', description: '删除角色' },
      { name: 'role:manage', description: '角色管理（包含所有角色操作）' },
      
      // 权限管理权限
      { name: 'permission:read', description: '查看权限信息' },
      { name: 'permission:write', description: '创建和编辑权限' },
      { name: 'permission:delete', description: '删除权限' },
      { name: 'permission:manage', description: '权限管理（包含所有权限操作）' },
      
      // 系统管理权限
      { name: 'system:manage', description: '系统管理' },
      { name: 'system:config', description: '系统配置' },
      { name: 'system:monitor', description: '系统监控' },
      
      // 基础权限
      { name: 'dashboard:view', description: '查看仪表板' },
      { name: 'profile:view', description: '查看个人信息' },
      { name: 'profile:edit', description: '编辑个人信息' }
    ];
    
    for (const permission of permissions) {
      try {
        await PermissionService.createPermission(permission);
        console.log(`创建权限: ${permission.name}`);
      } catch (error) {
        console.error(`创建权限 ${permission.name} 失败:`, error);
      }
    }
  }
  
  /**
   * 初始化角色数据
   */
  private static async initializeRoles(): Promise<void> {
    console.log('初始化角色数据...');
    
    // 获取所有权限用于分配
    const permissionsResult = await PermissionService.getAllPermissions();
    if (!permissionsResult.success || !permissionsResult.data) {
      throw new Error('获取权限列表失败');
    }
    
    const allPermissions = permissionsResult.data;
    const getPermissionIds = (names: string[]) => {
      return allPermissions
        .filter(p => names.includes(p.name))
        .map(p => p.id);
    };
    
    const roles = [
      {
        name: '超级管理员',
        description: '系统超级管理员，拥有所有权限',
        permission_ids: allPermissions.map(p => p.id) // 所有权限
      },
      {
        name: '系统管理员',
        description: '系统管理员，负责用户和权限管理',
        permission_ids: getPermissionIds([
          'user:manage', 'role:manage', 'permission:manage',
          'dashboard:view', 'profile:view', 'profile:edit'
        ])
      },
      {
        name: '普通用户',
        description: '普通用户，只能查看基础信息',
        permission_ids: getPermissionIds([
          'dashboard:view', 'profile:view', 'profile:edit'
        ])
      },
      {
        name: '访客',
        description: '访客用户，只能查看仪表板',
        permission_ids: getPermissionIds(['dashboard:view'])
      }
    ];
    
    for (const role of roles) {
      try {
        await RoleService.createRole(role);
        console.log(`创建角色: ${role.name}`);
      } catch (error) {
        console.error(`创建角色 ${role.name} 失败:`, error);
      }
    }
  }
  
  /**
   * 初始化用户数据
   */
  private static async initializeUsers(): Promise<void> {
    console.log('初始化用户数据...');
    
    // 获取所有角色用于分配
    const rolesResult = await RoleService.getAllRoles();
    if (!rolesResult.success || !rolesResult.data) {
      throw new Error('获取角色列表失败');
    }
    
    const allRoles = rolesResult.data;
    const getRoleIds = (names: string[]) => {
      return allRoles
        .filter(r => names.includes(r.name))
        .map(r => r.id);
    };
    
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // 实际应用中应该加密
        full_name: '系统管理员',
        status: UserStatus.ACTIVE,
        role_ids: getRoleIds(['超级管理员'])
      },
      {
        username: 'manager',
        email: 'manager@example.com',
        password: 'manager123',
        full_name: '项目经理',
        status: UserStatus.ACTIVE,
        role_ids: getRoleIds(['系统管理员'])
      },
      {
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        full_name: '普通用户',
        status: UserStatus.ACTIVE,
        role_ids: getRoleIds(['普通用户'])
      },
      {
        username: 'guest',
        email: 'guest@example.com',
        password: 'guest123',
        full_name: '访客用户',
        status: UserStatus.ACTIVE,
        role_ids: getRoleIds(['访客'])
      }
    ];
    
    for (const user of users) {
      try {
        await UserService.createUser(user);
        console.log(`创建用户: ${user.username} (${user.email})`);
      } catch (error) {
        console.error(`创建用户 ${user.username} 失败:`, error);
      }
    }
  }
  
  /**
   * 清除所有数据（仅用于开发测试）
   */
  static async clearAllData(): Promise<void> {
    console.warn('清除所有数据...');
    
    try {
      const database = await getDatabase();
      
      // 按依赖关系逆序删除
      await database.execute('DELETE FROM user_roles');
      await database.execute('DELETE FROM role_permissions');
      await database.execute('DELETE FROM users');
      await database.execute('DELETE FROM roles');
      await database.execute('DELETE FROM permissions');
      
      console.log('所有数据已清除');
    } catch (error) {
      console.error('清除数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 重置数据（清除后重新初始化）
   */
  static async resetData(): Promise<void> {
    console.log('重置数据...');
    
    await this.clearAllData();
    await this.initializeAll();
    
    console.log('数据重置完成');
  }
}

// 导出便捷方法
export const initializeBaseData = () => DataInitializer.initializeAll();
export const clearAllData = () => DataInitializer.clearAllData();
export const resetData = () => DataInitializer.resetData();