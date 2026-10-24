interface EmptyStateProps {
  onClear: () => void;
}

export function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="empty" role="status">
      <div className="empty-title">No orders match these filters</div>
      <p className="empty-hint">Try removing a condition or widening a range.</p>
      <button type="button" className="btn primary" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}