import { Badge } from '@/components/ui/badge';
import { selectStockStatus } from '@/state/selectors';
import type { Product } from '@/types/product';

export function ProductStatusBadge({ product }: { product: Product }) {
  const status = selectStockStatus(product);

  switch (status) {
    case 'out':
      return <Badge variant="destructive">Out of Stock</Badge>;
    case 'low':
      return <Badge variant="warning">Low Stock</Badge>;
    case 'in':
    default:
      return <Badge variant="success">In Stock</Badge>;
  }
}
