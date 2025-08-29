<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Refresh, Search, Key, Lock, Unlock, ArrowDown } from '@element-plus/icons-vue';
import { UserService, RoleService } from '../../../service/auth';
import type { UserInfo, Role, UserStatus, PaginationRequest } from '../../../types/auth';
import UserDialog from './UserDialog.vue';

// 响应式数据
const loading = ref(false);
const users = ref<UserInfo[]>([]);
const roles = ref<Role[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentUser = ref<UserInfo | null>(null);

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0,
  total_pages: 0
});

// 搜索参数
const searchForm = reactive({
  search: '',
  status: ''
});

// 表格列配置
const tableColumns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'full_name', label: '姓名', minWidth: 120 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'roles', label: '角色', minWidth: 150 },
  { prop: 'created_at', label: '创建时间', width: 160 },
  { prop: 'actions', label: '操作', width: 280, fixed: 'right' }
];

// 用户状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '激活', value: 'active' },
  { label: '禁用', value: 'inactive' },
  { label: '暂停', value: 'suspended' }
];

// 计算属性
const statusTagType = computed(() => {
  return (status: UserStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'suspended': return 'warning';
      default: return 'info';
    }
  };
});

const statusText = computed(() => {
  return (status: UserStatus) => {
    switch (status) {
      case 'active': return '激活';
      case 'inactive': return '禁用';
      case 'suspended': return '暂停';
      default: return '未知';
    }
  };
});

// 方法
const loadUsers = async () => {
  loading.value = true;
  try {
    const params: PaginationRequest = {
      page: pagination.page,
      page_size: pagination.page_size,
      search: searchForm.search || undefined,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    // 如果有状态筛选，这里可以扩展参数
    const result = await UserService.getUsers(params);
    
    if (result.success && result.data) {
      users.value = result.data.data;
      pagination.total = result.data.total;
      pagination.total_pages = result.data.total_pages;
    } else {
      ElMessage.error(result.error || '获取用户列表失败');
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
    ElMessage.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    const result = await RoleService.getAllRoles();
    if (result.success && result.data) {
      roles.value = result.data;
    }
  } catch (error) {
    console.error('加载角色列表失败:', error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadUsers();
};

const handleReset = () => {
  searchForm.search = '';
  searchForm.status = '';
  pagination.page = 1;
  loadUsers();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadUsers();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize;
  pagination.page = 1;
  loadUsers();
};

const handleCreate = () => {
  dialogMode.value = 'create';
  currentUser.value = null;
  dialogVisible.value = true;
};

const handleEdit = (user: UserInfo) => {
  dialogMode.value = 'edit';
  currentUser.value = { ...user };
  dialogVisible.value = true;
};

const handleDelete = async (user: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const result = await UserService.deleteUser(user.id);
    if (result.success) {
      ElMessage.success('用户删除成功');
      loadUsers();
    } else {
      ElMessage.error(result.error || '删除用户失败');
    }
  } catch {
    // 用户取消删除
  }
};

const handleStatusChange = async (user: UserInfo, newStatus: UserStatus) => {
  try {
    const result = await UserService.updateUserStatus(user.id, newStatus);
    if (result.success) {
      ElMessage.success('用户状态更新成功');
      loadUsers();
    } else {
      ElMessage.error(result.error || '更新用户状态失败');
    }
  } catch (error) {
    console.error('更新用户状态失败:', error);
    ElMessage.error('更新用户状态失败');
  }
};

const handleResetPassword = async (user: UserInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${user.username}" 的密码吗？新密码将设置为默认密码。`,
      '确认重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // 设置默认密码为 "123456"
    const result = await UserService.resetUserPassword(user.id, '123456');
    if (result.success) {
      ElMessage.success('密码重置成功，新密码为：123456');
    } else {
      ElMessage.error(result.error || '重置密码失败');
    }
  } catch {
    // 用户取消重置
  }
};

const handleDialogSubmit = () => {
  loadUsers();
  dialogVisible.value = false;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const formatRoles = (roles: Role[] | undefined) => {
  if (!roles || roles.length === 0) return '无角色';
  return roles.map(role => role.name).join(', ');
};

// 生命周期
onMounted(() => {
  loadUsers();
  loadRoles();
});
</script>

<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理系统用户、分配角色和权限</p>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="请输入用户名、邮箱或姓名"
            :prefix-icon="Search"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 120px" clearable>
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="action-card" shadow="never">
      <el-button type="primary" :icon="Plus" @click="handleCreate">新增用户</el-button>
      <el-button :icon="Refresh" @click="loadUsers">刷新</el-button>
    </el-card>

    <!-- 用户表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="users"
        :loading="loading"
        row-key="id"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <strong>{{ row.username }}</strong>
          </template>
        </el-table-column>
        
        <el-table-column prop="email" label="邮箱" min-width="180" />
        
        <el-table-column prop="full_name" label="姓名" min-width="120">
          <template #default="{ row }">
            {{ row.full_name || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="roles" label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.id"
              size="small"
              style="margin-right: 4px"
            >
              {{ role.name }}
            </el-tag>
            <span v-if="!row.roles || row.roles.length === 0" class="text-muted">无角色</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            
            <el-dropdown @command="(command: string) => command === 'resetPassword' ? handleResetPassword(row) : handleStatusChange(row, command as UserStatus)">
              <el-button size="small">
                更多操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="resetPassword" :icon="Key">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'active'"
                    command="inactive"
                    :icon="Lock"
                  >
                    禁用用户
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status !== 'active'"
                    command="active"
                    :icon="Unlock"
                  >
                    启用用户
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="suspended"
                    :icon="Lock"
                    v-if="row.status !== 'suspended'"
                  >
                    暂停用户
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    :icon="Delete"
                    @click="handleDelete(row)"
                  >
                    删除用户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 用户弹窗 -->
    <UserDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :user="currentUser"
      :roles="roles"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
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

.search-card,
.action-card,
.table-card {
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
}
</style>