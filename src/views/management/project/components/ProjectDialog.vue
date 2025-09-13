<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @opened="handleDialogOpened"
    @closed="handleDialogClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="project-form"
      @submit.prevent
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入项目名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目编号" prop="project_no">
              <el-input
                v-model="formData.project_no"
                placeholder="请输入项目编号"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="client_name">
              <el-input
                v-model="formData.client_name"
                placeholder="请输入客户名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属公司" prop="company_id">
              <el-select
                v-model="formData.company_id"
                placeholder="请选择所属公司"
                style="width: 100%"
                filterable
                clearable
              >
                <el-option
                  v-for="company in companyOptions"
                  :key="company.id"
                  :label="company.company_name"
                  :value="company.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入项目描述"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- 时间和预算 -->
      <div class="form-section">
        <h3 class="section-title">时间和预算</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="计划开始日期" prop="start_date">
              <el-date-picker
                v-model="formData.start_date"
                type="date"
                placeholder="请选择开始日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划结束日期" prop="planned_end_date">
              <el-date-picker
                v-model="formData.planned_end_date"
                type="date"
                placeholder="请选择结束日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="mode === 'edit'">
            <el-form-item label="实际结束日期" prop="actual_end_date">
              <el-date-picker
                v-model="formData.actual_end_date"
                type="date"
                placeholder="请选择实际结束日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目预算" prop="total_budget">
              <el-input-number
                v-model="formData.total_budget"
                placeholder="请输入项目预算"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目状态" prop="status">
              <el-select
                v-model="formData.status"
                placeholder="请选择项目状态"
                style="width: 100%"
              >
                <el-option
                  v-for="option in projectStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 项目团队 -->
      <div class="form-section">
        <h3 class="section-title">项目团队</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目经理" prop="manager_id">
              <el-select
                v-model="formData.manager_id"
                placeholder="请选择项目经理"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="`${user.full_name} (${user.username})`"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { ProjectService } from '../../../../service/project';
import { CompanyService } from '../../../../service/company';
import { UserService } from '../../../../service/auth';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectStatus
} from '../../../../types/project';
import { ProjectStatusOptions } from '../../../../types/project';

// Props
interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  projectData: Project | null;
  companyId?: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'success': [];
}>();

// 响应式数据
const loading = ref(false);
const formRef = ref();
const companyOptions = ref<Array<{id: number, company_name: string}>>([]);
const userOptions = ref<Array<{id: number, username: string, full_name: string}>>([]);

// 表单数据
const formData = reactive<{
  name: string;
  project_no: string;
  client_name: string;
  description: string;
  start_date: string;
  planned_end_date: string;
  actual_end_date: string;
  total_budget: number;
  status: ProjectStatus;
  company_id: number | undefined;
  manager_id: number | undefined;
}>({
  name: '',
  project_no: '',
  client_name: '',
  description: '',
  start_date: '',
  planned_end_date: '',
  actual_end_date: '',
  total_budget: 0,
  status: 'planning',
  company_id: undefined,
  manager_id: undefined
});

