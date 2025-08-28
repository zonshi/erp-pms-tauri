<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { PermissionService } from '../../../service/auth';
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '../../../types/auth';

// Props
interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  permission: Permission | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'submit': [];
}>();

// 响应式数据
const loading = ref(false);
const formRef = ref();

// 表单数据
const formData = reactive({
  name: '',
  description: ''
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 100, message: '权限名称长度在 2 到 100 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\-:\.]+$/, message: '权限名称只能包含字母、数字、下划线、连字符、冒号和点号', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
};

// 计算属性
const dialogTitle = computed(() => {
  return props.mode === 'create' ? '新增权限' : '编辑权限';
});

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 方法
const resetForm = () => {
  formData.name = '';
  formData.description = '';
  
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const loadFormData = () => {
  if (props.mode === 'edit' && props.permission) {
    formData.name = props.permission.name;
    formData.description = props.permission.description || '';
  } else {
    resetForm();
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    loading.value = true;
    
    if (props.mode === 'create') {
      // 创建权限
      const request: CreatePermissionRequest = {
        name: formData.name,
        description: formData.description || undefined
      };
      
      const result = await PermissionService.createPermission(request);
      if (result.success) {
        ElMessage.success('权限创建成功');
        emit('submit');
      } else {
        ElMessage.error(result.error || '创建权限失败');
      }
    } else {
      // 更新权限
      if (!props.permission) return;
      
      const request: UpdatePermissionRequest = {
        name: formData.name,
        description: formData.description || undefined
      };
      
      const result = await PermissionService.updatePermission(props.permission.id, request);
      if (result.success) {
        ElMessage.success('权限更新成功');
        emit('submit');
      } else {
        ElMessage.error(result.error || '更新权限失败');
      }
    }
  } catch (error) {
    console.error('提交权限信息失败:', error);
    ElMessage.error('操作失败');
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  dialogVisible.value = false;
};

// 监听对话框显示状态
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      loadFormData();
    }
  }
);

// 监听权限数据变化
watch(
  () => props.permission,
  () => {
    if (props.visible) {
      loadFormData();
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="权限名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入权限名称，如：user:read"
          style="width: 100%"
        />
        <div class="form-help-text">
          建议使用模块:操作的格式，如：user:read, user:write, project:manage
        </div>
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
          style="width: 100%"
        />
        <div class="form-help-text">
          简要描述此权限的用途和作用范围
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ mode === 'create' ? '创建' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  text-align: right;
}

.form-help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}
</style>