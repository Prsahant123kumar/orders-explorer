import type { RawOrder } from './types';

export function pickCustomerName(raw: RawOrder): string {
  const name = raw.schemaVersion === 1 ? raw.customer_name : raw.customerName;
  return (name ?? raw.customerName ?? raw.customer_name ?? '').trim();
}


export function parseAmountRupees(raw: RawOrder): number {
  const n = typeof raw.amount === 'string' ? Number(raw.amount.trim()) : (raw.amount ?? NaN);
  if (!Number.isFinite(n)) return 0;
  const rupees = raw.schemaVersion === 1 ? n / 100 : n;
  return Math.round(rupees * 100) / 100; // avoid 45.989999 style artifacts
}