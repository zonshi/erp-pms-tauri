/**
 * 收付款管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { PaymentReceipt, PaymentStatus } from '../../types/project';

export class PaymentReceiptService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化收付款服务数据库连接失败:', error);
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
   * 获取项目收付款列表
   */
  static async getProjectPayments(projectId: number): Promise<PaymentReceipt[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select(
        `SELECT 
          pr.*,
          p.name as project_name,
          c.title as contract_title
        FROM payment_receipts pr
        LEFT JOIN projects p ON pr.project_id = p.id
        LEFT JOIN contracts c ON pr.contract_id = c.id
        WHERE pr.project_id = ?
        ORDER BY pr.transaction_date DESC`,
        [projectId]
      ) as unknown as PaymentReceipt[];
    } catch (error) {
      console.error('查询项目收付款失败:', error);
      throw error;
    }
  }

  /**
   * 获取收付款详情
   */
  static async getPaymentById(id: number): Promise<PaymentReceipt | null> {
    await this.ensureDbInitialized();
    
    try {
      const payments = await this.db.select(
        `SELECT 
          pr.*,
          p.name as project_name,
          c.title as contract_title
        FROM payment_receipts pr
        LEFT JOIN projects p ON pr.project_id = p.id
        LEFT JOIN contracts c ON pr.contract_id = c.id
        WHERE pr.id = ?`,
        [id]
      ) as unknown as PaymentReceipt[];
      return payments[0] || null;
    } catch (error) {
      console.error('查询收付款详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建收付款记录
   */
  static async createPayment(paymentData: Omit<PaymentReceipt, 'id'>, createdBy: number): Promise<PaymentReceipt> {
    await this.ensureDbInitialized();
    
    try {
      // 检查收付款单号是否已存在
      const existingByNo = await this.db.select(
        'SELECT id FROM payment_receipts WHERE receipt_no = ?',
        [paymentData.receipt_no]
      ) as unknown as any[];
      
      if (existingByNo.length > 0) {
        throw new Error('收付款单号已存在');
      }

      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO payment_receipts (
          receipt_no, type, amount, currency, exchange_rate, category,
          counterparty, payment_method, transaction_date, description,
          status, project_id, contract_id, bank_account_id,
          created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentData.receipt_no,
          paymentData.type,
          paymentData.amount,
          paymentData.currency,
          paymentData.exchange_rate || null,
          paymentData.category,
          paymentData.counterparty,
          paymentData.payment_method,
          paymentData.transaction_date,
          paymentData.description || '',
          paymentData.status || 'draft',
          paymentData.project_id || null,
          paymentData.contract_id || null,
          paymentData.bank_account_id || null,
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      // 返回新创建的收付款记录
      return await this.getPaymentById(result.lastInsertId as number) as PaymentReceipt;
    } catch (error) {
      console.error('创建收付款失败:', error);
      throw error;
    }
  }

  /**
   * 更新收付款记录
   */
  static async updatePayment(id: number, paymentData: Partial<PaymentReceipt>, updatedBy: number): Promise<PaymentReceipt> {
    await this.ensureDbInitialized();
    
    try {
      // 检查收付款是否存在
      const existingPayment = await this.getPaymentById(id);
      if (!existingPayment) {
        throw new Error('收付款记录不存在');
      }

      // 检查收付款单号唯一性（排除当前记录）
      if (paymentData.receipt_no) {
        const existingByNo = await this.db.select(
          'SELECT id FROM payment_receipts WHERE receipt_no = ? AND id != ?',
          [paymentData.receipt_no, id]
        ) as unknown as any[];
        
        if (existingByNo.length > 0) {
          throw new Error('收付款单号已存在');
        }
      }

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = [
        'receipt_no', 'type', 'amount', 'currency', 'exchange_rate', 'category',
        'counterparty', 'payment_method', 'transaction_date', 'description',
        'status', 'project_id', 'contract_id', 'bank_account_id'
      ];

      fieldsToUpdate.forEach(field => {
        if (paymentData[field as keyof PaymentReceipt] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(paymentData[field as keyof PaymentReceipt]);
        }
      });

      // 添加更新时间和更新人
      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);

      // 添加WHERE条件的ID
      updateValues.push(id);

      await this.db.execute(
        `UPDATE payment_receipts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 返回更新后的收付款记录
      return await this.getPaymentById(id) as PaymentReceipt;
    } catch (error) {
      console.error('更新收付款失败:', error);
      throw error;
    }
  }

  /**
   * 删除收付款记录
   */
  static async deletePayment(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查收付款是否存在
      const payment = await this.getPaymentById(id);
      if (!payment) {
        throw new Error('收付款记录不存在');
      }

      // 检查状态是否可以删除
      if (payment.status === 'paid') {
        throw new Error('已支付的记录无法删除');
      }

      // 删除收付款记录
      await this.db.execute('DELETE FROM payment_receipts WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除收付款失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目收付款统计
   */
  static async getProjectPaymentSummary(projectId: number): Promise<{
    total_income: number;
    total_expense: number;
    net_amount: number;
    pending_income: number;
    pending_expense: number;
    paid_income: number;
    paid_expense: number;
    payment_by_month: Array<{ month: string; income: number; expense: number; }>;
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 总体统计
      const totalStats = await this.db.select(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
          COALESCE(SUM(CASE WHEN type = 'income' AND status IN ('pending', 'approved') THEN amount ELSE 0 END), 0) as pending_income,
          COALESCE(SUM(CASE WHEN type = 'expense' AND status IN ('pending', 'approved') THEN amount ELSE 0 END), 0) as pending_expense,
          COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as paid_income,
          COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as paid_expense
        FROM payment_receipts 
        WHERE project_id = ?`,
        [projectId]
      ) as unknown as {
        total_income: number;
        total_expense: number;
        pending_income: number;
        pending_expense: number;
        paid_income: number;
        paid_expense: number;
      }[];

      // 月度统计
      const monthlyStats = await this.db.select(
        `SELECT 
          strftime('%Y-%m', transaction_date) as month,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM payment_receipts 
        WHERE project_id = ?
        GROUP BY strftime('%Y-%m', transaction_date)
        ORDER BY month DESC
        LIMIT 12`,
        [projectId]
      ) as unknown as Array<{ month: string; income: number; expense: number; }>;

      const stats = totalStats[0] || {
        total_income: 0,
        total_expense: 0,
        pending_income: 0,
        pending_expense: 0,
        paid_income: 0,
        paid_expense: 0
      };

      return {
        total_income: stats.total_income,
        total_expense: stats.total_expense,
        net_amount: stats.total_income - stats.total_expense,
        pending_income: stats.pending_income,
        pending_expense: stats.pending_expense,
        paid_income: stats.paid_income,
        paid_expense: stats.paid_expense,
        payment_by_month: monthlyStats || []
      };
    } catch (error) {
      console.error('获取项目收付款统计失败:', error);
      throw error;
    }
  }

  /**
   * 生成收付款单号
   */
  static async generateReceiptNo(type: 'income' | 'expense'): Promise<string> {
    await this.ensureDbInitialized();
    
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const prefix = type === 'income' ? `SK${year}${month}` : `FK${year}${month}`;

      // 获取当月最大编号
      const result = await this.db.select(
        `SELECT receipt_no FROM payment_receipts 
        WHERE receipt_no LIKE ? 
        ORDER BY receipt_no DESC 
        LIMIT 1`,
        [`${prefix}%`]
      ) as unknown as { receipt_no: string }[];

      let sequence = 1;
      if (result.length > 0) {
        const lastNo = result[0].receipt_no;
        const lastSequence = parseInt(lastNo.substring(prefix.length));
        sequence = lastSequence + 1;
      }

      return `${prefix}${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      console.error('生成收付款单号失败:', error);
      throw error;
    }
  }

  /**
   * 更新收付款状态
   */
  static async updatePaymentStatus(id: number, status: PaymentStatus, updatedBy: number): Promise<PaymentReceipt> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute(
        'UPDATE payment_receipts SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?',
        [status, new Date().toISOString(), updatedBy, id]
      );

      return await this.getPaymentById(id) as PaymentReceipt;
    } catch (error) {
      console.error('更新收付款状态失败:', error);
      throw error;
    }
  }
}