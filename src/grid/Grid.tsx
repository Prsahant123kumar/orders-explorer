import { useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Order } from '../data/types';
import { COLUMNS, MIN_COLUMN_WIDTH, buildTemplate, defaultWidths, sumWidths } from './columns';
import type { SortState } from './sort';
import { useVirtual } from './useVirtual';

export const ROW_HEIGHT = 32;

interface GridProps {
  orders: Order[];
  sort: SortState | null;
  onSort: (key: keyof Order) => void;
  pinned: keyof Order | null;
  onPin: (key: keyof Order | null) => void;
}

export function Grid({ orders, sort, onSort, pinned, onPin }: GridProps) {
  const { ref, onScroll, start, end, totalHeight } = useVirtual(orders.length, ROW_HEIGHT);
  const [widths, setWidths] = useState<number[]>(defaultWidths);

  const order = useMemo(() => {
    const all = COLUMNS.map((_, i) => i);
    const pinnedIndex = COLUMNS.findIndex((c) => c.key === pinned);
    if (pinnedIndex === -1) return all;
    return [pinnedIndex, ...all.filter((i) => i !== pinnedIndex)];
  }, [pinned]);

  const template = useMemo(() => buildTemplate(order.map((i) => widths[i])), [order, widths]);
  const totalWidth = useMemo(() => sumWidths(widths), [widths]);

  function setWidth(index: number, width: number) {
    setWidths((prev) => prev.map((w, i) => (i === index ? width : w)));
  }

  function startResize(event: PointerEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    const startX = event.clientX;
    const startWidth = widths[index];
    target.setPointerCapture(event.pointerId);

    const onMove = (e: globalThis.PointerEvent) => {
      setWidth(index, Math.max(MIN_COLUMN_WIDTH, startWidth + e.clientX - startX));
    };
    const onUp = () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  }

  const rows = [];
  for (let i = start; i < end; i++) {
    const item = orders[i];
    rows.push(
      <div
        key={item.id}
        className={`grid-row${i % 2 === 1 ? ' odd' : ''}`}
        role="row"
        aria-rowindex={i + 2}
        style={{
          gridTemplateColumns: template,
          height: ROW_HEIGHT,
          transform: `translateY(${i * ROW_HEIGHT}px)`,
        }}
      >
        {order.map((colIndex) => {
          const col = COLUMNS[colIndex];
          const text = col.format(item);
          const classes = ['cell'];
          if (col.align === 'right') classes.push('num');
          if (col.key === pinned) classes.push('pinned');
          return (
            <div key={col.key} role="gridcell" className={classes.join(' ')} title={text}>
              {text}
            </div>
          );
        })}
      </div>,
    );
  }

  return (
    <div
      ref={ref}
      className="grid-scroll"
      role="grid"
      aria-rowcount={orders.length + 1}
      aria-colcount={COLUMNS.length}
      onScroll={onScroll}
    >
      <div className="grid-inner" style={{ width: totalWidth }}>
        <div className="grid-header" role="row" style={{ gridTemplateColumns: template }}>
          {order.map((colIndex) => {
            const col = COLUMNS[colIndex];
            const active = sort?.key === col.key;
            const isPinned = col.key === pinned;
            const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
            const classes = ['cell', 'header-cell'];
            if (col.align === 'right') classes.push('num');
            if (isPinned) classes.push('pinned');
            return (
              <div
                key={col.key}
                role="columnheader"
                aria-sort={ariaSort}
                className={classes.join(' ')}
                onClick={() => onSort(col.key)}
              >
                {col.label}
                {active && <span className="sort-icon">{sort.dir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>}
                <button
                  type="button"
                  className={`pin-btn${isPinned ? ' on' : ''}`}
                  aria-pressed={isPinned}
                  aria-label={isPinned ? `Unpin ${col.label}` : `Pin ${col.label}`}
                  title={isPinned ? 'Unpin column' : 'Pin column'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(isPinned ? null : col.key);
                  }}
                >
                  {'\u{1F4CC}'}
                </button>
                <div
                  className="resize-handle"
                  onPointerDown={(e) => startResize(e, colIndex)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={() => setWidth(colIndex, col.width)}
                  title="Drag to resize, double-click to reset"
                />
              </div>
            );
          })}
        </div>
        <div className="grid-body" style={{ height: totalHeight }}>
          {rows}
        </div>
      </div>
    </div>
  );
}