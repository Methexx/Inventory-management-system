import * as Yup from 'yup';

import { LIMITS } from '@/constants/limits';

// Context the factory needs to enforce category name uniqueness.
interface CategoryItem {
  id: string;
  name: string;
}

interface CategorySchemaContext {
  existingCategories: CategoryItem[];
  currentCategoryId?: string;
}

/**
 * Builds the Yup schema for the category form (create / rename).
 *
 * `existingCategories` — list of current categories.
 * `currentCategoryId`  — optional ID of the category being edited (excluded from uniqueness check).
 */
export function createCategorySchema({
  existingCategories,
  currentCategoryId,
}: CategorySchemaContext) {
  // Exclude currentCategoryId when renaming, then normalise remaining names for Set lookup.
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
