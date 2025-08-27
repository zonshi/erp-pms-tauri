import { createMemoryHistory, createRouter } from 'vue-router';

import Layout from './views/Layout.vue';
import LoginView from './views/auth/LoginView.vue';

const routes = [
  { path: '/',
    component: Layout,
    children: [

    ]
  },
  { path: '/login', component: LoginView },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;