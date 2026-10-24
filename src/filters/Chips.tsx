import type { ReactNode } from 'react';
import { describeCondition } from './describe';
import { isActiveCondition } from './engine';
import type { FilterState } from './types';

interface ChipsProps {
  groups: FilterState;
  onChange: (groups: FilterState) => void;
}

export function Chips({ groups, onChange }: ChipsProps) {
  const items: ReactNode[] = [];
  let shown = 0;

  for (const group of groups) {
    const active = group.conditions.filter(isActiveCondition);
    if (active.length === 0) continue;

    if (shown > 0) {
      items.push(
        <span key={`and-${group.id}`} className="chip-sep strong">
          AND
        </span>,
      );
    }
    shown += 1;

    const chips: ReactNode[] = [];
    active.forEach((condition, index) => {
      if (index > 0) {
        chips.push(
          <span key={`or-${condition.id}`} className="chip-sep">
            or
          </span>,
        );
      }
      const text = describeCondition(condition);
      chips.push(
        <span key={condition.id} className="chip" title={text}>
          <span className="chip-text">{text}</span>
          <button
            type="button"
            className="chip-x"
            aria-label={`Remove filter: ${text}`}
            onClick={() =>
              onChange(
                groups
                  .map((g) =>
                    g.id === group.id
                      ? { ...g, conditions: g.conditions.filter((c) => c.id !== condition.id) }
                      : g,
                  )
                  .filter((g) => g.conditions.length > 0),
              )
            }
          >
            {'\u00D7'}
          </button>
        </span>,
      );
    });

    items.push(
      <span key={group.id} className="chip-group">
        {chips}
      </span>,
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="chips" aria-label="Active filters">
      {items}
      <button type="button" className="btn small clear-all" onClick={() => onChange([])}>
        Clear all
      </button>
    </div>
  );
}