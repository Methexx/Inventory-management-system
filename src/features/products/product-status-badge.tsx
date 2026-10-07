import { Badge } from '@/components/ui/badge';
import { selectStockStatus } from '@/state/selectors';
import type { Product } from '@/types/product';

interface ProductStatusBadgeProps {
  product: Product;
  showDetails?: boolean;
}

export function ProductStatusBadge({ product, showDetails = false }: ProductStatusBadgeProps) {
  const status = selectStockStatus(product);

  switch (status) {
    case 'out':
      return <Badge variant="destructive">Out of Stock</Badge>;
    case 'low':
      return (
        <Badge
          variant="warning"
          title={`Stock (${product.stock}) is at or below threshold (${product.lowStockThreshold})`}
        >
          Low Stock{showDetails ? ` (≤${product.lowStockThreshold})` : ''}
        </Badge>
      );
    case 'in':
    default:
      return <Badge variant="success">In Stock</Badge>;
  }
}
