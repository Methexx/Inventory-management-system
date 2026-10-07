import { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import * as Yup from 'yup';

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
import { LIMITS } from '@/constants/limits';
import { useInventory } from '@/state/use-inventory';
import type { Product } from '@/types/product';

interface BulkRestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess?: () => void;
}

const bulkRestockSchema = Yup.object({
  quantity: Yup.number()
    .typeError('Quantity must be a whole number')
    .required('Quantity is required')
    .integer('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(LIMITS.stockMax, `Quantity cannot exceed ${LIMITS.stockMax.toLocaleString()}`),
  note: Yup.string().trim().max(LIMITS.noteMax, `Note cannot exceed ${LIMITS.noteMax} characters`),
});

export function BulkRestockDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkRestockDialogProps) {
  const { restockProducts } = useInventory();
  const inputRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: {
      quantity: '',
      note: '',
    },
    validationSchema: bulkRestockSchema,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const numQuantity = Number(values.quantity);
      const trimmedNote = values.note.trim() || undefined;
      const ids = selectedProducts.map((p) => p.productId);

      const result = restockProducts(ids, numQuantity, trimmedNote);
      setSubmitting(false);

      if (result.ok) {
        toast.success(
          `Successfully restocked ${result.data.length} products (+${numQuantity} units each)`,
        );
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error.message);
      }
    },
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({
        values: {
          quantity: '',
          note: '',
        },
      });
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, resetForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Bulk Restock Products</span>
        </DialogTitle>
        <DialogDescription>
          Add stock to <strong className="text-foreground">{selectedProducts.length}</strong>{' '}
          selected {selectedProducts.length === 1 ? 'item' : 'items'} simultaneously.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        <div className="max-h-28 overflow-y-auto rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Selected items:</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {selectedProducts.map((p) => (
              <span
                key={p.productId}
                className="rounded bg-card px-1.5 py-0.5 border font-mono text-[11px] text-foreground"
              >
                {p.name} ({p.stock})
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulk-quantity">Quantity to Add to Each Product *</Label>
          <Input
            ref={inputRef}
            id="bulk-quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 20"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(formik.touched.quantity && formik.errors.quantity)}
          />
          {formik.touched.quantity && formik.errors.quantity && (
            <p className="text-xs text-destructive">{formik.errors.quantity}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulk-note">Note / Reason (optional)</Label>
          <Input
            id="bulk-note"
            name="note"
            placeholder="e.g. Bulk restock shipment delivery"
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {formik.isSubmitting ? 'Restocking...' : `Restock ${selectedProducts.length} Items`}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
