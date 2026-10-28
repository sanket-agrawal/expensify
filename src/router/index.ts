import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/HomePage.vue';
import CreateTripPage from '@/pages/CreateTripPage.vue';
import TripDashboardPage from '@/pages/TripDashboardPage.vue';
import ExpensesListPage from '@/pages/ExpensesListPage.vue';
import AddEditExpensePage from '@/pages/AddEditExpensePage.vue';
import ExpenseDetailPage from '@/pages/ExpenseDetailPage.vue';
import SettleUpPage from '@/pages/SettleUpPage.vue';
import NotFoundPage from '@/pages/NotFoundPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/new',
    name: 'create-trip',
    component: CreateTripPage,
  },
  {
    path: '/t/:token',
    name: 'trip-dashboard',
    component: TripDashboardPage,
  },
  {
    path: '/t/:token/expenses',
    name: 'expenses-list',
    component: ExpensesListPage,
  },
  {
    path: '/t/:token/expenses/new',
    name: 'add-expense',
    component: AddEditExpensePage,
  },
  {
    path: '/t/:token/expenses/:id',
    name: 'expense-detail',
    component: ExpenseDetailPage,
  },
  {
    path: '/t/:token/expenses/:id/edit',
    name: 'edit-expense',
    component: AddEditExpensePage,
  },
  {
    path: '/t/:token/settle',
    name: 'settle-up',
    component: SettleUpPage,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
