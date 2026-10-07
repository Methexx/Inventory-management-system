import { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import { ArrowDownRight, ArrowUpRight, Package, TrendingDown, TrendingUp } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { createStockAdjustSchema } from '@/schemas/stock-schema';
import { useInventory } from '@/state/use-inventory';
import type { Product } from '@/types/product';
import type { StockDirection } from '@/types/stock';

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function StockAdjustDialog({ open, onOpenChange, product }: StockAdjustDialogProps) {
  const { adjustStock } = useInventory();
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const currentStock = product?.stock ?? 0;
  const schema = createStockAdjustSchema({ currentStock });

  const formik = useFormik<{
    direction: StockDirection;
    quantity: string;
    note: string;
  }>({
    initialValues: {
      direction: 'increase',
      quantity: '',
      note: '',
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      if (!product) return;

      const numQuantity = Number(values.quantity);
      const trimmedNote = values.note.trim();

      const result = adjustStock(product.productId, {
        direction: values.direction,
        quantity: numQuantity,
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
      });

      setSubmitting(false);

      if (result.ok) {
        const actionWord = values.direction === 'increase' ? 'Restocked' : 'Dispensed';
        toast.success(`${actionWord} ${product.name}: stock is now ${result.data.stock} units`);
        resetForm();
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    },
  });

  const { resetForm } = formik;

  // Focus quantity input on dialog open and reset form
  useEffect(() => {
    if (open) {
      resetForm({
        values: {
          direction: 'increase',
          quantity: '',
          note: '',
        },
      });
      const timer = setTimeout(() => {
        quantityInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, resetForm]);

  if (!product) return null;

  // Live preview calculation
  const parsedQuantity = parseInt(formik.values.quantity, 10);
  const validQuantity = !Number.isNaN(parsedQuantity) && parsedQuantity > 0;
  let resultingStock = currentStock;

  if (validQuantity) {
    if (formik.values.direction === 'increase') {
      resultingStock = currentStock + parsedQuantity;
    } else {
      resultingStock = Math.max(0, currentStock - parsedQuantity);
    }
  }

  const isOversell =
    formik.values.direction === 'decrease' && validQuantity && parsedQuantity > currentStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span>Adjust Stock</span>
        </DialogTitle>
        <DialogDescription>
          Update stock level for <strong className="text-foreground">{product.name}</strong> (
          <span className="font-mono">{product.productId}</span>).
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        {/* Direction Toggle */}
        <div className="space-y-1.5">
          <Label>Adjustment Type *</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                formik.setFieldValue('direction', 'increase');
                formik.setFieldTouched('direction', true);
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                formik.values.direction === 'increase'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'border-input bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Restock (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                formik.setFieldValue('direction', 'decrease');
                formik.setFieldTouched('direction', true);
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                formik.values.direction === 'decrease'
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm dark:bg-amber-950/40 dark:text-amber-200'
                  : 'border-input bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Sale / Outbound (-)</span>
            </button>
          </div>
        </div>

        {/* Live Stock Preview Card */}
        <div className="rounded-lg border bg-muted/40 p-3.5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Stock Preview
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Current</span>
              <div className="text-xl font-bold text-foreground">
                {currentStock}{' '}
                <span className="text-xs font-normal text-muted-foreground">units</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              {formik.values.direction === 'increase' ? (
                <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
              {validQuantity && (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    formik.values.direction === 'increase'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {formik.values.direction === 'increase'
                    ? `+${parsedQuantity}`
                    : `-${parsedQuantity}`}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground">Result</span>
              <div
                className={cn(
                  'text-xl font-bold',
                  isOversell ? 'text-destructive' : 'text-foreground',
                )}
              >
                {resultingStock}{' '}
                <span className="text-xs font-normal text-muted-foreground">units</span>
              </div>
            </div>
          </div>

          {isOversell && (
            <div className="mt-2 text-xs font-medium text-destructive">
              ⚠️ Cannot dispense {parsedQuantity} units. Only {currentStock} available in stock.
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label htmlFor="stock-quantity">Quantity *</Label>
          <Input
            ref={quantityInputRef}
            id="stock-quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 10"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(formik.touched.quantity && formik.errors.quantity)}
          />
          {formik.touched.quantity && formik.errors.quantity && (
            <p className="text-xs text-destructive">{formik.errors.quantity}</p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="stock-note">Reason / Note (optional)</Label>
          <Input
            id="stock-note"
            name="note"
            placeholder="e.g. PO #1029 supplier delivery or customer order"
            value={formik.values.note}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(formik.touched.note && formik.errors.note)}
          />
          {formik.touched.note && formik.errors.note && (
            <p className="text-xs text-destructive">{formik.errors.note}</p>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid || !formik.values.quantity}
            className={cn(
              formik.values.direction === 'increase'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700'
                : 'bg-primary hover:bg-primary/90',
            )}
          >
            {formik.isSubmitting
              ? 'Saving...'
              : formik.values.direction === 'increase'
                ? 'Confirm Restock'
                : 'Confirm Sale'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
