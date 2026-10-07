import * as Yup from 'yup';

import { LIMITS } from '@/constants/limits';

interface CategoryItem {
  id: string;
  name: string;
}

interface CategorySchemaContext {
  existingCategories: CategoryItem[];
  currentCategoryId?: string;
}

export function createCategorySchema({
  existingCategories,
  currentCategoryId,
}: CategorySchemaContext) {
  const takenNames = new Set(
    existingCategories
      .filter((cat) => !currentCategoryId || cat.id !== currentCategoryId)
      .map((cat) => cat.name.trim().toLowerCase()),
  );

  return Yup.object({
    name: Yup.string()
      .trim()
      .required('Category name is required')
      .min(
        LIMITS.categoryNameMin,
        `Category name must be at least ${LIMITS.categoryNameMin} characters`,
      )
      .max(
        LIMITS.categoryNameMax,
        `Category name must be at most ${LIMITS.categoryNameMax} characters`,
      )
      .test('unique-name', 'Category name already exists', (value) => {
        if (!value) return true;
        return !takenNames.has(value.trim().toLowerCase());
      }),
  });
}
