<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { UserService } from '../../../service/auth';
import { UserStatus } from '../../../types/auth';
import type { UserInfo, Role, CreateUserRequest, UpdateUserRequest } from '../../../types/auth';

// Props
interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  user: UserInfo | null;
  roles: Role[];
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
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  full_name: '',
  status: 'active' as UserStatus,
  role_ids: [] as number[]
});

// 用户状态选项
const statusOptions = [
  { label: '激活', value: 'active' },
  { label: '禁用', value: 'inactive' },
  { label: '暂停', value: 'suspended' }
];

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== formData.password) {
          callback(new Error('两次输入密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  full_name: [
    { max: 100, message: '姓名不能超过 100 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择用户状态', trigger: 'change' }
  ]
};

// 计算属性
const dialogTitle = computed(() => {
  return props.mode === 'create' ? '新增用户' : '编辑用户';
});

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 编辑模式下密码不是必填的
const editModeRules = computed(() => {
  if (props.mode === 'edit') {
    const rules = { ...formRules };
    rules.password = [
      { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
    ];
    rules.confirmPassword = [
      {
        validator: (_rule: any, value: string, callback: Function) => {
          if (formData.password && value !== formData.password) {
            callback(new Error('两次输入密码不一致'));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ];
    return rules;
  }
  return formRules;
});

// 方法
const resetForm = () => {
  formData.username = '';
  formData.email = '';
  formData.password = '';
  formData.confirmPassword = '';
  formData.full_name = '';
  formData.status = UserStatus.ACTIVE;
  formData.role_ids = [];
  
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const loadFormData = () => {
  if (props.mode === 'edit' && props.user) {
    formData.username = props.user.username;
    formData.email = props.user.email;
    formData.password = '';
    formData.confirmPassword = '';
    formData.full_name = props.user.full_name || '';
    formData.status = props.user.status;
    formData.role_ids = props.user.roles?.map(role => role.id) || [];
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
      // 创建用户
      const request: CreateUserRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
        status: formData.status,
        role_ids: formData.role_ids.length > 0 ? formData.role_ids : undefined
      };
      
      const result = await UserService.createUser(request);
      if (result.success) {
        ElMessage.success('用户创建成功');
        emit('submit');
      } else {
        ElMessage.error(result.error || '创建用户失败');
      }
    } else {
      // 更新用户
      if (!props.user) return;
      
      const request: UpdateUserRequest = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || undefined,
        status: formData.status,
        role_ids: formData.role_ids.length > 0 ? formData.role_ids : undefined
      };
      
      // 如果输入了新密码，则更新密码
      if (formData.password) {
        await UserService.resetUserPassword(props.user.id, formData.password);
      }
      
      const result = await UserService.updateUser(props.user.id, request);
      if (result.success) {
        ElMessage.success('用户更新成功');
        emit('submit');
      } else {
        ElMessage.error(result.error || '更新用户失败');
      }
    }
  } catch (error) {
    console.error('提交用户信息失败:', error);
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

// 监听用户数据变化
watch(
  () => props.user,
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
    width="600px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="editModeRules"
      label-width="100px"
      label-position="left"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              :disabled="mode === 'edit'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱地址"
              type="email"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              :placeholder="mode === 'create' ? '请输入密码' : '留空则不修改密码'"
              type="password"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="formData.confirmPassword"
              :placeholder="mode === 'create' ? '请确认密码' : '确认新密码'"
              type="password"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="full_name">
            <el-input
              v-model="formData.full_name"
              placeholder="请输入姓名"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="角色" prop="role_ids">
        <el-select
          v-model="formData.role_ids"
          placeholder="请选择角色"
          multiple
          style="width: 100%"
        >
          <el-option
            v-for="role in roles"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          >
            <span style="float: left">{{ role.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">
              {{ role.description || '无描述' }}
            </span>
          </el-option>
        </el-select>
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

:deep(.el-select .el-input) {
  width: 100%;
}
</style>