/**
 * 合同文档管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { 
  ContractDocument, 
  UploadContractDocumentRequest 
} from '../../types/project';

export class ContractDocumentService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化合同文档服务数据库连接失败:', error);
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
   * 获取合同的所有文档
   */
  static async getContractDocuments(contractId: number): Promise<ContractDocument[]> {
    await this.ensureDbInitialized();
    
    try {
      const documents = await this.db.select(
        `SELECT 
          cd.*,
          u.full_name as uploader_name
        FROM contract_documents cd
        LEFT JOIN users u ON cd.uploaded_by = u.id
        WHERE cd.contract_id = ?
        ORDER BY cd.uploaded_at DESC`,
        [contractId]
      ) as unknown as ContractDocument[];

      // 格式化文件大小
      return documents.map(doc => ({
        ...doc,
        file_size_formatted: this.formatFileSize(doc.file_size)
      }));
    } catch (error) {
      console.error('查询合同文档失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取文档详情
   */
  static async getContractDocumentById(id: number): Promise<ContractDocument | null> {
    await this.ensureDbInitialized();
    
    try {
      const documents = await this.db.select(
        `SELECT 
          cd.*,
          u.full_name as uploader_name
        FROM contract_documents cd
        LEFT JOIN users u ON cd.uploaded_by = u.id
        WHERE cd.id = ?`,
        [id]
      ) as unknown as ContractDocument[];
      
      const doc = documents[0];
      if (doc) {
        doc.file_size_formatted = this.formatFileSize(doc.file_size);
      }
      
      return doc || null;
    } catch (error) {
      console.error('查询合同文档详情失败:', error);
      throw error;
    }
  }

  /**
   * 上传合同文档
   */
  static async uploadContractDocument(documentData: UploadContractDocumentRequest, uploadedBy: number): Promise<ContractDocument> {
    await this.ensureDbInitialized();
    
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO contract_documents (
          contract_id, file_name, file_path, file_type, file_size,
          uploaded_at, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          documentData.contract_id,
          documentData.file_name,
          documentData.file_path,
          documentData.file_type,
          documentData.file_size,
          now,
          uploadedBy
        ]
      );

      // 返回新创建的文档信息
      return await this.getContractDocumentById(result.lastInsertId as number) as ContractDocument;
    } catch (error) {
      console.error('上传合同文档失败:', error);
      throw error;
    }
  }

  /**
   * 删除合同文档
   */
  static async deleteContractDocument(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查文档是否存在
      const document = await this.getContractDocumentById(id);
      if (!document) {
        throw new Error('合同文档不存在');
      }

      // 删除文档记录
      await this.db.execute('DELETE FROM contract_documents WHERE id = ?', [id]);
      
      // 注意：这里只删除数据库记录，实际文件删除需要在调用方处理
    } catch (error) {
      console.error('删除合同文档失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除合同文档
   */
  static async batchDeleteContractDocuments(documentIds: number[]): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      for (const id of documentIds) {
        await this.deleteContractDocument(id);
      }
    } catch (error) {
      console.error('批量删除合同文档失败:', error);
      throw error;
    }
  }

  /**
   * 获取合同文档统计信息
   */
  static async getContractDocumentStatistics(contractId: number): Promise<{
    total_documents: number;
    total_size: number;
    total_size_formatted: string;
    file_types: Array<{ type: string; count: number; }>;
  }> {
    await this.ensureDbInitialized();
    
    try {
      // 获取基本统计
      const basicStats = await this.db.select(
        `SELECT 
          COUNT(*) as total_documents,
          COALESCE(SUM(file_size), 0) as total_size
        FROM contract_documents 
        WHERE contract_id = ?`,
        [contractId]
      ) as unknown as { total_documents: number; total_size: number }[];

      // 获取文件类型统计
      const typeStats = await this.db.select(
        `SELECT 
          file_type as type,
          COUNT(*) as count
        FROM contract_documents 
        WHERE contract_id = ?
        GROUP BY file_type
        ORDER BY count DESC`,
        [contractId]
      ) as unknown as Array<{ type: string; count: number }>;

      const stats = basicStats[0] || { total_documents: 0, total_size: 0 };

      return {
        total_documents: stats.total_documents,
        total_size: stats.total_size,
        total_size_formatted: this.formatFileSize(stats.total_size),
        file_types: typeStats || []
      };
    } catch (error) {
      console.error('获取合同文档统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查文件名是否已存在
   */
  static async isFileNameExists(contractId: number, fileName: string, excludeId?: number): Promise<boolean> {
    await this.ensureDbInitialized();
    
    try {
      let query = 'SELECT id FROM contract_documents WHERE contract_id = ? AND file_name = ?';
      const params: any[] = [contractId, fileName];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await this.db.select(query, params) as unknown as any[];
      return result.length > 0;
    } catch (error) {
      console.error('检查文件名是否存在失败:', error);
      throw error;
    }
  }

  /**
   * 更新文档信息
   */
  static async updateContractDocument(id: number, updates: { file_name?: string; file_path?: string }): Promise<ContractDocument> {
    await this.ensureDbInitialized();
    
    try {
      // 检查文档是否存在
      const existingDoc = await this.getContractDocumentById(id);
      if (!existingDoc) {
        throw new Error('合同文档不存在');
      }

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.file_name !== undefined) {
        updateFields.push('file_name = ?');
        updateValues.push(updates.file_name);
      }

      if (updates.file_path !== undefined) {
        updateFields.push('file_path = ?');
        updateValues.push(updates.file_path);
      }

      if (updateFields.length === 0) {
        return existingDoc;
      }

      // 添加WHERE条件的ID
      updateValues.push(id);

      await this.db.execute(
        `UPDATE contract_documents SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 返回更新后的文档信息
      return await this.getContractDocumentById(id) as ContractDocument;
    } catch (error) {
      console.error('更新合同文档失败:', error);
      throw error;
    }
  }

  /**
   * 格式化文件大小
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 根据文件扩展名获取文件类型
   */
  static getFileTypeFromExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    
    return typeMap[extension] || 'application/octet-stream';
  }
}