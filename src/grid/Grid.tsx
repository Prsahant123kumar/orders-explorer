import type { Order } from '../data/types';
import { COLUMNS, GRID_TEMPLATE, TOTAL_WIDTH } from './columns';

export const ROW_HEIGHT = 32;

interface GridProps {
  orders: Order[];
}

export function Grid({ orders }: GridProps) {
  return (
    <div
      className="grid-scroll"
      role="grid"
      aria-rowcount={orders.length + 1}
      aria-colcount={COLUMNS.length}
    >
      <div className="grid-inner" style={{ width: TOTAL_WIDTH }}>
        <div className="grid-header" role="row" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              role="columnheader"
              className={`cell header-cell${col.align === 'right' ? ' num' : ''}`}
            >
              {col.label}
            </div>
          ))}
        </div>
        {orders.map((order) => (
          <div
            key={order.id}
            className="grid-row"
            role="row"
            style={{ gridTemplateColumns: GRID_TEMPLATE, height: ROW_HEIGHT }}
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
          </div>
        ))}
      </div>
    </div>
  );
}