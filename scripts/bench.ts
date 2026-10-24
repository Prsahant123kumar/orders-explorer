import { readFileSync } from 'node:fs';
import { dedupeById } from '../src/data/dedupe';
import { normalizeOrder } from '../src/data/normalize';
import type { Order, RawOrder } from '../src/data/types';
import { applyFilter } from '../src/filters/engine';
import { createCondition, createGroup } from '../src/filters/fields';
import type { Condition, Group } from '../src/filters/types';
import { sortOrders } from '../src/grid/sort';

function time(fn: () => unknown, runs = 7): number {
  fn();
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

function report(name: string, ms: number, note = '') {
  console.log(`${name.padEnd(46)} ${ms.toFixed(1).padStart(8)} ms  ${note}`);
}

function group(...conditions: Condition[]): Group {
  return { ...createGroup(), conditions };
}

function enumCond(field: 'status' | 'region', values: string[]): Condition {
  const c = createCondition(field);
  if (c.kind !== 'enum') throw new Error('expected enum');
  return { ...c, values };
}

function amountGt(value: string): Condition {
  const c = createCondition('amount');
  if (c.kind !== 'number') throw new Error('expected number');
  return { ...c, op: 'gt', value };
}

function customerContains(value: string): Condition {
  const c = createCondition('customer');
  if (c.kind !== 'text') throw new Error('expected text');
  return { ...c, op: 'contains', value };
}

function notesContains(value: string): Condition {
  const c = createCondition('notes');
  if (c.kind !== 'text') throw new Error('expected text');
  return { ...c, op: 'contains', value };
}

function createdBetween(a: string, b: string): Condition {
  const c = createCondition('createdAt');
  if (c.kind !== 'date') throw new Error('expected date');
  return { ...c, op: 'between', value: a, value2: b };
}

const text = readFileSync('public/orders.json', 'utf8');
let raw: RawOrder[] = [];
report('JSON.parse (17 MB)', time(() => (raw = JSON.parse(text) as RawOrder[]), 3));
let orders: Order[] = [];
report('normalize + dedupe', time(() => (orders = dedupeById(raw.map(normalizeOrder))), 3));
console.log(`\n${orders.length} orders\n`);

console.log('FILTER');
const cases: [string, Group[]][] = [
  ['status is shipped or delivered', [group(enumCond('status', ['shipped', 'delivered']))]],
  ['amount > 1000', [group(amountGt('1000'))]],
  ['customer contains "an"', [group(customerContains('an'))]],
  ['notes contains "urgent"', [group(notesContains('urgent'))]],
  ['created between two dates', [group(createdBetween('2025-01-01', '2025-06-30'))]],
  [
    '(status OR region) AND amount AND customer',
    [
      group(enumCond('status', ['shipped']), enumCond('region', ['SOUTH', 'WEST'])),
      group(amountGt('1000')),
      group(customerContains('a')),
    ],
  ],
];
for (const [name, groups] of cases) {
  let count = 0;
  const ms = time(() => (count = applyFilter(orders, groups).length));
  report(name, ms, `${count} rows`);
}

console.log('\nSORT (ascending, all rows)');
const keys: (keyof Order)[] = [
  'id',
  'customer',
  'email',
  'status',
  'amount',
  'createdAt',
  'updatedAt',
  'notes',
];
for (const key of keys) {
  report(`sort by ${key}`, time(() => sortOrders(orders, { key, dir: 'asc' }), 3));
}