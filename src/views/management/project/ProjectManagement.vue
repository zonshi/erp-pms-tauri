<template>
  <div class="project-management">
    <!-- 页面标题栏 -->
    <div class="header-section">
      <div class="title-section">
        <h2>项目管理</h2>
        <p class="description">管理公司项目全生命周期，包括项目信息、合同、预算、收付款等。</p>
      </div>
      
      <div class="action-section">
        <el-button type="primary" :icon="Plus" @click="handleCreateProject" v-permission="'project:create'">
          新建项目
        </el-button>
        <el-button :icon="Refresh" @click="loadCompanyProjectTree">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧公司项目树 -->
      <div class="left-panel">
        <div class="tree-header">
          <el-input
            v-model="searchText"
            placeholder="搜索公司或项目..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            class="search-input"
          />
        </div>
        
        <div class="tree-container" v-loading="treeLoading">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            :expand-on-click-node="false"
            :default-expand-all="false"
            node-key="id"
            class="project-tree"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon class="node-icon" :class="getNodeIconClass(data.type)">
                  <component :is="getNodeIcon(data.type)" />
                </el-icon>
                <span class="node-label" :class="getNodeLabelClass(data.type)">
                  {{ node.label }}
                </span>
                <span v-if="data.type === 'company'" class="node-suffix">
                  <el-button 
                    type="text" 
                    size="small" 
                    :icon="Plus"
                    @click.stop="handleCreateProjectForCompany(data.data.companyId)"
                    title="为该公司新增项目"
                    v-permission="'project:create'"
                  />
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="right-panel">
        <!-- 欢迎页面 -->
        <div v-if="!selectedProject" class="welcome-panel">
          <div class="welcome-content">
            <el-icon class="welcome-icon"><FolderOpened /></el-icon>
            <h3>欢迎使用项目管理</h3>
            <p>请从左侧选择一个项目来查看详细信息，或者创建一个新项目。</p>
            <div class="welcome-actions">
              <el-button type="primary" :icon="Plus" @click="handleCreateProject" v-permission="'project:create'">
                创建新项目
              </el-button>
            </div>
          </div>
        </div>

        <!-- 项目详情页面 -->
        <div v-else class="project-detail-panel">
          <!-- 项目头部信息 -->
          <div class="project-header">
            <div class="project-info">
              <div class="project-title">
                <h3>{{ selectedProject.name }}</h3>
                <el-tag :type="getProjectStatusType(selectedProject.status)" class="status-tag">
                  {{ getProjectStatusText(selectedProject.status) }}
                </el-tag>
              </div>
              <div class="project-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  项目经理：{{ selectedProject.manager_name || '未指定' }}
                </span>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ selectedProject.start_date }} ~ {{ selectedProject.planned_end_date }}
                </span>
                <span class="meta-item">
                  <el-icon><Money /></el-icon>
                  预算：¥{{ formatMoney(selectedProject.total_budget) }}
                </span>
              </div>
            </div>
            <div class="project-actions">
              <el-button 
                type="primary" 
                :icon="Edit" 
                @click="handleEditProject"
                size="small"
                v-permission="'project:edit'"
              >
                编辑项目
              </el-button>
              <el-dropdown @command="handleProjectAction">
                <el-button size="small">
                  更多操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      v-if="dropdownPermissions.canCreateProject"
                      command="duplicate"
                    >
                      <el-icon><CopyDocument /></el-icon>复制项目
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-if="dropdownPermissions.canReadProject"
                      command="export"
                    >
                      <el-icon><Download /></el-icon>导出数据
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-if="dropdownPermissions.canDeleteProject"
                      command="delete" 
                      divided
                    >
                      <el-icon><Delete /></el-icon>删除项目
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 项目标签页 -->
          <div class="project-tabs">
            <el-tabs 
              v-model="activeTab" 
              type="border-card"
              @tab-change="handleTabChange"
            >
              <el-tab-pane 
                v-for="tab in projectTabs" 
                :key="tab.key"
                :label="tab.label" 
                :name="tab.key"
              >
                <template #label>
                  <span class="tab-label">
                    <el-icon><component :is="getTabIcon(tab.icon)" /></el-icon>
                    {{ tab.label }}
                  </span>
                </template>
                
                <!-- 动态加载标签页内容 -->
                <component 
                  :is="getTabComponent(tab.key)" 
                  :project="selectedProject"
                  :project-id="selectedProject.id!"
                  @project-updated="handleProjectUpdated"
                  @edit-project="handleEditProject"
                />
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目新增/编辑对话框 -->
    <ProjectDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :project-data="currentProject"
      :company-id="selectedCompanyId"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, 
  Refresh, 
  Search, 
  Edit, 
  Delete,
  User,
  Calendar,
  Money,
  FolderOpened,
  OfficeBuilding,
  Document,
  ArrowDown,
  CopyDocument,
  Download,
  InfoFilled,
  CreditCard
} from '@element-plus/icons-vue';

