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
}

export function Grid({ orders, sort, onSort }: GridProps) {
  const { ref, onScroll, start, end, totalHeight } = useVirtual(orders.length, ROW_HEIGHT);
  const [widths, setWidths] = useState<number[]>(defaultWidths);

  const template = useMemo(() => buildTemplate(widths), [widths]);
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
    const order = orders[i];
    rows.push(
      <div
        key={order.id}
        className="grid-row"
        role="row"
        aria-rowindex={i + 2}
        style={{
          gridTemplateColumns: template,
          height: ROW_HEIGHT,
          transform: `translateY(${i * ROW_HEIGHT}px)`,
        }}
      >
        {COLUMNS.map((col) => {
          const text = col.format(order);
          return (
            <div
              key={col.key}
              role="gridcell"
              className={`cell${col.align === 'right' ? ' num' : ''}`}
              title={text}
            >
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
          {COLUMNS.map((col, index) => {
            const active = sort?.key === col.key;
            const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
            return (
              <div
                key={col.key}
                role="columnheader"
                aria-sort={ariaSort}
                className={`cell header-cell${col.align === 'right' ? ' num' : ''}`}
                onClick={() => onSort(col.key)}
              >
                {col.label}
                {active && <span className="sort-icon">{sort.dir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>}
                <div
                  className="resize-handle"
                  onPointerDown={(e) => startResize(e, index)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={() => setWidth(index, col.width)}
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