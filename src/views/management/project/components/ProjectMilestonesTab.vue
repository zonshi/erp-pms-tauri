<template>
  <div class="project-milestones-tab">
    <div class="tab-header">
      <div class="header-left">
        <h3>项目里程碑</h3>
        <p>管理项目的关键节点和重要时间点</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreateMilestone">
          新增里程碑
        </el-button>
      </div>
    </div>

    <div class="milestone-content" v-loading="loading">
      <!-- 里程碑统计概览 -->
      <div class="milestone-overview">
        <el-card>
          <template #header>
            <span>里程碑概览</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ milestoneStats.total }}</div>
                <div class="overview-label">总里程碑</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ milestoneStats.completed }}</div>
                <div class="overview-label">已完成</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ milestoneStats.in_progress }}</div>
                <div class="overview-label">进行中</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ milestoneStats.completion_rate.toFixed(1) }}%</div>
                <div class="overview-label">完成率</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 里程碑列表 -->
      <div class="milestone-table">
        <el-card>
          <template #header>
            <span>里程碑列表</span>
          </template>
          <el-table :data="milestones" style="width: 100%">
            <el-table-column prop="title" label="里程碑名称" width="200" />
            <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
            <el-table-column prop="priority" label="优先级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityTagType(row.priority)" size="small">
                  {{ getPriorityLabel(row.priority) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planned_date" label="计划日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.planned_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="actual_date" label="实际日期" width="120">
              <template #default="{ row }">
                {{ row.actual_date ? formatDate(row.actual_date) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditMilestone(row)">编辑</el-button>
                <el-button 
                  size="small" 
                  :type="row.status === 'completed' ? 'info' : 'success'"
                  :disabled="row.status === 'completed'"
                  @click="handleCompleteMilestone(row)"
                >
                  {{ row.status === 'completed' ? '已完成' : '标记完成' }}
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteMilestone(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && milestones.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Flag /></el-icon>
        <p>暂无里程碑</p>
        <el-button type="primary" @click="handleCreateMilestone">创建第一个里程碑</el-button>
      </div>
    </div>

    <!-- 里程碑对话框 -->
    <MilestoneDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :milestone="currentMilestone"
      :project-id="projectId"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Flag } from '@element-plus/icons-vue';
import type { Project, ProjectMilestone } from '../../../../types/project';
import { MilestoneStatusOptions, MilestonePriorityOptions } from '../../../../types/project';
import { ProjectMilestoneService } from '../../../../service/project';
import MilestoneDialog from './MilestoneDialog.vue';

// Props
interface Props {
  project: Project;
  projectId: number;
}

const props = defineProps<Props>();

// 响应式数据
const loading = ref(false);
const milestones = ref<ProjectMilestone[]>([]);
const milestoneStats = ref({
  total: 0,
  completed: 0,
  pending: 0,
  in_progress: 0,
  delayed: 0,
  completion_rate: 0,
  upcoming: [] as ProjectMilestone[]
});
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentMilestone = ref<ProjectMilestone | null>(null);

// 方法
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

const getStatusLabel = (status: string): string => {
  const option = MilestoneStatusOptions.find(opt => opt.value === status);
  return option?.label || status;
};

const getStatusTagType = (status: string) => {
  const option = MilestoneStatusOptions.find(opt => opt.value === status);
  switch (option?.color) {
    case '#67c23a': return 'success';
    case '#409eff': return 'primary';
    case '#f56c6c': return 'danger';
    default: return 'info';
  }
};

const getPriorityLabel = (priority: string): string => {
  const option = MilestonePriorityOptions.find(opt => opt.value === priority);
  return option?.label || priority;
};

const getPriorityTagType = (priority: string) => {
  const option = MilestonePriorityOptions.find(opt => opt.value === priority);
  switch (option?.color) {
    case '#f56c6c': return 'danger';
    case '#409eff': return 'primary';
    default: return 'info';
  }
};

const loadMilestoneData = async () => {
  loading.value = true;
  try {
    const [milestoneList, stats] = await Promise.all([
      ProjectMilestoneService.getProjectMilestones(props.projectId),
      ProjectMilestoneService.getMilestoneStatistics(props.projectId)
    ]);
    
    milestones.value = milestoneList;
    milestoneStats.value = stats;
  } catch (error) {
    console.error('加载项目里程碑失败:', error);
    ElMessage.error('加载项目里程碑失败');
  } finally {
    loading.value = false;
  }
};

const handleCreateMilestone = () => {
  dialogMode.value = 'create';
  currentMilestone.value = null;
  dialogVisible.value = true;
};

const handleEditMilestone = (milestone: ProjectMilestone) => {
  dialogMode.value = 'edit';
  currentMilestone.value = milestone;
  dialogVisible.value = true;
};

const handleCompleteMilestone = async (milestone: ProjectMilestone) => {
  try {
    await ElMessageBox.confirm('确定要标记这个里程碑为已完成吗？', '确认操作', {
      type: 'info'
    });
    
    await ProjectMilestoneService.completeMilestone(milestone.id!, new Date().toISOString().split('T')[0], 1); // TODO: 获取真实用户ID
    ElMessage.success('里程碑状态更新成功');
    await loadMilestoneData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新里程碑状态失败:', error);
      ElMessage.error('更新失败');
    }
  }
};

const handleDeleteMilestone = async (milestone: ProjectMilestone) => {
  try {
    await ElMessageBox.confirm('确定要删除这个里程碑吗？', '确认删除', {
      type: 'warning'
    });
    
    await ProjectMilestoneService.deleteMilestone(milestone.id!);
    ElMessage.success('删除成功');
    await loadMilestoneData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除里程碑失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const handleDialogSubmit = async () => {
  dialogVisible.value = false;
  await loadMilestoneData();
};

// 生命周期
onMounted(() => {
  loadMilestoneData();
});
</script>

<style scoped>
.project-milestones-tab {
  height: 100%;
  padding: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.milestone-overview {
  margin-bottom: 20px;
}

.overview-item {
  text-align: center;
  padding: 16px 0;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.milestone-table {
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 16px;
}
</style>