import type { Order } from '../data/types';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: keyof Order;
  dir: SortDir;
}

export function nextSort(current: SortState | null, key: keyof Order): SortState {
  if (current && current.key === key) {
    return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  return { key, dir: 'asc' };
}

export function sortOrders(orders: Order[], sort: SortState | null): Order[] {
  if (!sort || orders.length === 0) return orders;

  const { key, dir } = sort;
  const sign = dir === 'asc' ? 1 : -1;
  const n = orders.length;
  const empty = new Uint8Array(n);
  const index = new Array<number>(n);
  for (let i = 0; i < n; i++) index[i] = i;

  const sample = orders.find((o) => o[key] !== null)?.[key];

  if (typeof sample === 'number') {
    const nums = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const value = orders[i][key];
      if (typeof value === 'number') nums[i] = value;
      else empty[i] = 1;
    }
    index.sort((a, b) => {
      if (empty[a] || empty[b]) return empty[a] === empty[b] ? 0 : empty[a] ? 1 : -1;
      return (nums[a] - nums[b]) * sign;
    });
  } else {
    const strings = new Array<string>(n);
    for (let i = 0; i < n; i++) {
      const value = orders[i][key];
      if (value === null) {
        empty[i] = 1;
        strings[i] = '';
      } else {
        strings[i] = String(value).toLowerCase();
      }
    }
    index.sort((a, b) => {
      if (empty[a] || empty[b]) return empty[a] === empty[b] ? 0 : empty[a] ? 1 : -1;
      const x = strings[a];
      const y = strings[b];
      if (x < y) return -sign;
      if (x > y) return sign;
      return 0;
    });
  }

  return index.map((i) => orders[i]);
}