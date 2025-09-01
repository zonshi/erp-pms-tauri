<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增收付款' : '编辑收付款'"
    width="600px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      size="default"
    >
      <el-form-item label="收付款类型" prop="type">
        <el-radio-group v-model="formData.type" :disabled="mode === 'edit'">
          <el-radio label="income">收入</el-radio>
          <el-radio label="expense">支出</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="单据编号" prop="receipt_no">
        <el-input
          v-model="formData.receipt_no"
          :placeholder="mode === 'create' ? '系统自动生成或手动输入' : '不可修改'"
          :readonly="mode === 'edit'"
          maxlength="50"
        >
          <template v-if="mode === 'create'" #append>
            <el-button @click="generateReceiptNo">自动生成</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input
          v-model="formData.amount"
          placeholder="请输入金额"
          type="number"
          min="0"
          step="0.01"
        >
          <template #prepend>￥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="类别" prop="category">
        <el-input
          v-model="formData.category"
          placeholder="请输入收付款类别"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="对方名称" prop="counterparty">
        <el-input
          v-model="formData.counterparty"
          placeholder="请输入对方单位或个人名称"
          maxlength="100"
        />
      </el-form-item>

      <el-form-item label="支付方式" prop="payment_method">
        <el-select
          v-model="formData.payment_method"
          placeholder="请选择支付方式"
          style="width: 100%"
        >
          <el-option label="现金" value="cash" />
          <el-option label="银行转账" value="bank_transfer" />
          <el-option label="支票" value="check" />
          <el-option label="信用卡" value="credit_card" />
          <el-option label="支付宝" value="alipay" />
          <el-option label="微信支付" value="wechat_pay" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="交易日期" prop="transaction_date">
        <el-date-picker
          v-model="formData.transaction_date"
          type="date"
          placeholder="请选择交易日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="币种" prop="currency">
        <el-select
          v-model="formData.currency"
          placeholder="请选择币种"
          style="width: 100%"
        >
          <el-option label="人民币(CNY)" value="CNY" />
          <el-option label="美元(USD)" value="USD" />
          <el-option label="欧元(EUR)" value="EUR" />
          <el-option label="英镑(GBP)" value="GBP" />
          <el-option label="日元(JPY)" value="JPY" />
        </el-select>
      </el-form-item>

      <el-form-item 
        v-if="formData.currency !== 'CNY'" 
        label="汇率" 
        prop="exchange_rate"
      >
        <el-input
          v-model="formData.exchange_rate"
          placeholder="请输入汇率"
          type="number"
          min="0"
          step="0.0001"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态"
          style="width: 100%"
        >
          <el-option label="草稿" value="draft" />
          <el-option label="待审批" value="pending" />
          <el-option label="已批准" value="approved" />
          <el-option label="已支付" value="paid" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入备注信息（可选）"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ mode === 'create' ? '创建' : '更新' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import type { PaymentReceipt } from '../../../../types/project';
import { PaymentReceiptService } from '../../../../service/project';

