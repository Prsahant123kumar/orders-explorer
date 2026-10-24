import { DATE_OPS, FIELDS, FIELD_BY_KEY, NUMBER_OPS, TEXT_OPS, createCondition } from './fields';
import type { Condition, DateOp, FilterField, NumberOp, TextOp } from './types';

interface ConditionRowProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}

export function ConditionRow({ condition, onChange, onRemove }: ConditionRowProps) {
  function changeField(key: FilterField) {
    onChange({ ...createCondition(key), id: condition.id });
  }

  function renderEditor() {
    switch (condition.kind) {
      case 'text':
        return (
          <>
            <select
              aria-label="Operator"
              value={condition.op}
              onChange={(e) => onChange({ ...condition, op: e.target.value as TextOp })}
            >
              {TEXT_OPS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              aria-label="Value"
              placeholder="text"
              value={condition.value}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
            />
          </>
        );

      case 'number':
        return (
          <>
            <select
              aria-label="Operator"
              value={condition.op}
              onChange={(e) => onChange({ ...condition, op: e.target.value as NumberOp })}
            >
              {NUMBER_OPS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="any"
              aria-label="Value"
              placeholder="number"
              value={condition.value}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
            />
            {condition.op === 'between' && (
              <>
                <span className="op-label">and</span>
                <input
                  type="number"
                  step="any"
                  aria-label="Second value"
                  placeholder="number"
                  value={condition.value2}
                  onChange={(e) => onChange({ ...condition, value2: e.target.value })}
                />
              </>
            )}
          </>
        );

      case 'date':
        return (
          <>
            <select
              aria-label="Operator"
              value={condition.op}
              onChange={(e) => onChange({ ...condition, op: e.target.value as DateOp })}
            >
              {DATE_OPS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Date"
              value={condition.value}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
            />
            {condition.op === 'between' && (
              <>
                <span className="op-label">and</span>
                <input
                  type="date"
                  aria-label="Second date"
                  value={condition.value2}
                  onChange={(e) => onChange({ ...condition, value2: e.target.value })}
                />
              </>
            )}
          </>
        );

      case 'enum': {
        const def = FIELD_BY_KEY.get(condition.field);
        const options = def ? def.options : [];
        const toggle = (value: string) => {
          const values = condition.values.includes(value)
            ? condition.values.filter((v) => v !== value)
            : [...condition.values, value];
          onChange({ ...condition, values });
        };
        return (
          <>
            <span className="op-label">is one of</span>
            <span className="enum-opts" role="group" aria-label="Values">
              {options.map((option) => {
                const on = condition.values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`toggle${on ? ' on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggle(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </span>
          </>
        );
      }
    }
  }

  return (
    <div className="cond">
      <select
        aria-label="Field"
        value={condition.field}
        onChange={(e) => changeField(e.target.value as FilterField)}
      >
        {FIELDS.map((field) => (
          <option key={field.key} value={field.key}>
            {field.label}
          </option>
        ))}
      </select>
      {renderEditor()}
      <button type="button" className="icon-btn" aria-label="Remove condition" onClick={onRemove}>
        {'\u00D7'}
      </button>
    </div>
  );
}