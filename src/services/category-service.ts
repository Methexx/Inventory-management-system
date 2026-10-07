import { LIMITS } from '@/constants/limits';
import { fail, ok } from '@/lib/result';
import type { Category } from '@/types/category';
import type { InventoryState } from '@/types/inventory';
import type { Result } from '@/types/result';

export interface CreateCategoryMetadata {
  categoryId: string;
}

/**
 * Creates a new custom category.
 *
 * Rules:
 * - Name must be trimmed and between 2 and 30 characters.
 * - Name must be unique case-insensitively across existing categories.
 * - Always marked with `isDefault: false`.
 */
export function createCategory(
  state: InventoryState,
  name: string,
  metadata: CreateCategoryMetadata,
): Result<{ category: Category }> {
  const trimmed = name.trim();

  if (trimmed.length < LIMITS.categoryNameMin || trimmed.length > LIMITS.categoryNameMax) {
    return fail(
      'VALIDATION_ERROR',
      `Category name must be between ${LIMITS.categoryNameMin} and ${LIMITS.categoryNameMax} characters.`,
    );
  }

  const isDuplicate = state.categories.some(
    (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) {
    return fail('DUPLICATE_CATEGORY', 'A category with this name already exists.');
  }

  const category: Category = {
    id: metadata.categoryId,
    name: trimmed,
    isDefault: false,
  };

  return ok({ category });
}

/**
 * Renames an existing custom category.
 *
 * Rules:
 * - Category must exist.
 * - Default seed categories cannot be renamed.
 * - Name must be between 2 and 30 characters.
 * - Cannot rename to an existing category's name (case-insensitive).
 */
export function renameCategory(
  state: InventoryState,
  categoryId: string,
  name: string,
): Result<{ category: Category }> {
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) {
    return fail('CATEGORY_NOT_FOUND', 'This category no longer exists.');
  }

  if (category.isDefault) {
    return fail('VALIDATION_ERROR', 'Default categories cannot be renamed.');
  }

  const trimmed = name.trim();
  if (trimmed.length < LIMITS.categoryNameMin || trimmed.length > LIMITS.categoryNameMax) {
    return fail(
      'VALIDATION_ERROR',
      `Category name must be between ${LIMITS.categoryNameMin} and ${LIMITS.categoryNameMax} characters.`,
    );
  }

  const isDuplicate = state.categories.some(
    (c) => c.id !== categoryId && c.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) {
    return fail('DUPLICATE_CATEGORY', 'A category with this name already exists.');
  }

  const updatedCategory: Category = {
    ...category,
    name: trimmed,
  };

  return ok({ category: updatedCategory });
}

/**
 * Deletes an unused custom category.
 *
 * Rules:
 * - Category must exist.
 * - Default seed categories cannot be deleted.
 * - Cannot delete if any product in state references this category.
 */
export function deleteCategory(
  state: InventoryState,
  categoryId: string,
): Result<{ categoryId: string }> {
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) {
    return fail('CATEGORY_NOT_FOUND', 'This category no longer exists.');
  }

  if (category.isDefault) {
    return fail('VALIDATION_ERROR', 'Default categories cannot be deleted.');
  }

  const usedCount = state.products.filter((p) => p.categoryId === categoryId).length;
  if (usedCount > 0) {
    const productWord = usedCount === 1 ? 'product' : 'products';
    return fail(
      'CATEGORY_IN_USE',
      `This category has ${usedCount} ${productWord}. Move or delete them first.`,
    );
  }

  return ok({ categoryId });
}
