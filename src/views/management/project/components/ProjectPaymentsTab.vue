<template>
  <div class="project-payments-tab">
    <div class="tab-header">
      <div class="header-left">
        <h3>收付款管理</h3>
        <p>管理项目相关的收付款记录</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreatePayment">
          新增收付款
        </el-button>
      </div>
    </div>

    <div class="payments-content" v-loading="loading">
      <!-- 收付款概览 -->
      <div class="payments-overview">
        <el-card>
          <template #header>
            <span>收付款概览</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value positive">￥{{ formatNumber(paymentSummary.total_income) }}</div>
                <div class="overview-label">总收入</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value negative">￥{{ formatNumber(paymentSummary.total_expense) }}</div>
                <div class="overview-label">总支出</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value" :class="paymentSummary.net_amount >= 0 ? 'positive' : 'negative'">
                  ￥{{ formatNumber(paymentSummary.net_amount) }}
                </div>
                <div class="overview-label">净收入</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value pending">￥{{ formatNumber(paymentSummary.pending_income + paymentSummary.pending_expense) }}</div>
                <div class="overview-label">待处理</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 收付款列表 -->
      <div class="payments-table">
        <el-card>
          <template #header>
            <div class="table-header">
              <span>收付款列表</span>
              <div class="table-filters">
                <el-select v-model="filterType" placeholder="类型" style="width: 120px; margin-right: 10px">
                  <el-option label="全部" value="" />
                  <el-option label="收入" value="income" />
                  <el-option label="支出" value="expense" />
                </el-select>
                <el-select v-model="filterStatus" placeholder="状态" style="width: 120px">
                  <el-option label="全部" value="" />
                  <el-option label="草稿" value="draft" />
                  <el-option label="待审批" value="pending" />
                  <el-option label="已批准" value="approved" />
                  <el-option label="已支付" value="paid" />
                  <el-option label="已拒绝" value="rejected" />
                </el-select>
              </div>
            </div>
          </template>
          <el-table :data="filteredPayments" style="width: 100%">
            <el-table-column prop="receipt_no" label="单据编号" width="140" />
            <el-table-column prop="type" label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                  {{ row.type === 'income' ? '收入' : '支出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.type === 'income' ? 'amount-positive' : 'amount-negative'">
                  {{ row.type === 'income' ? '+' : '-' }}￥{{ formatNumber(row.amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="类别" width="120" />
            <el-table-column prop="counterparty" label="对方" width="150" show-overflow-tooltip />
            <el-table-column prop="payment_method" label="支付方式" width="120" />
            <el-table-column prop="transaction_date" label="交易日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.transaction_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-dropdown @command="(command: string) => handlePaymentAction(command, row)">
                  <el-button size="small" type="primary">
                    编辑<el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>编辑
                      </el-dropdown-item>
                      <el-dropdown-item 
                        v-if="row.status !== 'paid'"
                        command="markPaid"
                      >
                        <el-icon><Check /></el-icon>标记已支付
                      </el-dropdown-item>
                      <el-dropdown-item 
                        v-if="row.status === 'paid'"
                        command="markPaid"
                        disabled
                      >
                        <el-icon><Check /></el-icon>已支付
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && payments.length === 0" class="empty-state">
        <el-icon class="empty-icon"><CreditCard /></el-icon>
        <p>暂无收付款记录</p>
        <el-button type="primary" @click="handleCreatePayment">创建第一条收付款记录</el-button>
      </div>
    </div>

    <!-- 收付款对话框 -->
    <PaymentDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :payment="currentPayment"
      :project-id="projectId"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, CreditCard, ArrowDown, Edit, Check, Delete } from '@element-plus/icons-vue';
import type { Project, PaymentReceipt } from '../../../../types/project';
import { PaymentReceiptService } from '../../../../service/project';
import PaymentDialog from './PaymentDialog.vue';

// Props
interface Props {
  project: Project;
  projectId: number;
}

const props = defineProps<Props>();

// 响应式数据
const loading = ref(false);
const payments = ref<PaymentReceipt[]>([]);
const paymentSummary = ref({
  total_income: 0,
  total_expense: 0,
  net_amount: 0,
  pending_income: 0,
  pending_expense: 0,
  paid_income: 0,
  paid_expense: 0,
  payment_by_month: [] as Array<{ month: string; income: number; expense: number; }>
});
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentPayment = ref<PaymentReceipt | null>(null);
const filterType = ref('');
const filterStatus = ref('');

// 计算属性
const filteredPayments = computed(() => {
  return payments.value.filter(payment => {
    const typeMatch = !filterType.value || payment.type === filterType.value;
    const statusMatch = !filterStatus.value || payment.status === filterStatus.value;
    return typeMatch && statusMatch;
  });
});

// 方法
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审批',
    'approved': '已批准',
    'paid': '已支付',
    'rejected': '已拒绝'
  };
  return statusMap[status] || status;
};

const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    'draft': 'info',
    'pending': 'warning',
    'approved': 'primary',
    'paid': 'success',
    'rejected': 'danger'
  };
  return typeMap[status] || 'info';
};

