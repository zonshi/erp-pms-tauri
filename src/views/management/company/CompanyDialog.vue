<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @opened="handleDialogOpened"
    @closed="handleDialogClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      class="company-form"
      @submit.prevent
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company_name">
              <el-input
                v-model="formData.company_name"
                placeholder="请输入公司名称"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="credit_code">
              <el-input
                v-model="formData.credit_code"
                placeholder="请输入统一社会信用代码"
                maxlength="18"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司类型" prop="company_type">
              <el-select
                v-model="formData.company_type"
                placeholder="请选择公司类型"
                style="width: 100%"
              >
                <el-option
                  v-for="option in companyTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立日期" prop="established_date">
              <el-date-picker
                v-model="formData.established_date"
                type="date"
                placeholder="请选择成立日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="注册地址" prop="reg_address">
          <el-input
            v-model="formData.reg_address"
            type="textarea"
            placeholder="请输入注册地址"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="办公地址" prop="office_address">
          <el-input
            v-model="formData.office_address"
            type="textarea"
            placeholder="请输入办公地址"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注册资本(万元)" prop="registered_capital">
              <el-input-number
                v-model="formData.registered_capital"
                placeholder="请输入注册资本"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经营范围" prop="business_scope">
              <el-input
                v-model="formData.business_scope"
                placeholder="请输入经营范围"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 法定代表人信息 -->
      <div class="form-section">
        <h3 class="section-title">法定代表人信息</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="法人姓名" prop="legal_representative_name">
              <el-input
                v-model="formData.legal_representative_name"
                placeholder="请输入法定代表人姓名"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="法人身份证" prop="legal_representative_id_card">
              <el-input
                v-model="formData.legal_representative_id_card"
                placeholder="请输入身份证号"
                maxlength="18"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="法人联系方式" prop="legal_representative_contact">
              <el-input
                v-model="formData.legal_representative_contact"
                placeholder="请输入联系方式"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 联系信息 -->
      <div class="form-section">
        <h3 class="section-title">联系信息</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="联系人姓名" prop="contact_name">
              <el-input
                v-model="formData.contact_name"
                placeholder="请输入联系人姓名"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系人职位" prop="contact_position">
              <el-input
                v-model="formData.contact_position"
                placeholder="请输入联系人职位"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系人手机" prop="contact_mobile">
              <el-input
                v-model="formData.contact_mobile"
                placeholder="请输入手机号"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人座机" prop="contact_landline">
              <el-input
                v-model="formData.contact_landline"
                placeholder="请输入座机号码"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人邮箱" prop="contact_email">
              <el-input
                v-model="formData.contact_email"
                placeholder="请输入邮箱地址"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="紧急联系人" prop="emergency_contact">
              <el-input
                v-model="formData.emergency_contact"
                placeholder="请输入紧急联系人"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急联系电话" prop="emergency_phone">
              <el-input
                v-model="formData.emergency_phone"
                placeholder="请输入紧急联系电话"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 财务信息 -->
      <div class="form-section">
        <h3 class="section-title">财务信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行账户" prop="bank_account">
              <el-input
                v-model="formData.bank_account"
                placeholder="请输入银行账户信息"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税务登记号" prop="tax_registration_no">
              <el-input
                v-model="formData.tax_registration_no"
                placeholder="请输入税务登记号"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="开票信息" prop="invoice_info">
          <el-input
            v-model="formData.invoice_info"
            type="textarea"
            placeholder="请输入开票信息（如开票单位名称、地址、电话等）"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- 资质信息 -->
      <div class="form-section">
        <h3 class="section-title">资质信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业执照" prop="business_license">
              <el-input
                v-model="formData.business_license"
                placeholder="营业执照文件路径或编号"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安全生产许可证" prop="safety_production_license">
              <el-input
                v-model="formData.safety_production_license"
                placeholder="安全生产许可证号"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="资质证书" prop="qualification">
          <el-input
            v-model="formData.qualification"
            type="textarea"
            placeholder="请输入资质证书信息"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="认证信息" prop="certification_info">
          <el-input
            v-model="formData.certification_info"
            type="textarea"
            placeholder="请输入认证信息"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- 其他信息 -->
      <div class="form-section">
        <h3 class="section-title">其他信息</h3>
        
        <el-form-item label="行业备案信息" prop="industry_filing_info">
          <el-input
            v-model="formData.industry_filing_info"
            type="textarea"
            placeholder="请输入行业备案信息"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="历史项目" prop="historical_projects">
          <el-input
            v-model="formData.historical_projects"
            type="textarea"
            placeholder="请输入历史项目信息"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
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
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { CompanyService } from '../../../service/company';
import type { 
  Company, 
  CreateCompanyRequest, 
  UpdateCompanyRequest
} from '../../../types/company.ts';
import { CompanyTypeOptions } from '../../../types/company.ts';

