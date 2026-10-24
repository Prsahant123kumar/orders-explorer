import { ConditionRow } from './ConditionRow';
import { createCondition, createGroup } from './fields';
import type { Condition, FilterState, Group } from './types';

interface FilterBuilderProps {
  groups: FilterState;
  onChange: (groups: FilterState) => void;
}

export function FilterBuilder({ groups, onChange }: FilterBuilderProps) {
  function updateGroup(id: string, update: (group: Group) => Group) {
    onChange(groups.map((g) => (g.id === id ? update(g) : g)));
  }

  function updateCondition(groupId: string, condition: Condition) {
    updateGroup(groupId, (g) => ({
      ...g,
      conditions: g.conditions.map((c) => (c.id === condition.id ? condition : c)),
    }));
  }

  function removeCondition(groupId: string, conditionId: string) {
    const next = groups
      .map((g) =>
        g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) } : g,
      )
      .filter((g) => g.conditions.length > 0);
    onChange(next);
  }

  return (
    <section className="filters" aria-label="Filters">
      {groups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && <div className="and-sep">AND</div>}
          <div className="group">
            <div className="group-head">
              <span>
                Match <strong>any</strong> of
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Remove group"
                title="Remove group"
                onClick={() => onChange(groups.filter((g) => g.id !== group.id))}
              >
                {'\u00D7'}
              </button>
            </div>
            {group.conditions.map((condition, index) => (
              <div key={condition.id} className="cond-line">
                <span className="or-tag">{index > 0 ? 'OR' : ''}</span>
                <ConditionRow
                  condition={condition}
                  onChange={(c) => updateCondition(group.id, c)}
                  onRemove={() => removeCondition(group.id, condition.id)}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn small"
              onClick={() =>
                updateGroup(group.id, (g) => ({
                  ...g,
                  conditions: [...g.conditions, createCondition('status')],
                }))
              }
            >
              + Condition
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn" onClick={() => onChange([...groups, createGroup()])}>
        + Add filter
      </button>
    </section>
  );
}