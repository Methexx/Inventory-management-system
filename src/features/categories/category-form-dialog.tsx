import { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import { FolderPlus } from 'lucide-react';
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
import { createCategorySchema } from '@/schemas/category-schema';
import { useInventory } from '@/state/use-inventory';
import type { Category } from '@/types/category';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onCreated?: (category: Category) => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onCreated,
}: CategoryFormDialogProps) {
  const { state, addCategory, renameCategory } = useInventory();
  const inputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(category);

  const schema = createCategorySchema({
    existingCategories: state.categories,
    currentCategoryId: category?.id,
  });

  const formik = useFormik({
    initialValues: {
      name: category?.name ?? '',
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const trimmedName = values.name.trim();

      if (isEdit && category) {
        const result = renameCategory(category.id, trimmedName);
        setSubmitting(false);

        if (result.ok) {
          toast.success(`Renamed category to "${result.data.name}"`);
          resetForm();
          onOpenChange(false);
        } else {
          toast.error(result.error.message);
        }
      } else {
        const result = addCategory(trimmedName);
        setSubmitting(false);

        if (result.ok) {
          toast.success(`Created category "${result.data.name}"`);
          onCreated?.(result.data);
          resetForm();
          onOpenChange(false);
        } else {
          toast.error(result.error.message);
        }
      }
    },
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({
        values: {
          name: category?.name ?? '',
        },
      });
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, category, resetForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5 text-primary" />
          <span>{isEdit ? 'Rename Category' : 'Create New Category'}</span>
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the display name of this category.'
            : 'Add a new category to group and organize products.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="category-name">Category Name *</Label>
          <Input
            ref={inputRef}
            id="category-name"
            name="name"
            placeholder="e.g. Home Appliances"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-xs text-destructive">{formik.errors.name}</p>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid || !formik.values.name.trim()}
          >
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
