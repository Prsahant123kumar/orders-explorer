import type { Order } from '../data/types';
import type { Condition, FilterState } from './types';

export type Predicate = (order: Order) => boolean;

const DAY_MS = 86_400_000;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseDay(text: string): number | null {
  const match = DAY_PATTERN.exec(text.trim());
  if (!match) return null;
  const t = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(t) ? null : t;
}

export function enumValue(order: Order, field: string): string {
  if (field === 'priority') return order.priority === null ? 'none' : String(order.priority);
  return String(order[field as keyof Order]);
}

export function compileCondition(condition: Condition): Predicate | null {
  switch (condition.kind) {
    case 'text': {
      const field = condition.field;
      const op = condition.op;
      const query = condition.value.trim().toLowerCase();
      if (query === '') return null;
      if (op === 'contains') return (o) => o[field].toLowerCase().includes(query);
      if (op === 'notContains') return (o) => !o[field].toLowerCase().includes(query);
      return (o) => o[field].toLowerCase() === query;
    }

    case 'number': {
      const field = condition.field;
      const op = condition.op;
      const a = parseNumber(condition.value);
      if (a === null) return null;
      if (op === 'eq') return (o) => o[field] === a;
      if (op === 'gt') return (o) => o[field] > a;
      if (op === 'lt') return (o) => o[field] < a;
      const b = parseNumber(condition.value2);
      if (b === null) return null;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return (o) => o[field] >= lo && o[field] <= hi;
    }

    case 'date': {
      const field = condition.field;
      const op = condition.op;
      const a = parseDay(condition.value);
      if (a === null) return null;
      if (op === 'before') {
        return (o) => {
          const t = o[field];
          return t !== null && t < a;
        };
      }
      if (op === 'after') {
        const from = a + DAY_MS;
        return (o) => {
          const t = o[field];
          return t !== null && t >= from;
        };
      }
      const b = parseDay(condition.value2);
      if (b === null) return null;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b) + DAY_MS;
      return (o) => {
        const t = o[field];
        return t !== null && t >= lo && t < hi;
      };
    }

    case 'enum': {
      const field = condition.field;
      if (condition.values.length === 0) return null;
      const allowed = new Set(condition.values);
      return (o) => allowed.has(enumValue(o, field));
    }
  }
}

export function isActiveCondition(condition: Condition): boolean {
  return compileCondition(condition) !== null;
}

export function applyFilter(orders: Order[], groups: FilterState): Order[] {
  const compiled: Predicate[][] = [];
  for (const group of groups) {
    const predicates: Predicate[] = [];
    for (const condition of group.conditions) {
      const predicate = compileCondition(condition);
      if (predicate) predicates.push(predicate);
    }
    if (predicates.length > 0) compiled.push(predicates);
  }

  if (compiled.length === 0) return orders;

  const result: Order[] = [];
  for (const order of orders) {
    let all = true;
    for (const predicates of compiled) {
      let any = false;
      for (const predicate of predicates) {
        if (predicate(order)) {
          any = true;
          break;
        }
      }
      if (!any) {
        all = false;
        break;
      }
    }
    if (all) result.push(order);
  }
  return result;
}