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


const DMY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const ISO_NO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

export function parseDate(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;

  if (typeof v === 'number') return v * 1000;

  const s = v.trim();

  const dmy = DMY.exec(s);
  if (dmy) {
    const [, d, m, y] = dmy;
    return Date.UTC(+y, +m - 1, +d);
  }

  const iso = ISO_NO_TZ.test(s) ? s + 'Z' : s;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}