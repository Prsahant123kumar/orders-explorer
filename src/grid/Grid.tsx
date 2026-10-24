import { useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import type { Order } from '../data/types';
import { COLUMNS, MIN_COLUMN_WIDTH, buildTemplate, defaultWidths, sumWidths } from './columns';
import type { SortState } from './sort';
import { useVirtual } from './useVirtual';

export const ROW_HEIGHT = 32;
export const HEADER_HEIGHT = 32;

interface FocusPos {
  row: number;
  col: number;
}

interface GridProps {
  orders: Order[];
  sort: SortState | null;
  onSort: (key: keyof Order) => void;
  pinned: keyof Order | null;
  onPin: (key: keyof Order | null) => void;
  selected: Set<string>;
  onRowClick: (id: string, event: MouseEvent<HTMLDivElement>) => void;
}

export function Grid({ orders, sort, onSort, pinned, onPin, selected, onRowClick }: GridProps) {
  const { ref, onScroll, start, end, totalHeight } = useVirtual(orders.length, ROW_HEIGHT);
  const [widths, setWidths] = useState<number[]>(defaultWidths);
  const [focus, setFocus] = useState<FocusPos | null>(null);

  const order = useMemo(() => {
    const all = COLUMNS.map((_, i) => i);
    const pinnedIndex = COLUMNS.findIndex((c) => c.key === pinned);
    if (pinnedIndex === -1) return all;
    return [pinnedIndex, ...all.filter((i) => i !== pinnedIndex)];
  }, [pinned]);

  const template = useMemo(() => buildTemplate(order.map((i) => widths[i])), [order, widths]);
  const totalWidth = useMemo(() => sumWidths(widths), [widths]);

  const lastRow = orders.length - 1;
  const lastCol = COLUMNS.length - 1;
  const focusRow = focus ? Math.min(focus.row, lastRow) : -1;
  const focusCol = focus ? Math.min(focus.col, lastCol) : -1;

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

  function scrollCellIntoView(row: number, col: number) {
    const el = ref.current;
    if (!el) return;

    const top = row * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT + HEADER_HEIGHT;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;

    if (pinned && col === 0) return;
    const pinnedWidth = pinned ? widths[order[0]] : 0;
    let left = 0;
    for (let k = 0; k < col; k++) left += widths[order[k]];
    const right = left + widths[order[col]];
    if (left < el.scrollLeft + pinnedWidth) el.scrollLeft = left - pinnedWidth;
    else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth;
  }

  function moveFocus(row: number, col: number) {
    const r = Math.max(0, Math.min(lastRow, row));
    const c = Math.max(0, Math.min(lastCol, col));
    setFocus({ row: r, col: c });
    scrollCellIntoView(r, c);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || orders.length === 0) return;

    const current = focus ?? { row: 0, col: 0 };
    const row = Math.min(current.row, lastRow);
    const col = Math.min(current.col, lastCol);
    const page = Math.max(
      1,
      Math.floor((event.currentTarget.clientHeight - HEADER_HEIGHT) / ROW_HEIGHT) - 1,
    );
    const ctrl = event.ctrlKey || event.metaKey;

    let next: FocusPos | null = null;
    switch (event.key) {
      case 'ArrowDown':
        next = { row: row + 1, col };
        break;
      case 'ArrowUp':
        next = { row: row - 1, col };
        break;
      case 'ArrowRight':
        next = { row, col: col + 1 };
        break;
      case 'ArrowLeft':
        next = { row, col: col - 1 };
        break;
      case 'PageDown':
        next = { row: row + page, col };
        break;
      case 'PageUp':
        next = { row: row - page, col };
        break;
      case 'Home':
        next = ctrl ? { row: 0, col: 0 } : { row, col: 0 };
        break;
      case 'End':
        next = ctrl ? { row: lastRow, col: lastCol } : { row, col: lastCol };
        break;
    }

    if (next) {
      event.preventDefault();
      moveFocus(next.row, next.col);
    }
  }

  const rows = [];
  for (let i = start; i < end; i++) {
    const item = orders[i];
    const isSelected = selected.has(item.id);
    rows.push(
      <div
        key={item.id}
        className={`grid-row${i % 2 === 1 ? ' odd' : ''}${isSelected ? ' selected' : ''}`}
        role="row"
        aria-rowindex={i + 2}
        aria-selected={isSelected}
        onClick={(e) => onRowClick(item.id, e)}
        style={{
          gridTemplateColumns: template,
          height: ROW_HEIGHT,
          transform: `translateY(${i * ROW_HEIGHT}px)`,
        }}
      >
        {order.map((colIndex, k) => {
          const col = COLUMNS[colIndex];
          const text = col.format(item);
          const classes = ['cell'];
          if (col.align === 'right') classes.push('num');
          if (col.key === pinned) classes.push('pinned');
          if (i === focusRow && k === focusCol) classes.push('focused');
          return (
            <div
              key={col.key}
              id={`cell-${i}-${k}`}
              role="gridcell"
              aria-colindex={k + 1}
              className={classes.join(' ')}
              title={text}
              onClick={() => moveFocus(i, k)}
            >
              {text}
            </div>
          );
        })}
      </div>,
    );
  }

  const activeCell =
    focusRow >= start && focusRow < end ? `cell-${focusRow}-${focusCol}` : undefined;

  return (
    <div
      ref={ref}
      className="grid-scroll"
      role="grid"
      tabIndex={0}
      aria-label="Orders"
      aria-rowcount={orders.length + 1}
      aria-colcount={COLUMNS.length}
      aria-activedescendant={activeCell}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        if (e.target === e.currentTarget && !focus && orders.length > 0) {
          setFocus({ row: 0, col: 0 });
        }
      }}
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