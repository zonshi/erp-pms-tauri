/**
 * 项目预算管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { ProjectBudget } from '../../types/project';

export class ProjectBudgetService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化项目预算服务数据库连接失败:', error);
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
   * 获取项目预算列表
   */
  static async getProjectBudgets(projectId: number): Promise<ProjectBudget[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select<ProjectBudget[]>(
        'SELECT * FROM project_budgets WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      );
    } catch (error) {
      console.error('查询项目预算失败:', error);
      throw error;
    }
  }

  /**
   * 创建预算项
   */
  static async createBudgetItem(budgetData: Omit<ProjectBudget, 'id'>, createdBy: number): Promise<ProjectBudget> {
    await this.ensureDbInitialized();
    
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO project_budgets (
          project_id, item_name, category, planned_amount, actual_amount,
          remarks, created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          budgetData.project_id,
          budgetData.item_name,
          budgetData.category,
          budgetData.planned_amount,
          budgetData.actual_amount || null,
          budgetData.remarks || '',
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      const budgets = await this.db.select<ProjectBudget[]>(
        'SELECT * FROM project_budgets WHERE id = ?',
        [result.lastInsertId]
      );
      
      return budgets[0];
    } catch (error) {
      console.error('创建预算项失败:', error);
      throw error;
    }
  }

  /**
   * 更新预算项
   */
  static async updateBudgetItem(id: number, budgetData: Partial<ProjectBudget>, updatedBy: number): Promise<ProjectBudget> {
    await this.ensureDbInitialized();
    
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = ['item_name', 'category', 'planned_amount', 'actual_amount', 'remarks'];

      fieldsToUpdate.forEach(field => {
        if (budgetData[field as keyof ProjectBudget] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(budgetData[field as keyof ProjectBudget]);
        }
      });

      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);
      updateValues.push(id);

      await this.db.execute(
        `UPDATE project_budgets SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const budgets = await this.db.select<ProjectBudget[]>(
        'SELECT * FROM project_budgets WHERE id = ?',
        [id]
      );
      
      return budgets[0];
    } catch (error) {
      console.error('更新预算项失败:', error);
      throw error;
    }
  }

  /**
   * 删除预算项
   */
  static async deleteBudgetItem(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute('DELETE FROM project_budgets WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除预算项失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目预算汇总
   */
  static async getProjectBudgetSummary(projectId: number): Promise<{
    total_planned: number;
    total_actual: number;
    utilization_rate: number;
    categories: Array<{
      category: string;
      planned_amount: number;
      actual_amount: number;
    }>;
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 总体统计
      const totalStats = await this.db.select<{
        total_planned: number;
        total_actual: number;
      }[]>(
        `SELECT 
          COALESCE(SUM(planned_amount), 0) as total_planned,
          COALESCE(SUM(actual_amount), 0) as total_actual
        FROM project_budgets 
        WHERE project_id = ?`,
        [projectId]
      );

      // 分类统计
      const categoryStats = await this.db.select<{
        category: string;
        planned_amount: number;
        actual_amount: number;
      }[]>(
        `SELECT 
          category,
          COALESCE(SUM(planned_amount), 0) as planned_amount,
          COALESCE(SUM(actual_amount), 0) as actual_amount
        FROM project_budgets 
        WHERE project_id = ?
        GROUP BY category
        ORDER BY planned_amount DESC`,
        [projectId]
      );

      const totals = totalStats[0] || { total_planned: 0, total_actual: 0 };
      const utilizationRate = totals.total_planned > 0 
        ? (totals.total_actual / totals.total_planned) * 100 
        : 0;

      return {
        total_planned: totals.total_planned,
        total_actual: totals.total_actual,
        utilization_rate: utilizationRate,
        categories: categoryStats
      };
    } catch (error) {
      console.error('获取项目预算汇总失败:', error);
      throw error;
    }
  }
}