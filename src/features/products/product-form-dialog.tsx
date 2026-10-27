import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryFormDialog } from '@/features/categories/category-form-dialog';
import { formatCurrency } from '@/lib/format';
import { generateProductId } from '@/lib/id';
import { createProductSchema } from '@/schemas/product-schema';
import { useInventory } from '@/state/use-inventory';
import type { Category } from '@/types/category';
import type { Product } from '@/types/product';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
}

export function ProductFormDialog(props: ProductFormDialogProps) {
  return props.open ? (
    <ProductFormContent key={props.product?.productId ?? 'new'} {...props} />
  ) : null;
}

function ProductFormContent({
  open,
  onOpenChange,
  product: providedProduct,
  categories,
}: ProductFormDialogProps) {
  const { state, addProduct, editProduct } = useInventory();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const product = providedProduct ?? selectedProduct;
  const isEdit = Boolean(product);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  const existingProductIds = useMemo(
    () => state.products.map((p) => p.productId),
    [state.products],
  );
  const [generatedProductId, setGeneratedProductId] = useState(() => {
    const result = generateProductId(existingProductIds);
    return result.ok ? result.data : '';
  });
  const categoryIds = categories.map((c) => c.id);

  const schema = createProductSchema({
    existingProductIds,
    categoryIds,
    mode: isEdit ? 'edit' : 'create',
  });

  const initialValues = useMemo(
    () => ({
      name: product?.name ?? '',
      productId: product?.productId ?? generatedProductId,
      categoryId: product?.categoryId ?? categories[0]?.id ?? '',
      price: product ? String(product.price) : '',
      stock: product ? String(product.stock) : '0',
      lowStockThreshold: product ? String(product.lowStockThreshold) : '5',
    }),
    [categories, generatedProductId, product],
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: (values, { setSubmitting }) => {
      if (isEdit && product) {
        if (!hasProductChanges) {
          setSubmitting(false);
          return;
        }
        const result = editProduct(product.productId, {
          name: values.name.trim(),
          categoryId: values.categoryId,
          price: Number(values.price),
          lowStockThreshold: Number(values.lowStockThreshold),
        });

        setSubmitting(false);

        if (result.ok) {
          toast.success(`Updated ${result.data.name}`);
          onOpenChange(false);
        } else {
          toast.error(result.error.message);
        }
      } else {
        const result = addProduct({
          name: values.name.trim(),
          productId: values.productId.trim().toUpperCase(),
          categoryId: values.categoryId,
          price: Number(values.price),
          stock: Number(values.stock),
          lowStockThreshold: Number(values.lowStockThreshold),
        });

        setSubmitting(false);

        if (result.ok) {
          toast.success(`Added ${result.data.name}`);
          onOpenChange(false);
        } else {
          toast.error(result.error.message);
        }
      }
    },
  });
  const hasProductChanges = Boolean(
    product &&
    (formik.values.name.trim() !== product.name ||
      formik.values.categoryId !== product.categoryId ||
      Number(formik.values.price) !== product.price ||
      Number(formik.values.lowStockThreshold) !== product.lowStockThreshold),
  );
  const searchQuery = formik.values.name.trim().toLowerCase();
  const matchingProducts = useMemo(
    () =>
      searchQuery.length >= 3
        ? state.products.filter((item) => item.name.toLowerCase().includes(searchQuery))
        : [],
    [searchQuery, state.products],
  );
  const showSearch = !isEdit && isSearchOpen && searchQuery.length >= 3;

  const selectProduct = (item: Product) => {
    setSelectedProduct(item);
    setIsSearchOpen(false);
    setActiveResultIndex(-1);
    nameRef.current?.focus();
  };

  const startNewProduct = () => {
    const result = generateProductId(existingProductIds);
    setGeneratedProductId(result.ok ? result.data : '');
    setSelectedProduct(null);
    setIsSearchOpen(false);
    setActiveResultIndex(-1);
    nameRef.current?.focus();
  };

  useEffect(() => {
    if (formik.submitCount > 0 && !formik.isValid) {
      const firstErrorField = Object.keys(formik.errors)[0];
      if (firstErrorField && formRef.current) {
        const element = formRef.current.querySelector<HTMLInputElement | HTMLSelectElement>(
          `[name="${firstErrorField}"]`,
        );
        element?.focus();
      }
    }
  }, [formik.submitCount, formik.isValid, formik.errors]);

  useEffect(() => {
    if (showSearch && activeResultIndex >= 0) {
      document.getElementById(`product-match-${activeResultIndex}`)?.scrollIntoView?.({
        block: 'nearest',
      });
    }
  }, [activeResultIndex, showSearch]);

  const handleGenerateId = () => {
    const res = generateProductId(existingProductIds);
    if (res.ok) {
      formik.setFieldValue('productId', res.data);
      formik.setFieldTouched('productId', true);
      toast.info(`Generated product ID: ${res.data}`);
    } else {
      toast.error(res.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update product details. Use Stock Adjust to change stock.'
            : 'Enter a new product, or type at least 3 characters to find an existing one.'}
        </DialogDescription>
      </DialogHeader>

      <form ref={formRef} onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        <div className="relative space-y-1.5">
          <Label htmlFor="product-name">Product Name *</Label>
          <Input
            ref={nameRef}
            id="product-name"
            name="name"
            autoComplete="off"
            role={!isEdit ? 'combobox' : undefined}
            aria-autocomplete={!isEdit ? 'list' : undefined}
            aria-expanded={!isEdit ? showSearch : undefined}
            aria-controls={showSearch ? 'product-matches' : undefined}
            aria-activedescendant={
              showSearch && matchingProducts[activeResultIndex]
                ? `product-match-${activeResultIndex}`
                : undefined
            }
            placeholder="e.g. Wireless Ergonomic Mouse"
            value={formik.values.name}
            onChange={(event) => {
              formik.handleChange(event);
              setIsSearchOpen(true);
              setActiveResultIndex(-1);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={(event) => {
              formik.handleBlur(event);
              setIsSearchOpen(false);
              setActiveResultIndex(-1);
            }}
            onKeyDown={(event) => {
              if (isEdit || searchQuery.length < 3) return;
              if (event.key === 'Escape' && showSearch) {
                event.preventDefault();
                event.stopPropagation();
                setIsSearchOpen(false);
                setActiveResultIndex(-1);
              } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setIsSearchOpen(true);
                if (matchingProducts.length > 0) {
                  setActiveResultIndex((index) =>
                    event.key === 'ArrowDown'
                      ? (index + 1) % matchingProducts.length
                      : (index <= 0 ? matchingProducts.length : index) - 1,
                  );
                }
              } else if (event.key === 'Enter' && showSearch) {
                event.preventDefault();
                const match = matchingProducts[activeResultIndex];
                if (match) selectProduct(match);
                else setIsSearchOpen(false);
              }
            }}
            aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
          />
          {showSearch && (
            <div className="absolute left-0 right-0 z-10 rounded-md border bg-card shadow-lg">
              <ul
                id="product-matches"
                role="listbox"
                aria-label="Matching products"
                className="max-h-48 overflow-y-auto p-1"
              >
                {matchingProducts.map((item, index) => (
                  <li
                    key={item.productId}
                    id={`product-match-${index}`}
                    role="option"
                    aria-selected={index === activeResultIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectProduct(item)}
                    onMouseEnter={() => setActiveResultIndex(index)}
                    className={`cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent ${
                      index === activeResultIndex ? 'bg-accent' : ''
                    }`}
                  >
                    <span className="block break-words font-medium">{item.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.productId} · {formatCurrency(item.price)} · Stock: {item.stock}
                    </span>
                  </li>
                ))}
              </ul>
              {matchingProducts.length === 0 && (
                <p role="status" className="px-3 py-2 text-sm text-muted-foreground">
                  No matching products. Continue filling in the details to create a new product.
                </p>
              )}
            </div>
          )}
          {selectedProduct && !providedProduct && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Editing existing product: {selectedProduct.productId}</span>
              <Button type="button" variant="link" size="sm" onClick={startNewProduct}>
                Create a new product instead
              </Button>
            </div>
          )}
          {formik.touched.name && formik.errors.name && (
            <p className="text-xs text-destructive">{formik.errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="product-id">Product ID (SKU) *</Label>
            {!isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateId}
                className="h-6 gap-1 px-1.5 text-xs text-primary"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto Generate</span>
              </Button>
            )}
          </div>
          <Input
            id="product-id"
            name="productId"
            placeholder="e.g. PRD-102938"
            value={formik.values.productId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={isEdit}
            className="uppercase font-mono"
            aria-invalid={Boolean(formik.touched.productId && formik.errors.productId)}
          />
          {isEdit ? (
            <p className="text-xs text-muted-foreground">Product ID is immutable after creation.</p>
          ) : (
            formik.touched.productId &&
            formik.errors.productId && (
              <p className="text-xs text-destructive">{formik.errors.productId}</p>
            )
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="product-category">Category *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateCategoryOpen(true)}
              className="h-6 gap-1 px-1.5 text-xs text-primary"
            >
              <Plus className="h-3 w-3" />
              <span>New Category</span>
            </Button>
          </div>
          <select
            id="product-category"
            name="categoryId"
            value={formik.values.categoryId}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setIsCreateCategoryOpen(true);
              } else {
                formik.handleChange(e);
              }
            }}
            onBlur={formik.handleBlur}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-invalid={Boolean(formik.touched.categoryId && formik.errors.categoryId)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__new__">+ Create new category...</option>
          </select>
          {formik.touched.categoryId && formik.errors.categoryId && (
            <p className="text-xs text-destructive">{formik.errors.categoryId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="product-price">Price (LKR) *</Label>
            <Input
              id="product-price"
              name="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(formik.touched.price && formik.errors.price)}
            />
            {formik.touched.price && formik.errors.price && (
              <p className="text-xs text-destructive">{formik.errors.price}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-stock">{isEdit ? 'Current Stock' : 'Initial Stock *'}</Label>
            <Input
              id="product-stock"
              name="stock"
              type="number"
              step="1"
              value={formik.values.stock}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isEdit}
              aria-invalid={Boolean(formik.touched.stock && formik.errors.stock)}
            />
            {isEdit ? (
              <p className="text-xs text-muted-foreground">Stock adjusts via Stock Adjust.</p>
            ) : (
              formik.touched.stock &&
              formik.errors.stock && (
                <p className="text-xs text-destructive">{formik.errors.stock}</p>
              )
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-threshold">Low Stock Alert Threshold</Label>
          <Input
            id="product-threshold"
            name="lowStockThreshold"
            type="number"
            step="1"
            placeholder="5"
            value={formik.values.lowStockThreshold}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(
              formik.touched.lowStockThreshold && formik.errors.lowStockThreshold,
            )}
          />
          {formik.touched.lowStockThreshold && formik.errors.lowStockThreshold && (
            <p className="text-xs text-destructive">{formik.errors.lowStockThreshold}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              formik.isSubmitting ||
              (isEdit && !hasProductChanges) ||
              (formik.submitCount > 0 && !formik.isValid)
            }
          >
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
      </form>

      <CategoryFormDialog
        open={isCreateCategoryOpen}
        onOpenChange={setIsCreateCategoryOpen}
        onCreated={(newCategory) => {
          formik.setFieldValue('categoryId', newCategory.id);
          formik.setFieldTouched('categoryId', true);
        }}
      />
    </Dialog>
  );
}
