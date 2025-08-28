<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { RoleService } from '../../../service/auth';
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../../../types/auth';

// Props
interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  role: Role | null;
  permissions: Permission[];
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
  description: '',
  permission_ids: [] as number[]
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/, message: '角色名称只能包含中文、字母、数字、下划线、连字符和空格', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
};

// 计算属性
const dialogTitle = computed(() => {
  return props.mode === 'create' ? '新增角色' : '编辑角色';
});

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 权限选择相关
const checkAll = ref(false);
const isIndeterminate = ref(false);

// 计算权限选择状态
const updateCheckAllStatus = () => {
  const checkedCount = formData.permission_ids.length;
  const totalCount = props.permissions.length;
  
  checkAll.value = checkedCount === totalCount && totalCount > 0;
  isIndeterminate.value = checkedCount > 0 && checkedCount < totalCount;
};

// 全选/取消全选
const handleCheckAllChange = (val: boolean) => {
  if (val) {
    formData.permission_ids = props.permissions.map(p => p.id);
  } else {
    formData.permission_ids = [];
  }
  isIndeterminate.value = false;
};

// 权限选择变化
const handlePermissionChange = () => {
  updateCheckAllStatus();
};

// 方法
const resetForm = () => {
  formData.name = '';
  formData.description = '';
  formData.permission_ids = [];
  checkAll.value = false;
  isIndeterminate.value = false;
  
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const loadFormData = () => {
  if (props.mode === 'edit' && props.role) {
    formData.name = props.role.name;
    formData.description = props.role.description || '';
    formData.permission_ids = props.role.permissions?.map(p => p.id) || [];
    updateCheckAllStatus();
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
      // 创建角色
      const request: CreateRoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        permission_ids: formData.permission_ids.length > 0 ? formData.permission_ids : undefined
      };
      
      const result = await RoleService.createRole(request);
      if (result.success) {
        ElMessage.success('角色创建成功');
        emit('submit');
      } else {
        ElMessage.error(result.error || '创建角色失败');
      }
    } else {
      // 更新角色
      if (!props.role) return;
      
      const request: UpdateRoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        permission_ids: formData.permission_ids
      };
      
      const result = await RoleService.updateRole(props.role.id, request);
      if (result.success) {
        ElMessage.success('角色更新成功');
        emit('submit');
      } else {
        ElMessage.error(result.error || '更新角色失败');
      }
    }
  } catch (error) {
    console.error('提交角色信息失败:', error);
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

// 监听角色数据变化
watch(
  () => props.role,
  () => {
    if (props.visible) {
      loadFormData();
    }
  }
);

// 监听权限变化
watch(
  () => props.permissions,
  () => {
    if (props.visible) {
      updateCheckAllStatus();
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="700px"
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
      <el-form-item label="角色名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入角色名称"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="权限分配">
        <div class="permission-container">
          <div class="permission-header">
            <el-checkbox
              v-model="checkAll"
              :indeterminate="isIndeterminate"
              @change="handleCheckAllChange"
            >
              全选权限
            </el-checkbox>
            <span class="permission-count">
              已选择 {{ formData.permission_ids.length }} / {{ permissions.length }} 个权限
            </span>
          </div>
          
          <el-divider />
          
          <div class="permission-list">
            <el-checkbox-group
              v-model="formData.permission_ids"
              @change="handlePermissionChange"
            >
              <div class="permission-grid">
                <div
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="permission-item"
                >
                  <el-checkbox :value="permission.id">
                    <div class="permission-content">
                      <div class="permission-name">{{ permission.name }}</div>
                      <div class="permission-description">
                        {{ permission.description || '无描述' }}
                      </div>
                    </div>
                  </el-checkbox>
                </div>
              </div>
            </el-checkbox-group>
          </div>
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

.permission-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.permission-count {
  color: #606266;
  font-size: 14px;
}

.permission-list {
  max-height: 300px;
  overflow-y: auto;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.permission-item {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.3s;
}

.permission-item:hover {
  border-color: #409eff;
  background-color: #f7f9fc;
}

.permission-content {
  margin-left: 8px;
}

.permission-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.permission-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

:deep(.el-checkbox) {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

:deep(.el-checkbox__label) {
  flex: 1;
  line-height: 1.4;
}

:deep(.el-divider) {
  margin: 12px 0;
}
</style>