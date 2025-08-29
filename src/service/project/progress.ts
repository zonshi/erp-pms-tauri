/**
 * 项目进度管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { ProjectProgress } from '../../types/project';

export class ProjectProgressService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化项目进度服务数据库连接失败:', error);
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
   * 获取项目进度列表
   */
  static async getProjectProgress(projectId: number): Promise<ProjectProgress[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select<ProjectProgress[]>(
        'SELECT * FROM project_progress WHERE project_id = ? ORDER BY planned_start_date ASC',
        [projectId]
      );
    } catch (error) {
      console.error('查询项目进度失败:', error);
      throw error;
    }
  }

  /**
   * 创建进度阶段
   */
  static async createProgressPhase(progressData: Omit<ProjectProgress, 'id'>, createdBy: number): Promise<ProjectProgress> {
    await this.ensureDbInitialized();
    
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO project_progress (
          project_id, phase_name, planned_start_date, planned_end_date,
          actual_start_date, actual_end_date, completion_percentage,
          status, description, created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          progressData.project_id,
          progressData.phase_name,
          progressData.planned_start_date,
          progressData.planned_end_date,
          progressData.actual_start_date || null,
          progressData.actual_end_date || null,
          progressData.completion_percentage || 0,
          progressData.status || 'not_started',
          progressData.description || '',
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      const progressList = await this.db.select<ProjectProgress[]>(
        'SELECT * FROM project_progress WHERE id = ?',
        [result.lastInsertId]
      );
      
      return progressList[0];
    } catch (error) {
      console.error('创建进度阶段失败:', error);
      throw error;
    }
  }

  /**
   * 更新进度阶段
   */
  static async updateProgressPhase(id: number, progressData: Partial<ProjectProgress>, updatedBy: number): Promise<ProjectProgress> {
    await this.ensureDbInitialized();
    
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = [
        'phase_name', 'planned_start_date', 'planned_end_date',
        'actual_start_date', 'actual_end_date', 'completion_percentage',
        'status', 'description'
      ];

      fieldsToUpdate.forEach(field => {
        if (progressData[field as keyof ProjectProgress] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(progressData[field as keyof ProjectProgress]);
        }
      });

      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);
      updateValues.push(id);

      await this.db.execute(
        `UPDATE project_progress SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const progressList = await this.db.select<ProjectProgress[]>(
        'SELECT * FROM project_progress WHERE id = ?',
        [id]
      );
      
      return progressList[0];
    } catch (error) {
      console.error('更新进度阶段失败:', error);
      throw error;
    }
  }

  /**
   * 删除进度阶段
   */
  static async deleteProgressPhase(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute('DELETE FROM project_progress WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除进度阶段失败:', error);
      throw error;
    }
  }

  /**
   * 更新阶段完成百分比
   */
  static async updatePhaseCompletion(id: number, completionPercentage: number, updatedBy: number): Promise<ProjectProgress> {
    await this.ensureDbInitialized();
    
    try {
      // 根据完成百分比自动更新状态
      let status = 'not_started';
      if (completionPercentage > 0 && completionPercentage < 100) {
        status = 'in_progress';
      } else if (completionPercentage === 100) {
        status = 'completed';
      }

      await this.db.execute(
        `UPDATE project_progress 
        SET completion_percentage = ?, status = ?, updated_at = ?, updated_by = ?
        WHERE id = ?`,
        [completionPercentage, status, new Date().toISOString(), updatedBy, id]
      );

      const progressList = await this.db.select<ProjectProgress[]>(
        'SELECT * FROM project_progress WHERE id = ?',
        [id]
      );
      
      return progressList[0];
    } catch (error) {
      console.error('更新阶段完成度失败:', error);
      throw error;
    }
  }

  /**
   * 开始阶段
   */
  static async startPhase(id: number, actualStartDate: string, updatedBy: number): Promise<ProjectProgress> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute(
        `UPDATE project_progress 
        SET status = 'in_progress', actual_start_date = ?, updated_at = ?, updated_by = ?
        WHERE id = ?`,
        [actualStartDate, new Date().toISOString(), updatedBy, id]
      );

      const progressList = await this.db.select<ProjectProgress[]>(
        'SELECT * FROM project_progress WHERE id = ?',
        [id]
      );
      
      return progressList[0];
    } catch (error) {
      console.error('开始阶段失败:', error);
      throw error;
    }
  }

  /**
   * 完成阶段
   */
  static async completePhase(id: number, actualEndDate: string, updatedBy: number): Promise<ProjectProgress> {
    await this.ensureDbInitialized();
    
    try {
      await this.db.execute(
        `UPDATE project_progress 
        SET status = 'completed', actual_end_date = ?, completion_percentage = 100, 
            updated_at = ?, updated_by = ?
        WHERE id = ?`,
        [actualEndDate, new Date().toISOString(), updatedBy, id]
      );

      const progressList = await this.db.select<ProjectProgress[]>(
        'SELECT * FROM project_progress WHERE id = ?',
        [id]
      );
      
      return progressList[0];
    } catch (error) {
      console.error('完成阶段失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目整体进度
   */
  static async getOverallProgress(projectId: number): Promise<{
    overall_completion: number;
    total_phases: number;
    completed_phases: number;
    in_progress_phases: number;
    not_started_phases: number;
    delayed_phases: number;
    current_phase?: ProjectProgress;
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 阶段统计
      const stats = await this.db.select<{
        total_phases: number;
        completed_phases: number;
        in_progress_phases: number;
        not_started_phases: number;
        delayed_phases: number;
        avg_completion: number;
      }[]>(
        `SELECT 
          COUNT(*) as total_phases,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_phases,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_phases,
          COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started_phases,
          COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_phases,
          COALESCE(AVG(completion_percentage), 0) as avg_completion
        FROM project_progress 
        WHERE project_id = ?`,
        [projectId]
      );

      // 当前进行中的阶段
      const currentPhase = await this.db.select<ProjectProgress[]>(
        `SELECT * FROM project_progress 
        WHERE project_id = ? AND status = 'in_progress'
        ORDER BY planned_start_date ASC
        LIMIT 1`,
        [projectId]
      );

      const phaseStats = stats[0] || {
        total_phases: 0,
        completed_phases: 0,
        in_progress_phases: 0,
        not_started_phases: 0,
        delayed_phases: 0,
        avg_completion: 0
      };

      return {
        overall_completion: phaseStats.avg_completion,
        total_phases: phaseStats.total_phases,
        completed_phases: phaseStats.completed_phases,
        in_progress_phases: phaseStats.in_progress_phases,
        not_started_phases: phaseStats.not_started_phases,
        delayed_phases: phaseStats.delayed_phases,
        current_phase: currentPhase[0]
      };
    } catch (error) {
      console.error('获取项目整体进度失败:', error);
      throw error;
    }
  }

  /**
   * 获取进度时间线
   */
  static async getProgressTimeline(projectId: number): Promise<Array<{
    phase_name: string;
    planned_start_date: string;
    planned_end_date: string;
    actual_start_date?: string;
    actual_end_date?: string;
    status: string;
    completion_percentage: number;
    duration_planned: number; // 计划天数
    duration_actual?: number; // 实际天数
  }>> {
    await this.ensureDbInitialized();
    
    try {
      const timeline = await this.db.select<{
        phase_name: string;
        planned_start_date: string;
        planned_end_date: string;
        actual_start_date?: string;
        actual_end_date?: string;
        status: string;
        completion_percentage: number;
      }[]>(
        `SELECT 
          phase_name, planned_start_date, planned_end_date,
          actual_start_date, actual_end_date, status, completion_percentage
        FROM project_progress 
        WHERE project_id = ?
        ORDER BY planned_start_date ASC`,
        [projectId]
      );

      return timeline.map(phase => {
        const plannedStart = new Date(phase.planned_start_date);
        const plannedEnd = new Date(phase.planned_end_date);
        const durationPlanned = Math.ceil((plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24));

        let durationActual: number | undefined;
        if (phase.actual_start_date && phase.actual_end_date) {
          const actualStart = new Date(phase.actual_start_date);
          const actualEnd = new Date(phase.actual_end_date);
          durationActual = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          ...phase,
          duration_planned: durationPlanned,
          duration_actual: durationActual
        };
      });
    } catch (error) {
      console.error('获取进度时间线失败:', error);
      throw error;
    }
  }
}