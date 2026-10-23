import type { RawOrder } from './types';

/** Version 1 uses customer_name, version 2 uses customerName. Same field. */
export function pickCustomerName(raw: RawOrder): string {
  const name = raw.schemaVersion === 1 ? raw.customer_name : raw.customerName;
  // be forgiving: fall back to whichever one exists
  return (name ?? raw.customerName ?? raw.customer_name ?? '').trim();
}