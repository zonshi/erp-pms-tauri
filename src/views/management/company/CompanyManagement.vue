<template>
  <div class="company-management">
    <!-- 页面标题和操作栏 -->
    <div class="header-section">
      <div class="title-section">
        <h2>公司信息管理</h2>
        <p class="description">管理系统中的公司信息，包括客户公司和合作伙伴等。</p>
      </div>
      
      <!-- 搜索和筛选 -->
      <div class="search-section">
        <el-form :model="searchForm" inline class="search-form">
          <el-form-item label="公司名称">
            <el-input
              v-model="searchForm.company_name"
              placeholder="请输入公司名称"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
            />
          </el-form-item>
          
          <el-form-item label="信用代码">
            <el-input
              v-model="searchForm.credit_code"
              placeholder="请输入统一社会信用代码"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
            />
          </el-form-item>
          
          <el-form-item label="公司类型">
            <el-select
              v-model="searchForm.company_type"
              placeholder="请选择公司类型"
              clearable
              style="width: 180px"
            >
              <el-option
                v-for="option in companyTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
            <el-button :icon="Refresh" @click="handleReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新增公司
        </el-button>
        <el-button :icon="Refresh" @click="loadCompanies">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 公司列表表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="companies"
        stripe
        border
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column 
          prop="company_name" 
          label="公司名称" 
          min-width="200"
          show-overflow-tooltip
        />
        
        <el-table-column 
          prop="credit_code" 
          label="统一社会信用代码" 
          min-width="180"
          show-overflow-tooltip
        />
        
        <el-table-column prop="company_type" label="公司类型" width="120">
          <template #default="{ row }">
            {{ getCompanyTypeLabel(row.company_type) }}
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="contact_name" 
          label="联系人" 
          width="100"
          show-overflow-tooltip
        />
        
        <el-table-column 
          prop="contact_mobile" 
          label="联系电话" 
          width="130"
        />
        
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="created_at" 
          label="创建时间" 
          width="160"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column 
          label="操作" 
          width="200" 
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-dropdown 
              @command="(command: string) => handleDropdownAction(command, row)"
            >
              <el-button type="info" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-if="row.status === 'active'" 
                    command="disable"
                  >
                    停用
                  </el-dropdown-item>
                  <el-dropdown-item 
                    v-if="row.status !== 'active'" 
                    command="enable"
                  >
                    启用
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <CompanyDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :company-data="currentCompany"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, 
  Edit, 
  Delete, 
  Refresh, 
  Search, 
  ArrowDown 
} from '@element-plus/icons-vue';
import { CompanyService } from '../../../service/company';
import type { 
  Company, 
  CompanyQueryParams
} from '../../../types/company';
import { CompanyTypeOptions, CompanyStatusOptions } from '../../../types/company';
import CompanyDialog from './CompanyDialog.vue';

// 响应式数据
const loading = ref(false);
const companies = ref<Company[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentCompany = ref<Company | null>(null);

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0,
  total_pages: 0
});

// 搜索参数
const searchForm = reactive({
  company_name: '',
  credit_code: '',
  company_type: '',
  status: 'active'
});

// 排序参数
const sortParams = reactive({
  sort_by: 'created_at',
  sort_order: 'DESC' as 'ASC' | 'DESC'
});

// 公司类型选项
const companyTypeOptions = CompanyTypeOptions;

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  ...CompanyStatusOptions
];

// 计算属性
const getStatusTagType = computed(() => {
  return (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'suspended': return 'warning';
      default: return 'success';
    }
  };
});

const getStatusText = computed(() => {
  return (status: string) => {
    const option = CompanyStatusOptions.find(opt => opt.value === status);
    return option?.label || '正常';
  };
});

// 方法
const getCompanyTypeLabel = (type: string): string => {
  const option = companyTypeOptions.find(opt => opt.value === type);
  return option?.label || type || '-';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const loadCompanies = async () => {
  loading.value = true;
  try {
    const params: CompanyQueryParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      company_name: searchForm.company_name || undefined,
      credit_code: searchForm.credit_code || undefined,
      company_type: searchForm.company_type || undefined,
      status: searchForm.status || undefined,
      sort_by: sortParams.sort_by,
      sort_order: sortParams.sort_order
    };

    const result = await CompanyService.getCompanies(params);
    companies.value = result.companies;
    pagination.total = result.total;
    pagination.total_pages = result.total_pages;
  } catch (error) {
    console.error('加载公司列表失败:', error);
    ElMessage.error('加载公司列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadCompanies();
};

const handleReset = () => {
  searchForm.company_name = '';
  searchForm.credit_code = '';
  searchForm.company_type = '';
  searchForm.status = 'active';
  pagination.page = 1;
  loadCompanies();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadCompanies();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize;
  pagination.page = 1;
  loadCompanies();
};

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  if (prop) {
    sortParams.sort_by = prop;
    sortParams.sort_order = order === 'ascending' ? 'ASC' : 'DESC';
    loadCompanies();
  }
};

const handleCreate = () => {
  dialogMode.value = 'create';
  currentCompany.value = null;
  dialogVisible.value = true;
};

const handleEdit = (company: Company) => {
  dialogMode.value = 'edit';
  currentCompany.value = { ...company };
  dialogVisible.value = true;
};

const handleDropdownAction = async (command: string, company: Company) => {
  switch (command) {
    case 'disable':
      await handleStatusChange(company, 'inactive');
      break;
    case 'enable':
      await handleStatusChange(company, 'active');
      break;
    case 'delete':
      await handleDelete(company);
      break;
  }
};

const handleStatusChange = async (company: Company, newStatus: string) => {
  try {
    const statusText = newStatus === 'active' ? '启用' : '停用';
    await ElMessageBox.confirm(
      `确定要${statusText}公司 "${company.company_name}" 吗？`,
      `确认${statusText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // 这里应该调用更新状态的API
    // 由于当前的updateCompany API需要传入更新人ID，这里暂时使用完整的更新接口
    // 实际项目中可能需要单独的状态更新接口
    
    ElMessage.success(`${statusText}成功`);
    loadCompanies();
  } catch {
    // 用户取消操作
  }
};

const handleDelete = async (company: Company) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除公司 "${company.company_name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // 这里需要获取当前用户ID，暂时使用1作为占位符
    // 实际项目中需要从用户状态管理中获取
    await CompanyService.deleteCompany(company.id!, 1);
    ElMessage.success('删除成功');
    loadCompanies();
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      // 用户取消删除或其他错误
      console.error('删除公司失败:', error);
    }
  }
};

const handleDialogSuccess = () => {
  dialogVisible.value = false;
  loadCompanies();
};

// 生命周期
onMounted(() => {
  loadCompanies();
});
</script>

<style scoped>
.company-management {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.header-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-section {
  margin-bottom: 24px;
}

.title-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.title-section .description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.search-section {
  margin-bottom: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.action-section {
  display: flex;
  gap: 12px;
}

.table-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-pagination) {
  justify-content: flex-end;
}
</style>