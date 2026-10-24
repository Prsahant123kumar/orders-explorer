import { parseNumber } from './engine';
import { FIELD_BY_KEY } from './fields';
import type { Condition } from './types';

function num(text: string): string {
  const n = parseNumber(text);
  return n === null ? text : n.toLocaleString('en-IN');
}

export function describeCondition(condition: Condition): string {
  const def = FIELD_BY_KEY.get(condition.field);
  const label = def ? def.label : condition.field;

  switch (condition.kind) {
    case 'text': {
      const op =
        condition.op === 'contains'
          ? 'contains'
          : condition.op === 'notContains'
            ? 'does not contain'
            : 'equals';
      return `${label} ${op} "${condition.value.trim()}"`;
    }
    case 'number': {
      if (condition.op === 'between') {
        return `${label} ${num(condition.value)} to ${num(condition.value2)}`;
      }
      const symbol = condition.op === 'eq' ? '=' : condition.op === 'gt' ? '>' : '<';
      return `${label} ${symbol} ${num(condition.value)}`;
    }
    case 'date': {
      if (condition.op === 'between') return `${label} ${condition.value} to ${condition.value2}`;
      return `${label} ${condition.op} ${condition.value}`;
    }
    case 'enum': {
      const options = def ? def.options : [];
      const names = condition.values.map((v) => options.find((o) => o.value === v)?.label ?? v);
      return `${label}: ${names.join(', ')}`;
    }
  }
}
