import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Dialog, DialogTitle } from './dialog';

describe('Dialog', () => {
  it('labels the dialog, traps focus, and closes with Escape', () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTitle>Delete product</DialogTitle>
        <button type="button">Cancel</button>
        <button type="button">Delete</button>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Delete product' });
    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(closeButton);

    deleteButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(deleteButton);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
