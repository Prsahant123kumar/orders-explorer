import { useDeferredValue, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { DetailPanel } from './components/DetailPanel';
import type { Order } from './data/types';
import { useOrders } from './data/useOrders';
import { applyFilter } from './filters/engine';
import { FilterBuilder } from './filters/FilterBuilder';
import type { FilterState } from './filters/types';
import { Grid } from './grid/Grid';
import { nextSort, sortOrders } from './grid/sort';
import type { SortState } from './grid/sort';
import { Chips } from './filters/Chips';
const NO_ORDERS: Order[] = [];

export default function App() {
  const state = useOrders();
  const [sort, setSort] = useState<SortState | null>(null);
  const [pinned, setPinned] = useState<keyof Order | null>(null);
  const [groups, setGroups] = useState<FilterState>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const anchor = useRef<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const orders = state.status === 'ready' ? state.orders : NO_ORDERS;
  const deferredGroups = useDeferredValue(groups);
  const filtered = useMemo(() => applyFilter(orders, deferredGroups), [orders, deferredGroups]);
  const sorted = useMemo(() => sortOrders(filtered, sort), [filtered, sort]);

  const detail = useMemo(
    () => (detailId ? (orders.find((o) => o.id === detailId) ?? null) : null),
    [orders, detailId],
  );

  function handleRowClick(id: string, event: MouseEvent<HTMLDivElement>) {
    if (event.shiftKey && anchor.current !== null) {
      const from = sorted.findIndex((o) => o.id === anchor.current);
      const to = sorted.findIndex((o) => o.id === id);
      if (from !== -1 && to !== -1) {
        const lo = Math.min(from, to);
        const hi = Math.max(from, to);
        const range = new Set<string>();
        for (let i = lo; i <= hi; i++) range.add(sorted[i].id);
        setSelected(range);
        return;
      }
    }

    anchor.current = id;
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

  function handleToggle(id: string) {
    anchor.current = id;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (state.status === 'loading') return <p className="message">Loading orders...</p>;
  if (state.status === 'error') return <p className="message">Failed to load: {state.message}</p>;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Orders Explorer</h1>
        <div className="topbar-right">
          <span>
            {sorted.length.toLocaleString('en-IN')} of {orders.length.toLocaleString('en-IN')} orders
          </span>
          <span className="selected-count">{selected.size.toLocaleString('en-IN')} selected</span>
          <button
            type="button"
            className="btn"
            disabled={selected.size === 0}
            onClick={() => {
              setSelected(new Set());
              anchor.current = null;
            }}
          >
            Clear selection
          </button>
        </div>
      </header>
      <FilterBuilder groups={groups} onChange={setGroups} />
      <Chips groups={groups} onChange={setGroups} />
      <main className="main">
        <div className="grid-wrap">
          <Grid
            orders={sorted}
            sort={sort}
            onSort={(key) => setSort((s) => nextSort(s, key))}
            pinned={pinned}
            onPin={setPinned}
            selected={selected}
            onRowClick={handleRowClick}
            onToggle={handleToggle}
            onOpen={setDetailId}
          />
        </div>
        {detail && <DetailPanel order={detail} onClose={() => setDetailId(null)} />}
      </main>
    </div>
  );
}