import { ProjectService } from '../../../service/project';
import type { 
  Project, 
  CompanyProjectTreeNode,
  ProjectTabType
} from '../../../types/project';
import { ProjectStatusOptions, ProjectTabConfig } from '../../../types/project';
import { checkPermission } from '../../../service/auth/permission-checker';

import ProjectDialog from './components/ProjectDialog.vue';
import ProjectInfoTab from './components/ProjectInfoTab.vue';
import ProjectContractsTab from './components/ProjectContractsTab.vue';
import ProjectBudgetTab from './components/ProjectBudgetTab.vue';
import ProjectPaymentsTab from './components/ProjectPaymentsTab.vue';

// 响应式数据
const treeLoading = ref(false);
const searchText = ref('');
const treeData = ref<CompanyProjectTreeNode[]>([]);
const selectedProject = ref<Project | null>(null);
const activeTab = ref<ProjectTabType>('info');
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const currentProject = ref<Project | null>(null);
const selectedCompanyId = ref<number | undefined>();

// 树组件配置
const treeProps = {
  children: 'children',
  label: 'label'
};

// 标签页配置
const projectTabs = ref(ProjectTabConfig);

// 根据权限过滤可用的标签页
const filterTabsByPermission = async () => {
  const filteredTabs = [];
  for (const tab of ProjectTabConfig) {
    if (tab.permission) {
      const hasPermission = await checkPermission(tab.permission);
      if (hasPermission) {
        filteredTabs.push(tab);
      }
    } else {
      filteredTabs.push(tab);
    }
  }
  projectTabs.value = filteredTabs;
  
  // 如果当前选中的标签页不在可用列表中，切换到第一个可用的标签页
  if (filteredTabs.length > 0 && !filteredTabs.find(tab => tab.key === activeTab.value)) {
    activeTab.value = filteredTabs[0].key as ProjectTabType;
  }
};

// 权限检查相关的响应式数据
const dropdownPermissions = ref({
  canCreateProject: false,
  canReadProject: false,
  canDeleteProject: false
});

// 检查下拉菜单权限
const checkDropdownPermissions = async () => {
  dropdownPermissions.value = {
    canCreateProject: await checkPermission('project:create'),
    canReadProject: await checkPermission('project:read'),
    canDeleteProject: await checkPermission('project:delete')
  };
};

// 计算属性
const getProjectStatusType = computed(() => {
  return (status: string) => {
    const option = ProjectStatusOptions.find(opt => opt.value === status);
    return option?.color === '#67c23a' ? 'success' : 
           option?.color === '#409eff' ? 'primary' :
           option?.color === '#f56c6c' ? 'danger' :
           option?.color === '#e6a23c' ? 'warning' : 'info';
  };
});

const getProjectStatusText = computed(() => {
  return (status: string) => {
    const option = ProjectStatusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };
});

// 方法
const getNodeIcon = (type: string) => {
  return type === 'company' ? OfficeBuilding : Document;
};

const getNodeIconClass = (type: string) => {
  return type === 'company' ? 'company-icon' : 'project-icon';
};

const getNodeLabelClass = (type: string) => {
  return type === 'company' ? 'company-label' : 'project-label';
};

// 图标映射函数
const getTabIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'InfoFilled': InfoFilled,
    'Document': Document,
    'Money': Money,
    'CreditCard': CreditCard
  };
  return iconMap[iconName] || Document;
};

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const loadCompanyProjectTree = async () => {
  treeLoading.value = true;
  try {
    treeData.value = await ProjectService.getCompanyProjectTree(searchText.value || undefined);
  } catch (error) {
    console.error('加载公司项目树失败:', error);
    ElMessage.error('加载项目树失败');
  } finally {
    treeLoading.value = false;
  }
};

const handleSearch = async () => {
  await loadCompanyProjectTree();
};

const handleNodeClick = async (data: CompanyProjectTreeNode) => {
  if (data.type === 'project' && data.data?.projectId) {
    try {
      selectedProject.value = await ProjectService.getProjectById(data.data.projectId);
      activeTab.value = 'info'; // 重置到第一个标签页
    } catch (error) {
      console.error('加载项目详情失败:', error);
      ElMessage.error('加载项目详情失败');
    }
  }
};

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName as ProjectTabType;
};

const getTabComponent = (tabKey: string) => {
  const componentMap = {
    'info': ProjectInfoTab,
    'contracts': ProjectContractsTab,
    'budget': ProjectBudgetTab,
    'payments': ProjectPaymentsTab
  };
  return componentMap[tabKey as keyof typeof componentMap];
};

const handleCreateProject = () => {
  dialogMode.value = 'create';
  currentProject.value = null;
  selectedCompanyId.value = undefined;
  dialogVisible.value = true;
};

