/**
 * 合同审批管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { 
  ContractApproval, 
  CreateContractApprovalRequest, 
  UpdateContractApprovalRequest
} from '../../types/project';

export class ContractApprovalService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化合同审批服务数据库连接失败:', error);
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
   * 获取合同的审批记录
   */
  static async getContractApprovals(contractId: number): Promise<ContractApproval[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select(
        `SELECT 
          ca.*,
          u.full_name as approver_name,
          c.title as contract_title
        FROM contract_approvals ca
        LEFT JOIN users u ON ca.approver_id = u.id
        LEFT JOIN contracts c ON ca.contract_id = c.id
        WHERE ca.contract_id = ?
        ORDER BY ca.approval_level ASC, ca.created_at ASC`,
        [contractId]
      ) as unknown as ContractApproval[];
    } catch (error) {
      console.error('查询合同审批记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取审批记录详情
   */
  static async getContractApprovalById(id: number): Promise<ContractApproval | null> {
    await this.ensureDbInitialized();
    
    try {
      const approvals = await this.db.select(
        `SELECT 
          ca.*,
          u.full_name as approver_name,
          c.title as contract_title
        FROM contract_approvals ca
        LEFT JOIN users u ON ca.approver_id = u.id
        LEFT JOIN contracts c ON ca.contract_id = c.id
        WHERE ca.id = ?`,
        [id]
      ) as unknown as ContractApproval[];
      return approvals[0] || null;
    } catch (error) {
      console.error('查询合同审批记录详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新的审批记录
   */
  static async createContractApproval(approvalData: CreateContractApprovalRequest): Promise<ContractApproval> {
    await this.ensureDbInitialized();
    
    try {
      // 检查是否已存在同级别的审批记录
      const existingApprovals = await this.db.select(
        'SELECT id FROM contract_approvals WHERE contract_id = ? AND approval_level = ?',
        [approvalData.contract_id, approvalData.approval_level]
      ) as unknown as any[];
      
      if (existingApprovals.length > 0) {
        throw new Error(`审批级别 ${approvalData.approval_level} 已存在审批记录`);
      }

      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO contract_approvals (
          contract_id, approver_id, approval_level, status, comments, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          approvalData.contract_id,
          approvalData.approver_id,
          approvalData.approval_level,
          'pending',
          approvalData.comments || '',
          now
        ]
      );

      // 返回新创建的审批记录
      return await this.getContractApprovalById(result.lastInsertId as number) as ContractApproval;
    } catch (error) {
      console.error('创建合同审批记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新审批记录
   */
  static async updateContractApproval(approvalData: UpdateContractApprovalRequest): Promise<ContractApproval> {
    await this.ensureDbInitialized();
    
    try {
      // 检查审批记录是否存在
      const existingApproval = await this.getContractApprovalById(approvalData.id);
      if (!existingApproval) {
        throw new Error('审批记录不存在');
      }

      // 检查状态是否可以更新
      if (existingApproval.status !== 'pending') {
        throw new Error('只能更新状态为"待审批"的记录');
      }

      const now = new Date().toISOString();
      
      await this.db.execute(
        `UPDATE contract_approvals 
        SET status = ?, comments = ?, approved_at = ? 
        WHERE id = ?`,
        [
          approvalData.status,
          approvalData.comments || existingApproval.comments || '',
          approvalData.status === 'pending' ? null : now,
          approvalData.id
        ]
      );

      // 如果审批通过，检查是否需要更新合同状态
      if (approvalData.status === 'approved') {
        await this.checkAndUpdateContractStatus(existingApproval.contract_id);
      }

      // 返回更新后的审批记录
      return await this.getContractApprovalById(approvalData.id) as ContractApproval;
    } catch (error) {
      console.error('更新合同审批记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除审批记录
   */
  static async deleteContractApproval(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查审批记录是否存在
      const approval = await this.getContractApprovalById(id);
      if (!approval) {
        throw new Error('审批记录不存在');
      }

      // 检查是否可以删除
      if (approval.status !== 'pending') {
        throw new Error('只能删除状态为"待审批"的记录');
      }

      // 删除审批记录
      await this.db.execute('DELETE FROM contract_approvals WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除合同审批记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的待审批合同列表
   */
  static async getPendingApprovalsByUser(userId: number): Promise<ContractApproval[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select(
        `SELECT 
          ca.*,
          u.full_name as approver_name,
          c.title as contract_title,
          c.amount as contract_amount,
          c.party_a,
          c.party_b
        FROM contract_approvals ca
        LEFT JOIN users u ON ca.approver_id = u.id
        LEFT JOIN contracts c ON ca.contract_id = c.id
        WHERE ca.approver_id = ? AND ca.status = 'pending'
        ORDER BY ca.approval_level ASC, ca.created_at ASC`,
        [userId]
      ) as unknown as ContractApproval[];
    } catch (error) {
      console.error('查询用户待审批合同失败:', error);
      throw error;
    }
  }

  /**
   * 获取合同审批状态摘要
   */
  static async getContractApprovalSummary(contractId: number): Promise<{
    total_levels: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    current_level: number;
    overall_status: 'pending' | 'approved' | 'rejected' | 'completed';
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 获取审批统计
      const stats = await this.db.select(
        `SELECT 
          COUNT(*) as total_levels,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          MIN(CASE WHEN status = 'pending' THEN approval_level ELSE NULL END) as current_level
        FROM contract_approvals 
        WHERE contract_id = ?`,
        [contractId]
      ) as unknown as {
        total_levels: number;
        pending_count: number;
        approved_count: number;
        rejected_count: number;
        current_level: number | null;
      }[];

      const stat = stats[0] || {
        total_levels: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        current_level: null
      };

      // 确定整体状态
      let overall_status: 'pending' | 'approved' | 'rejected' | 'completed';
      if (stat.rejected_count > 0) {
        overall_status = 'rejected';
      } else if (stat.pending_count > 0) {
        overall_status = 'pending';
      } else if (stat.total_levels > 0 && stat.approved_count === stat.total_levels) {
        overall_status = 'completed';
      } else {
        overall_status = 'approved';
      }

      return {
        total_levels: stat.total_levels,
        pending_count: stat.pending_count,
        approved_count: stat.approved_count,
        rejected_count: stat.rejected_count,
        current_level: stat.current_level || 0,
        overall_status
      };
    } catch (error) {
      console.error('获取合同审批状态摘要失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建审批流程
   */
  static async createApprovalWorkflow(contractId: number, approvers: Array<{ approver_id: number; approval_level: number; }>): Promise<ContractApproval[]> {
    await this.ensureDbInitialized();
    
    try {
      const createdApprovals: ContractApproval[] = [];
      
      // 按审批级别排序
      const sortedApprovers = approvers.sort((a, b) => a.approval_level - b.approval_level);
      
      for (const approver of sortedApprovers) {
        const approval = await this.createContractApproval({
          contract_id: contractId,
          approver_id: approver.approver_id,
          approval_level: approver.approval_level
        });
        createdApprovals.push(approval);
      }
      
      return createdApprovals;
    } catch (error) {
      console.error('批量创建审批流程失败:', error);
      throw error;
    }
  }

  /**
   * 检查并更新合同状态
   */
  private static async checkAndUpdateContractStatus(contractId: number): Promise<void> {
    try {
      const summary = await this.getContractApprovalSummary(contractId);
      
      let newStatus: string;
      if (summary.overall_status === 'completed') {
        newStatus = 'approved';
      } else if (summary.overall_status === 'rejected') {
        newStatus = 'draft'; // 被拒绝后回到草稿状态
      } else {
        newStatus = 'reviewing';
      }

      // 更新合同状态
      await this.db.execute(
        'UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?',
        [newStatus, new Date().toISOString(), contractId]
      );
    } catch (error) {
      console.error('更新合同状态失败:', error);
      // 不抛出错误，避免影响审批流程
    }
  }

  /**
   * 撤回审批
   */
  static async withdrawApproval(contractId: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 删除所有待审批的记录
      await this.db.execute(
        'DELETE FROM contract_approvals WHERE contract_id = ? AND status = ?',
        [contractId, 'pending']
      );

      // 将合同状态改回草稿
      await this.db.execute(
        'UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?',
        ['draft', new Date().toISOString(), contractId]
      );
    } catch (error) {
      console.error('撤回审批失败:', error);
      throw error;
    }
  }
}