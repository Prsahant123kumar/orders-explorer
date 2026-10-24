import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { DetailPanel } from './components/DetailPanel';
import { EmptyState } from './components/EmptyState';
import { ErrorBanner } from './components/ErrorBanner';
import type { Order } from './data/types';
import { useOrders } from './data/useOrders';
import { buildCsv, downloadCsv } from './export/csv';
import { Chips } from './filters/Chips';
import { applyFilter } from './filters/engine';
import { FilterBuilder } from './filters/FilterBuilder';
import type { FilterState } from './filters/types';
import { Grid } from './grid/Grid';
import { nextSort, sortOrders } from './grid/sort';
import type { SortState } from './grid/sort';
import { parseSearch } from './url/codec';
import { useUrlSync } from './url/useUrlSync';

const NO_ORDERS: Order[] = [];

export default function App() {
  const state = useOrders();
  const [initial] = useState(() => parseSearch(window.location.search));
  const [sort, setSort] = useState<SortState | null>(initial.state.sort);
  const [pinned, setPinned] = useState<keyof Order | null>(initial.state.pinned);
  const [groups, setGroups] = useState<FilterState>(initial.state.groups);
  const [urlErrors, setUrlErrors] = useState<string[]>(initial.errors);
  const [selected, setSelected] = useState<Set<string>>(() => initial.state.selected);
  const anchor = useRef<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useUrlSync({ groups, sort, pinned, selected });

  const checkedSelection = useRef(false);
  useEffect(() => {
    if (state.status !== 'ready' || checkedSelection.current) return;
    checkedSelection.current = true;
    if (selected.size === 0) return;
    const known = new Set(state.orders.map((o) => o.id));
    const kept = new Set([...selected].filter((id) => known.has(id)));
    if (kept.size !== selected.size) {
      const dropped = selected.size - kept.size;
      setSelected(kept);
      setUrlErrors((prev) => [
        ...prev,
        `${dropped.toLocaleString('en-IN')} selected order(s) in the link do not exist and were ignored.`,
      ]);
    }
  }, [state, selected]);

  const orders = state.status === 'ready' ? state.orders : NO_ORDERS;
  const deferredGroups = useDeferredValue(groups);
  const ordered = useMemo(() => sortOrders(orders, sort), [orders, sort]);
  const sorted = useMemo(() => applyFilter(ordered, deferredGroups), [ordered, deferredGroups]);

  const visibleIds = useMemo(() => new Set(sorted.map((o) => o.id)), [sorted]);
  const hiddenCount = useMemo(() => {
    let count = 0;
    for (const id of selected) if (!visibleIds.has(id)) count++;
    return count;
  }, [selected, visibleIds]);

  const detail = useMemo(
    () => (detailId ? (orders.find((o) => o.id === detailId) ?? null) : null),
    [orders, detailId],
  );

    const handleRowClick = useCallback(
    (id: string, event: MouseEvent<HTMLDivElement>) => {
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
    },
    [sorted],
  );

    const handleToggle = useCallback((id: string) => {
    anchor.current = id;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleDeselectHidden() {
    setSelected((prev) => new Set([...prev].filter((id) => visibleIds.has(id))));
  }

    function handleExport() {
    const rows = ordered.filter((o) => selected.has(o.id));
    const day = new Date().toISOString().slice(0, 10);
    downloadCsv(buildCsv(rows), `orders-selected-${rows.length}-${day}.csv`);
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
          <span className="selected-count">
            {selected.size.toLocaleString('en-IN')} selected
            {hiddenCount > 0 && (
              <span className="hidden-count">
                {' '}
                ({hiddenCount.toLocaleString('en-IN')} hidden by filter)
              </span>
            )}
          </span>
          {hiddenCount > 0 && (
            <button type="button" className="btn" onClick={handleDeselectHidden}>
              Deselect hidden
            </button>
          )}
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
          <button
            type="button"
            className="btn primary"
            disabled={selected.size === 0}
            onClick={handleExport}
          >
            Export {selected.size.toLocaleString('en-IN')} {selected.size === 1 ? 'row' : 'rows'}
          </button>
        </div>
      </header>
      <ErrorBanner messages={urlErrors} onDismiss={() => setUrlErrors([])} />
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
          {sorted.length === 0 && <EmptyState onClear={() => setGroups([])} />}
        </div>
        {detail && <DetailPanel order={detail} onClose={() => setDetailId(null)} />}
      </main>
    </div>
  );
}