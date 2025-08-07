  import { createRouter, createWebHistory } from 'vue-router'
  import register from '../views/Regisiter.vue'
  import discuss from '../views/Discuss.vue'
  import PlansList from '../views/PlansList.vue';
  import PlanDetail from '../views/PlanDetail.vue';  
  import PlanCreate from '../views/PlanCreate.vue';
  import profile from '../views/Profile.vue'
  import resources from '../views/Resources.vue'
  import home from '../views/Home.vue'
  import login from '../views/Login.vue'
  import progressTracker from '../views/ProgressTracker.vue'
  import DataAnalysis from '../views/DataAnalysis.vue'
  import { useCounterStore } from '@/stores/counter'

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        redirect: '/login', // 重定向到登录页面
      },
      {
        path: '/home',name: 'home',component: home,meta: { requiresAuth: true }, // 需要登录
      },
      {
        path: '/register',name: 'register',component: register,
      },
      {
        path: '/login',name: 'login',component: login,
      },
      {
        path: '/profile',name: 'profile',component: profile,meta: { requiresAuth: true }, 
      },
      {
        path: '/resources',name: 'resources',component: resources,meta: { requiresAuth: true },
      },
      {
        path: '/progressTracker',name: 'progressTracker',component: progressTracker,meta: { requiresAuth: true }, 
      },
      {
        path: '/plans',name: 'plans-list',component: PlansList,meta: { requiresAuth: true }, 
      },
      {
        path: '/plan/:id',name: 'plan-detail',component: PlanDetail,meta: { requiresAuth: true }, 
      },
      {
        path: '/plan/new',name: 'plan-new',component: PlanDetail, meta: { requiresAuth: true },props: { isNew: true },
      },
      {
        path: '/plans/new',name: 'plan-create',component: PlanCreate, meta: { requiresAuth: true },
      },{
      path: '/data-analysis',name: 'data-analysis',component: DataAnalysis,meta: { requiresAuth: true }
      },
      {
      path: '/discuss',name: 'discuss-list',component: discuss,meta: { requiresAuth: true },
       children: [{
        path: ':id', 
        name: 'discuss-detail',
        component: discuss }]
      },
      {
        path: '/admin',
        name: 'admin-panel',
        component: () => import('../views/AdminPanel.vue'),
        meta: { requiresAuth: true },
        beforeEnter: (to, from, next) => {
          const authStore = useCounterStore();
          // 确保Pinia store已初始化
          if (!authStore.isLoggedIn) {
            return next('/login');
          }
          if (authStore.getUsername() === 'Bob') {
            next();
          } else {
            next('/home');
          }
        }
      }
    ],
  })

  // 导航守卫
  router.beforeEach((to, from, next) => {
    const authStore = useCounterStore(); // 获取 Pinia Store
    const isAuthenticated = authStore.isLoggedIn; // 检查用户是否已登录
    console.log('导航守卫检查 - 目标路由:', to.path);
    console.log('是否已登录:', isAuthenticated);

    if (to.meta.requiresAuth && !isAuthenticated) {
      // 如果需要登录且用户未登录，则重定向到登录页面
      next('/login');
    } else {
      // 否则继续导航
      next();
    }
  });

  export default router
