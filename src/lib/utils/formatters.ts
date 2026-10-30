/**
 * VyaparSuite ERP Standard Value Formatters
 */

export function formatCurrency(
  amount: number | string,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatQuantity(qty: number | string, places: number = 2): string {
  const num = typeof qty === 'string' ? parseFloat(qty) || 0 : qty;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(num);
}

export function formatPercent(value: number | string, places: number = 1): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return `${num.toFixed(places)}%`;
}
