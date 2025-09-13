import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  build: {
    target: 'esnext', // 支持顶级 await
    chunkSizeWarningLimit: 1000, // 调整块大小警告限制为 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Vue 相关库分割为独立块
          vue: ['vue', 'vue-router'],
          // 将 Element Plus 相关库分割为独立块
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          // 将服务层分割为独立块
          services: [
            './src/service/auth/index.ts',
            './src/service/auth/user.ts',
            './src/service/auth/role.ts',
            './src/service/auth/permission.ts'
          ],
          // 将项目管理服务分割为独立块
          'project-services': [
            './src/service/project/project.ts',
            './src/service/project/budget.ts',
            './src/service/project/milestone.ts',
            './src/service/project/progress.ts',
            './src/service/project/payment.ts'
          ],
          // 将合同管理服务分割为独立块
          'contract-services': [
            './src/service/contract/index.ts',
            './src/service/contract/contractApproval.ts',
            './src/service/contract/contractDocument.ts',
            './src/service/contract/contractItem.ts'
          ],
          // 将管理页面组件分割为独立块
          'management-views': [
            './src/views/management/user/UserManagement.vue',
            './src/views/management/role/RoleManagement.vue',
            './src/views/management/permission/PermissionManagement.vue',
            './src/views/management/company/CompanyManagement.vue'
          ],
          // 将项目管理页面组件分割为独立块
          'project-views': [
            './src/views/management/project/ProjectManagement.vue'
          ]
        }
      }
    }
  }
}));
