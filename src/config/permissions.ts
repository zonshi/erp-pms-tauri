/**
 * 权限配置文件 - 定义系统中所有权限点
 * 按模块和操作类型进行细分，支持按钮级和数据级权限控制
 */

export interface PermissionConfig {
  key: string;
  name: string;
  description: string;
  category: string;
  level: 'module' | 'page' | 'button' | 'data';
  parent?: string;
  includes?: string[]; // 包含的子权限
}

/**
 * 系统权限配置
 * 采用层级结构：模块 > 页面 > 功能 > 按钮/数据操作
 */
export const PERMISSION_CONFIG: PermissionConfig[] = [
  // ====== 仪表板模块 ======
  {
    key: 'dashboard',
    name: '仪表板',
    description: '系统仪表板模块',
    category: '基础模块',
    level: 'module',
    includes: ['dashboard:view']
  },
  {
    key: 'dashboard:view',
    name: '查看仪表板',
    description: '访问和查看系统仪表板',
    category: '基础模块',
    level: 'page',
    parent: 'dashboard'
  },

  // ====== 用户管理模块 ======
  {
    key: 'user',
    name: '用户管理',
    description: '用户管理模块',
    category: '系统管理',
    level: 'module',
    includes: ['user:view', 'user:create', 'user:edit', 'user:delete', 'user:reset_password', 'user:assign_role', 'user:change_status']
  },
  {
    key: 'user:view',
    name: '查看用户',
    description: '访问用户管理页面，查看用户列表和详情',
    category: '系统管理',
    level: 'page',
    parent: 'user',
    includes: ['user:read']
  },
  {
    key: 'user:read',
    name: '读取用户数据',
    description: '查看用户基本信息和列表数据',
    category: '系统管理',
    level: 'data',
    parent: 'user:view'
  },
  {
    key: 'user:create',
    name: '新增用户',
    description: '创建新用户账号',
    category: '系统管理',
    level: 'button',
    parent: 'user:view'
  },
  {
    key: 'user:edit',
    name: '编辑用户',
    description: '修改用户信息',
    category: '系统管理',
    level: 'button',
    parent: 'user:view'
  },
  {
    key: 'user:delete',
    name: '删除用户',
    description: '删除用户账号',
    category: '系统管理',
    level: 'button',
    parent: 'user:view'
  },
  {
    key: 'user:reset_password',
    name: '重置密码',
    description: '重置用户密码',
    category: '系统管理',
    level: 'button',
    parent: 'user:view'
  },
  {
    key: 'user:assign_role',
    name: '分配角色',
    description: '为用户分配角色',
    category: '系统管理',
    level: 'button',
    parent: 'user:view'
  },
  {
    key: 'user:change_status',
    name: '修改状态',
    description: '启用/停用用户账号',
    category: '系统管理',
    level: 'button',
    parent: 'user:view'
  },

  // ====== 角色管理模块 ======
  {
    key: 'role',
    name: '角色管理',
    description: '角色管理模块',
    category: '系统管理',
    level: 'module',
    includes: ['role:view', 'role:create', 'role:edit', 'role:delete', 'role:assign_permission']
  },
  {
    key: 'role:view',
    name: '查看角色',
    description: '访问角色管理页面，查看角色列表和详情',
    category: '系统管理',
    level: 'page',
    parent: 'role',
    includes: ['role:read']
  },
  {
    key: 'role:read',
    name: '读取角色数据',
    description: '查看角色信息和权限配置',
    category: '系统管理',
    level: 'data',
    parent: 'role:view'
  },
  {
    key: 'role:create',
    name: '新增角色',
    description: '创建新角色',
    category: '系统管理',
    level: 'button',
    parent: 'role:view'
  },
  {
    key: 'role:edit',
    name: '编辑角色',
    description: '修改角色信息和权限',
    category: '系统管理',
    level: 'button',
    parent: 'role:view'
  },
  {
    key: 'role:delete',
    name: '删除角色',
    description: '删除角色',
    category: '系统管理',
    level: 'button',
    parent: 'role:view'
  },
  {
    key: 'role:assign_permission',
    name: '分配权限',
    description: '为角色分配权限',
    category: '系统管理',
    level: 'button',
    parent: 'role:view'
  },

  // ====== 权限管理模块 ======
  {
    key: 'permission',
    name: '权限管理',
    description: '权限管理模块',
    category: '系统管理',
    level: 'module',
    includes: ['permission:view', 'permission:create', 'permission:edit', 'permission:delete']
  },
  {
    key: 'permission:view',
    name: '查看权限',
    description: '访问权限管理页面，查看权限列表',
    category: '系统管理',
    level: 'page',
    parent: 'permission',
    includes: ['permission:read']
  },
  {
    key: 'permission:read',
    name: '读取权限数据',
    description: '查看权限信息',
    category: '系统管理',
    level: 'data',
    parent: 'permission:view'
  },
  {
    key: 'permission:create',
    name: '新增权限',
    description: '创建新权限',
    category: '系统管理',
    level: 'button',
    parent: 'permission:view'
  },
  {
    key: 'permission:edit',
    name: '编辑权限',
    description: '修改权限信息',
    category: '系统管理',
    level: 'button',
    parent: 'permission:view'
  },
  {
    key: 'permission:delete',
    name: '删除权限',
    description: '删除权限',
    category: '系统管理',
    level: 'button',
    parent: 'permission:view'
  },

  // ====== 公司管理模块 ======
  {
    key: 'company',
    name: '公司管理',
    description: '公司管理模块',
    category: '业务管理',
    level: 'module',
    includes: ['company:view', 'company:create', 'company:edit', 'company:delete']
  },
  {
    key: 'company:view',
    name: '查看公司',
    description: '访问公司管理页面，查看公司列表和详情',
    category: '业务管理',
    level: 'page',
    parent: 'company',
    includes: ['company:read']
  },
  {
    key: 'company:read',
    name: '读取公司数据',
    description: '查看公司信息',
    category: '业务管理',
    level: 'data',
    parent: 'company:view'
  },
  {
    key: 'company:create',
    name: '新增公司',
    description: '创建新公司',
    category: '业务管理',
    level: 'button',
    parent: 'company:view'
  },
  {
    key: 'company:edit',
    name: '编辑公司',
    description: '修改公司信息',
    category: '业务管理',
    level: 'button',
    parent: 'company:view'
  },
  {
    key: 'company:delete',
    name: '删除公司',
    description: '删除公司',
    category: '业务管理',
    level: 'button',
    parent: 'company:view'
  },

  // ====== 项目管理模块 ======
  {
    key: 'project',
    name: '项目管理',
    description: '项目管理模块',
    category: '业务管理',
    level: 'module',
    includes: [
      'project:view', 'project:create', 'project:edit', 'project:delete',
      'project:budget:view', 'project:budget:create', 'project:budget:edit', 'project:budget:delete',
      'project:payment:view', 'project:payment:create', 'project:payment:edit', 'project:payment:delete',
      'project:contract:view', 'project:contract:create', 'project:contract:edit', 'project:contract:delete'
    ]
  },
  // 项目基础功能
  {
    key: 'project:view',
    name: '查看项目',
    description: '访问项目管理页面，查看项目列表和详情',
    category: '业务管理',
    level: 'page',
    parent: 'project',
    includes: ['project:read']
  },
  {
    key: 'project:read',
    name: '读取项目数据',
    description: '查看项目基本信息',
    category: '业务管理',
    level: 'data',
    parent: 'project:view'
  },
  {
    key: 'project:create',
    name: '新增项目',
    description: '创建新项目',
    category: '业务管理',
    level: 'button',
    parent: 'project:view'
  },
  {
    key: 'project:edit',
    name: '编辑项目',
    description: '修改项目信息',
    category: '业务管理',
    level: 'button',
    parent: 'project:view'
  },
  {
    key: 'project:delete',
    name: '删除项目',
    description: '删除项目',
    category: '业务管理',
    level: 'button',
    parent: 'project:view'
  },

  // 项目预算管理
  {
    key: 'project:budget:view',
    name: '查看项目预算',
    description: '查看项目预算信息',
    category: '业务管理',
    level: 'page',
    parent: 'project:view',
    includes: ['project:budget:read']
  },
  {
    key: 'project:budget:read',
    name: '读取预算数据',
    description: '查看预算详细数据',
    category: '业务管理',
    level: 'data',
    parent: 'project:budget:view'
  },
  {
    key: 'project:budget:create',
    name: '新增预算项',
    description: '创建新的预算项',
    category: '业务管理',
    level: 'button',
    parent: 'project:budget:view'
  },
  {
    key: 'project:budget:edit',
    name: '编辑预算项',
    description: '修改预算项信息',
    category: '业务管理',
    level: 'button',
    parent: 'project:budget:view'
  },
  {
    key: 'project:budget:delete',
    name: '删除预算项',
    description: '删除预算项',
    category: '业务管理',
    level: 'button',
    parent: 'project:budget:view'
  },

  // 项目收付款管理
  {
    key: 'project:payment:view',
    name: '查看项目收付款',
    description: '查看项目收付款信息',
    category: '业务管理',
    level: 'page',
    parent: 'project:view',
    includes: ['project:payment:read']
  },
  {
    key: 'project:payment:read',
    name: '读取收付款数据',
    description: '查看收付款详细数据',
    category: '业务管理',
    level: 'data',
    parent: 'project:payment:view'
  },
  {
    key: 'project:payment:create',
    name: '新增收付款记录',
    description: '创建新的收付款记录',
    category: '业务管理',
    level: 'button',
    parent: 'project:payment:view'
  },
  {
    key: 'project:payment:edit',
    name: '编辑收付款记录',
    description: '修改收付款记录',
    category: '业务管理',
    level: 'button',
    parent: 'project:payment:view'
  },
  {
    key: 'project:payment:delete',
    name: '删除收付款记录',
    description: '删除收付款记录',
    category: '业务管理',
    level: 'button',
    parent: 'project:payment:view'
  },

  // 项目合同管理
  {
    key: 'project:contract:view',
    name: '查看项目合同',
    description: '查看项目相关合同信息',
    category: '业务管理',
    level: 'page',
    parent: 'project:view',
    includes: ['project:contract:read']
  },
  {
    key: 'project:contract:read',
    name: '读取合同数据',
    description: '查看合同详细数据',
    category: '业务管理',
    level: 'data',
    parent: 'project:contract:view'
  },
  {
    key: 'project:contract:create',
    name: '新增合同',
    description: '创建新的合同',
    category: '业务管理',
    level: 'button',
    parent: 'project:contract:view'
  },
  {
    key: 'project:contract:edit',
    name: '编辑合同',
    description: '修改合同信息',
    category: '业务管理',
    level: 'button',
    parent: 'project:contract:view'
  },
  {
    key: 'project:contract:delete',
    name: '删除合同',
    description: '删除合同',
    category: '业务管理',
    level: 'button',
    parent: 'project:contract:view'
  },

  // ====== 系统管理组合权限 ======
  {
    key: 'system:admin',
    name: '系统管理员',
    description: '系统管理员权限，包含用户、角色、权限管理',
    category: '系统管理',
    level: 'module',
    includes: ['user', 'role', 'permission']
  },

  // ====== 业务管理组合权限 ======
  {
    key: 'business:admin',
    name: '业务管理员',
    description: '业务管理员权限，包含公司、项目管理',
    category: '业务管理',
    level: 'module',
    includes: ['company', 'project']
  },

  // ====== 只读权限 ======
  {
    key: 'readonly',
    name: '只读权限',
    description: '所有模块的只读权限',
    category: '基础权限',
    level: 'module',
    includes: [
      'dashboard:view',
      'user:view', 'role:view', 'permission:view',
      'company:view', 'project:view',
      'project:budget:view', 'project:payment:view', 'project:contract:view'
    ]
  }
];

