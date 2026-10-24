import { useEffect, useRef } from 'react';
import type { Order } from '../data/types';
import { COLUMNS } from '../grid/columns';

interface DetailPanelProps {
  order: Order;
  onClose: () => void;
}

export function DetailPanel({ order, onClose }: DetailPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fields = COLUMNS.filter((c) => c.key !== 'notes');

  return (
    <aside className="detail" aria-label="Order details">
      <div className="detail-head">
        <h2>{order.id}</h2>
        <button ref={closeRef} type="button" className="btn" onClick={onClose}>
          Close (Esc)
        </button>
      </div>
      <div className="detail-body">
        <dl className="detail-list">
          {fields.map((col) => (
            <div className="detail-item" key={col.key}>
              <dt>{col.label}</dt>
              <dd>{col.format(order)}</dd>
            </div>
          ))}
        </dl>
        <h3 className="detail-title">Notes</h3>
        <pre className="detail-notes">{order.notes || '\u2014'}</pre>
      </div>
    </aside>
  );
}