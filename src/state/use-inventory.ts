import { useContext } from 'react';

import { InventoryContext, type InventoryContextValue } from './inventory-context';

/**
 * Hook to consume the inventory state and actions.
 * Throws if called outside an `InventoryProvider`.
 */
export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
