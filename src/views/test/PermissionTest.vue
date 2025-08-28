<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { usePermissions } from '../../composables/usePermissions';
import { PermissionChecker } from '../../service/auth/permission-checker';

const { currentUser, isSystemAdmin, isSuperAdmin } = usePermissions();

// 权限测试结果
const permissionTests = ref<Array<{ name: string; result: boolean; loading: boolean }>>([]);

// 角色测试结果
const roleTests = ref<Array<{ name: string; result: boolean; loading: boolean }>>([]);

// 测试权限列表
const testPermissions = [
  'user:read',
  'user:write', 
  'user:delete',
  'user:manage',
  'role:read',
  'role:write',
  'role:manage',
  'permission:read',
  'permission:write',
  'permission:manage',
  'dashboard:view',
  'system:manage'
];

// 测试角色列表
const testRoles = [
  '超级管理员',
  '系统管理员',
  '普通用户',
  '访客'
];

// 执行权限测试
const runPermissionTests = async () => {
  permissionTests.value = testPermissions.map(permission => ({
    name: permission,
    result: false,
    loading: true
  }));

  for (let i = 0; i < testPermissions.length; i++) {
    const permission = testPermissions[i];
    try {
      const result = await PermissionChecker.checkPermission(permission);
      permissionTests.value[i].result = result;
    } catch (error) {
      console.error(`测试权限 ${permission} 失败:`, error);
      permissionTests.value[i].result = false;
    } finally {
      permissionTests.value[i].loading = false;
    }
  }
};

// 执行角色测试
const runRoleTests = async () => {
  roleTests.value = testRoles.map(role => ({
    name: role,
    result: false,
    loading: true
  }));

  for (let i = 0; i < testRoles.length; i++) {
    const role = testRoles[i];
    try {
      const result = await PermissionChecker.checkRole(role);
      roleTests.value[i].result = result;
    } catch (error) {
      console.error(`测试角色 ${role} 失败:`, error);
      roleTests.value[i].result = false;
    } finally {
      roleTests.value[i].loading = false;
    }
  }
};

// 重新运行所有测试
const runAllTests = async () => {
  await Promise.all([
    runPermissionTests(),
    runRoleTests()
  ]);
};

onMounted(() => {
  runAllTests();
});
</script>

<template>
  <div class="permission-test">
    <div class="page-header">
      <h2>权限测试页面</h2>
      <p>测试当前用户的权限和角色</p>
    </div>

    <!-- 用户信息 -->
    <el-card class="user-info-card" shadow="never">
      <template #header>
        <span>当前用户信息</span>
        <el-button style="float: right;" @click="runAllTests" type="primary" size="small">
          刷新测试
        </el-button>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ currentUser?.username || '未登录' }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ currentUser?.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ currentUser?.full_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentUser?.status === 'active' ? 'success' : 'danger'">
            {{ currentUser?.status === 'active' ? '激活' : '非激活' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否系统管理员">
          <el-tag :type="isSystemAdmin ? 'success' : 'info'">
            {{ isSystemAdmin ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否超级管理员">
          <el-tag :type="isSuperAdmin ? 'success' : 'info'">
            {{ isSuperAdmin ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="24">
      <!-- 权限测试 -->
      <el-col :span="12">
        <el-card class="test-card" shadow="never">
          <template #header>
            <span>权限测试结果</span>
          </template>
          
          <div class="test-list">
            <div
              v-for="test in permissionTests"
              :key="test.name"
              class="test-item"
            >
              <span class="test-name">{{ test.name }}</span>
              <div class="test-result">
                <el-icon v-if="test.loading" class="is-loading">
                  <Loading />
                </el-icon>
                <el-tag v-else :type="test.result ? 'success' : 'danger'" size="small">
                  {{ test.result ? '有权限' : '无权限' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 角色测试 -->
      <el-col :span="12">
        <el-card class="test-card" shadow="never">
          <template #header>
            <span>角色测试结果</span>
          </template>
          
          <div class="test-list">
            <div
              v-for="test in roleTests"
              :key="test.name"
              class="test-item"
            >
              <span class="test-name">{{ test.name }}</span>
              <div class="test-result">
                <el-icon v-if="test.loading" class="is-loading">
                  <Loading />
                </el-icon>
                <el-tag v-else :type="test.result ? 'success' : 'danger'" size="small">
                  {{ test.result ? '拥有角色' : '无此角色' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 权限指令测试 -->
    <el-card class="directive-test-card" shadow="never">
      <template #header>
        <span>权限指令测试</span>
      </template>
      
      <div class="directive-examples">
        <h4>以下按钮根据权限动态显示/隐藏：</h4>
        
        <div class="button-group">
          <el-button v-permission="'user:read'" type="primary">
            用户查看权限 (user:read)
          </el-button>
          
          <el-button v-permission="'user:write'" type="success">
            用户编辑权限 (user:write)
          </el-button>
          
          <el-button v-permission="'user:delete'" type="danger">
            用户删除权限 (user:delete)
          </el-button>
          
          <el-button v-permission="'system:manage'" type="warning">
            系统管理权限 (system:manage)
          </el-button>
        </div>

        <div class="button-group">
          <el-button v-role="'超级管理员'" type="primary">
            超级管理员可见
          </el-button>
          
          <el-button v-role="'系统管理员'" type="success">
            系统管理员可见
          </el-button>
          
          <el-button v-role="'普通用户'" type="info">
            普通用户可见
          </el-button>
          
          <el-button v-super-admin type="danger">
            仅超级管理员可见
          </el-button>
        </div>

        <div class="button-group">
          <el-button v-permission="{ permissions: ['user:read', 'user:write'], mode: 'any' }" type="primary">
            有用户读取或编辑权限即可见
          </el-button>
          
          <el-button v-permission="{ permissions: ['user:read', 'user:write', 'user:delete'], mode: 'all' }" type="danger">
            需要所有用户权限才可见
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.permission-test {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.user-info-card,
.test-card,
.directive-test-card {
  margin-bottom: 24px;
}

.test-list {
  max-height: 400px;
  overflow-y: auto;
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.test-item:last-child {
  border-bottom: none;
}

.test-name {
  font-family: 'Courier New', monospace;
  color: #333;
  font-weight: 500;
}

.test-result {
  display: flex;
  align-items: center;
}

.directive-examples h4 {
  color: #333;
  margin-bottom: 16px;
}

.button-group {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

:deep(.el-descriptions__body .el-descriptions__table .el-descriptions-item__cell) {
  padding: 12px;
}
</style>