const loadPaymentData = async () => {
  loading.value = true;
  try {
    const [paymentList, summary] = await Promise.all([
      PaymentReceiptService.getProjectPayments(props.projectId),
      PaymentReceiptService.getProjectPaymentSummary(props.projectId)
    ]);
    
    payments.value = paymentList;
    paymentSummary.value = summary;
  } catch (error) {
    console.error('加载项目收付款失败:', error);
    ElMessage.error('加载项目收付款失败');
  } finally {
    loading.value = false;
  }
};

const handleCreatePayment = () => {
  dialogMode.value = 'create';
  currentPayment.value = null;
  dialogVisible.value = true;
};

const handlePaymentAction = async (command: string, payment: PaymentReceipt) => {
  switch (command) {
    case 'edit':
      handleEditPayment(payment);
      break;
    case 'markPaid':
      if (payment.status !== 'paid') {
        await handlePaymentPaid(payment);
      }
      break;
    case 'delete':
      await handleDeletePayment(payment);
      break;
  }
};

const handleEditPayment = (payment: PaymentReceipt) => {
  dialogMode.value = 'edit';
  currentPayment.value = payment;
  dialogVisible.value = true;
};

const handlePaymentPaid = async (payment: PaymentReceipt) => {
  try {
    await ElMessageBox.confirm('确定要标记这条收付款为已支付吗？', '确认操作', {
      type: 'info'
    });
    
    await PaymentReceiptService.updatePaymentStatus(payment.id!, 'paid', 1); // TODO: 获取真实用户ID
    ElMessage.success('收付款状态更新成功');
    await loadPaymentData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新收付款状态失败:', error);
      ElMessage.error('更新失败');
    }
  }
};

const handleDeletePayment = async (payment: PaymentReceipt) => {
  try {
    await ElMessageBox.confirm('确定要删除这条收付款记录吗？', '确认删除', {
      type: 'warning'
    });
    
    await PaymentReceiptService.deletePayment(payment.id!);
    ElMessage.success('删除成功');
    await loadPaymentData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除收付款失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const handleDialogSubmit = async () => {
  dialogVisible.value = false;
  await loadPaymentData();
};

// 生命周期
onMounted(() => {
  loadPaymentData();
});
</script>

<style scoped>
.project-payments-tab {
  height: 100%;
  overflow: hidden;
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
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.payments-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.payments-overview {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.overview-item {
  text-align: center;
  padding: 16px 0;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.overview-value.positive {
  color: #67c23a;
}

.overview-value.negative {
  color: #f56c6c;
}

.overview-value.pending {
  color: #e6a23c;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.payments-table {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-filters {
  display: flex;
  align-items: center;
}

/* 表格水平滚动控制 */
:deep(.el-table) {
  overflow-x: auto;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.amount-negative {
  color: #f56c6c;
  font-weight: 600;
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
.payments-content::-webkit-scrollbar,
:deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.payments-content::-webkit-scrollbar-track,
:deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.payments-content::-webkit-scrollbar-thumb,
:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.payments-content::-webkit-scrollbar-thumb:hover,
:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>