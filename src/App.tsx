import { useMemo, useState } from 'react';
import type { Order } from './data/types';
import { useOrders } from './data/useOrders';
import { Grid } from './grid/Grid';
import { nextSort, sortOrders } from './grid/sort';
import type { SortState } from './grid/sort';

const NO_ORDERS: Order[] = [];

export default function App() {
  const state = useOrders();
  const [sort, setSort] = useState<SortState | null>(null);

  const orders = state.status === 'ready' ? state.orders : NO_ORDERS;
  const sorted = useMemo(() => sortOrders(orders, sort), [orders, sort]);

  if (state.status === 'loading') return <p className="message">Loading orders...</p>;
  if (state.status === 'error') return <p className="message">Failed to load: {state.message}</p>;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Orders Explorer</h1>
        <span>{sorted.length.toLocaleString('en-IN')} orders</span>
      </header>
      <main className="main">
        <Grid orders={sorted} sort={sort} onSort={(key) => setSort((s) => nextSort(s, key))} />
      </main>
    </div>
  );
}