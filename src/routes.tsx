import { createBrowserRouter } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { CategoriesPage } from '@/pages/categories-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { HistoryPage } from '@/pages/history-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { ProductsPage } from '@/pages/products-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
