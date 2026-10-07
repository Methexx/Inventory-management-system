import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@/components/shared/error-boundary';
import { router } from '@/routes';
import { InventoryProvider } from '@/state/inventory-provider';

function App() {
  return (
    <ErrorBoundary>
      <InventoryProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </InventoryProvider>
    </ErrorBoundary>
  );
}

export default App;
