/**
 * 公司管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { 
  Company, 
  CreateCompanyRequest, 
  UpdateCompanyRequest, 
  CompanyQueryParams,
  CompanyListResponse 
} from '../../types/company.ts';

export class CompanyService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化公司服务数据库连接失败:', error);
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
   * 获取公司列表（带分页和搜索）
   */
  static async getCompanies(params: CompanyQueryParams = {}): Promise<CompanyListResponse> {
    await this.ensureDbInitialized();
    
    const {
      company_name,
      credit_code,
      company_type,
      status = 'active',
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = params;

    // 构建WHERE条件
    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (company_name) {
      conditions.push('company_name LIKE ?');
      queryParams.push(`%${company_name}%`);
    }

    if (credit_code) {
      conditions.push('credit_code LIKE ?');
      queryParams.push(`%${credit_code}%`);
    }

    if (company_type) {
      conditions.push('company_type = ?');
      queryParams.push(company_type);
    }

    if (status) {
      conditions.push('status = ?');
      queryParams.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 计算偏移量
    const offset = (page - 1) * page_size;

    try {
      // 查询总数
      const countQuery = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
      const countResult = await this.db.select(countQuery, queryParams) as Array<{total: number}>;
      const total = countResult[0]?.total || 0;

      // 查询数据
      const dataQuery = `
        SELECT * FROM companies 
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `;
      const companies = await this.db.select(dataQuery, [...queryParams, page_size, offset]) as Company[];

      const total_pages = Math.ceil(total / page_size);

      return {
        companies,
        total,
        page,
        page_size,
        total_pages
      };
    } catch (error) {
      console.error('查询公司列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取公司详情
   */
  static async getCompanyById(id: number): Promise<Company | null> {
    await this.ensureDbInitialized();
    
    try {
      const companies = await this.db.select(
        'SELECT * FROM companies WHERE id = ?',
        [id]
      ) as Company[];
      return companies[0] || null;
    } catch (error) {
      console.error('查询公司详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新公司
   */
  static async createCompany(companyData: CreateCompanyRequest, createdBy: number): Promise<Company> {
    await this.ensureDbInitialized();
    
    try {
      // 检查公司名称是否已存在
      const existingByName = await this.db.select(
        'SELECT id FROM companies WHERE company_name = ?',
        [companyData.company_name]
      ) as {id: number}[];
      
      if (existingByName.length > 0) {
        throw new Error('公司名称已存在');
      }

      // 检查统一社会信用代码是否已存在
      const existingByCode = await this.db.select(
        'SELECT id FROM companies WHERE credit_code = ?',
        [companyData.credit_code]
      ) as {id: number}[];
      
      if (existingByCode.length > 0) {
        throw new Error('统一社会信用代码已存在');
      }

      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO companies (
          company_name, credit_code, reg_address, office_address, business_scope,
          company_type, established_date, registered_capital, legal_representative_name,
          legal_representative_id_card, legal_representative_contact, contact_name,
          contact_position, contact_mobile, contact_landline, contact_email,
          emergency_contact, emergency_phone, bank_account, tax_registration_no,
          invoice_info, business_license, safety_production_license, qualification,
          certification_info, industry_filing_info, organizational_structure,
          historical_projects, attachments, remarks, status, created_at, updated_at,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyData.company_name,
          companyData.credit_code,
          companyData.reg_address,
          companyData.office_address || '',
          companyData.business_scope || '',
          companyData.company_type || '',
          companyData.established_date || '',
          companyData.registered_capital || null,
          companyData.legal_representative_name || '',
          companyData.legal_representative_id_card || '',
          companyData.legal_representative_contact || '',
          companyData.contact_name || '',
          companyData.contact_position || '',
          companyData.contact_mobile || '',
          companyData.contact_landline || '',
          companyData.contact_email || '',
          companyData.emergency_contact || '',
          companyData.emergency_phone || '',
          companyData.bank_account || '',
          companyData.tax_registration_no || '',
          companyData.invoice_info || '',
          companyData.business_license || '',
          companyData.safety_production_license || '',
          companyData.qualification || '',
          companyData.certification_info || '',
          companyData.industry_filing_info || '',
          companyData.organizational_structure || '',
          companyData.historical_projects || '',
          companyData.attachments || '',
          companyData.remarks || '',
          'active',
          now,
          now,
          createdBy,
          createdBy
        ]
      );

      // 返回新创建的公司信息
      return await this.getCompanyById(result.lastInsertId as number) as Company;
    } catch (error) {
      console.error('创建公司失败:', error);
      throw error;
    }
  }

  /**
   * 更新公司信息
   */
  static async updateCompany(companyData: UpdateCompanyRequest, updatedBy: number): Promise<Company> {
    await this.ensureDbInitialized();
    
    try {
      // 检查公司是否存在
      const existingCompany = await this.getCompanyById(companyData.id);
      if (!existingCompany) {
        throw new Error('公司不存在');
      }

      // 检查公司名称唯一性（排除当前公司）
      if (companyData.company_name) {
        const existingByName = await this.db.select(
          'SELECT id FROM companies WHERE company_name = ? AND id != ?',
          [companyData.company_name, companyData.id]
        ) as {id: number}[];
        
        if (existingByName.length > 0) {
          throw new Error('公司名称已存在');
        }
      }

      // 检查统一社会信用代码唯一性（排除当前公司）
      if (companyData.credit_code) {
        const existingByCode = await this.db.select(
          'SELECT id FROM companies WHERE credit_code = ? AND id != ?',
          [companyData.credit_code, companyData.id]
        ) as {id: number}[];
        
        if (existingByCode.length > 0) {
          throw new Error('统一社会信用代码已存在');
        }
      }

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = [
        'company_name', 'credit_code', 'reg_address', 'office_address', 'business_scope',
        'company_type', 'established_date', 'registered_capital', 'legal_representative_name',
        'legal_representative_id_card', 'legal_representative_contact', 'contact_name',
        'contact_position', 'contact_mobile', 'contact_landline', 'contact_email',
        'emergency_contact', 'emergency_phone', 'bank_account', 'tax_registration_no',
        'invoice_info', 'business_license', 'safety_production_license', 'qualification',
        'certification_info', 'industry_filing_info', 'organizational_structure',
        'historical_projects', 'attachments', 'remarks'
      ];

      fieldsToUpdate.forEach(field => {
        if (companyData[field as keyof UpdateCompanyRequest] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(companyData[field as keyof UpdateCompanyRequest]);
        }
      });

      // 添加更新时间和更新人
      updateFields.push('updated_at = ?', 'updated_by = ?');
      updateValues.push(new Date().toISOString(), updatedBy);

      // 添加WHERE条件的ID
      updateValues.push(companyData.id);

      await this.db.execute(
        `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 返回更新后的公司信息
      return await this.getCompanyById(companyData.id) as Company;
    } catch (error) {
      console.error('更新公司失败:', error);
      throw error;
    }
  }

  /**
   * 删除公司（软删除，更新状态为inactive）
   */
  static async deleteCompany(id: number, deletedBy: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查公司是否存在
      const company = await this.getCompanyById(id);
      if (!company) {
        throw new Error('公司不存在');
      }

      // 检查是否有关联的项目
      const projects = await this.db.select(
        'SELECT id FROM projects WHERE company_id = ?',
        [id]
      ) as {id: number}[];
      
      if (projects.length > 0) {
        throw new Error('该公司下还有项目，无法删除');
      }

      // 软删除：更新状态为inactive
      await this.db.execute(
        'UPDATE companies SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?',
        ['inactive', new Date().toISOString(), deletedBy, id]
      );
    } catch (error) {
      console.error('删除公司失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用的公司（用于下拉选择）
   */
  static async getAvailableCompanies(): Promise<{ id: number; company_name: string }[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select(
        'SELECT id, company_name FROM companies WHERE status = ? OR status IS NULL ORDER BY company_name',
        ['active']
      ) as { id: number; company_name: string }[];
    } catch (error) {
      console.error('查询可用公司列表失败:', error);
      throw error;
    }
  }

  /**
   * 检查公司名称是否可用
   */
  static async isCompanyNameAvailable(companyName: string, excludeId?: number): Promise<boolean> {
    await this.ensureDbInitialized();
    
    try {
      let query = 'SELECT id FROM companies WHERE company_name = ?';
      const params: any[] = [companyName];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await this.db.select(query, params) as {id: number}[];
      return result.length === 0;
    } catch (error) {
      console.error('检查公司名称可用性失败:', error);
      throw error;
    }
  }

  /**
   * 检查统一社会信用代码是否可用
   */
  static async isCreditCodeAvailable(creditCode: string, excludeId?: number): Promise<boolean> {
    await this.ensureDbInitialized();
    
    try {
      let query = 'SELECT id FROM companies WHERE credit_code = ?';
      const params: any[] = [creditCode];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await this.db.select(query, params) as {id: number}[];
      return result.length === 0;
    } catch (error) {
      console.error('检查统一社会信用代码可用性失败:', error);
      throw error;
    }
  }
}