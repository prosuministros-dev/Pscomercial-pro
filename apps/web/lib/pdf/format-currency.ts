/**
 * Format a number as currency string for PDF rendering.
 * Does NOT use browser APIs (Intl.NumberFormat is available in Node).
 */
export function formatCurrencyForPdf(
  amount: number,
  currency: 'COP' | 'USD' = 'COP',
): string {
  if (currency === 'COP') {
    return `$ ${Math.round(amount).toLocaleString('es-CO')}`;
  }
  return `USD ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date string (ISO) to a readable format for PDF.
 */
export function formatDateForPdf(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
