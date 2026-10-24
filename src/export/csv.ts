import type { Order } from '../data/types';
import { formatPayment, formatPriority, titleCase } from '../utils/format';

interface CsvColumn {
  label: string;
  text: boolean;
  value: (order: Order) => string;
}

const iso = (ms: number | null): string => (ms === null ? '' : new Date(ms).toISOString());

const CSV_COLUMNS: CsvColumn[] = [
  { label: 'Order ID', text: true, value: (o) => o.id },
  { label: 'Customer', text: true, value: (o) => o.customer },
  { label: 'Email', text: true, value: (o) => o.email },
  { label: 'Status', text: false, value: (o) => titleCase(o.status) },
  { label: 'Amount (INR)', text: false, value: (o) => o.amount.toFixed(2) },
  { label: 'Currency', text: false, value: (o) => o.currency },
  { label: 'Created (UTC)', text: false, value: (o) => iso(o.createdAt) },
  { label: 'Updated (UTC)', text: false, value: (o) => iso(o.updatedAt) },
  { label: 'Region', text: false, value: (o) => titleCase(o.region) },
  { label: 'Channel', text: false, value: (o) => titleCase(o.channel) },
  { label: 'Priority', text: false, value: (o) => formatPriority(o.priority) },
  { label: 'Payment', text: false, value: (o) => formatPayment(o.paymentMethod) },
  { label: 'Items', text: false, value: (o) => String(o.itemCount) },
  { label: 'Notes', text: true, value: (o) => o.notes },
];

export function escapeCell(value: string, guardFormulas: boolean): string {
  let text = value;
  if (guardFormulas && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildCsv(orders: Order[]): string {
  const lines: string[] = [CSV_COLUMNS.map((c) => escapeCell(c.label, false)).join(',')];
  for (const order of orders) {
    lines.push(CSV_COLUMNS.map((c) => escapeCell(c.value(order), c.text)).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}