import { readFileSync } from 'node:fs';
import { dedupeById } from '../src/data/dedupe';
import { normalizeOrder } from '../src/data/normalize';
import type { RawOrder } from '../src/data/types';
import { applyFilter } from '../src/filters/engine';
import { createCondition, createGroup } from '../src/filters/fields';
import type { Condition, Group } from '../src/filters/types';

const raw = JSON.parse(readFileSync('public/orders.json', 'utf8')) as RawOrder[];
const orders = dedupeById(raw.map(normalizeOrder));

let failed = 0;
function check(name: string, actual: number, expected: number) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  engine=${actual} expected=${expected}`);
}

function group(...conditions: Condition[]): Group {
  return { ...createGroup(), conditions };
}

function enumCond(field: 'status' | 'priority' | 'region', values: string[]): Condition {
  const c = createCondition(field);
  if (c.kind !== 'enum') throw new Error('expected enum');
  return { ...c, values };
}

function numberCond(op: 'eq' | 'gt' | 'lt' | 'between', value: string, value2 = ''): Condition {
  const c = createCondition('amount');
  if (c.kind !== 'number') throw new Error('expected number');
  return { ...c, op, value, value2 };
}

function textCond(op: 'contains' | 'notContains' | 'equals', value: string): Condition {
  const c = createCondition('customer');
  if (c.kind !== 'text') throw new Error('expected text');
  return { ...c, op, value };
}

function dateCond(op: 'before' | 'after' | 'between', value: string, value2 = ''): Condition {
  const c = createCondition('createdAt');
  if (c.kind !== 'date') throw new Error('expected date');
  return { ...c, op, value, value2 };
}

check('no groups returns everything', applyFilter(orders, []).length, orders.length);

check(
  'empty condition is ignored',
  applyFilter(orders, [group(enumCond('status', []))]).length,
  orders.length,
);

check(
  'status shipped OR delivered',
  applyFilter(orders, [group(enumCond('status', ['shipped', 'delivered']))]).length,
  orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').length,
);

check(
  '(shipped OR delivered) AND amount > 1000',
  applyFilter(orders, [
    group(enumCond('status', ['shipped']), enumCond('status', ['delivered'])),
    group(numberCond('gt', '1000')),
  ]).length,
  orders.filter((o) => (o.status === 'shipped' || o.status === 'delivered') && o.amount > 1000)
    .length,
);

check(
  'amount greater than 5000 matches nothing',
  applyFilter(orders, [group(numberCond('gt', '5000'))]).length,
  orders.filter((o) => o.amount > 5000).length,
);

check(
  'priority None',
  applyFilter(orders, [group(enumCond('priority', ['none']))]).length,
  orders.filter((o) => o.priority === null).length,
);

check(
  'priority None OR 1',
  applyFilter(orders, [group(enumCond('priority', ['none', '1']))]).length,
  orders.filter((o) => o.priority === null || o.priority === 1).length,
);

check(
  'amount between 1000 and 2000 (reversed bounds)',
  applyFilter(orders, [group(numberCond('between', '2000', '1000'))]).length,
  orders.filter((o) => o.amount >= 1000 && o.amount <= 2000).length,
);

check(
  'customer contains "an"',
  applyFilter(orders, [group(textCond('contains', 'AN'))]).length,
  orders.filter((o) => o.customer.toLowerCase().includes('an')).length,
);

check(
  'customer does not contain "an"',
  applyFilter(orders, [group(textCond('notContains', 'an'))]).length,
  orders.filter((o) => !o.customer.toLowerCase().includes('an')).length,
);

check(
  'created before 2025-01-01',
  applyFilter(orders, [group(dateCond('before', '2025-01-01'))]).length,
  orders.filter((o) => o.createdAt < Date.UTC(2025, 0, 1)).length,
);

check(
  'created after 2025-06-30',
  applyFilter(orders, [group(dateCond('after', '2025-06-30'))]).length,
  orders.filter((o) => o.createdAt >= Date.UTC(2025, 6, 1)).length,
);

check(
  'created between 2025-03-01 and 2025-03-31',
  applyFilter(orders, [group(dateCond('between', '2025-03-01', '2025-03-31'))]).length,
  orders.filter((o) => o.createdAt >= Date.UTC(2025, 2, 1) && o.createdAt < Date.UTC(2025, 3, 1))
    .length,
);

console.log(failed === 0 ? '\nAll checks passed' : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);