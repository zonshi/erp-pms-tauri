/**
 * 合同管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { 
  Contract, 
  CreateContractRequest, 
  UpdateContractRequest, 
  ContractQueryParams,
  ContractListResponse,
  PaymentReceipt,
  ContractItem,
  ContractDocument,
  ContractApproval
} from '../../types/project';
import { ContractItemService } from '../contract/contractItem';
import { ContractDocumentService } from '../contract/contractDocument';
import { ContractApprovalService } from '../contract/contractApproval';

export class ContractService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化合同服务数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 确保数据库连接已初始化
   */
  private static async ensureDbInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  /**
   * 获取合同列表（带分页和搜索）
   */
  static async getContracts(params: ContractQueryParams = {}): Promise<ContractListResponse> {
    await this.ensureDbInitialized();
    
    const {
      title,
      contract_no,
      contract_type,
      status,
      project_id,
      start_date,
      end_date,
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = params;

    // 构建WHERE条件
    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (title) {
      conditions.push('c.title LIKE ?');
      queryParams.push(`%${title}%`);
    }

    if (contract_no) {
      conditions.push('c.contract_no LIKE ?');
      queryParams.push(`%${contract_no}%`);
    }

    if (contract_type) {
      conditions.push('c.contract_type = ?');
      queryParams.push(contract_type);
    }

    if (status) {
      conditions.push('c.status = ?');
      queryParams.push(status);
    }

    if (project_id) {
      conditions.push('c.project_id = ?');
      queryParams.push(project_id);
    }

    if (start_date) {
      conditions.push('c.start_date >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      conditions.push('c.end_date <= ?');
      queryParams.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 计算偏移量
    const offset = (page - 1) * page_size;

    try {
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM contracts c 
        ${whereClause}
      `;
      const countResult = await this.db.select<{total: number}>(countQuery, queryParams);
      const total = (countResult as unknown as {total: number}[])[0]?.total || 0;

      // 查询数据（联表获取项目名称）
      const dataQuery = `
        SELECT 
          c.*,
          p.name as project_name
        FROM contracts c 
        LEFT JOIN projects p ON c.project_id = p.id
        ${whereClause}
        ORDER BY c.${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `;
      const contracts = await this.db.select<Contract>(dataQuery, [...queryParams, page_size, offset]) as unknown as Contract[];

      const total_pages = Math.ceil(total / page_size);

      return {
        contracts,
        total,
        page,
        page_size,
        total_pages
      };
    } catch (error) {
      console.error('查询合同列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取合同详情
   */
  static async getContractById(id: number): Promise<Contract | null> {
    await this.ensureDbInitialized();
    
    try {
      const contracts = await this.db.select<Contract>(
        `SELECT 
          c.*,
          p.name as project_name
        FROM contracts c 
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE c.id = ?`,
        [id]
      ) as unknown as Contract[];
      return contracts[0] || null;
    } catch (error) {
      console.error('查询合同详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新合同
   */
  static async createContract(contractData: CreateContractRequest, createdBy: number): Promise<Contract> {
    await this.ensureDbInitialized();
    
    try {
      // 检查合同编号是否已存在
      const existingByNo = await this.db.select<Contract>(
        'SELECT id FROM contracts WHERE contract_no = ?',
        [contractData.contract_no]
      ) as unknown as Contract[];
      
      if (existingByNo.length > 0) {
        throw new Error('合同编号已存在');
      }

      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO contracts (
          title, contract_no, contract_type, party_a, party_b, amount,
          start_date, end_date, signed_at, status, project_id,
          created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contractData.title,
          contractData.contract_no,
          contractData.contract_type,
          contractData.party_a,
          contractData.party_b,
          contractData.amount,
          contractData.start_date,
          contractData.end_date,
          contractData.signed_at,
          contractData.status || 'draft',
          contractData.project_id || null,
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      // 返回新创建的合同信息
      return await this.getContractById(result.lastInsertId as number) as Contract;
    } catch (error) {
      console.error('创建合同失败:', error);
      throw error;
    }
  }

  /**
   * 更新合同信息
   */
  static async updateContract(contractData: UpdateContractRequest, updatedBy: number): Promise<Contract> {
    await this.ensureDbInitialized();
    
    try {
      // 检查合同是否存在
      const existingContract = await this.getContractById(contractData.id);
      if (!existingContract) {
        throw new Error('合同不存在');
      }

      // 检查合同编号唯一性（排除当前合同）
      if (contractData.contract_no) {
        const existingByNo = await this.db.select<Contract>(
          'SELECT id FROM contracts WHERE contract_no = ? AND id != ?',
          [contractData.contract_no, contractData.id]
        ) as unknown as Contract[];
        
        if (existingByNo.length > 0) {
          throw new Error('合同编号已存在');
        }
      }

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = [
        'title', 'contract_no', 'contract_type', 'party_a', 'party_b', 'amount',
        'start_date', 'end_date', 'signed_at', 'status', 'project_id'
      ];

      fieldsToUpdate.forEach(field => {
        if (contractData[field as keyof UpdateContractRequest] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(contractData[field as keyof UpdateContractRequest]);
        }
      });

      // 添加更新时间和更新人
      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);

      // 添加WHERE条件的ID
      updateValues.push(contractData.id);

      await this.db.execute(
        `UPDATE contracts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 返回更新后的合同信息
      return await this.getContractById(contractData.id) as Contract;
    } catch (error) {
      console.error('更新合同失败:', error);
      throw error;
    }
  }

  /**
   * 删除合同
   */
  static async deleteContract(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查合同是否存在
      const contract = await this.getContractById(id);
      if (!contract) {
        throw new Error('合同不存在');
      }

      // 检查是否有关联的收付款记录
      const payments = await this.db.select(
        'SELECT id FROM payment_receipts WHERE contract_id = ?',
        [id]
      ) as any[];
      
      if (payments.length > 0) {
        throw new Error('该合同下还有收付款记录，无法删除');
      }

      // 删除合同
      await this.db.execute('DELETE FROM contracts WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除合同失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目的合同列表
   */
  static async getContractsByProject(projectId: number): Promise<Contract[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select<Contract>(
        `SELECT 
          c.*,
          p.name as project_name
        FROM contracts c 
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE c.project_id = ?
        ORDER BY c.created_at DESC`,
        [projectId]
      ) as unknown as Contract[];
    } catch (error) {
      console.error('查询项目合同失败:', error);
      throw error;
    }
  }

  /**
   * 获取合同履行情况
   */
  static async getContractPerformance(contractId: number): Promise<{
    contract: Contract;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    payment_rate: number;
    payments: PaymentReceipt[];
    overdue_payments: PaymentReceipt[];
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 获取合同信息
      const contract = await this.getContractById(contractId);
      if (!contract) {
        throw new Error('合同不存在');
      }

      // 获取付款统计
      const paymentStats = await this.db.select<{
        paid_amount: number;
        pending_amount: number;
      }>(
        `SELECT 
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
          COALESCE(SUM(CASE WHEN status IN ('draft', 'pending', 'approved') THEN amount ELSE 0 END), 0) as pending_amount
        FROM payment_receipts 
        WHERE contract_id = ?`,
        [contractId]
      ) as unknown as {paid_amount: number; pending_amount: number}[];

      // 获取所有付款记录
      const payments = await this.db.select<PaymentReceipt>(
        `SELECT * FROM payment_receipts 
        WHERE contract_id = ?
        ORDER BY transaction_date DESC`,
        [contractId]
      ) as unknown as PaymentReceipt[];

      // 获取逾期付款记录
      const overduePayments = await this.db.select<PaymentReceipt>(
        `SELECT * FROM payment_receipts 
        WHERE contract_id = ? 
        AND status IN ('pending', 'approved')
        AND transaction_date < date('now')
        ORDER BY transaction_date ASC`,
        [contractId]
      ) as unknown as PaymentReceipt[];

      const stats = paymentStats[0] || { paid_amount: 0, pending_amount: 0 };
      const paymentRate = contract.amount > 0 ? (stats.paid_amount / contract.amount) * 100 : 0;

      return {
        contract,
        total_amount: contract.amount,
        paid_amount: stats.paid_amount,
        pending_amount: stats.pending_amount,
        payment_rate: paymentRate,
        payments,
        overdue_payments: overduePayments
      };
    } catch (error) {
      console.error('获取合同履行情况失败:', error);
      throw error;
    }
  }

  /**
   * 检查合同编号是否可用
   */
  static async isContractNoAvailable(contractNo: string, excludeId?: number): Promise<boolean> {
    await this.ensureDbInitialized();
    
    try {
      let query = 'SELECT id FROM contracts WHERE contract_no = ?';
      const params: any[] = [contractNo];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await this.db.select(query, params) as unknown as any[];
      return result.length === 0;
    } catch (error) {
      console.error('检查合同编号可用性失败:', error);
      throw error;
    }
  }

  /**
   * 更新合同状态
   */
  static async updateContractStatus(id: number, status: string, updatedBy: number): Promise<Contract> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute(
        'UPDATE contracts SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?',
        [status, new Date().toISOString(), updatedBy, id]
      );

      return await this.getContractById(id) as Contract;
    } catch (error) {
      console.error('更新合同状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取合同的完整信息（包括条目、文档、审批等）
   */
  static async getContractFullDetails(contractId: number): Promise<{
    contract: Contract;
    items: ContractItem[];
    documents: ContractDocument[];
    approvals: ContractApproval[];
    itemsStats: any;
    documentsStats: any;
    approvalSummary: any;
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 获取合同基本信息
      const contract = await this.getContractById(contractId);
      if (!contract) {
        throw new Error('合同不存在');
      }

      // 并行获取其他信息
      const [
        items,
        documents,
        approvals,
        itemsStats,
        documentsStats,
        approvalSummary
      ] = await Promise.all([
        ContractItemService.getContractItems(contractId),
        ContractDocumentService.getContractDocuments(contractId),
        ContractApprovalService.getContractApprovals(contractId),
        ContractItemService.getContractItemsStatistics(contractId),
        ContractDocumentService.getContractDocumentStatistics(contractId),
        ContractApprovalService.getContractApprovalSummary(contractId)
      ]);

      return {
        contract,
        items,
        documents,
        approvals,
        itemsStats,
        documentsStats,
        approvalSummary
      };
    } catch (error) {
      console.error('获取合同完整信息失败:', error);
      throw error;
    }
  }

  /**
   * 合同统计信息
   */
  static async getContractStatistics(params?: {
    start_date?: string;
    end_date?: string;
    project_id?: number;
  }): Promise<{
    total_contracts: number;
    total_amount: number;
    status_breakdown: Array<{ status: string; count: number; amount: number }>;
    type_breakdown: Array<{ type: string; count: number; amount: number }>;
    monthly_trends: Array<{ month: string; count: number; amount: number }>;
  }> {
    await this.ensureDbInitialized();
    
    try {
      const conditions: string[] = [];
      const queryParams: any[] = [];

      if (params?.start_date) {
        conditions.push('created_at >= ?');
        queryParams.push(params.start_date);
      }

      if (params?.end_date) {
        conditions.push('created_at <= ?');
        queryParams.push(params.end_date);
      }

      if (params?.project_id) {
        conditions.push('project_id = ?');
        queryParams.push(params.project_id);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 基本统计
      const basicStats = await this.db.select(
        `SELECT 
          COUNT(*) as total_contracts,
          COALESCE(SUM(amount), 0) as total_amount
        FROM contracts ${whereClause}`,
        queryParams
      ) as unknown as { total_contracts: number; total_amount: number }[];

      // 状态统计
      const statusStats = await this.db.select(
        `SELECT 
          status,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM contracts ${whereClause}
        GROUP BY status
        ORDER BY count DESC`,
        queryParams
      ) as unknown as Array<{ status: string; count: number; amount: number }>;

      // 类型统计
      const typeStats = await this.db.select(
        `SELECT 
          contract_type as type,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM contracts ${whereClause}
        GROUP BY contract_type
        ORDER BY count DESC`,
        queryParams
      ) as unknown as Array<{ type: string; count: number; amount: number }>;

      // 月度趋势
      const monthlyStats = await this.db.select(
        `SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as amount
        FROM contracts ${whereClause}
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month DESC
        LIMIT 12`,
        queryParams
      ) as unknown as Array<{ month: string; count: number; amount: number }>;

      const stats = basicStats[0] || { total_contracts: 0, total_amount: 0 };

      return {
        total_contracts: stats.total_contracts,
        total_amount: stats.total_amount,
        status_breakdown: statusStats || [],
        type_breakdown: typeStats || [],
        monthly_trends: monthlyStats || []
      };
    } catch (error) {
      console.error('获取合同统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 複制合同
   */
  static async duplicateContract(sourceContractId: number, createdBy: number, updates?: Partial<CreateContractRequest>): Promise<Contract> {
    await this.ensureDbInitialized();
    
    try {
      // 获取源合同信息
      const sourceContract = await this.getContractById(sourceContractId);
      if (!sourceContract) {
        throw new Error('源合同不存在');
      }

      // 准备新合同数据
      const newContractData: CreateContractRequest = {
        title: `${sourceContract.title} - 副本`,
        contract_no: await this.generateContractNo(),
        contract_type: sourceContract.contract_type,
        party_a: sourceContract.party_a,
        party_b: sourceContract.party_b,
        amount: sourceContract.amount,
        start_date: sourceContract.start_date,
        end_date: sourceContract.end_date,
        signed_at: sourceContract.signed_at,
        status: 'draft',
        project_id: sourceContract.project_id,
        ...updates
      };

      // 创建新合同
      const newContract = await this.createContract(newContractData, createdBy);

      // 复制合同条目
      if (newContract.id) {
        await ContractItemService.copyItemsToContract(sourceContractId, newContract.id);
      }

      return newContract;
    } catch (error) {
      console.error('复制合同失败:', error);
      throw error;
    }
  }

  /**
   * 生成合同编号
   */
  static async generateContractNo(): Promise<string> {
    await this.ensureDbInitialized();
    
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const prefix = `HT${year}${month}`;

      // 获取当月最大编号
      const result = await this.db.select(
        `SELECT contract_no FROM contracts 
        WHERE contract_no LIKE ? 
        ORDER BY contract_no DESC 
        LIMIT 1`,
        [`${prefix}%`]
      ) as unknown as { contract_no: string }[];

      let sequence = 1;
      if (result.length > 0) {
        const lastNo = result[0].contract_no;
        const lastSequence = parseInt(lastNo.substring(prefix.length));
        sequence = lastSequence + 1;
      }

      return `${prefix}${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      console.error('生成合同编号失败:', error);
      throw error;
    }
  }
}