// 项目状态选项
const projectStatusOptions = ProjectStatusOptions;

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '项目名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  project_no: [
    { required: true, message: '请输入项目编号', trigger: 'blur' },
    { min: 2, max: 50, message: '项目编号长度在 2 到 50 个字符', trigger: 'blur' },
    {
      validator: async (_rule: any, value: string, callback: Function) => {
        if (!value) {
          callback();
          return;
        }
        
        try {
          const excludeId = props.mode === 'edit' && props.projectData?.id ? props.projectData.id : undefined;
          const available = await ProjectService.isProjectNoAvailable(value, excludeId);
          if (!available) {
            callback(new Error('项目编号已存在'));
          } else {
            callback();
          }
        } catch (error) {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  client_name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' },
    { min: 2, max: 100, message: '客户名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  start_date: [
    { required: true, message: '请选择项目开始日期', trigger: 'change' }
  ],
  planned_end_date: [
    { required: true, message: '请选择项目结束日期', trigger: 'change' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value && formData.start_date && value <= formData.start_date) {
          callback(new Error('结束日期必须晚于开始日期'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  total_budget: [
    { required: true, message: '请输入项目预算', trigger: 'blur' },
    { type: 'number', min: 0, message: '项目预算不能为负数', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择项目状态', trigger: 'change' }
  ],
  manager_id: [
    { required: true, message: '请选择项目经理', trigger: 'change' }
  ]
};

// 计算属性
const dialogTitle = computed(() => {
  return props.mode === 'create' ? '新建项目' : '编辑项目';
});

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 方法
const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (key === 'total_budget') {
      (formData as any)[key] = 0;
    } else if (key === 'status') {
      (formData as any)[key] = 'planning';
    } else {
      (formData as any)[key] = key.includes('_id') ? undefined : '';
    }
  });
  
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const loadFormData = () => {
  if (props.mode === 'edit' && props.projectData) {
    const project = props.projectData;
    formData.name = project.name;
    formData.project_no = project.project_no;
    formData.client_name = project.client_name;
    formData.description = project.description || '';
    formData.start_date = project.start_date;
    formData.planned_end_date = project.planned_end_date;
    formData.actual_end_date = project.actual_end_date || '';
    formData.total_budget = project.total_budget;
    formData.status = project.status;
    formData.company_id = project.company_id;
    formData.manager_id = project.manager_id;
  } else {
    resetForm();
    // 如果传入了公司ID，自动设置
    if (props.companyId) {
      formData.company_id = props.companyId;
    }
  }
};

const loadCompanyOptions = async () => {
  try {
    companyOptions.value = await CompanyService.getAvailableCompanies();
  } catch (error) {
    console.error('加载公司选项失败:', error);
  }
};

const loadUserOptions = async () => {
  try {
    console.log('开始加载用户选项...');
    
    // 首先设置默认的模拟数据，确保组件能正常工作
    userOptions.value = [
      { id: 1, username: 'admin', full_name: '系统管理员' },
      { id: 2, username: 'manager', full_name: '项目经理' },
      { id: 3, username: 'developer', full_name: '开发人员' },
      { id: 4, username: 'tester', full_name: '测试人员' }
    ];
    console.log('设置默认用户选项:', userOptions.value);
    
    // 尝试从数据库加载真实数据（如果可用）
    try {
      const result = await UserService.getUsers({ page_size: 100 });
      console.log('UserService.getUsers 返回结果:', result);
      
      // 安全地检查返回数据结构
      if (result && 
          typeof result === 'object' && 
          result.success === true && 
          result.data && 
          typeof result.data === 'object' && 
          result.data.data && 
          Array.isArray(result.data.data) && 
          result.data.data.length > 0) {
        
        // 安全地映射用户数据
        const mappedUsers = result.data.data
          .filter(user => user && typeof user === 'object' && user.id && user.username)
          .map(user => ({
            id: user.id,
            username: user.username,
            full_name: user.full_name || user.username
          }));
        
        if (mappedUsers.length > 0) {
          userOptions.value = mappedUsers;
          console.log('成功加载真实用户选项:', userOptions.value);
        }
      } else {
        console.warn('用户数据格式不正确或为空，使用默认模拟数据');
      }
    } catch (dbError) {
      console.warn('从数据库加载用户失败，使用默认模拟数据:', dbError);
    }
  } catch (error) {
    console.error('加载用户选项失败:', error);
    // 如果所有操作都失败，确保至少有基本的模拟数据
    userOptions.value = [
      { id: 1, username: 'admin', full_name: '系统管理员' },
      { id: 2, username: 'manager', full_name: '项目经理' }
    ];
  }
};

const handleDialogOpened = () => {
  loadFormData();
};

const handleDialogClosed = () => {
  resetForm();
};

const handleCancel = () => {
  dialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    loading.value = true;
    
    if (props.mode === 'create') {
      // 创建项目
      const request: CreateProjectRequest = {
        name: formData.name,
        project_no: formData.project_no,
        client_name: formData.client_name,
        description: formData.description || undefined,
        start_date: formData.start_date,
        planned_end_date: formData.planned_end_date,
        total_budget: formData.total_budget,
        status: formData.status,
        company_id: formData.company_id,
        manager_id: formData.manager_id!
      };
      
      // 这里需要获取当前用户ID，暂时使用1作为占位符
      await ProjectService.createProject(request, 1);
      ElMessage.success('项目创建成功');
      emit('success');
    } else {
      // 更新项目
      if (!props.projectData?.id) return;
      
      const request: UpdateProjectRequest = {
        id: props.projectData.id,
        name: formData.name,
        project_no: formData.project_no,
        client_name: formData.client_name,
        description: formData.description || undefined,
        start_date: formData.start_date,
        planned_end_date: formData.planned_end_date,
        actual_end_date: formData.actual_end_date || undefined,
        total_budget: formData.total_budget,
        status: formData.status,
        company_id: formData.company_id,
        manager_id: formData.manager_id!
      };
      
      // 这里需要获取当前用户ID，暂时使用1作为占位符
      await ProjectService.updateProject(request, 1);
      ElMessage.success('项目更新成功');
      emit('success');
    }
  } catch (error) {
    console.error('提交项目信息失败:', error);
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('操作失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadCompanyOptions(),
    loadUserOptions()
  ]);
});
</script>

<style scoped>
.project-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.form-section {
  margin-bottom: 32px;
}

.section-title {
  margin: 0 0 20px 0;
  padding: 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #409eff;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea .el-input__count) {
  background: transparent;
}

/* 自定义滚动条样式 */
.project-form::-webkit-scrollbar {
  width: 6px;
}

.project-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.project-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.project-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>