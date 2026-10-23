import { useEffect, useState } from 'react';
import type { Order } from './types';

export type OrdersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; orders: Order[]; rawCount: number };

export function useOrders(): OrdersState {
  const [state, setState] = useState<OrdersState>({ status: 'loading' });

  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      if (event.data.type === 'done') {
        setState({ status: 'ready', orders: event.data.orders, rawCount: event.data.rawCount });
      } else {
        setState({ status: 'error', message: event.data.message });
      }
      worker.terminate();
    };
    worker.postMessage({ url: `${import.meta.env.BASE_URL}orders.json` });
    return () => worker.terminate();
  }, []);

  return state;
}