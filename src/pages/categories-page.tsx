import { useState } from 'react';
import { Edit3, Lock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryFormDialog } from '@/features/categories/category-form-dialog';
import { selectCategoryCounts } from '@/state/selectors';
import { useInventory } from '@/state/use-inventory';
import type { Category } from '@/types/category';

export function CategoriesPage() {
  const { state, removeCategory } = useInventory();
  const categoryCounts = selectCategoryCounts(state);
  const countMap = new Map(categoryCounts.map((c) => [c.categoryId, c]));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    const target = categoryToDelete;
    const result = removeCategory(target.id);
    setCategoryToDelete(null);

    if (result.ok) {
      toast.success(`Deleted category "${target.name}"`);
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Categories
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Organize products into categories, manage custom groups, and monitor catalog counts.
          </p>
        </div>

        <Button onClick={handleAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Category Name
              </th>
              <th scope="col" className="px-4 py-3.5">
                Type
              </th>
              <th scope="col" className="px-4 py-3.5">
                Products
              </th>
              <th scope="col" className="px-4 py-3.5">
                Total Units
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {state.categories.map((category) => {
              const meta = countMap.get(category.id);
              const productCount = meta?.count ?? 0;
              const stockUnits = meta?.stockUnits ?? 0;
              const canDelete = !category.isDefault && productCount === 0;

              return (
                <tr key={category.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-foreground">{category.name}</td>
                  <td className="px-4 py-4">
                    {category.isDefault ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-muted-foreground/30 text-muted-foreground"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Default</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-foreground">
                    <span className="font-semibold">{productCount}</span>{' '}
                    <span className="text-xs text-muted-foreground">
                      {productCount === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {stockUnits.toLocaleString()} units
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {category.isDefault ? (
                        <span
                          className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground/70"
                          title="Default seed categories cannot be modified"
                        >
                          Protected
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(category)}
                            title="Rename category"
                            aria-label={`Rename ${category.name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canDelete}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-40"
                            onClick={() => handleDelete(category)}
                            title={
                              productCount > 0
                                ? `Cannot delete: category has ${productCount} assigned products`
                                : 'Delete category'
                            }
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
        {state.categories.map((category) => {
          const meta = countMap.get(category.id);
          const productCount = meta?.count ?? 0;
          const stockUnits = meta?.stockUnits ?? 0;
          const canDelete = !category.isDefault && productCount === 0;

          return (
            <Card key={category.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-foreground">{category.name}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {productCount} {productCount === 1 ? 'product' : 'products'} •{' '}
                      {stockUnits.toLocaleString()} units
                    </p>
                  </div>
                  {category.isDefault ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-muted-foreground/30 text-xs text-muted-foreground"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Default</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Custom
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 border-t pt-2.5">
                  {category.isDefault ? (
                    <span className="text-xs text-muted-foreground/70">Protected default</span>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Rename</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canDelete}
                        onClick={() => handleDelete(category)}
                        className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
                        title={
                          productCount > 0
                            ? `Cannot delete: category has ${productCount} assigned products`
                            : 'Delete category'
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setCategoryToDelete(null);
        }}
        title="Delete Category"
        description={`Are you sure you want to delete category "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Category"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
