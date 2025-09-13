<template>
  <div class="project-progress-tab">
    <div class="tab-header">
      <div class="header-left">
        <h3>项目进展</h3>
        <p>跟踪项目各阶段的进度和完成情况</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleCreatePhase">
          新增阶段
        </el-button>
      </div>
    </div>

    <div class="progress-content" v-loading="loading">
      <!-- 进度概览 -->
      <div class="progress-overview">
        <el-card>
          <template #header>
            <span>进度概览</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ overallStats.overall_completion }}%</div>
                <div class="overview-label">整体进度</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ overallStats.total_phases }}</div>
                <div class="overview-label">总阶段数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ overallStats.completed_phases }}</div>
                <div class="overview-label">已完成阶段</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="overview-item">
                <div class="overview-value">{{ overallStats.in_progress_phases }}</div>
                <div class="overview-label">进行中阶段</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 阶段列表 -->
      <div class="phases-list">
        <el-timeline>
          <el-timeline-item
            v-for="phase in progressPhases"
            :key="phase.id"
            :type="getTimelineType(phase.status)"
            :icon="getTimelineIcon(phase.status)"
          >
            <el-card class="phase-card">
              <div class="phase-header">
                <div class="phase-title">
                  <h4>{{ phase.phase_name }}</h4>
                  <el-tag :type="getStatusTagType(phase.status)">
                    {{ getStatusText(phase.status) }}
                  </el-tag>
                </div>
                <div class="phase-actions">
                  <el-button size="small" @click="handleEditPhase(phase)">编辑</el-button>
                </div>
              </div>
              <div class="phase-content">
                <div class="phase-dates">
                  <span>计划：{{ formatDate(phase.planned_start_date) }} ~ {{ formatDate(phase.planned_end_date) }}</span>
                  <span v-if="phase.actual_start_date">
                    实际：{{ formatDate(phase.actual_start_date) }} ~ {{ phase.actual_end_date ? formatDate(phase.actual_end_date) : '进行中' }}
                  </span>
                </div>
                <div class="phase-progress">
                  <el-progress 
                    :percentage="phase.completion_percentage || 0"
                    :status="getProgressStatus(phase.completion_percentage || 0)"
                  />
                </div>
                <div v-if="phase.description" class="phase-description">
                  {{ phase.description }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && progressPhases.length === 0" class="empty-state">
        <el-icon class="empty-icon"><TrendCharts /></el-icon>
        <p>暂无进度阶段</p>
        <el-button type="primary" @click="handleCreatePhase">创建第一个阶段</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, TrendCharts, CircleCheck, Clock, Loading } from '@element-plus/icons-vue';
import type { Project, ProjectProgress } from '../../../../types/project';
import { ProgressStatusOptions } from '../../../../types/project';
import { ProjectProgressService } from '../../../../service/project';

// Props
interface Props {
  project: Project;
  projectId: number;
}

const props = defineProps<Props>();

// 响应式数据
const loading = ref(false);
const progressPhases = ref<ProjectProgress[]>([]);
const overallStats = ref({
  overall_completion: 0,
  total_phases: 0,
  completed_phases: 0,
  in_progress_phases: 0,
  not_started_phases: 0,
  delayed_phases: 0
});

// 方法
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const getStatusText = (status: string): string => {
  const option = ProgressStatusOptions.find(opt => opt.value === status);
  return option?.label || status;
};

const getStatusTagType = (status: string) => {
  const option = ProgressStatusOptions.find(opt => opt.value === status);
  switch (option?.color) {
    case '#67c23a': return 'success';
    case '#409eff': return 'primary';
    case '#f56c6c': return 'danger';
    default: return 'info';
  }
};

const getTimelineType = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'primary';
    case 'delayed': return 'danger';
    default: return 'info';
  }
};

const getTimelineIcon = (status: string) => {
  switch (status) {
    case 'completed': return CircleCheck;
    case 'in_progress': return Loading;
    case 'delayed': return Clock;
    default: return Clock;
  }
};

const getProgressStatus = (percentage: number) => {
  if (percentage === 100) return 'success';
  if (percentage >= 80) return undefined;
  if (percentage >= 50) return 'warning';
  return 'exception';
};

const loadProgressData = async () => {
  loading.value = true;
  try {
    const [phases, stats] = await Promise.all([
      ProjectProgressService.getProjectProgress(props.projectId),
      ProjectProgressService.getOverallProgress(props.projectId)
    ]);
    
    progressPhases.value = phases;
    overallStats.value = {
      overall_completion: Math.round(stats.overall_completion),
      total_phases: stats.total_phases,
      completed_phases: stats.completed_phases,
      in_progress_phases: stats.in_progress_phases,
      not_started_phases: stats.not_started_phases,
      delayed_phases: stats.delayed_phases
    };
  } catch (error) {
    console.error('加载项目进度失败:', error);
    ElMessage.error('加载项目进度失败');
  } finally {
    loading.value = false;
  }
};

const handleCreatePhase = () => {
  ElMessage.info('阶段创建功能待开发');
};

const handleEditPhase = (_phase: ProjectProgress) => {
  ElMessage.info('阶段编辑功能待开发');
};

// 生命周期
onMounted(() => {
  loadProgressData();
});
</script>

<style scoped>
.project-progress-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 20px 0 20px;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #303133;
}

.header-left p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.progress-content {
  flex: 1;
  padding: 0 20px 20px 20px;
  overflow-y: auto;
}

.progress-overview {
  margin-bottom: 24px;
}

.overview-item {
  text-align: center;
}

.overview-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}

.phase-card {
  margin-bottom: 16px;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.phase-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-title h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.phase-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phase-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.phase-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
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