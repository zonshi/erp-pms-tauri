<template>
  <div class="project-budget-tab">
    <div class="tab-header">
      <div class="header-left">
        <h3>预算管理</h3>
        <p>管理项目预算分配和实际支出</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreateBudget">
          新增预算项
        </el-button>
      </div>
    </div>

    <div class="budget-content" v-loading="loading">
      <!-- 预算概览 -->
      <div class="budget-overview">
        <el-card>
          <template #header>
            <span>预算概览</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">￥{{ formatNumber(budgetSummary.total_planned) }}</div>
                <div class="overview-label">计划预算</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">￥{{ formatNumber(budgetSummary.total_actual) }}</div>
                <div class="overview-label">实际支出</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ budgetSummary.utilization_rate.toFixed(1) }}%</div>
                <div class="overview-label">使用率</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">￥{{ formatNumber(budgetSummary.total_planned - budgetSummary.total_actual) }}</div>
                <div class="overview-label">剩余预算</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 预算列表 -->
      <div class="budget-table">
        <el-card>
          <template #header>
            <span>预算明细</span>
          </template>
          <el-table :data="budgets" style="width: 100%">
            <el-table-column prop="item_name" label="项目名称" width="200" />
            <el-table-column prop="category" label="类别" width="120">
              <template #default="{ row }">
                <el-tag>{{ getCategoryLabel(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planned_amount" label="计划金额" width="120" align="right">
              <template #default="{ row }">
                ￥{{ formatNumber(row.planned_amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="actual_amount" label="实际支出" width="120" align="right">
              <template #default="{ row }">
                ￥{{ formatNumber(row.actual_amount || 0) }}
              </template>
            </el-table-column>
            <el-table-column label="执行率" width="100" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="getExecutionRate(row)"
                  :status="getProgressStatus(getExecutionRate(row))"
                  type="circle"
                  :width="50"
                />
              </template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditBudget(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBudget(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && budgets.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Money /></el-icon>
        <p>暂无预算项目</p>
        <el-button type="primary" @click="handleCreateBudget">创建第一个预算项</el-button>
      </div>
    </div>

    <!-- 预算项对话框 -->
    <BudgetDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :budget="currentBudget"
      :project-id="projectId"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Money } from '@element-plus/icons-vue';
import type { Project, ProjectBudget } from '../../../../types/project';
import { BudgetCategoryOptions } from '../../../../types/project';
import { ProjectBudgetService } from '../../../../service/project';
import BudgetDialog from './BudgetDialog.vue';

// Props
interface Props {
  project: Project;
  projectId: number;
}

const props = defineProps<Props>();

// 响应式数据
const loading = ref(false);
const budgets = ref<ProjectBudget[]>([]);
const budgetSummary = ref({
  total_planned: 0,
  total_actual: 0,
  utilization_rate: 0,
  categories: [] as Array<{ category: string; planned_amount: number; actual_amount: number; }>
});
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentBudget = ref<ProjectBudget | null>(null);

// 方法
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

const getCategoryLabel = (category: string): string => {
  const option = BudgetCategoryOptions.find(opt => opt.value === category);
  return option?.label || category;
};

const getExecutionRate = (budget: ProjectBudget): number => {
  if (!budget.planned_amount || budget.planned_amount === 0) return 0;
  return Math.round(((budget.actual_amount || 0) / budget.planned_amount) * 100);
};

const getProgressStatus = (rate: number) => {
  if (rate > 100) return 'exception';
  if (rate === 100) return 'success';
  if (rate >= 80) return 'warning';
  return undefined;
};

const loadBudgetData = async () => {
  loading.value = true;
  try {
    const [budgetList, summary] = await Promise.all([
      ProjectBudgetService.getProjectBudgets(props.projectId),
      ProjectBudgetService.getProjectBudgetSummary(props.projectId)
    ]);
    
    budgets.value = budgetList;
    budgetSummary.value = summary;
  } catch (error) {
    console.error('加载项目预算失败:', error);
    ElMessage.error('加载项目预算失败');
  } finally {
    loading.value = false;
  }
};

const handleCreateBudget = () => {
  dialogMode.value = 'create';
  currentBudget.value = null;
  dialogVisible.value = true;
};

const handleEditBudget = (budget: ProjectBudget) => {
  dialogMode.value = 'edit';
  currentBudget.value = budget;
  dialogVisible.value = true;
};

const handleDeleteBudget = async (budget: ProjectBudget) => {
  try {
    await ElMessageBox.confirm('确定要删除这个预算项吗？', '确认删除', {
      type: 'warning'
    });
    
    await ProjectBudgetService.deleteBudgetItem(budget.id!);
    ElMessage.success('删除成功');
    await loadBudgetData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除预算项失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const handleDialogSubmit = async () => {
  dialogVisible.value = false;
  await loadBudgetData();
};

// 生命周期
onMounted(() => {
  loadBudgetData();
});
</script>

<style scoped>
.project-budget-tab {
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
  color: #606266;
  font-size: 14px;
}

.budget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.budget-overview {
  flex-shrink: 0;
}

.overview-item {
  text-align: center;
  padding: 16px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.budget-table {
  flex: 1;
  min-height: 400px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 16px;
}

/* 自定义滚动条 */
.project-budget-tab::-webkit-scrollbar {
  width: 6px;
}

.project-budget-tab::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.project-budget-tab::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.project-budget-tab::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>