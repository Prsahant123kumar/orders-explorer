import { createCondition, createGroup } from '../src/filters/fields';
import type { Condition, Group } from '../src/filters/types';
import { buildSearch, parseSearch } from '../src/url/codec';
import type { UrlState } from '../src/url/codec';

let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

function group(...conditions: Condition[]): Group {
  return { ...createGroup(), conditions };
}

const status = { ...createCondition('status'), values: ['shipped', 'delivered'] } as Condition;
const customer = { ...createCondition('customer'), value: 'Ānand & "co"' } as Condition;
const amount = {
  ...createCondition('amount'),
  op: 'between',
  value: '1000',
  value2: '2000',
} as Condition;
const created = {
  ...createCondition('createdAt'),
  op: 'after',
  value: '2025-03-01',
} as Condition;
const priority = { ...createCondition('priority'), values: ['none', '1'] } as Condition;

const empty: UrlState = { groups: [], sort: null, pinned: null };
check('default state gives an empty query', buildSearch(empty) === '');

const blank = parseSearch('');
check(
  'empty query parses without errors',
  blank.errors.length === 0 && blank.state.groups.length === 0 && blank.state.sort === null,
);

const full: UrlState = {
  groups: [group(status, customer), group(amount, priority), group(created)],
  sort: { key: 'amount', dir: 'desc' },
  pinned: 'customer',
};
const search = buildSearch(full);
const back = parseSearch(search);
check('round trip has no errors', back.errors.length === 0, back.errors.join('; '));
check('round trip keeps three groups', back.state.groups.length === 3);
check('round trip keeps the exact same query', buildSearch(back.state) === search);
check(
  'round trip keeps sort and pin',
  back.state.sort?.key === 'amount' &&
    back.state.sort.dir === 'desc' &&
    back.state.pinned === 'customer',
);

const broken = [
  '?f=garbage',
  '?f=',
  '?f=null',
  '?f=%7B%7D',
  '?f=[[]]',
  '?f=[[{"f":"nope","v":"x"}]]',
  '?f=[[{"f":"status","in":["shipped","hacked"]}]]',
  '?f=[[{"f":"amount","o":"gt","v":"abc"}]]',
  '?f=[[{"f":"createdAt","o":"before","v":"yesterday"}]]',
  '?f=[[{"f":"customer","o":"drop","v":"x"}]]',
  '?f=%E0%A4%A',
  `?f=${'['.repeat(100000)}`,
  '?sort=amount:sideways',
  '?sort=bogus:asc',
  '?sort=amount',
  '?pin=bogus',
];

for (const query of broken) {
  const label = query.length > 50 ? `${query.slice(0, 47)}...` : query;
  try {
    const result = parseSearch(query);
    check(`broken ${label} is reported`, result.errors.length > 0);
    check(
      `broken ${label} falls back to defaults`,
      result.state.groups.length === 0 || query.startsWith('?sort') || query.startsWith('?pin'),
    );
  } catch (error) {
    check(`broken ${label} must not throw`, false, String(error));
  }
}

const mixed = parseSearch('?sort=amount:asc&pin=bogus');
check(
  'valid sort is kept when pin is broken',
  mixed.state.sort?.key === 'amount' && mixed.state.pinned === null && mixed.errors.length === 1,
);

console.log(failed === 0 ? '\nAll checks passed' : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);