-- 权限体系重构迁移 - 添加细粒度权限定义（修复版）
-- 版本: 3
-- 日期: 2024-01-XX
-- 描述: 重新设计权限体系，支持模块->页面->按钮->数据操作的层级权限

-- 1. 清理原有权限数据（保留用户和角色）
DELETE FROM role_permissions;
DELETE FROM permissions;

-- 2. 检查并添加权限表字段
-- 检查字段是否存在，如果不存在则添加
-- SQLite不支持IF NOT EXISTS语法，需要使用特殊处理

-- 创建临时表结构
CREATE TABLE IF NOT EXISTS permissions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT '',
  level TEXT DEFAULT 'button',
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (parent_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 复制现有数据到新表
INSERT INTO permissions_new (id, name, description, created_at)
SELECT id, name, description, created_at FROM permissions;

-- 删除旧表
DROP TABLE permissions;

-- 重命名新表
ALTER TABLE permissions_new RENAME TO permissions;

-- 3. 插入新的细粒度权限数据

-- ====== 基础模块权限 ======
INSERT INTO permissions (name, description, category, level, parent_id, sort_order, created_at) VALUES

-- 仪表板权限
('dashboard', '仪表板模块', '基础模块', 'module', NULL, 100, datetime('now')),
('dashboard:view', '查看仪表板', '基础模块', 'page', 1, 101, datetime('now')),

-- ====== 系统管理权限 ======
-- 用户管理
('user', '用户管理模块', '系统管理', 'module', NULL, 200, datetime('now')),
('user:view', '查看用户页面', '系统管理', 'page', 3, 201, datetime('now')),
('user:read', '读取用户数据', '系统管理', 'data', 4, 202, datetime('now')),
('user:create', '新增用户', '系统管理', 'button', 4, 203, datetime('now')),
('user:edit', '编辑用户', '系统管理', 'button', 4, 204, datetime('now')),
('user:delete', '删除用户', '系统管理', 'button', 4, 205, datetime('now')),
('user:reset_password', '重置用户密码', '系统管理', 'button', 4, 206, datetime('now')),
('user:assign_role', '分配用户角色', '系统管理', 'button', 4, 207, datetime('now')),
('user:change_status', '修改用户状态', '系统管理', 'button', 4, 208, datetime('now')),

-- 角色管理
('role', '角色管理模块', '系统管理', 'module', NULL, 300, datetime('now')),
('role:view', '查看角色页面', '系统管理', 'page', 11, 301, datetime('now')),
('role:read', '读取角色数据', '系统管理', 'data', 12, 302, datetime('now')),
('role:create', '新增角色', '系统管理', 'button', 12, 303, datetime('now')),
('role:edit', '编辑角色', '系统管理', 'button', 12, 304, datetime('now')),
('role:delete', '删除角色', '系统管理', 'button', 12, 305, datetime('now')),
('role:assign_permission', '分配角色权限', '系统管理', 'button', 12, 306, datetime('now')),

-- 权限管理
('permission', '权限管理模块', '系统管理', 'module', NULL, 400, datetime('now')),
('permission:view', '查看权限页面', '系统管理', 'page', 17, 401, datetime('now')),
('permission:read', '读取权限数据', '系统管理', 'data', 18, 402, datetime('now')),
('permission:create', '新增权限', '系统管理', 'button', 18, 403, datetime('now')),
('permission:edit', '编辑权限', '系统管理', 'button', 18, 404, datetime('now')),
('permission:delete', '删除权限', '系统管理', 'button', 18, 405, datetime('now')),

-- ====== 业务管理权限 ======
-- 公司管理
('company', '公司管理模块', '业务管理', 'module', NULL, 500, datetime('now')),
('company:view', '查看公司页面', '业务管理', 'page', 22, 501, datetime('now')),
('company:read', '读取公司数据', '业务管理', 'data', 23, 502, datetime('now')),
('company:create', '新增公司', '业务管理', 'button', 23, 503, datetime('now')),
('company:edit', '编辑公司', '业务管理', 'button', 23, 504, datetime('now')),
('company:delete', '删除公司', '业务管理', 'button', 23, 505, datetime('now')),

-- 项目管理
('project', '项目管理模块', '业务管理', 'module', NULL, 600, datetime('now')),
('project:view', '查看项目页面', '业务管理', 'page', 27, 601, datetime('now')),
('project:read', '读取项目数据', '业务管理', 'data', 28, 602, datetime('now')),
('project:create', '新增项目', '业务管理', 'button', 28, 603, datetime('now')),
('project:edit', '编辑项目', '业务管理', 'button', 28, 604, datetime('now')),
('project:delete', '删除项目', '业务管理', 'button', 28, 605, datetime('now')),

-- 项目预算管理
('project:budget:view', '查看项目预算', '业务管理', 'page', 28, 610, datetime('now')),
('project:budget:read', '读取预算数据', '业务管理', 'data', 32, 611, datetime('now')),
('project:budget:create', '新增预算项', '业务管理', 'button', 32, 612, datetime('now')),
('project:budget:edit', '编辑预算项', '业务管理', 'button', 32, 613, datetime('now')),
('project:budget:delete', '删除预算项', '业务管理', 'button', 32, 614, datetime('now')),

-- 项目里程碑管理
('project:milestone:view', '查看项目里程碑', '业务管理', 'page', 28, 620, datetime('now')),
('project:milestone:read', '读取里程碑数据', '业务管理', 'data', 37, 621, datetime('now')),
('project:milestone:create', '新增里程碑', '业务管理', 'button', 37, 622, datetime('now')),
('project:milestone:edit', '编辑里程碑', '业务管理', 'button', 37, 623, datetime('now')),
('project:milestone:delete', '删除里程碑', '业务管理', 'button', 37, 624, datetime('now')),

-- 项目收付款管理
('project:payment:view', '查看项目收付款', '业务管理', 'page', 28, 630, datetime('now')),
('project:payment:read', '读取收付款数据', '业务管理', 'data', 42, 631, datetime('now')),
('project:payment:create', '新增收付款记录', '业务管理', 'button', 42, 632, datetime('now')),
('project:payment:edit', '编辑收付款记录', '业务管理', 'button', 42, 633, datetime('now')),
('project:payment:delete', '删除收付款记录', '业务管理', 'button', 42, 634, datetime('now')),

-- 项目进展管理
('project:progress:view', '查看项目进展', '业务管理', 'page', 28, 640, datetime('now')),
('project:progress:read', '读取进展数据', '业务管理', 'data', 47, 641, datetime('now')),
('project:progress:create', '新增进展阶段', '业务管理', 'button', 47, 642, datetime('now')),
('project:progress:edit', '编辑进展阶段', '业务管理', 'button', 47, 643, datetime('now')),
('project:progress:delete', '删除进展阶段', '业务管理', 'button', 47, 644, datetime('now')),

-- 项目合同管理
('project:contract:view', '查看项目合同', '业务管理', 'page', 28, 650, datetime('now')),
('project:contract:read', '读取合同数据', '业务管理', 'data', 52, 651, datetime('now')),
('project:contract:create', '新增合同', '业务管理', 'button', 52, 652, datetime('now')),
('project:contract:edit', '编辑合同', '业务管理', 'button', 52, 653, datetime('now')),
('project:contract:delete', '删除合同', '业务管理', 'button', 52, 654, datetime('now')),

-- ====== 组合权限 ======
-- 系统管理组合权限
('system:admin', '系统管理员权限', '系统管理', 'module', NULL, 800, datetime('now')),

-- 业务管理组合权限
('business:admin', '业务管理员权限', '业务管理', 'module', NULL, 900, datetime('now')),

-- 只读权限
('readonly', '只读权限', '基础权限', 'module', NULL, 1000, datetime('now'));

-- 4. 重新分配角色权限

-- 超级管理员 - 拥有所有权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员';

-- 系统管理员 - 拥有系统管理和基础权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '系统管理员'
AND p.name IN (
  -- 基础权限
  'dashboard:view',
  -- 系统管理权限
  'user:view', 'user:read', 'user:create', 'user:edit', 'user:delete', 'user:reset_password', 'user:assign_role', 'user:change_status',
  'role:view', 'role:read', 'role:create', 'role:edit', 'role:delete', 'role:assign_permission',
  'permission:view', 'permission:read', 'permission:create', 'permission:edit', 'permission:delete'
);

-- 普通用户 - 拥有基础查看权限和有限的业务权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '普通用户'
AND p.name IN (
  -- 基础权限
  'dashboard:view',
  -- 业务查看权限
  'company:view', 'company:read',
  'project:view', 'project:read',
  'project:budget:view', 'project:budget:read',
  'project:milestone:view', 'project:milestone:read',
  'project:payment:view', 'project:payment:read',
  'project:progress:view', 'project:progress:read',
  'project:contract:view', 'project:contract:read'
);

-- 访客 - 仅基础查看权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '访客'
AND p.name IN ('dashboard:view');

-- 5. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_level ON permissions(level);
CREATE INDEX IF NOT EXISTS idx_permissions_parent_id ON permissions(parent_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 迁移完成