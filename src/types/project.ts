/**
 * 项目管理相关类型定义
 */

// 项目基础信息接口
export interface Project {
  id?: number;
  name: string; // 项目名称 - 必填
  project_no: string; // 项目编号 - 必填且唯一
  client_name: string; // 客户名称 - 必填
  description?: string; // 项目描述
  start_date: string; // 计划开始日期 - 必填
  planned_end_date: string; // 计划结束日期 - 必填
  actual_end_date?: string; // 实际结束日期
  total_budget: number; // 项目总预算 - 必填
  status: ProjectStatus; // 项目状态
  
  // 关联信息
  company_id?: number; // 关联公司ID
  manager_id: number; // 项目经理ID - 必填
  
  // 系统字段
  created_at?: string; // 创建时间
  updated_at?: string; // 更新时间
  created_by?: number; // 创建人ID
  updated_by?: number; // 更新人ID
  
  // 扩展字段（用于显示）
  company_name?: string; // 公司名称
  manager_name?: string; // 项目经理姓名
}

// 项目状态枚举
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled' | 'suspended';

// 项目状态选项
export const ProjectStatusOptions = [
  { value: 'planning', label: '规划中', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#409eff' },
  { value: 'completed', label: '已完成', color: '#67c23a' },
  { value: 'cancelled', label: '已取消', color: '#f56c6c' },
  { value: 'suspended', label: '已暂停', color: '#e6a23c' }
];

// 项目查询条件接口
export interface ProjectQueryParams {
  name?: string; // 项目名称
  project_no?: string; // 项目编号
  client_name?: string; // 客户名称
  status?: ProjectStatus; // 项目状态
  company_id?: number; // 公司ID
  manager_id?: number; // 项目经理ID
  start_date?: string; // 开始日期（范围查询起始）
  end_date?: string; // 结束日期（范围查询结束）
  page?: number; // 页码
  page_size?: number; // 每页数量
  sort_by?: string; // 排序字段
  sort_order?: 'ASC' | 'DESC'; // 排序方向
}

// 项目创建请求接口
export interface CreateProjectRequest {
  name: string;
  project_no: string;
  client_name: string;
  description?: string;
  start_date: string;
  planned_end_date: string;
  total_budget: number;
  status?: ProjectStatus;
  company_id?: number;
  manager_id: number;
}

// 项目更新请求接口
export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: number;
  actual_end_date?: string;
}

// 项目列表响应接口
export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 公司项目树节点接口
export interface CompanyProjectTreeNode {
  id: string; // 节点ID，格式：company_${companyId} 或 project_${projectId}
  label: string; // 显示名称
  type: 'company' | 'project'; // 节点类型
  children?: CompanyProjectTreeNode[]; // 子节点
  data?: {
    companyId?: number;
    projectId?: number;
    projectCount?: number; // 公司下项目数量
  };
}

