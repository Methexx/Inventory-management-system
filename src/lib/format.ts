const CURRENCY_FORMATTER = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
});

export function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}