const handleCreateProjectForCompany = (companyId: number) => {
  dialogMode.value = 'create';
  currentProject.value = null;
  selectedCompanyId.value = companyId;
  dialogVisible.value = true;
};

const handleEditProject = () => {
  if (!selectedProject.value) return;
  
  dialogMode.value = 'edit';
  currentProject.value = { ...selectedProject.value };
  selectedCompanyId.value = selectedProject.value.company_id;
  dialogVisible.value = true;
};

const handleProjectAction = async (command: string) => {
  if (!selectedProject.value) return;
  
  switch (command) {
    case 'duplicate':
      await handleDuplicateProject();
      break;
    case 'export':
      await handleExportProject();
      break;
    case 'delete':
      await handleDeleteProject();
      break;
  }
};

const handleDuplicateProject = async () => {
  // TODO: 实现项目复制功能
  ElMessage.info('项目复制功能待开发');
};

const handleExportProject = async () => {
  // TODO: 实现项目导出功能
  ElMessage.info('项目导出功能待开发');
};

const handleDeleteProject = async () => {
  if (!selectedProject.value) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${selectedProject.value.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await ProjectService.deleteProject(selectedProject.value.id!);
    ElMessage.success('删除成功');
    
    // 清空选中的项目并刷新树
    selectedProject.value = null;
    await loadCompanyProjectTree();
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message);
    }
  }
};

const handleDialogSuccess = async () => {
  dialogVisible.value = false;
  await loadCompanyProjectTree();
  
  // 如果是编辑模式，刷新当前项目信息
  if (dialogMode.value === 'edit' && selectedProject.value?.id) {
    try {
      selectedProject.value = await ProjectService.getProjectById(selectedProject.value.id);
    } catch (error) {
      console.error('刷新项目信息失败:', error);
    }
  }
};

const handleProjectUpdated = async () => {
  // 当项目信息在子组件中更新时，刷新项目信息
  if (selectedProject.value?.id) {
    try {
      selectedProject.value = await ProjectService.getProjectById(selectedProject.value.id);
    } catch (error) {
      console.error('刷新项目信息失败:', error);
    }
  }
};

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadCompanyProjectTree(),
    filterTabsByPermission(),
    checkDropdownPermissions()
  ]);
});

// 监听搜索文本变化
watch(searchText, () => {
  // 防抖处理
  if (searchText.value === '') {
    loadCompanyProjectTree();
  }
});
</script>

<style scoped>
.project-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header-section {
  background: white;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #303133;
}

.title-section .description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.action-section {
  display: flex;
  gap: 12px;
}

.main-content {
  flex: 1;
  display: flex;
  /* 移除 overflow: hidden，允许右侧面板内的标签页滚动 */
  /* 左侧面板有独立的滚动设置，不受影响 */
}

.left-panel {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.tree-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.search-input {
  width: 100%;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.project-tree {
  height: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.node-icon {
  margin-right: 8px;
  font-size: 16px;
}

.company-icon {
  color: #409eff;
}

.project-icon {
  color: #67c23a;
}

.node-label {
  flex: 1;
  font-size: 14px;
}

.company-label {
  font-weight: 500;
  color: #303133;
}

.project-label {
  color: #606266;
}

.node-suffix {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-suffix {
  opacity: 1;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 移除 overflow: hidden，允许内部组件控制滚动 */
}

.welcome-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.welcome-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.welcome-content p {
  margin: 0 0 24px 0;
  color: #606266;
  line-height: 1.5;
}

.welcome-actions {
  display: flex;
  justify-content: center;
}

.project-detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.project-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-info {
  flex: 1;
}

.project-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.project-title h3 {
  margin: 0 12px 0 0;
  font-size: 18px;
  color: #303133;
}

.status-tag {
  font-size: 12px;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.meta-item .el-icon {
  margin-right: 6px;
  color: #909399;
}

.project-actions {
  display: flex;
  gap: 12px;
}

.project-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 0 24px 24px 24px;
  min-height: 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.el-tabs--border-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
}

:deep(.el-tabs__header) {
  flex-shrink: 0;
  margin: 0; /* 移除默认边距 */
}

:deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  padding: 0; /* 移除默认内边距，让子组件自己控制 */
  overflow: hidden; /* 确保内容不会撑开容器 */
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden; /* 确保标签页不会撑开容器 */
}

/* 自定义滚动条样式 */
.tree-container::-webkit-scrollbar,
:deep(.el-tab-pane)::-webkit-scrollbar {
  width: 6px;
}

.tree-container::-webkit-scrollbar-track,
:deep(.el-tab-pane)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.tree-container::-webkit-scrollbar-thumb,
:deep(.el-tab-pane)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.tree-container::-webkit-scrollbar-thumb:hover,
:deep(.el-tab-pane)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>