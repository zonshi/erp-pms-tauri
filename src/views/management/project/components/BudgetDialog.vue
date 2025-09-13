<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增预算项' : '编辑预算项'"
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
      <el-form-item label="项目名称" prop="item_name">
        <el-input
          v-model="formData.item_name"
          placeholder="请输入预算项目名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="预算类别" prop="category">
        <el-select
          v-model="formData.category"
          placeholder="请选择预算类别"
          style="width: 100%"
        >
          <el-option
            v-for="option in BudgetCategoryOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="计划金额" prop="planned_amount">
        <el-input
          v-model="formData.planned_amount"
          placeholder="请输入计划金额"
          type="number"
          min="0"
          step="0.01"
        >
          <template #prepend>￥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="实际金额" prop="actual_amount">
        <el-input
          v-model="formData.actual_amount"
          placeholder="请输入实际金额（可选）"
          type="number"
          min="0"
          step="0.01"
        >
          <template #prepend>￥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="备注" prop="remarks">
        <el-input
          v-model="formData.remarks"
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
import type { ProjectBudget } from '../../../../types/project';
import { BudgetCategoryOptions } from '../../../../types/project';
import { ProjectBudgetService } from '../../../../service/project';

// Props
interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  budget?: ProjectBudget | null;
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

const formData = ref<Omit<ProjectBudget, 'id'>>({
  project_id: props.projectId,
  item_name: '',
  category: '',
  planned_amount: 0,
  actual_amount: 0,
  remarks: ''
});

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 表单验证规则
const rules: FormRules = {
  item_name: [
    { required: true, message: '请输入预算项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '预算项目名称长度应在 2-100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择预算类别', trigger: 'change' }
  ],
  planned_amount: [
    { required: true, message: '请输入计划金额', trigger: 'blur' },
    { 
      validator: (_rule: any, value: any, callback: any) => {
        if (value <= 0) {
          callback(new Error('计划金额必须大于0'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ],
  actual_amount: [
    { 
      validator: (_rule: any, value: any, callback: any) => {
        if (value !== undefined && value !== null && value !== '' && value < 0) {
          callback(new Error('实际金额不能为负数'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ]
};

// 方法
const resetForm = () => {
  formData.value = {
    project_id: props.projectId,
    item_name: '',
    category: '',
    planned_amount: 0,
    actual_amount: 0,
    remarks: ''
  };
  formRef.value?.clearValidate();
};

const initializeForm = () => {
  if (props.mode === 'edit' && props.budget) {
    formData.value = {
      project_id: props.budget.project_id,
      item_name: props.budget.item_name,
      category: props.budget.category,
      planned_amount: props.budget.planned_amount,
      actual_amount: props.budget.actual_amount || 0,
      remarks: props.budget.remarks || ''
    };
  } else {
    resetForm();
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
      planned_amount: Number(formData.value.planned_amount),
      actual_amount: formData.value.actual_amount ? Number(formData.value.actual_amount) : undefined
    };

    if (props.mode === 'create') {
      // 创建预算项
      await ProjectBudgetService.createBudgetItem(submitData, 1); // TODO: 获取真实用户ID
      ElMessage.success('预算项创建成功');
    } else {
      // 更新预算项
      if (!props.budget?.id) {
        throw new Error('预算项ID不存在');
      }
      await ProjectBudgetService.updateBudgetItem(props.budget.id, submitData, 1); // TODO: 获取真实用户ID
      ElMessage.success('预算项更新成功');
    }

    visible.value = false;
    emit('submit');
  } catch (error) {
    console.error('预算项操作失败:', error);
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