/**
 * 获取权限配置
 */
export function getPermissionConfig(key: string): PermissionConfig | undefined {
  return PERMISSION_CONFIG.find(p => p.key === key);
}

/**
 * 获取模块权限
 */
export function getModulePermissions(module: string): PermissionConfig[] {
  return PERMISSION_CONFIG.filter(p => p.parent === module || p.key === module);
}

/**
 * 获取权限的所有子权限
 */
export function getPermissionIncludes(key: string): string[] {
  const config = getPermissionConfig(key);
  if (!config?.includes) return [];
  
  let allIncludes: string[] = [];
  
  for (const includeKey of config.includes) {
    allIncludes.push(includeKey);
    // 递归获取子权限的包含权限
    const subIncludes = getPermissionIncludes(includeKey);
    allIncludes.push(...subIncludes);
  }
  
  // 去重
  return [...new Set(allIncludes)];
}

/**
 * 检查权限是否包含指定权限
 */
export function hasPermissionInclude(parentKey: string, childKey: string): boolean {
  if (parentKey === childKey) return true;
  
  const includes = getPermissionIncludes(parentKey);
  return includes.includes(childKey);
}

/**
 * 获取分类权限
 */
export function getPermissionsByCategory(category: string): PermissionConfig[] {
  return PERMISSION_CONFIG.filter(p => p.category === category);
}

/**
 * 获取所有模块权限
 */
export function getModulePermissionKeys(): string[] {
  return PERMISSION_CONFIG
    .filter(p => p.level === 'module')
    .map(p => p.key);
}

/**
 * 获取所有页面权限
 */
export function getPagePermissionKeys(): string[] {
  return PERMISSION_CONFIG
    .filter(p => p.level === 'page')
    .map(p => p.key);
}