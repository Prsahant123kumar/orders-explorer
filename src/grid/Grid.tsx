import type { Order } from '../data/types';
import { COLUMNS, GRID_TEMPLATE, TOTAL_WIDTH } from './columns';
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
          gridTemplateColumns: GRID_TEMPLATE,
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
      <div className="grid-inner" style={{ width: TOTAL_WIDTH }}>
        <div className="grid-header" role="row" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
          {COLUMNS.map((col) => {
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