// Props
interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  companyData: Company | null;
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

// 表单数据
const formData = reactive({
  company_name: '',
  credit_code: '',
  reg_address: '',
  office_address: '',
  business_scope: '',
  company_type: '',
  established_date: '',
  registered_capital: undefined as number | undefined,
  legal_representative_name: '',
  legal_representative_id_card: '',
  legal_representative_contact: '',
  contact_name: '',
  contact_position: '',
  contact_mobile: '',
  contact_landline: '',
  contact_email: '',
  emergency_contact: '',
  emergency_phone: '',
  bank_account: '',
  tax_registration_no: '',
  invoice_info: '',
  business_license: '',
  safety_production_license: '',
  qualification: '',
  certification_info: '',
  industry_filing_info: '',
  organizational_structure: '',
  historical_projects: '',
  attachments: '',
  remarks: ''
});

// 公司类型选项
const companyTypeOptions = CompanyTypeOptions;

// 表单验证规则
const formRules = {
  company_name: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, max: 200, message: '公司名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  credit_code: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { 
      pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, 
      message: '请输入正确的统一社会信用代码格式', 
      trigger: 'blur' 
    }
  ],
  reg_address: [
    { required: true, message: '请输入注册地址', trigger: 'blur' },
    { min: 5, max: 500, message: '注册地址长度在 5 到 500 个字符', trigger: 'blur' }
  ],
  legal_representative_id_card: [
    {
      pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
      message: '请输入正确的身份证号格式',
      trigger: 'blur'
    }
  ],
  contact_email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur'
    }
  ],
  contact_mobile: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码格式',
      trigger: 'blur'
    }
  ],
  emergency_phone: [
    {
      pattern: /^(\d{3,4}-?)?\d{7,8}$|^1[3-9]\d{9}$/,
      message: '请输入正确的电话号码格式',
      trigger: 'blur'
    }
  ]
};

