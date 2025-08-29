/**
 * 合同管理服务入口
 */

export { ContractService } from '../project/contract';
export { ContractItemService } from './contractItem';
export { ContractDocumentService } from './contractDocument';
export { ContractApprovalService } from './contractApproval';

// 导出所有合同相关类型
export type {
  Contract,
  CreateContractRequest,
  UpdateContractRequest,
  ContractQueryParams,
  ContractListResponse,
  ContractItem,
  CreateContractItemRequest,
  UpdateContractItemRequest,
  ContractDocument,
  UploadContractDocumentRequest,
  ContractApproval,
  CreateContractApprovalRequest,
  UpdateContractApprovalRequest,
  ApprovalStatus
} from '../../types/project';

// 导出选项常量
export {
  ContractStatusOptions,
  ContractTypeOptions,
  ApprovalStatusOptions
} from '../../types/project';