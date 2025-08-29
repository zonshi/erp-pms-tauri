/**
 * 合同条目管理服务
 */

import Database from '@tauri-apps/plugin-sql';
import { 
  ContractItem, 
  CreateContractItemRequest, 
  UpdateContractItemRequest 
} from '../../types/project';

export class ContractItemService {
  private static db: Database;

  /**
   * 初始化数据库连接
   */
  static async init(): Promise<void> {
    try {
      this.db = await Database.load('sqlite:erp.db');
    } catch (error) {
      console.error('初始化合同条目服务数据库连接失败:', error);
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
   * 获取合同的所有条目
   */
  static async getContractItems(contractId: number): Promise<ContractItem[]> {
    await this.ensureDbInitialized();
    
    try {
      return await this.db.select(
        'SELECT * FROM contract_items WHERE contract_id = ? ORDER BY created_at ASC',
        [contractId]
      ) as unknown as ContractItem[];
    } catch (error) {
      console.error('查询合同条目失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取合同条目详情
   */
  static async getContractItemById(id: number): Promise<ContractItem | null> {
    await this.ensureDbInitialized();
    
    try {
      const items = await this.db.select(
        'SELECT * FROM contract_items WHERE id = ?',
        [id]
      ) as unknown as ContractItem[];
      return items[0] || null;
    } catch (error) {
      console.error('查询合同条目详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新的合同条目
   */
  static async createContractItem(itemData: CreateContractItemRequest): Promise<ContractItem> {
    await this.ensureDbInitialized();
    
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.execute(
        `INSERT INTO contract_items (
          contract_id, item_name, specification, quantity, unit_price, 
          total_amount, delivery_date, remarks, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemData.contract_id,
          itemData.item_name,
          itemData.specification || '',
          itemData.quantity,
          itemData.unit_price,
          itemData.total_amount,
          itemData.delivery_date || null,
          itemData.remarks || '',
          now
        ]
      );

      // 返回新创建的条目信息
      return await this.getContractItemById(result.lastInsertId as number) as ContractItem;
    } catch (error) {
      console.error('创建合同条目失败:', error);
      throw error;
    }
  }

  /**
   * 更新合同条目
   */
  static async updateContractItem(itemData: UpdateContractItemRequest): Promise<ContractItem> {
    await this.ensureDbInitialized();
    
    try {
      // 检查条目是否存在
      const existingItem = await this.getContractItemById(itemData.id);
      if (!existingItem) {
        throw new Error('合同条目不存在');
      }

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldsToUpdate = [
        'item_name', 'specification', 'quantity', 'unit_price', 
        'total_amount', 'delivery_date', 'remarks'
      ];

      fieldsToUpdate.forEach(field => {
        if (itemData[field as keyof UpdateContractItemRequest] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(itemData[field as keyof UpdateContractItemRequest]);
        }
      });

      if (updateFields.length === 0) {
        return existingItem;
      }

      // 添加WHERE条件的ID
      updateValues.push(itemData.id);

      await this.db.execute(
        `UPDATE contract_items SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 返回更新后的条目信息
      return await this.getContractItemById(itemData.id) as ContractItem;
    } catch (error) {
      console.error('更新合同条目失败:', error);
      throw error;
    }
  }

  /**
   * 删除合同条目
   */
  static async deleteContractItem(id: number): Promise<void> {
    await this.ensureDbInitialized();
    
    try {
      // 检查条目是否存在
      const item = await this.getContractItemById(id);
      if (!item) {
        throw new Error('合同条目不存在');
      }

      // 删除条目
      await this.db.execute('DELETE FROM contract_items WHERE id = ?', [id]);
    } catch (error) {
      console.error('删除合同条目失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建合同条目
   */
  static async batchCreateContractItems(contractId: number, items: Omit<CreateContractItemRequest, 'contract_id'>[]): Promise<ContractItem[]> {
    await this.ensureDbInitialized();
    
    try {
      const createdItems: ContractItem[] = [];
      
      for (const item of items) {
        const createdItem = await this.createContractItem({
          ...item,
          contract_id: contractId
        });
        createdItems.push(createdItem);
      }
      
      return createdItems;
    } catch (error) {
      console.error('批量创建合同条目失败:', error);
      throw error;
    }
  }

  /**
   * 获取合同条目统计信息
   */
  static async getContractItemsStatistics(contractId: number): Promise<{
    total_items: number;
    total_quantity: number;
    total_amount: number;
    avg_unit_price: number;
  }> {
    await this.ensureDbInitialized();
    
    try {
      const stats = await this.db.select(
        `SELECT 
          COUNT(*) as total_items,
          COALESCE(SUM(quantity), 0) as total_quantity,
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(AVG(unit_price), 0) as avg_unit_price
        FROM contract_items 
        WHERE contract_id = ?`,
        [contractId]
      ) as unknown as {
        total_items: number;
        total_quantity: number;
        total_amount: number;
        avg_unit_price: number;
      }[];

      return stats[0] || {
        total_items: 0,
        total_quantity: 0,
        total_amount: 0,
        avg_unit_price: 0
      };
    } catch (error) {
      console.error('获取合同条目统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 复制合同条目到新合同
   */
  static async copyItemsToContract(sourceContractId: number, targetContractId: number): Promise<ContractItem[]> {
    await this.ensureDbInitialized();
    
    try {
      // 获取源合同的所有条目
      const sourceItems = await this.getContractItems(sourceContractId);
      
      // 复制到目标合同
      const copiedItems: ContractItem[] = [];
      for (const item of sourceItems) {
        const newItem = await this.createContractItem({
          contract_id: targetContractId,
          item_name: item.item_name,
          specification: item.specification,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          delivery_date: item.delivery_date,
          remarks: item.remarks
        });
        copiedItems.push(newItem);
      }
      
      return copiedItems;
    } catch (error) {
      console.error('复制合同条目失败:', error);
      throw error;
    }
  }
}