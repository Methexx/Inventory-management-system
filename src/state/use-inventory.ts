import { useContext } from 'react';

import { InventoryContext, type InventoryContextValue } from './inventory-context';

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
