<template>
  <div class="project-info-tab">
    <!-- 项目概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon status-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ getStatusText(project.status) }}</div>
              <div class="stat-label">项目状态</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon budget-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatMoney(project.total_budget) }}</div>
              <div class="stat-label">项目预算</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon duration-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ projectDuration }}天</div>
              <div class="stat-label">项目周期</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon progress-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overallProgress }}%</div>
              <div class="stat-label">完成进度</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细信息 -->
    <div class="info-sections">
      <el-row :gutter="24">
        <!-- 基本信息 -->
        <el-col :span="12">
          <div class="info-section">
            <div class="section-header">
              <h3>基本信息</h3>
              <el-button 
                type="text" 
                :icon="Edit" 
                @click="emit('edit-project')"
                size="small"
              >
                编辑
              </el-button>
            </div>
            
            <div class="info-items">
              <div class="info-item">
                <label>项目名称：</label>
                <span>{{ project.name }}</span>
              </div>
              <div class="info-item">
                <label>项目编号：</label>
                <span>{{ project.project_no }}</span>
              </div>
              <div class="info-item">
                <label>客户名称：</label>
                <span>{{ project.client_name }}</span>
              </div>
              <div class="info-item">
                <label>所属公司：</label>
                <span>{{ project.company_name || '未指定' }}</span>
              </div>
              <div class="info-item">
                <label>项目经理：</label>
                <span>{{ project.manager_name || '未指定' }}</span>
              </div>
              <div class="info-item">
                <label>项目状态：</label>
                <el-tag :type="getStatusTagType(project.status)">
                  {{ getStatusText(project.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 时间信息 -->
        <el-col :span="12">
          <div class="info-section">
            <div class="section-header">
              <h3>时间安排</h3>
            </div>
            
            <div class="info-items">
              <div class="info-item">
                <label>计划开始日期：</label>
                <span>{{ formatDate(project.start_date) }}</span>
              </div>
              <div class="info-item">
                <label>计划结束日期：</label>
                <span>{{ formatDate(project.planned_end_date) }}</span>
              </div>
              <div class="info-item" v-if="project.actual_end_date">
                <label>实际结束日期：</label>
                <span>{{ formatDate(project.actual_end_date) }}</span>
              </div>
              <div class="info-item">
                <label>项目周期：</label>
                <span>{{ projectDuration }}天</span>
              </div>
              <div class="info-item" v-if="isOverdue">
                <label>逾期天数：</label>
                <span class="overdue-text">{{ overdueDays }}天</span>
              </div>
              <div class="info-item">
                <label>创建时间：</label>
                <span>{{ formatDateTime(project.created_at) }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 项目描述 -->
      <div class="info-section full-width">
        <div class="section-header">
          <h3>项目描述</h3>
        </div>
        <div class="description-content">
          <p v-if="project.description">{{ project.description }}</p>
          <p v-else class="no-description">暂无项目描述</p>
        </div>
      </div>

      <!-- 项目统计 -->
      <div class="info-section full-width">
        <div class="section-header">
          <h3>项目统计</h3>
        </div>
        <div v-loading="statisticsLoading" class="statistics-content">
          <el-row :gutter="16">
            <el-col :span="8">
              <div class="statistics-item">
                <div class="statistics-label">合同数量</div>
                <div class="statistics-value">{{ statistics.contracts_count }}个</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="statistics-item">
                <div class="statistics-label">合同总金额</div>
                <div class="statistics-value">¥{{ formatMoney(statistics.total_contract_amount) }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="statistics-item">
                <div class="statistics-label">预算执行率</div>
                <div class="statistics-value">{{ statistics.budget_execution_rate }}%</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 项目进度条 -->
      <div class="info-section full-width">
        <div class="section-header">
          <h3>项目进度</h3>
        </div>
        <div class="progress-content">
          <el-progress 
            :percentage="overallProgress" 
            :color="getProgressColor(overallProgress)"
            :stroke-width="20"
            text-inside
          />
          <div class="progress-info">
            <span>整体进度：{{ overallProgress }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Edit,
  TrendCharts,
  Money,
  Calendar,
  CircleCheck
} from '@element-plus/icons-vue';
import type { Project } from '../../../../types/project';
import { ProjectStatusOptions } from '../../../../types/project';

// Props
interface Props {
  project: Project;
  projectId: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'edit-project': [];
}>();

// 响应式数据
const statisticsLoading = ref(false);
const overallProgress = ref(0);

const statistics = ref({
  contracts_count: 0,
  total_contract_amount: 0,
  budget_execution_rate: 0
});

// 计算属性
const projectDuration = computed(() => {
  const startDate = new Date(props.project.start_date);
  const endDate = new Date(props.project.planned_end_date);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const isOverdue = computed(() => {
  if (props.project.status === 'completed' || !props.project.planned_end_date) {
    return false;
  }
  const today = new Date();
  const plannedEnd = new Date(props.project.planned_end_date);
  return today > plannedEnd;
});

const overdueDays = computed(() => {
  if (!isOverdue.value) return 0;
  const today = new Date();
  const plannedEnd = new Date(props.project.planned_end_date);
  const diffTime = Math.abs(today.getTime() - plannedEnd.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 方法
const getStatusText = (status: string): string => {
  const option = ProjectStatusOptions.find(opt => opt.value === status);
  return option?.label || status;
};

const getStatusTagType = (status: string) => {
  const option = ProjectStatusOptions.find(opt => opt.value === status);
  switch (option?.color) {
    case '#67c23a': return 'success';
    case '#409eff': return 'primary';
    case '#f56c6c': return 'danger';
    case '#e6a23c': return 'warning';
    default: return 'info';
  }
};

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return '#f56c6c';
  if (percentage < 70) return '#e6a23c';
  return '#67c23a';
};

const loadProjectStatistics = async () => {
  statisticsLoading.value = true;
  try {
    // TODO: 实现项目统计数据加载
    // 这里需要调用各个服务来获取统计数据
    
    // 模拟数据
    statistics.value = {
      contracts_count: 3,
      total_contract_amount: 1500000,
      budget_execution_rate: 65
    };
  } catch (error) {
    console.error('加载项目统计失败:', error);
  } finally {
    statisticsLoading.value = false;
  }
};

// 生命周期
onMounted(async () => {
  await loadProjectStatistics();
});
</script>

<style scoped>
.project-info-tab {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.overview-cards {
  margin-bottom: 24px;
  flex-shrink: 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.status-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.budget-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.duration-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.progress-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.info-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
}

.info-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.full-width {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item label {
  width: 120px;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.info-item span {
  color: #303133;
  font-size: 14px;
}

.overdue-text {
  color: #f56c6c;
  font-weight: 500;
}

.description-content {
  line-height: 1.6;
  color: #606266;
}

.no-description {
  color: #c0c4cc;
  font-style: italic;
}

.statistics-content {
  min-height: 120px;
}

.statistics-item {
  text-align: center;
  padding: 16px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.statistics-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.statistics-value {
  font-size: 20px;
  font-weight: 600;
  color: #495057;
}

.mt-16 {
  margin-top: 16px;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
}

/* 自定义滚动条样式 */
.project-info-tab::-webkit-scrollbar {
  width: 6px;
}

.project-info-tab::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.project-info-tab::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.project-info-tab::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>