// 项目预算接口
export interface ProjectBudget {
  id?: number;
  project_id: number;
  item_name: string; // 预算项目名称
  category: string; // 预算类别
  planned_amount: number; // 计划金额
  actual_amount?: number; // 实际金额
  remarks?: string; // 备注
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

// 预算类别选项
export const BudgetCategoryOptions = [
  { value: 'personnel', label: '人员成本' },
  { value: 'equipment', label: '设备费用' },
  { value: 'material', label: '材料费用' },
  { value: 'service', label: '外包服务' },
  { value: 'travel', label: '差旅费用' },
  { value: 'office', label: '办公费用' },
  { value: 'other', label: '其他费用' }
];

// 项目里程碑接口
export interface ProjectMilestone {
  id?: number;
  project_id: number;
  title: string; // 里程碑标题
  description?: string; // 描述
  planned_date: string; // 计划日期
  actual_date?: string; // 实际完成日期
  status: MilestoneStatus; // 状态
  priority: MilestonePriority; // 优先级
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

// 里程碑状态枚举
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

// 里程碑状态选项
export const MilestoneStatusOptions = [
  { value: 'pending', label: '待开始', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#409eff' },
  { value: 'completed', label: '已完成', color: '#67c23a' },
  { value: 'delayed', label: '已延期', color: '#f56c6c' }
];

// 里程碑优先级枚举
export type MilestonePriority = 'low' | 'medium' | 'high';

// 里程碑优先级选项
export const MilestonePriorityOptions = [
  { value: 'low', label: '低', color: '#909399' },
  { value: 'medium', label: '中', color: '#409eff' },
  { value: 'high', label: '高', color: '#f56c6c' }
];

// 项目进度接口
export interface ProjectProgress {
  id?: number;
  project_id: number;
  phase_name: string; // 阶段名称
  planned_start_date: string; // 计划开始日期
  planned_end_date: string; // 计划结束日期
  actual_start_date?: string; // 实际开始日期
  actual_end_date?: string; // 实际结束日期
  completion_percentage?: number; // 完成百分比 (0-100)
  status: ProgressStatus; // 状态
  description?: string; // 描述
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

// 进度状态枚举
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

// 进度状态选项
export const ProgressStatusOptions = [
  { value: 'not_started', label: '未开始', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#409eff' },
  { value: 'completed', label: '已完成', color: '#67c23a' },
  { value: 'delayed', label: '已延期', color: '#f56c6c' }
];

// 合同基础信息接口
export interface Contract {
  id?: number;
  title: string; // 合同标题
  contract_no: string; // 合同编号 - 唯一
  contract_type: string; // 合同类型
  party_a: string; // 甲方
  party_b: string; // 乙方
  amount: number; // 合同总金额
  start_date: string; // 合同开始日期
  end_date: string; // 合同结束日期
  signed_at: string; // 签署日期
  status: ContractStatus; // 合同状态
  project_id?: number; // 关联项目ID
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  
  // 扩展字段
  project_name?: string; // 项目名称
}

// 合同状态枚举
export type ContractStatus = 'draft' | 'reviewing' | 'approved' | 'signed' | 'executing' | 'completed' | 'terminated';

// 合同状态选项
export const ContractStatusOptions = [
  { value: 'draft', label: '草稿', color: '#909399' },
  { value: 'reviewing', label: '审核中', color: '#e6a23c' },
  { value: 'approved', label: '已审批', color: '#409eff' },
  { value: 'signed', label: '已签署', color: '#67c23a' },
  { value: 'executing', label: '执行中', color: '#409eff' },
  { value: 'completed', label: '已完成', color: '#67c23a' },
  { value: 'terminated', label: '已终止', color: '#f56c6c' }
];

// 合同类型选项
export const ContractTypeOptions = [
  { value: 'service', label: '服务合同' },
  { value: 'supply', label: '供货合同' },
  { value: 'construction', label: '建设工程合同' },
  { value: 'consulting', label: '咨询合同' },
  { value: 'maintenance', label: '维护合同' },
  { value: 'lease', label: '租赁合同' },
  { value: 'other', label: '其他合同' }
];

// 合同查询条件接口
export interface ContractQueryParams {
  title?: string;
  contract_no?: string;
  contract_type?: string;
  status?: ContractStatus;
  project_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

// 合同创建请求接口
export interface CreateContractRequest {
  title: string;
  contract_no: string;
  contract_type: string;
  party_a: string;
  party_b: string;
  amount: number;
  start_date: string;
  end_date: string;
  signed_at: string;
  status?: ContractStatus;
  project_id?: number;
}

// 合同更新请求接口
export interface UpdateContractRequest extends Partial<CreateContractRequest> {
  id: number;
}

// 合同列表响应接口
export interface ContractListResponse {
  contracts: Contract[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 收付款记录接口
export interface PaymentReceipt {
  id?: number;
  receipt_no: string; // 收付款单号 - 唯一
  type: 'income' | 'expense'; // 收入/支出
  amount: number; // 金额
  currency: string; // 币种
  exchange_rate?: number; // 汇率
  category: string; // 类别
  counterparty: string; // 对方单位
  payment_method: string; // 支付方式
  transaction_date: string; // 交易日期
  description?: string; // 描述
  status: PaymentStatus; // 状态
  project_id?: number; // 关联项目
  contract_id?: number; // 关联合同
  bank_account_id?: number; // 关联银行账户
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  
  // 扩展字段
  project_name?: string;
  contract_title?: string;
}

// 收付款状态枚举
export type PaymentStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'rejected';

// 收付款状态选项
export const PaymentStatusOptions = [
  { value: 'draft', label: '草稿', color: '#909399' },
  { value: 'pending', label: '待审核', color: '#e6a23c' },
  { value: 'approved', label: '已审核', color: '#409eff' },
  { value: 'paid', label: '已支付', color: '#67c23a' },
  { value: 'rejected', label: '已拒绝', color: '#f56c6c' }
];

// 支付方式选项
export const PaymentMethodOptions = [
  { value: 'bank_transfer', label: '银行转账' },
  { value: 'cash', label: '现金' },
  { value: 'check', label: '支票' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'online_payment', label: '网上支付' },
  { value: 'other', label: '其他方式' }
];

// 合同条目接口
export interface ContractItem {
  id?: number;
  contract_id: number;
  item_name: string; // 项目名称
  specification?: string; // 规格说明
  quantity: number; // 数量
  unit_price: number; // 单价
  total_amount: number; // 总金额
  delivery_date?: string; // 交付日期
  remarks?: string; // 备注
  created_at?: string;
}

// 合同条目创建请求接口
export interface CreateContractItemRequest {
  contract_id: number;
  item_name: string;
  specification?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_date?: string;
  remarks?: string;
}

// 合同条目更新请求接口
export interface UpdateContractItemRequest extends Partial<CreateContractItemRequest> {
  id: number;
}

// 合同文档接口
export interface ContractDocument {
  id?: number;
  contract_id: number;
  file_name: string; // 文件名
  file_path: string; // 文件路径
  file_type: string; // 文件类型
  file_size: number; // 文件大小（字节）
  uploaded_at?: string; // 上传时间
  uploaded_by: number; // 上传人ID
  
  // 扩展字段
  uploader_name?: string; // 上传人姓名
  file_size_formatted?: string; // 格式化的文件大小
}

// 合同文档上传请求接口
export interface UploadContractDocumentRequest {
  contract_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

// 合同审批接口
export interface ContractApproval {
  id?: number;
  contract_id: number;
  approver_id: number; // 审批人ID
  approval_level: number; // 审批级别
  status: ApprovalStatus; // 审批状态
  comments?: string; // 审批意见
  approved_at?: string; // 审批时间
  created_at?: string;
  
  // 扩展字段
  approver_name?: string; // 审批人姓名
  contract_title?: string; // 合同标题
}

// 审批状态枚举
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// 审批状态选项
export const ApprovalStatusOptions = [
  { value: 'pending', label: '待审批', color: '#e6a23c' },
  { value: 'approved', label: '已通过', color: '#67c23a' },
  { value: 'rejected', label: '已拒绝', color: '#f56c6c' }
];

// 合同审批创建请求接口
export interface CreateContractApprovalRequest {
  contract_id: number;
  approver_id: number;
  approval_level: number;
  comments?: string;
}

// 合同审批更新请求接口
export interface UpdateContractApprovalRequest {
  id: number;
  status: ApprovalStatus;
  comments?: string;
}

// 项目统计信息接口
export interface ProjectStatistics {
  total_projects: number; // 项目总数
  active_projects: number; // 进行中项目数
  completed_projects: number; // 已完成项目数
  total_budget: number; // 总预算
  actual_cost: number; // 实际成本
  budget_utilization: number; // 预算使用率
  overdue_projects: number; // 逾期项目数
  milestone_completion_rate: number; // 里程碑完成率
}

// 项目详情标签页类型
export type ProjectTabType = 'info' | 'contracts' | 'progress' | 'milestones' | 'budget' | 'payments';

// 项目详情标签页配置
export const ProjectTabConfig = [
  { key: 'info', label: '项目信息', icon: 'InfoFilled', permission: 'project:read' },
  { key: 'contracts', label: '合同信息', icon: 'Document', permission: 'project:contract:view' },
  { key: 'progress', label: '项目进展', icon: 'TrendCharts', permission: 'project:progress:view' },
  { key: 'milestones', label: '里程碑', icon: 'Flag', permission: 'project:milestone:view' },
  { key: 'budget', label: '预算管理', icon: 'Money', permission: 'project:budget:view' },
  { key: 'payments', label: '收付款', icon: 'CreditCard', permission: 'project:payment:view' }
];