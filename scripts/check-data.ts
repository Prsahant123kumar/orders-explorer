import { readFileSync } from 'node:fs';
import { dedupeById } from '../src/data/dedupe';
import { normalizeOrder } from '../src/data/normalize';
import { CHANNELS, PAYMENT_METHODS, REGIONS, STATUSES } from '../src/data/types';
import type { RawOrder } from '../src/data/types';

const raw = JSON.parse(readFileSync('public/orders.json', 'utf8')) as RawOrder[];
const orders = dedupeById(raw.map(normalizeOrder));

let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

check('raw record count', raw.length > 0, String(raw.length));
check('duplicates removed', orders.length < raw.length, String(raw.length - orders.length));
check('ids are unique', new Set(orders.map((o) => o.id)).size === orders.length);
check('statuses valid', orders.every((o) => STATUSES.includes(o.status)));
check('exactly 5 statuses', new Set(orders.map((o) => o.status)).size === 5);
check('regions valid', orders.every((o) => REGIONS.includes(o.region)));
check('exactly 6 regions', new Set(orders.map((o) => o.region)).size === 6);
check('channels valid', orders.every((o) => CHANNELS.includes(o.channel)));
check('payment methods valid', orders.every((o) => PAYMENT_METHODS.includes(o.paymentMethod)));
check('amounts are finite numbers', orders.every((o) => Number.isFinite(o.amount)));
check('amounts not negative', orders.every((o) => o.amount >= 0));
check('createdAt always parsed', orders.every((o) => o.createdAt > 0));
check('currency is INR', orders.every((o) => o.currency === 'INR'));
check('priority is 1, 2, 3 or null', orders.every((o) => [1, 2, 3, null].includes(o.priority)));
check('customer names present', orders.every((o) => o.customer.length > 0));
check('ids look like ORD- plus 7 digits', orders.every((o) => /^ORD-\d{7}$/.test(o.id)));
console.log(failed === 0 ? '\nAll checks passed' : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);