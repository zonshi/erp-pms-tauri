<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Refresh, Search } from '@element-plus/icons-vue';
import { PermissionService } from '../../../service/auth';
import type { Permission, PaginationRequest } from '../../../types/auth';
import PermissionDialog from './PermissionDialog.vue';

// 响应式数据
const loading = ref(false);
const permissions = ref<Permission[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentPermission = ref<Permission | null>(null);

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
const loadPermissions = async () => {
  loading.value = true;
  try {
    const params: PaginationRequest = {
      page: pagination.page,
      page_size: pagination.page_size,
      search: searchForm.search || undefined,
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await PermissionService.getPermissions(params);
    
    if (result.success && result.data) {
      permissions.value = result.data.data;
      pagination.total = result.data.total;
      pagination.total_pages = result.data.total_pages;
    } else {
      ElMessage.error(result.error || '获取权限列表失败');
    }
  } catch (error) {
    console.error('加载权限列表失败:', error);
    ElMessage.error('加载权限列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadPermissions();
};

const handleReset = () => {
  searchForm.search = '';
  pagination.page = 1;
  loadPermissions();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadPermissions();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize;
  pagination.page = 1;
  loadPermissions();
};

const handleCreate = () => {
  dialogMode.value = 'create';
  currentPermission.value = null;
  dialogVisible.value = true;
};

const handleEdit = (permission: Permission) => {
  dialogMode.value = 'edit';
  currentPermission.value = { ...permission };
  dialogVisible.value = true;
};

const handleDelete = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${permission.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const result = await PermissionService.deletePermission(permission.id);
    if (result.success) {
      ElMessage.success('权限删除成功');
      loadPermissions();
    } else {
      ElMessage.error(result.error || '删除权限失败');
    }
  } catch {
    // 用户取消删除
  }
};

const handleDialogSubmit = () => {
  loadPermissions();
  dialogVisible.value = false;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 生命周期
onMounted(() => {
  loadPermissions();
});
</script>

<template>
  <div class="permission-management">
    <div class="page-header">
      <h2>权限管理</h2>
      <p>管理系统权限，定义用户可执行的操作</p>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="请输入权限名称或描述"
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
      <el-button type="primary" :icon="Plus" @click="handleCreate">新增权限</el-button>
      <el-button :icon="Refresh" @click="loadPermissions">刷新</el-button>
    </el-card>

    <!-- 权限表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="permissions"
        :loading="loading"
        row-key="id"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="name" label="权限名称" min-width="200">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="300">
          <template #default="{ row }">
            {{ row.description || '-' }}
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
            >
              编辑
            </el-button>
            
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              @click="handleDelete(row)"
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

    <!-- 权限弹窗 -->
    <PermissionDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :permission="currentPermission"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<style scoped>
.permission-management {
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

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
}
</style>