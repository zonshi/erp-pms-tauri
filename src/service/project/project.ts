/**
 * 项目管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectQueryParams,
  ProjectListResponse,
  CompanyProjectTreeNode,
  ProjectStatistics,
  ProjectStatusOptions
} from '../../types/project';

export class ProjectService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化项目服务数据库连接失败:', error);
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
   * 获取项目列表（带分页和搜索）
   */
  static async getProjects(params: ProjectQueryParams = {}): Promise<ProjectListResponse> {
    await this.ensureDbInitialized();
    
    const {
      name,
      project_no,
      client_name,
      status,
      company_id,
      manager_id,
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

    if (name) {
      conditions.push('p.name LIKE ?');
      queryParams.push(`%${name}%`);
    }

    if (project_no) {
      conditions.push('p.project_no LIKE ?');
      queryParams.push(`%${project_no}%`);
    }

    if (client_name) {
      conditions.push('p.client_name LIKE ?');
      queryParams.push(`%${client_name}%`);
    }

    if (status) {
      conditions.push('p.status = ?');
      queryParams.push(status);
    }

    if (company_id) {
      conditions.push('p.company_id = ?');
      queryParams.push(company_id);
    }

    if (manager_id) {
      conditions.push('p.manager_id = ?');
      queryParams.push(manager_id);
    }

    if (start_date) {
      conditions.push('p.start_date >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      conditions.push('p.planned_end_date <= ?');
      queryParams.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 计算偏移量
    const offset = (page - 1) * page_size;

    try {
      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM projects p 
        ${whereClause}
      `;
      const countResult = await this.db.select<{total: number}>(countQuery, queryParams);
      const total = (countResult as unknown as any[])[0]?.total || 0;

      // 查询数据（联表获取公司名称和经理姓名）
      const dataQuery = `
        SELECT 
          p.*,
          c.company_name,
          u.full_name as manager_name
        FROM projects p 
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON p.manager_id = u.id
        ${whereClause}
        ORDER BY p.${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `;
      const projects = await this.db.select<Project>(dataQuery, [...queryParams, page_size, offset]) as unknown as Project[];

      const total_pages = Math.ceil(total / page_size);

      return {
        projects,
        total,
        page,
        page_size,
        total_pages
      };
    } catch (error) {
      console.error('查询项目列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取项目详情
   */
  static async getProjectById(id: number): Promise<Project | null> {
    await this.ensureDbInitialized();
    
    try {
      const projects = await this.db.select<Project>(
        `SELECT 
          p.*,
          c.company_name,
          u.full_name as manager_name
        FROM projects p 
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.id = ?`,
        [id]
      ) as unknown as Project[];
      return projects[0] || null;
    } catch (error) {
      console.error('查询项目详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新项目
   */
  static async createProject(projectData: CreateProjectRequest, createdBy: number): Promise<Project> {
    await this.ensureDbInitialized();
    
    try {
      // 检查项目编号是否已存在
      const existingByNo = await this.db.select<Project>(
        'SELECT id FROM projects WHERE project_no = ?',
        [projectData.project_no]
      ) as unknown as Project[];
      
      if (existingByNo.length > 0) {
        throw new Error('项目编号已存在');
      }

      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO projects (
          name, project_no, client_name, description, start_date, planned_end_date,
          total_budget, status, company_id, manager_id, created_at, updated_at,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectData.name,
          projectData.project_no,
          projectData.client_name,
          projectData.description || '',
          projectData.start_date,
          projectData.planned_end_date,
          projectData.total_budget,
          projectData.status || 'planning',
          projectData.company_id || null,
          projectData.manager_id,
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      // 返回新创建的项目信息
      return await this.getProjectById(result.lastInsertId as number) as Project;
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }

  /**
   * 更新项目信息
   */
  static async updateProject(projectData: UpdateProjectRequest, updatedBy: number): Promise<Project> {
    await this.ensureDbInitialized();
    
    try {
      // 检查项目是否存在
      const existingProject = await this.getProjectById(projectData.id);
      if (!existingProject) {
        throw new Error('项目不存在');
      }

      // 检查项目编号唯一性（排除当前项目）
      if (projectData.project_no) {
        const existingByNo = await this.db.select<Project>(
          'SELECT id FROM projects WHERE project_no = ? AND id != ?',
          [projectData.project_no, projectData.id]
        ) as unknown as Project[];
        
        if (existingByNo.length > 0) {
          throw new Error('项目编号已存在');
        }
      }

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = [
        'name', 'project_no', 'client_name', 'description', 'start_date', 
        'planned_end_date', 'actual_end_date', 'total_budget', 'status', 
        'company_id', 'manager_id'
      ];

      fieldsToUpdate.forEach(field => {
        if (projectData[field as keyof UpdateProjectRequest] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(projectData[field as keyof UpdateProjectRequest]);
        }
      });

      // 添加更新时间和更新人
      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);

      // 添加WHERE条件的ID
      updateValues.push(projectData.id);

      await this.db.execute(
        `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 返回更新后的项目信息
      return await this.getProjectById(projectData.id) as Project;
    } catch (error) {
      console.error('更新项目失败:', error);
      throw error;
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查项目是否存在
      const project = await this.getProjectById(id);
      if (!project) {
        throw new Error('项目不存在');
      }

      // 检查是否有关联的合同
      const contracts = await this.db.select(
        'SELECT id FROM contracts WHERE project_id = ?',
        [id]
      ) as any[];
      
      if (contracts.length > 0) {
        throw new Error('该项目下还有合同，无法删除');
      }

      // 检查是否有关联的收付款记录
      const payments = await this.db.select(
        'SELECT id FROM payment_receipts WHERE project_id = ?',
        [id]
      ) as any[];
      
      if (payments.length > 0) {
        throw new Error('该项目下还有收付款记录，无法删除');
      }

      // 删除相关数据
      await this.db.execute('DELETE FROM project_budgets WHERE project_id = ?', [id]);
      await this.db.execute('DELETE FROM project_milestones WHERE project_id = ?', [id]);
      await this.db.execute('DELETE FROM project_progress WHERE project_id = ?', [id]);
      
      // 删除项目
      await this.db.execute('DELETE FROM projects WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除项目失败:', error);
      throw error;
    }
  }

  /**
   * 获取公司-项目树结构
   */
  static async getCompanyProjectTree(searchText?: string): Promise<CompanyProjectTreeNode[]> {
    await this.ensureDbInitialized();
    
    try {
      let query = `
        SELECT 
          c.id as company_id,
          c.company_name,
          p.id as project_id,
          p.name as project_name,
          p.status as project_status
        FROM companies c
        LEFT JOIN projects p ON c.id = p.company_id
      `;
      
      const params: any[] = [];
      
      if (searchText) {
        query += ` WHERE (c.company_name LIKE ? OR p.name LIKE ?)`;
        params.push(`%${searchText}%`, `%${searchText}%`);
      }
      
      query += ` ORDER BY c.company_name, p.name`;
      
      const results = await this.db.select<{
        company_id: number;
        company_name: string;
        project_id?: number;
        project_name?: string;
        project_status?: string;
      }>(query, params) as unknown as {
        company_id: number;
        company_name: string;
        project_id?: number;
        project_name?: string;
        project_status?: string;
      }[];

      // 获取状态中文描述的辅助函数
      const getStatusText = (status: string) => {
        const option = ProjectStatusOptions.find(opt => opt.value === status);
        return option?.label || status;
      };

      // 构建树结构
      const companyMap = new Map<number, CompanyProjectTreeNode>();
      
      results.forEach(row => {
        // 处理公司节点
        if (!companyMap.has(row.company_id)) {
          companyMap.set(row.company_id, {
            id: `company_${row.company_id}`,
            label: row.company_name,
            type: 'company',
            children: [],
            data: {
              companyId: row.company_id,
              projectCount: 0
            }
          });
        }
        
        const companyNode = companyMap.get(row.company_id)!;
        
        // 处理项目节点
        if (row.project_id) {
          const statusText = getStatusText(row.project_status!);
          companyNode.children!.push({
            id: `project_${row.project_id}`,
            label: `${row.project_name} (${statusText})`,
            type: 'project',
            data: {
              projectId: row.project_id,
              companyId: row.company_id
            }
          });
          companyNode.data!.projectCount!++;
        }
      });

      // 更新公司节点标签，显示项目数量
      companyMap.forEach(companyNode => {
        const projectCount = companyNode.data!.projectCount!;
        companyNode.label = `${companyNode.label.split(' (')[0]} (${projectCount}个项目)`;
      });

      return Array.from(companyMap.values());
    } catch (error) {
      console.error('获取公司项目树失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目统计信息
   */
  static async getProjectStatistics(): Promise<ProjectStatistics> {
    await this.ensureDbInitialized();
    
    try {
      // 项目总数和状态统计
      const projectStats = await this.db.select<{
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        total_budget: number;
      }>(
        `SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COALESCE(SUM(total_budget), 0) as total_budget
        FROM projects`
      ) as unknown as {
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        total_budget: number;
      }[];

      // 实际成本统计（从预算表中）
      const costStats = await this.db.select<{
        actual_cost: number;
      }>(
        `SELECT COALESCE(SUM(actual_amount), 0) as actual_cost
        FROM project_budgets 
        WHERE actual_amount IS NOT NULL`
      ) as unknown as { actual_cost: number; }[];

      // 逾期项目统计
      const overdueStats = await this.db.select<{
        overdue_projects: number;
      }>(
        `SELECT COUNT(*) as overdue_projects
        FROM projects 
        WHERE status IN ('in_progress', 'planning') 
        AND planned_end_date < date('now')`
      ) as unknown as { overdue_projects: number; }[];

      // 里程碑完成率统计
      const milestoneStats = await this.db.select<{
        total_milestones: number;
        completed_milestones: number;
      }>(
        `SELECT 
          COUNT(*) as total_milestones,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_milestones
        FROM project_milestones`
      ) as unknown as {
        total_milestones: number;
        completed_milestones: number;
      }[];

      const stats = projectStats[0] || {
        total_projects: 0,
        active_projects: 0,
        completed_projects: 0,
        total_budget: 0
      };

      const actualCost = costStats[0]?.actual_cost || 0;
      const overdueProjects = overdueStats[0]?.overdue_projects || 0;
      const milestoneData = milestoneStats[0] || {
        total_milestones: 0,
        completed_milestones: 0
      };

      return {
        total_projects: stats.total_projects,
        active_projects: stats.active_projects,
        completed_projects: stats.completed_projects,
        total_budget: stats.total_budget,
        actual_cost: actualCost,
        budget_utilization: stats.total_budget > 0 ? (actualCost / stats.total_budget) * 100 : 0,
        overdue_projects: overdueProjects,
        milestone_completion_rate: milestoneData.total_milestones > 0 
          ? (milestoneData.completed_milestones / milestoneData.total_milestones) * 100 
          : 0
      };
    } catch (error) {
      console.error('获取项目统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查项目编号是否可用
   */
  static async isProjectNoAvailable(projectNo: string, excludeId?: number): Promise<boolean> {
    await this.ensureDbInitialized();
    
    try {
      let query = 'SELECT id FROM projects WHERE project_no = ?';
      const params: any[] = [projectNo];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await this.db.select(query, params) as any[];
      return result.length === 0;
    } catch (error) {
      console.error('检查项目编号可用性失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户管理的项目
   */
  static async getProjectsByManager(managerId: number): Promise<Project[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select<Project>(
        `SELECT 
          p.*,
          c.company_name,
          u.full_name as manager_name
        FROM projects p 
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.manager_id = ?
        ORDER BY p.created_at DESC`,
        [managerId]
      ) as unknown as Project[];
    } catch (error) {
      console.error('查询用户管理的项目失败:', error);
      throw error;
    }
  }

  /**
   * 获取公司下的项目
   */
  static async getProjectsByCompany(companyId: number): Promise<Project[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select<Project>(
        `SELECT 
          p.*,
          c.company_name,
          u.full_name as manager_name
        FROM projects p 
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.company_id = ?
        ORDER BY p.created_at DESC`,
        [companyId]
      ) as unknown as Project[];
    } catch (error) {
      console.error('查询公司项目失败:', error);
      throw error;
    }
  }
}