// 计算属性
const dialogTitle = computed(() => {
  return props.mode === 'create' ? '新增公司' : '编辑公司';
});

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 方法
const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (key === 'registered_capital') {
      (formData as any)[key] = undefined;
    } else {
      (formData as any)[key] = '';
    }
  });
  
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const loadFormData = () => {
  if (props.mode === 'edit' && props.companyData) {
    const company = props.companyData;
    formData.company_name = company.company_name || '';
    formData.credit_code = company.credit_code || '';
    formData.reg_address = company.reg_address || '';
    formData.office_address = company.office_address || '';
    formData.business_scope = company.business_scope || '';
    formData.company_type = company.company_type || '';
    formData.established_date = company.established_date || '';
    formData.registered_capital = company.registered_capital;
    formData.legal_representative_name = company.legal_representative_name || '';
    formData.legal_representative_id_card = company.legal_representative_id_card || '';
    formData.legal_representative_contact = company.legal_representative_contact || '';
    formData.contact_name = company.contact_name || '';
    formData.contact_position = company.contact_position || '';
    formData.contact_mobile = company.contact_mobile || '';
    formData.contact_landline = company.contact_landline || '';
    formData.contact_email = company.contact_email || '';
    formData.emergency_contact = company.emergency_contact || '';
    formData.emergency_phone = company.emergency_phone || '';
    formData.bank_account = company.bank_account || '';
    formData.tax_registration_no = company.tax_registration_no || '';
    formData.invoice_info = company.invoice_info || '';
    formData.business_license = company.business_license || '';
    formData.safety_production_license = company.safety_production_license || '';
    formData.qualification = company.qualification || '';
    formData.certification_info = company.certification_info || '';
    formData.industry_filing_info = company.industry_filing_info || '';
    formData.organizational_structure = company.organizational_structure || '';
    formData.historical_projects = company.historical_projects || '';
    formData.attachments = company.attachments || '';
    formData.remarks = company.remarks || '';
  } else {
    resetForm();
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
      // 创建公司
      const request: CreateCompanyRequest = {
        company_name: formData.company_name,
        credit_code: formData.credit_code,
        reg_address: formData.reg_address,
        office_address: formData.office_address || undefined,
        business_scope: formData.business_scope || undefined,
        company_type: formData.company_type || undefined,
        established_date: formData.established_date || undefined,
        registered_capital: formData.registered_capital,
        legal_representative_name: formData.legal_representative_name || undefined,
        legal_representative_id_card: formData.legal_representative_id_card || undefined,
        legal_representative_contact: formData.legal_representative_contact || undefined,
        contact_name: formData.contact_name || undefined,
        contact_position: formData.contact_position || undefined,
        contact_mobile: formData.contact_mobile || undefined,
        contact_landline: formData.contact_landline || undefined,
        contact_email: formData.contact_email || undefined,
        emergency_contact: formData.emergency_contact || undefined,
        emergency_phone: formData.emergency_phone || undefined,
        bank_account: formData.bank_account || undefined,
        tax_registration_no: formData.tax_registration_no || undefined,
        invoice_info: formData.invoice_info || undefined,
        business_license: formData.business_license || undefined,
        safety_production_license: formData.safety_production_license || undefined,
        qualification: formData.qualification || undefined,
        certification_info: formData.certification_info || undefined,
        industry_filing_info: formData.industry_filing_info || undefined,
        organizational_structure: formData.organizational_structure || undefined,
        historical_projects: formData.historical_projects || undefined,
        attachments: formData.attachments || undefined,
        remarks: formData.remarks || undefined
      };
      
      // 这里需要获取当前用户ID，暂时使用1作为占位符
      // 实际项目中需要从用户状态管理中获取
      await CompanyService.createCompany(request, 1);
      ElMessage.success('公司创建成功');
      emit('success');
    } else {
      // 更新公司
      if (!props.companyData?.id) return;
      
      const request: UpdateCompanyRequest = {
        id: props.companyData.id,
        company_name: formData.company_name,
        credit_code: formData.credit_code,
        reg_address: formData.reg_address,
        office_address: formData.office_address || undefined,
        business_scope: formData.business_scope || undefined,
        company_type: formData.company_type || undefined,
        established_date: formData.established_date || undefined,
        registered_capital: formData.registered_capital,
        legal_representative_name: formData.legal_representative_name || undefined,
        legal_representative_id_card: formData.legal_representative_id_card || undefined,
        legal_representative_contact: formData.legal_representative_contact || undefined,
        contact_name: formData.contact_name || undefined,
        contact_position: formData.contact_position || undefined,
        contact_mobile: formData.contact_mobile || undefined,
        contact_landline: formData.contact_landline || undefined,
        contact_email: formData.contact_email || undefined,
        emergency_contact: formData.emergency_contact || undefined,
        emergency_phone: formData.emergency_phone || undefined,
        bank_account: formData.bank_account || undefined,
        tax_registration_no: formData.tax_registration_no || undefined,
        invoice_info: formData.invoice_info || undefined,
        business_license: formData.business_license || undefined,
        safety_production_license: formData.safety_production_license || undefined,
        qualification: formData.qualification || undefined,
        certification_info: formData.certification_info || undefined,
        industry_filing_info: formData.industry_filing_info || undefined,
        organizational_structure: formData.organizational_structure || undefined,
        historical_projects: formData.historical_projects || undefined,
        attachments: formData.attachments || undefined,
        remarks: formData.remarks || undefined
      };
      
      // 这里需要获取当前用户ID，暂时使用1作为占位符
      await CompanyService.updateCompany(request, 1);
      ElMessage.success('公司更新成功');
      emit('success');
    }
  } catch (error) {
    console.error('提交公司信息失败:', error);
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('操作失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};

// 监听器
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadFormData();
  }
});
</script>

<style scoped>
.company-form {
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
.company-form::-webkit-scrollbar {
  width: 6px;
}

.company-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.company-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.company-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>