// Props
interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  payment?: PaymentReceipt | null;
  projectId: number;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submit'): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = ref<Omit<PaymentReceipt, 'id'>>({
  project_id: props.projectId,
  receipt_no: '',
  type: 'income',
  amount: 0,
  currency: 'CNY',
  exchange_rate: undefined,
  category: '',
  counterparty: '',
  payment_method: 'bank_transfer',
  transaction_date: '',
  description: '',
  status: 'draft',
  contract_id: undefined,
  bank_account_id: undefined
});

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 表单验证规则
const rules: FormRules = {
  type: [
    { required: true, message: '请选择收付款类型', trigger: 'change' }
  ],
  receipt_no: [
    { required: true, message: '请输入单据编号', trigger: 'blur' },
    { min: 1, max: 50, message: '单据编号长度应在 1-50 个字符', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { 
      validator: (_rule: any, value: any, callback: any) => {
        if (value <= 0) {
          callback(new Error('金额必须大于0'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ],
  category: [
    { required: true, message: '请输入收付款类别', trigger: 'blur' },
    { max: 50, message: '类别长度不能超过 50 个字符', trigger: 'blur' }
  ],
  counterparty: [
    { required: true, message: '请输入对方名称', trigger: 'blur' },
    { max: 100, message: '对方名称长度不能超过 100 个字符', trigger: 'blur' }
  ],
  payment_method: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
  ],
  transaction_date: [
    { required: true, message: '请选择交易日期', trigger: 'change' }
  ],
  currency: [
    { required: true, message: '请选择币种', trigger: 'change' }
  ],
  exchange_rate: [
    { 
      validator: (_rule: any, value: any, callback: any) => {
        if (formData.value.currency !== 'CNY' && (!value || value <= 0)) {
          callback(new Error('非人民币交易必须填写汇率'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
};

// 方法
const resetForm = () => {
  formData.value = {
    project_id: props.projectId,
    receipt_no: '',
    type: 'income',
    amount: 0,
    currency: 'CNY',
    exchange_rate: undefined,
    category: '',
    counterparty: '',
    payment_method: 'bank_transfer',
    transaction_date: '',
    description: '',
    status: 'draft',
    contract_id: undefined,
    bank_account_id: undefined
  };
  formRef.value?.clearValidate();
};

const initializeForm = () => {
  if (props.mode === 'edit' && props.payment) {
    formData.value = {
      project_id: props.payment.project_id,
      receipt_no: props.payment.receipt_no,
      type: props.payment.type,
      amount: props.payment.amount,
      currency: props.payment.currency,
      exchange_rate: props.payment.exchange_rate,
      category: props.payment.category,
      counterparty: props.payment.counterparty,
      payment_method: props.payment.payment_method,
      transaction_date: props.payment.transaction_date,
      description: props.payment.description || '',
      status: props.payment.status,
      contract_id: props.payment.contract_id,
      bank_account_id: props.payment.bank_account_id
    };
  } else {
    resetForm();
    // 设置默认交易日期为今天
    formData.value.transaction_date = new Date().toISOString().split('T')[0];
  }
};

const generateReceiptNo = async () => {
  try {
    const receiptNo = await PaymentReceiptService.generateReceiptNo(formData.value.type);
    formData.value.receipt_no = receiptNo;
    ElMessage.success('单据编号生成成功');
  } catch (error) {
    console.error('生成单据编号失败:', error);
    ElMessage.error('生成单据编号失败');
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 验证表单
    await formRef.value.validate();
    
    loading.value = true;

    // 处理数字字段
    const submitData = {
      ...formData.value,
      amount: Number(formData.value.amount),
      exchange_rate: formData.value.exchange_rate ? Number(formData.value.exchange_rate) : undefined
    };

    if (props.mode === 'create') {
      // 创建收付款
      await PaymentReceiptService.createPayment(submitData, 1); // TODO: 获取真实用户ID
      ElMessage.success('收付款创建成功');
    } else {
      // 更新收付款
      if (!props.payment?.id) {
        throw new Error('收付款ID不存在');
      }
      await PaymentReceiptService.updatePayment(props.payment.id, submitData, 1); // TODO: 获取真实用户ID
      ElMessage.success('收付款更新成功');
    }

    visible.value = false;
    emit('submit');
  } catch (error) {
    console.error('收付款操作失败:', error);
    ElMessage.error(props.mode === 'create' ? '创建失败' : '更新失败');
  } finally {
    loading.value = false;
  }
};

// 监听器
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      nextTick(() => {
        initializeForm();
      });
    }
  }
);

watch(
  () => props.projectId,
  (newProjectId) => {
    formData.value.project_id = newProjectId;
  }
);

// 监听币种变化，重置汇率
watch(
  () => formData.value.currency,
  (newCurrency) => {
    if (newCurrency === 'CNY') {
      formData.value.exchange_rate = undefined;
    }
  }
);

// 监听类型变化，自动更新单据编号前缀（仅在创建模式下）
watch(
  () => formData.value.type,
  () => {
    // 只在创建模式下生效，编辑模式下类型不可修改
    if (props.mode === 'create' && formData.value.receipt_no && (formData.value.receipt_no.startsWith('SK') || formData.value.receipt_no.startsWith('FK'))) {
      generateReceiptNo();
    }
  }
);
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea .el-input__count) {
  bottom: 8px;
  right: 10px;
}
</style>