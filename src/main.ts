import { createApp } from "vue";
import ElementPlus from "element-plus";
import 'element-plus/dist/index.css';
import App from "./App.vue";
import router from "./router.ts";
import { initializeBaseData } from './service/auth/init';
import { setupPermissionDirectives } from './directives/permission';
import { getDatabase } from './db';

// 异步初始化应用
async function initializeApp() {
  try {
    console.log('开始初始化应用...');
    
    // 等待数据库连接准备就绪
    console.log('等待数据库连接...');
    await getDatabase();
    console.log('数据库连接成功');
    
    // 延迟一下，确保数据库迁移完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 初始化基础数据
    console.log('开始初始化基础数据...');
    await initializeBaseData();
    console.log('基础数据初始化完成');
    
    // 创建并配置 Vue 应用
    const app = createApp(App);
    app.use(ElementPlus);
    app.use(router);
    
    // 注册权限指令
    setupPermissionDirectives(app);
    
    // 挂载应用
    app.mount("#app");
    console.log('应用初始化完成');
    
  } catch (error) {
    console.error('应用初始化失败:', error);
    
    // 显示错误信息给用户
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
      ">
        <div style="
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <h2 style="color: #e74c3c; margin-bottom: 1rem;">应用初始化失败</h2>
          <p style="color: #666; margin-bottom: 1rem;">请检查控制台错误信息或重启应用</p>
          <button onclick="location.reload()" style="
            padding: 0.5rem 1rem;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">重新加载</button>
        </div>
      </div>
    `;
  }
}

// 启动应用初始化
initializeApp();
