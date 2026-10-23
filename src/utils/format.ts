const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number): string {
  return inr.format(value);
}

export function formatDate(ms: number | null): string {
  if (ms === null) return '\u2014';
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const PAYMENT_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  cod: 'COD',
  wallet: 'Wallet',
};

export function formatPayment(value: string): string {
  return PAYMENT_LABELS[value] ?? titleCase(value);
}

export function formatPriority(value: number | null): string {
  return value === null ? 'None' : String(value);
}