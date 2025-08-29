-- 初始化基础数据
-- 注意：只有在数据不存在时才插入，避免重复数据

-- 1. 插入权限数据
INSERT OR IGNORE INTO permissions (name, description, created_at) VALUES
-- 用户管理权限
('user:read', '查看用户信息', datetime('now')),
('user:write', '创建和编辑用户', datetime('now')),
('user:delete', '删除用户', datetime('now')),
('user:manage', '用户管理（包含所有用户操作）', datetime('now')),

-- 角色管理权限
('role:read', '查看角色信息', datetime('now')),
('role:write', '创建和编辑角色', datetime('now')),
('role:delete', '删除角色', datetime('now')),
('role:manage', '角色管理（包含所有角色操作）', datetime('now')),

-- 权限管理权限
('permission:read', '查看权限信息', datetime('now')),
('permission:write', '创建和编辑权限', datetime('now')),
('permission:delete', '删除权限', datetime('now')),
('permission:manage', '权限管理（包含所有权限操作）', datetime('now')),

-- 公司管理权限
('company:read', '查看公司信息', datetime('now')),
('company:write', '创建和编辑公司', datetime('now')),
('company:delete', '删除公司', datetime('now')),
('company:manage', '公司管理（包含所有公司操作）', datetime('now')),

-- 项目管理权限
('project:read', '查看项目信息', datetime('now')),
('project:write', '创建和编辑项目', datetime('now')),
('project:delete', '删除项目', datetime('now')),
('project:manage', '项目管理（包含所有项目操作）', datetime('now')),

-- 合同管理权限
('contract:read', '查看合同信息', datetime('now')),
('contract:write', '创建和编辑合同', datetime('now')),
('contract:delete', '删除合同', datetime('now')),
('contract:approve', '审批合同', datetime('now')),
('contract:manage', '合同管理（包含所有合同操作）', datetime('now')),
('contract:document', '管理合同文档', datetime('now')),
('contract:item', '管理合同条目', datetime('now')),

-- 系统管理权限
('system:manage', '系统管理', datetime('now')),
('system:config', '系统配置', datetime('now')),
('system:monitor', '系统监控', datetime('now')),

-- 基础权限
('dashboard:view', '查看仪表板', datetime('now')),
('profile:view', '查看个人信息', datetime('now')),
('profile:edit', '编辑个人信息', datetime('now'));

-- 2. 插入角色数据
INSERT OR IGNORE INTO roles (name, description, created_at) VALUES
('超级管理员', '系统超级管理员，拥有所有权限', datetime('now')),
('系统管理员', '系统管理员，负责用户和权限管理', datetime('now')),
('普通用户', '普通用户，只能查看基础信息', datetime('now')),
('访客', '访客用户，只能查看仪表板', datetime('now'));

-- 3. 分配角色权限
-- 超级管理员 - 所有权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员';

-- 系统管理员 - 管理权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '系统管理员'
AND p.name IN (
  'user:manage', 'role:manage', 'permission:manage', 'company:manage', 'project:manage',
  'contract:manage', 'dashboard:view', 'profile:view', 'profile:edit'
);

-- 普通用户 - 基础权限
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '普通用户'
AND p.name IN ('dashboard:view', 'profile:view', 'profile:edit');

-- 访客 - 仅查看仪表板
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '访客'
AND p.name = 'dashboard:view';

-- 4. 插入用户数据（注意：实际应用中密码应该加密）
INSERT OR IGNORE INTO users (username, email, password, full_name, status, created_at) VALUES
('admin', 'admin@example.com', 'admin123', '系统管理员', 'active', datetime('now')),
('manager', 'manager@example.com', 'manager123', '项目经理', 'active', datetime('now')),
('user', 'user@example.com', 'user123', '普通用户', 'active', datetime('now')),
('guest', 'guest@example.com', 'guest123', '访客用户', 'active', datetime('now'));

-- 5. 分配用户角色
-- admin - 超级管理员
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = '超级管理员';

-- manager - 系统管理员
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'manager' AND r.name = '系统管理员';

-- user - 普通用户
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'user' AND r.name = '普通用户';

-- guest - 访客
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'guest' AND r.name = '访客';

-- 初始化数据插入完成