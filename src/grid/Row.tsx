import { memo } from 'react';
import type { MouseEvent } from 'react';
import type { Order } from '../data/types';
import { COLUMNS } from './columns';

export const ROW_HEIGHT = 32;

interface RowProps {
  item: Order;
  index: number;
  selected: boolean;
  focusCol: number;
  template: string;
  colOrder: number[];
  pinned: keyof Order | null;
  onRowClick: (id: string, event: MouseEvent<HTMLDivElement>) => void;
  onOpen: (id: string) => void;
  onCellClick: (row: number, col: number) => void;
}

function RowView({
  item,
  index,
  selected,
  focusCol,
  template,
  colOrder,
  pinned,
  onRowClick,
  onOpen,
  onCellClick,
}: RowProps) {
  return (
    <div
      className={`grid-row${index % 2 === 1 ? ' odd' : ''}${selected ? ' selected' : ''}`}
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selected}
      onClick={(e) => onRowClick(item.id, e)}
      onDoubleClick={() => onOpen(item.id)}
      style={{
        gridTemplateColumns: template,
        height: ROW_HEIGHT,
        transform: `translateY(${index * ROW_HEIGHT}px)`,
      }}
    >
      {colOrder.map((colIndex, k) => {
        const col = COLUMNS[colIndex];
        const text = col.format(item);
        const classes = ['cell'];
        if (col.align === 'right') classes.push('num');
        if (col.key === pinned) classes.push('pinned');
        if (k === focusCol) classes.push('focused');
        return (
          <div
            key={col.key}
            id={`cell-${index}-${k}`}
            role="gridcell"
            aria-colindex={k + 1}
            className={classes.join(' ')}
            title={text}
            onClick={() => onCellClick(index, k)}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}

export const Row = memo(RowView);