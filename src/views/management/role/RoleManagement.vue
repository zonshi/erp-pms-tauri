<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Refresh, Search, Setting } from '@element-plus/icons-vue';
import { RoleService, PermissionService } from '../../../service/auth';
import type { Role, Permission, PaginationRequest } from '../../../types/auth';
import RoleDialog from './RoleDialog.vue';

// 响应式数据
const loading = ref(false);
const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentRole = ref<Role | null>(null);

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0,
  total_pages: 0
});

// 搜索参数
const searchForm = reactive({
  search: ''
});

// 方法
const loadRoles = async () => {
  loading.value = true;
  try {
    const params: PaginationRequest = {
      page: pagination.page,
      page_size: pagination.page_size,
      search: searchForm.search || undefined,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await RoleService.getRoles(params);
    
    if (result.success && result.data) {
      roles.value = result.data.data;
      pagination.total = result.data.total;
      pagination.total_pages = result.data.total_pages;
    } else {
      ElMessage.error(result.error || '获取角色列表失败');
    }
  } catch (error) {
    console.error('加载角色列表失败:', error);
    ElMessage.error('加载角色列表失败');
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    const result = await PermissionService.getAllPermissions();
    if (result.success && result.data) {
      permissions.value = result.data;
    }
  } catch (error) {
    console.error('加载权限列表失败:', error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadRoles();
};

const handleReset = () => {
  searchForm.search = '';
  pagination.page = 1;
  loadRoles();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadRoles();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize;
  pagination.page = 1;
  loadRoles();
};

const handleCreate = () => {
  dialogMode.value = 'create';
  currentRole.value = null;
  dialogVisible.value = true;
};

const handleEdit = (role: Role) => {
  dialogMode.value = 'edit';
  currentRole.value = { ...role };
  dialogVisible.value = true;
};

const handleDelete = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const result = await RoleService.deleteRole(role.id);
    if (result.success) {
      ElMessage.success('角色删除成功');
      loadRoles();
    } else {
      ElMessage.error(result.error || '删除角色失败');
    }
  } catch {
    // 用户取消删除
  }
};

const handleDialogSubmit = () => {
  loadRoles();
  dialogVisible.value = false;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const formatPermissions = (permissions: Permission[] | undefined) => {
  if (!permissions || permissions.length === 0) return '无权限';
  return permissions.map(permission => permission.name).join(', ');
};

// 生命周期
onMounted(() => {
  loadRoles();
  loadPermissions();
});
</script>

<template>
  <div class="role-management">
    <div class="page-header">
      <h2>角色管理</h2>
      <p>管理系统角色和权限分配</p>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="请输入角色名称或描述"
            :prefix-icon="Search"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="action-card" shadow="never">
      <el-button type="primary" :icon="Plus" @click="handleCreate" v-permission="'role:create'">新增角色</el-button>
      <el-button :icon="Refresh" @click="loadRoles">刷新</el-button>
    </el-card>

    <!-- 角色表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="roles"
        :loading="loading"
        row-key="id"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="name" label="角色名称" min-width="150">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="permissions" label="权限" min-width="300">
          <template #default="{ row }">
            <div class="permissions-container">
              <el-tag
                v-for="permission in row.permissions?.slice(0, 3)"
                :key="permission.id"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ permission.name }}
              </el-tag>
              <el-tag
                v-if="row.permissions && row.permissions.length > 3"
                size="small"
                type="info"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                +{{ row.permissions.length - 3 }}
              </el-tag>
              <span v-if="!row.permissions || row.permissions.length === 0" class="text-muted">
                无权限
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              @click="handleEdit(row)"
              v-permission="'role:edit'"
            >
              编辑
            </el-button>
            
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              @click="handleDelete(row)"
              v-permission="'role:delete'"
            >
              删除
            </el-button>
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

    <!-- 角色弹窗 -->
    <RoleDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :role="currentRole"
      :permissions="permissions"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<style scoped>
.role-management {
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

.permissions-container {
  max-height: 60px;
  overflow: hidden;
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