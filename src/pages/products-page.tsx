import { useState } from 'react';
import { Plus } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { ProductFormDialog } from '@/features/products/product-form-dialog';
import { ProductList } from '@/features/products/product-list';
import { useInventory } from '@/state/use-inventory';
import type { Product } from '@/types/product';

export function ProductsPage() {
  const { state, removeProduct } = useInventory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    removeProduct(productToDelete.productId);
    setProductToDelete(null);
  };

  const handleAdjustStock = (_product: Product) => {
    void _product;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Products
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your inventory catalog, stock levels, and product details.
          </p>
        </div>

        <Button onClick={handleAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      <ProductList
        products={state.products}
        categories={state.categories}
        onAddProduct={handleAdd}
        onEditProduct={handleEdit}
        onDeleteProduct={handleDelete}
        onAdjustStock={handleAdjustStock}
      />

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedProduct(null);
          }
        }}
        product={selectedProduct}
        categories={state.categories}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setProductToDelete(null);
          }
        }}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}" (${productToDelete?.productId})? You can undo this action immediately.`}
        confirmLabel="Delete Product"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
