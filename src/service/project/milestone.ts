/**
 * 项目里程碑管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { ProjectMilestone } from '../../types/project';

export class ProjectMilestoneService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化项目里程碑服务数据库连接失败:', error);
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
   * 获取项目里程碑列表
   */
  static async getProjectMilestones(projectId: number): Promise<ProjectMilestone[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select<ProjectMilestone[]>(
        'SELECT * FROM project_milestones WHERE project_id = ? ORDER BY planned_date ASC',
        [projectId]
      );
    } catch (error) {
      console.error('查询项目里程碑失败:', error);
      throw error;
    }
  }

  /**
   * 创建里程碑
   */
  static async createMilestone(milestoneData: Omit<ProjectMilestone, 'id'>, createdBy: number): Promise<ProjectMilestone> {
    await this.ensureDbInitialized();
    
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO project_milestones (
          project_id, title, description, planned_date, actual_date,
          status, priority, created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          milestoneData.project_id,
          milestoneData.title,
          milestoneData.description || '',
          milestoneData.planned_date,
          milestoneData.actual_date || null,
          milestoneData.status || 'pending',
          milestoneData.priority || 'medium',
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      const milestones = await this.db.select<ProjectMilestone[]>(
        'SELECT * FROM project_milestones WHERE id = ?',
        [result.lastInsertId]
      );
      
      return milestones[0];
    } catch (error) {
      console.error('创建里程碑失败:', error);
      throw error;
    }
  }

  /**
   * 更新里程碑
   */
  static async updateMilestone(id: number, milestoneData: Partial<ProjectMilestone>, updatedBy: number): Promise<ProjectMilestone> {
    await this.ensureDbInitialized();
    
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = ['title', 'description', 'planned_date', 'actual_date', 'status', 'priority'];

      fieldsToUpdate.forEach(field => {
        if (milestoneData[field as keyof ProjectMilestone] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(milestoneData[field as keyof ProjectMilestone]);
        }
      });

      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);
      updateValues.push(id);

      await this.db.execute(
        `UPDATE project_milestones SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const milestones = await this.db.select<ProjectMilestone[]>(
        'SELECT * FROM project_milestones WHERE id = ?',
        [id]
      );
      
      return milestones[0];
    } catch (error) {
      console.error('更新里程碑失败:', error);
      throw error;
    }
  }

  /**
   * 删除里程碑
   */
  static async deleteMilestone(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute('DELETE FROM project_milestones WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除里程碑失败:', error);
      throw error;
    }
  }

  /**
   * 标记里程碑完成
   */
  static async completeMilestone(id: number, actualDate: string, updatedBy: number): Promise<ProjectMilestone> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute(
        `UPDATE project_milestones 
        SET status = 'completed', actual_date = ?, updated_at = ?, updated_by = ?
        WHERE id = ?`,
        [actualDate, new Date().toISOString(), updatedBy, id]
      );

      const milestones = await this.db.select<ProjectMilestone[]>(
        'SELECT * FROM project_milestones WHERE id = ?',
        [id]
      );
      
      return milestones[0];
    } catch (error) {
      console.error('标记里程碑完成失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目里程碑统计
   */
  static async getMilestoneStatistics(projectId: number): Promise<{
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    delayed: number;
    completion_rate: number;
    upcoming: ProjectMilestone[];
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 里程碑统计
      const stats = await this.db.select<{
        total: number;
        completed: number;
        pending: number;
        in_progress: number;
        delayed: number;
      }[]>(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed
        FROM project_milestones 
        WHERE project_id = ?`,
        [projectId]
      );

      // 即将到来的里程碑（7天内）
      const upcoming = await this.db.select<ProjectMilestone[]>(
        `SELECT * FROM project_milestones 
        WHERE project_id = ? 
        AND status IN ('pending', 'in_progress')
        AND planned_date BETWEEN date('now') AND date('now', '+7 days')
        ORDER BY planned_date ASC
        LIMIT 5`,
        [projectId]
      );

      const milestoneStats = stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        in_progress: 0,
        delayed: 0
      };

      const completionRate = milestoneStats.total > 0 
        ? (milestoneStats.completed / milestoneStats.total) * 100 
        : 0;

      return {
        ...milestoneStats,
        completion_rate: completionRate,
        upcoming
      };
    } catch (error) {
      console.error('获取里程碑统计失败:', error);
      throw error;
    }
  }
}