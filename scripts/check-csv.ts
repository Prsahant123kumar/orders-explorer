import { readFileSync } from 'node:fs';
import { dedupeById } from '../src/data/dedupe';
import { normalizeOrder } from '../src/data/normalize';
import type { RawOrder } from '../src/data/types';
import { buildCsv, escapeCell } from '../src/export/csv';

let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

function countRecords(csv: string): number {
  let records = 0;
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') i++;
      else inQuotes = !inQuotes;
    } else if (ch === '\n' && !inQuotes) {
      records++;
    }
  }
  return records;
}

check('comma is quoted', escapeCell('a,b', false) === '"a,b"');
check('quote is doubled', escapeCell('say "hi"', false) === '"say ""hi"""');
check('newline is quoted', escapeCell('a\nb', false) === '"a\nb"');
check('formula is guarded', escapeCell('=SUM(A1)', true) === "'=SUM(A1)");
check('plus is guarded', escapeCell('+91 98', true) === "'+91 98");
check('formula not guarded in non text', escapeCell('-5', false) === '-5');
check('plain text untouched', escapeCell('Asha', true) === 'Asha');

const raw = JSON.parse(readFileSync('public/orders.json', 'utf8')) as RawOrder[];
const orders = dedupeById(raw.map(normalizeOrder));
const hardest = orders.filter((o) => /[",\r\n]/.test(o.notes)).slice(0, 200);
const sample = [...hardest, ...orders.slice(0, 200)];
const csv = buildCsv(sample);

check('one record per order plus header', countRecords(csv) === sample.length + 1,
  `${countRecords(csv)} records for ${sample.length} orders`);
check('all 50000 orders export cleanly', countRecords(buildCsv(orders)) === orders.length + 1);
check('no raw script tags are altered into HTML', !csv.includes('undefined'));

console.log(failed === 0 ? '\nAll checks passed' : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);