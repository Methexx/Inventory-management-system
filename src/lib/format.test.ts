import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('returns a string containing LKR and the formatted integer', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('LKR');
    expect(result).toContain('1,000');
  });

  it('formats zero without errors', () => {
    const result = formatCurrency(0);
    expect(result).toContain('LKR');
    expect(result).toContain('0');
  });

  it('formats a decimal value to two decimal places', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('formats the maximum allowed price without errors', () => {
    const result = formatCurrency(99_999_999);
    expect(result).toContain('LKR');
    expect(result).toContain('99,999,999');
  });
});
