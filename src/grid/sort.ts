import type { Order } from '../data/types';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: keyof Order;
  dir: SortDir;
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function nextSort(current: SortState | null, key: keyof Order): SortState {
  if (current && current.key === key) {
    return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  return { key, dir: 'asc' };
}

export function sortOrders(orders: Order[], sort: SortState | null): Order[] {
  if (!sort) return orders;
  const { key, dir } = sort;
  const sign = dir === 'asc' ? 1 : -1;

  return [...orders].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    const xEmpty = x === null;
    const yEmpty = y === null;
    if (xEmpty || yEmpty) {
      if (xEmpty && yEmpty) return 0;
      return xEmpty ? 1 : -1;
    }
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * sign;
    return collator.compare(String(x), String(y)) * sign;
  });
}