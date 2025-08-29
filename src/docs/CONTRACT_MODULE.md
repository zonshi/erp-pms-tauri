# 合同信息管理模块

## 概述

合同信息管理模块是ERP系统中的核心功能之一，用于管理与项目相关的所有合同信息。该模块提供了完整的合同生命周期管理，包括合同创建、审批、执行、文档管理等功能。

## 主要功能

### 1. 合同基础管理
- **合同CRUD操作**：创建、查看、编辑、删除合同
- **合同编号自动生成**：按照规则自动生成唯一合同编号（格式：HT{年}{月}{序号}）
- **合同状态管理**：草稿、审核中、已审批、已签署、执行中、已完成、已终止
- **合同分页查询**：支持多条件搜索和分页
- **合同复制功能**：快速复制现有合同创建新合同

### 2. 合同条目管理
- **条目详细信息**：项目名称、规格、数量、单价、总金额、交付日期等
- **批量操作**：批量添加、编辑、删除条目
- **条目统计**：自动计算条目总数、总数量、总金额等
- **条目复制**：在合同间复制条目

### 3. 合同文档管理
- **文档上传**：支持多种文件格式（PDF、Word、Excel等）
- **文档分类**：按文件类型自动分类
- **文档版本**：支持文档版本管理
- **文档统计**：文档数量、文件大小统计
- **文档安全**：文件权限控制

### 4. 合同审批流程
- **多级审批**：支持多级审批流程
- **审批状态跟踪**：实时跟踪审批进度
- **审批意见**：记录审批人意见和建议
- **审批撤回**：支持审批发起人撤回审批
- **自动状态更新**：根据审批结果自动更新合同状态

### 5. 合同履行管理
- **履行情况跟踪**：关联收付款记录
- **付款统计**：已付、待付金额统计
- **逾期提醒**：逾期付款自动提醒
- **履行率计算**：自动计算合同履行率

### 6. 统计分析
- **合同统计**：按状态、类型、时间等维度统计
- **趋势分析**：月度合同签署趋势
- **金额分析**：合同金额分布和统计

## 技术架构

### 数据库设计

#### 主表结构
1. **contracts** - 合同主表
2. **contract_items** - 合同条目表
3. **contract_documents** - 合同文档表
4. **contract_approvals** - 合同审批表

#### 关联关系
- 合同与项目：多对一关系（一个项目可以有多个合同）
- 合同与条目：一对多关系
- 合同与文档：一对多关系
- 合同与审批：一对多关系

### 服务层架构

#### 核心服务类
1. **ContractService** - 合同基础服务
2. **ContractItemService** - 合同条目服务
3. **ContractDocumentService** - 合同文档服务
4. **ContractApprovalService** - 合同审批服务

#### 服务功能特点
- **类型安全**：使用TypeScript提供完整类型定义
- **错误处理**：统一的错误处理机制
- **数据验证**：输入数据有效性验证
- **事务支持**：关键操作支持数据库事务

### 权限系统

#### 合同权限定义
- `contract:read` - 查看合同信息
- `contract:write` - 创建和编辑合同
- `contract:delete` - 删除合同
- `contract:approve` - 审批合同
- `contract:manage` - 合同管理（包含所有合同操作）
- `contract:document` - 管理合同文档
- `contract:item` - 管理合同条目

#### 权限应用
- 页面级权限控制
- 按钮级权限控制
- API接口权限验证

## 使用说明

### 基础操作

#### 1. 导入服务
```typescript
import { 
  ContractService, 
  ContractItemService, 
  ContractDocumentService, 
  ContractApprovalService 
} from '@/service/contract';
```

#### 2. 创建合同
```typescript
const contractData = {
  title: '服务合同',
  contract_no: 'HT202401001',
  contract_type: 'service',
  party_a: '甲方公司',
  party_b: '乙方公司',
  amount: 100000,
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  signed_at: '2024-01-01',
  project_id: 1
};

const contract = await ContractService.createContract(contractData, userId);
```

#### 3. 添加合同条目
```typescript
const itemData = {
  contract_id: contract.id,
  item_name: '系统开发服务',
  specification: '按需求文档开发',
  quantity: 1,
  unit_price: 100000,
  total_amount: 100000,
  delivery_date: '2024-06-30'
};

const item = await ContractItemService.createContractItem(itemData);
```

#### 4. 上传合同文档
```typescript
const documentData = {
  contract_id: contract.id,
  file_name: 'contract.pdf',
  file_path: '/uploads/contract.pdf',
  file_type: 'application/pdf',
  file_size: 1024000
};

const document = await ContractDocumentService.uploadContractDocument(documentData, userId);
```

#### 5. 创建审批流程
```typescript
const approvers = [
  { approver_id: 2, approval_level: 1 },
  { approver_id: 3, approval_level: 2 }
];

const approvals = await ContractApprovalService.createApprovalWorkflow(contract.id, approvers);
```

### 高级功能

#### 1. 获取合同完整信息
```typescript
const fullDetails = await ContractService.getContractFullDetails(contractId);
// 返回：合同基本信息、条目、文档、审批记录及统计信息
```

#### 2. 合同统计分析
```typescript
const statistics = await ContractService.getContractStatistics({
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  project_id: 1
});
```

#### 3. 复制合同
```typescript
const newContract = await ContractService.duplicateContract(
  sourceContractId, 
  userId, 
  { title: '新合同标题' }
);
```

## 最佳实践

### 1. 数据一致性
- 使用事务确保关联数据的一致性
- 定期检查数据完整性
- 实施软删除策略

### 2. 性能优化
- 合理使用数据库索引
- 实现分页查询
- 缓存常用数据

### 3. 安全性
- 严格的权限控制
- 输入数据验证
- 敏感操作日志记录

### 4. 用户体验
- 友好的错误提示
- 操作反馈机制
- 数据自动保存

## 扩展功能

### 未来可能的增强
1. **电子签章**：集成电子签章功能
2. **合同模板**：预定义合同模板
3. **智能提醒**：基于AI的合同到期提醒
4. **OCR识别**：自动识别合同文档内容
5. **区块链存证**：合同数据上链存证

## 技术依赖

- **数据库**：SQLite（通过Tauri）
- **类型系统**：TypeScript
- **前端框架**：Vue 3
- **UI组件**：Element Plus
- **状态管理**：Pinia
- **权限管理**：自定义权限系统

## 维护说明

### 数据备份
定期备份合同相关数据，确保数据安全。

### 版本升级
新版本发布前，请测试合同模块的兼容性。

### 问题排查
遇到问题时，请检查：
1. 数据库连接状态
2. 权限配置是否正确
3. 服务初始化是否成功
4. 相关表结构是否存在

---

*本文档详细介绍了合同信息管理模块的设计和实现。如有疑问，请联系开发团队。*