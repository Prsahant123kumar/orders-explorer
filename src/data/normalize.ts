import type { Channel, Order, PaymentMethod, RawOrder, Region, Status } from './types';

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


export function normalizeOrder(raw: RawOrder): Order {
  const priority = raw.priority;
  return {
    id: raw.id.trim(),
    customer: pickCustomerName(raw),
    email: (raw.customerEmail ?? '').trim(),
    status: (raw.status ?? '').trim().toLowerCase() as Status,
    amount: parseAmountRupees(raw),
    currency: (raw.currency ?? 'INR').trim(),
    createdAt: parseDate(raw.createdAt) ?? 0,
    updatedAt: parseDate(raw.updatedAt),
    region: (raw.region ?? '').trim().toUpperCase() as Region,
    channel: (raw.channel ?? '').trim().toLowerCase() as Channel,
    priority: priority === 1 || priority === 2 || priority === 3 ? priority : null,
    paymentMethod: (raw.paymentMethod ?? '').trim().toLowerCase() as PaymentMethod,
    itemCount: raw.itemCount ?? 0,
    notes: raw.notes ?? '',
  };
}