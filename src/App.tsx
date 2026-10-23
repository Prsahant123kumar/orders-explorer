import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Order } from './data/types';
import { useOrders } from './data/useOrders';
import { Grid } from './grid/Grid';
import { nextSort, sortOrders } from './grid/sort';
import type { SortState } from './grid/sort';

const NO_ORDERS: Order[] = [];

export default function App() {
  const state = useOrders();
  const [sort, setSort] = useState<SortState | null>(null);
  const [pinned, setPinned] = useState<keyof Order | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const orders = state.status === 'ready' ? state.orders : NO_ORDERS;
  const sorted = useMemo(() => sortOrders(orders, sort), [orders, sort]);

  function handleRowClick(id: string, event: MouseEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelected(new Set([id]));
    }
  }

  if (state.status === 'loading') return <p className="message">Loading orders...</p>;
  if (state.status === 'error') return <p className="message">Failed to load: {state.message}</p>;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Orders Explorer</h1>
        <div className="topbar-right">
          <span>{sorted.length.toLocaleString('en-IN')} orders</span>
          <span className="selected-count">{selected.size.toLocaleString('en-IN')} selected</span>
          <button
            type="button"
            className="btn"
            disabled={selected.size === 0}
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </button>
        </div>
      </header>
      <main className="main">
        <Grid
          orders={sorted}
          sort={sort}
          onSort={(key) => setSort((s) => nextSort(s, key))}
          pinned={pinned}
          onPin={setPinned}
          selected={selected}
          onRowClick={handleRowClick}
        />
      </main>
    </div>
  );
}