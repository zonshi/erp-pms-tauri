<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增里程碑' : '编辑里程碑'"
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
      <el-form-item label="里程碑标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入里程碑标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入里程碑描述（可选）"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-select
          v-model="formData.priority"
          placeholder="请选择优先级"
          style="width: 100%"
        >
          <el-option
            v-for="option in MilestonePriorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <span :style="{ color: option.color }">{{ option.label }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="计划日期" prop="planned_date">
        <el-date-picker
          v-model="formData.planned_date"
          type="date"
          placeholder="请选择计划完成日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态"
          style="width: 100%"
        >
          <el-option
            v-for="option in MilestoneStatusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <span :style="{ color: option.color }">{{ option.label }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item 
        v-if="formData.status === 'completed'" 
        label="实际完成日期" 
        prop="actual_date"
      >
        <el-date-picker
          v-model="formData.actual_date"
          type="date"
          placeholder="请选择实际完成日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
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
import type { ProjectMilestone } from '../../../../types/project';
import { MilestoneStatusOptions, MilestonePriorityOptions } from '../../../../types/project';
import { ProjectMilestoneService } from '../../../../service/project';

// Props
interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  milestone?: ProjectMilestone | null;
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

const formData = ref<Omit<ProjectMilestone, 'id'>>({
  project_id: props.projectId,
  title: '',
  description: '',
  planned_date: '',
  actual_date: '',
  status: 'pending',
  priority: 'medium'
});

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入里程碑标题', trigger: 'blur' },
    { min: 2, max: 100, message: '里程碑标题长度应在 2-100 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  planned_date: [
    { required: true, message: '请选择计划完成日期', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  actual_date: [
    { 
      validator: (_rule: any, value: any, callback: any) => {
        if (formData.value.status === 'completed' && !value) {
          callback(new Error('已完成状态必须填写实际完成日期'));
        } else {
          callback();
        }
      }, 
      trigger: 'change' 
    }
  ]
};

// 方法
const resetForm = () => {
  formData.value = {
    project_id: props.projectId,
    title: '',
    description: '',
    planned_date: '',
    actual_date: '',
    status: 'pending',
    priority: 'medium'
  };
  formRef.value?.clearValidate();
};

const initializeForm = () => {
  if (props.mode === 'edit' && props.milestone) {
    formData.value = {
      project_id: props.milestone.project_id,
      title: props.milestone.title,
      description: props.milestone.description || '',
      planned_date: props.milestone.planned_date,
      actual_date: props.milestone.actual_date || '',
      status: props.milestone.status,
      priority: props.milestone.priority
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

    const submitData = {
      ...formData.value,
      actual_date: formData.value.actual_date || undefined
    };

    if (props.mode === 'create') {
      // 创建里程碑
      await ProjectMilestoneService.createMilestone(submitData, 1); // TODO: 获取真实用户ID
      ElMessage.success('里程碑创建成功');
    } else {
      // 更新里程碑
      if (!props.milestone?.id) {
        throw new Error('里程碑ID不存在');
      }
      await ProjectMilestoneService.updateMilestone(props.milestone.id, submitData, 1); // TODO: 获取真实用户ID
      ElMessage.success('里程碑更新成功');
    }

    visible.value = false;
    emit('submit');
  } catch (error) {
    console.error('里程碑操作失败:', error);
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

// 监听状态变化，自动设置实际完成日期
watch(
  () => formData.value.status,
  (newStatus) => {
    if (newStatus === 'completed' && !formData.value.actual_date) {
      formData.value.actual_date = new Date().toISOString().split('T')[0];
    } else if (newStatus !== 'completed') {
      formData.value.actual_date = '';
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