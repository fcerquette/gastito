import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const PUBLIC_ROUTES = new Set(['login', 'login-success']);

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/login/success',
    name: 'login-success',
    component: () => import('@/views/LoginSuccessView.vue'),
  },
  {
    path: '/',
    component: () => import('@/components/AppShell.vue'),
    children: [
      {
        path: '',
        name: 'groups',
        component: () => import('@/views/GroupsListView.vue'),
      },
      {
        path: 'groups/new',
        name: 'group-new',
        component: () => import('@/views/NewGroupView.vue'),
      },
      {
        path: 'groups/:id',
        name: 'group-detail',
        component: () => import('@/views/GroupDetailView.vue'),
        props: true,
      },
      {
        path: 'groups/:id/expenses/new',
        name: 'expense-new',
        component: () => import('@/views/NewExpenseView.vue'),
        props: true,
      },
      {
        path: 'groups/:id/settlements/new',
        name: 'settlement-new',
        component: () => import('@/views/NewSettlementView.vue'),
        props: true,
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const isPublic = typeof to.name === 'string' && PUBLIC_ROUTES.has(to.name);

  if (isPublic) return true;

  if (!auth.currentUser && !auth.meAttempted) {
    await auth.fetchMe();
  }

  if (!auth.currentUser) {
    return { name: 'login', query: { from: to.fullPath } };
  }

  return true;
});
