import type { Order } from './types';

function prefer(a: Order, b: Order): Order {
  if (a.updatedAt !== null && b.updatedAt !== null) {
    return b.updatedAt > a.updatedAt ? b : a;
  }
  if (a.updatedAt !== null) return a;
  if (b.updatedAt !== null) return b;
  return b;
}

export function dedupeById(orders: Order[]): Order[] {
  const map = new Map<string, Order>();
  for (const order of orders) {
    const previous = map.get(order.id);
    map.set(order.id, previous ? prefer(previous, order) : order);
  }
  return [...map.values()];
}