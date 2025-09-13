<template>
  <div class="project-contracts-tab">
    <div class="tab-header">
      <div class="header-left">
        <h3>合同信息</h3>
        <p>管理与该项目相关的所有合同</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreateContract">
          新增合同
        </el-button>
      </div>
    </div>

    <div class="contracts-content" v-loading="loading">
      <el-table
        :data="contracts"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="contract_no" label="合同编号" width="150" />
        <el-table-column prop="title" label="合同标题" min-width="200" />
        <el-table-column prop="contract_type" label="合同类型" width="120" />
        <el-table-column prop="amount" label="合同金额" width="150" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="signed_at" label="签署日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.signed_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewContract(row)">
              查看
            </el-button>
            <el-button size="small" @click="handleEditContract(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-if="!loading && contracts.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Document /></el-icon>
        <p>暂无合同信息</p>
        <el-button type="primary" @click="handleCreateContract">创建第一个合同</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Document } from '@element-plus/icons-vue';
import type { Contract, Project } from '../../../../types/project';
import { ContractStatusOptions } from '../../../../types/project';
import { ContractService } from '../../../../service/project';

// Props
interface Props {
  project: Project;
  projectId: number;
}

const props = defineProps<Props>();

// 响应式数据
const loading = ref(false);
const contracts = ref<Contract[]>([]);

// 方法
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const getStatusText = (status: string): string => {
  const option = ContractStatusOptions.find(opt => opt.value === status);
  return option?.label || status;
};

const getStatusTagType = (status: string) => {
  const option = ContractStatusOptions.find(opt => opt.value === status);
  switch (option?.color) {
    case '#67c23a': return 'success';
    case '#409eff': return 'primary';
    case '#f56c6c': return 'danger';
    case '#e6a23c': return 'warning';
    default: return 'info';
  }
};

const loadContracts = async () => {
  loading.value = true;
  try {
    contracts.value = await ContractService.getContractsByProject(props.projectId);
  } catch (error) {
    console.error('加载合同列表失败:', error);
    ElMessage.error('加载合同列表失败');
  } finally {
    loading.value = false;
  }
};

const handleCreateContract = () => {
  ElMessage.info('合同创建功能待开发');
};

const handleViewContract = (_contract: Contract) => {
  ElMessage.info('合同查看功能待开发');
};

const handleEditContract = (_contract: Contract) => {
  ElMessage.info('合同编辑功能待开发');
};

// 生命周期
onMounted(() => {
  loadContracts();
});
</script>

<style scoped>
.project-contracts-tab {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #303133;
}

.header-left p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.contracts-content {
  flex: 1;
  min-height: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 16px;
}

/* 自定义滚动条样式 */
.project-contracts-tab::-webkit-scrollbar {
  width: 6px;
}

.project-contracts-tab::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.project-contracts-tab::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.project-contracts-tab::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>