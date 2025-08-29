/**
 * 公司管理相关类型定义
 */

// 公司基础信息接口
export interface Company {
  id?: number;
  company_name: string; // 公司名称 - 必填且唯一
  credit_code: string; // 统一社会信用代码 - 必填且唯一
  reg_address: string; // 注册地址 - 必填
  office_address?: string; // 办公地址
  business_scope?: string; // 经营范围
  company_type?: string; // 公司类型
  established_date?: string; // 成立日期
  registered_capital?: number; // 注册资本
  
  // 法定代表人信息
  legal_representative_name?: string; // 法定代表人姓名
  legal_representative_id_card?: string; // 法定代表人身份证
  legal_representative_contact?: string; // 法定代表人联系方式
  
  // 联系信息
  contact_name?: string; // 联系人姓名
  contact_position?: string; // 联系人职位
  contact_mobile?: string; // 联系人手机
  contact_landline?: string; // 联系人座机
  contact_email?: string; // 联系人邮箱
  
  // 紧急联系方式
  emergency_contact?: string; // 紧急联系人
  emergency_phone?: string; // 紧急联系电话
  
  // 财务信息
  bank_account?: string; // 银行账户
  tax_registration_no?: string; // 税务登记号
  invoice_info?: string; // 开票信息(JSON格式)
  
  // 资质信息
  business_license?: string; // 营业执照
  safety_production_license?: string; // 安全生产许可证
  qualification?: string; // 资质证书
  certification_info?: string; // 认证信息
  industry_filing_info?: string; // 行业备案信息
  
  // 组织架构
  organizational_structure?: string; // 组织架构(JSON格式)
  
  // 项目相关
  historical_projects?: string; // 历史项目
  
  // 附件
  attachments?: string; // 附件
  
  // 备注
  remarks?: string; // 备注
  
  // 系统字段
  status?: 'active' | 'inactive' | 'suspended'; // 状态
  created_at?: string; // 创建时间
  updated_at?: string; // 更新时间
  created_by?: number; // 创建人ID
  updated_by?: number; // 更新人ID
}

// 公司查询条件接口
export interface CompanyQueryParams {
  company_name?: string; // 公司名称
  credit_code?: string; // 统一社会信用代码
  company_type?: string; // 公司类型
  status?: string; // 状态
  page?: number; // 页码
  page_size?: number; // 每页数量
  sort_by?: string; // 排序字段
  sort_order?: 'ASC' | 'DESC'; // 排序方向
}

// 公司创建请求接口
export interface CreateCompanyRequest {
  company_name: string;
  credit_code: string;
  reg_address: string;
  office_address?: string;
  business_scope?: string;
  company_type?: string;
  established_date?: string;
  registered_capital?: number;
  legal_representative_name?: string;
  legal_representative_id_card?: string;
  legal_representative_contact?: string;
  contact_name?: string;
  contact_position?: string;
  contact_mobile?: string;
  contact_landline?: string;
  contact_email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  bank_account?: string;
  tax_registration_no?: string;
  invoice_info?: string;
  business_license?: string;
  safety_production_license?: string;
  qualification?: string;
  certification_info?: string;
  industry_filing_info?: string;
  organizational_structure?: string;
  historical_projects?: string;
  attachments?: string;
  remarks?: string;
}

// 公司更新请求接口
export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  id: number;
}

// 公司列表响应接口
export interface CompanyListResponse {
  companies: Company[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 公司类型选项
export const CompanyTypeOptions = [
  { value: 'limited_liability', label: '有限责任公司' },
  { value: 'joint_stock', label: '股份有限公司' },
  { value: 'sole_proprietorship', label: '个人独资企业' },
  { value: 'partnership', label: '合伙企业' },
  { value: 'state_owned', label: '国有企业' },
  { value: 'collective', label: '集体企业' },
  { value: 'foreign_invested', label: '外商投资企业' },
  { value: 'other', label: '其他' }
];

// 公司状态选项
export const CompanyStatusOptions = [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '停用' },
  { value: 'suspended', label: '暂停' }
];

// 联系人信息接口
export interface ContactInfo {
  name?: string; // 联系人姓名
  position?: string; // 职位
  mobile?: string; // 手机
  landline?: string; // 座机
  email?: string; // 邮箱
}

// 发票信息接口
export interface InvoiceInfo {
  company_name?: string; // 开票公司名称
  tax_number?: string; // 纳税人识别号
  address?: string; // 开票地址
  phone?: string; // 开票电话
  bank_name?: string; // 开户银行
  bank_account?: string; // 银行账号
}

// 组织架构节点接口
export interface OrganizationNode {
  id: string; // 节点ID
  name: string; // 部门/岗位名称
  type: 'department' | 'position'; // 类型：部门或岗位
  parent_id?: string; // 父节点ID
  children?: OrganizationNode[]; // 子节点
  description?: string; // 描述
  manager?: string; // 负责人
}