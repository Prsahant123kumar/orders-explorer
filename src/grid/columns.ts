import type { Order } from '../data/types';
import { formatAmount, formatDate, formatPayment, formatPriority, titleCase } from '../utils/format';

export type ColumnType = 'text' | 'number' | 'date' | 'enum';

export interface Column {
  key: keyof Order;
  label: string;
  width: number;
  type: ColumnType;
  align: 'left' | 'right';
  format: (order: Order) => string;
}

export const COLUMNS: Column[] = [
  { key: 'id', label: 'Order ID', width: 120, type: 'text', align: 'left', format: (o) => o.id },
  { key: 'customer', label: 'Customer', width: 170, type: 'text', align: 'left', format: (o) => o.customer },
  { key: 'email', label: 'Email', width: 220, type: 'text', align: 'left', format: (o) => o.email },
  { key: 'status', label: 'Status', width: 100, type: 'enum', align: 'left', format: (o) => titleCase(o.status) },
  { key: 'amount', label: 'Amount', width: 130, type: 'number', align: 'right', format: (o) => formatAmount(o.amount) },
  { key: 'createdAt', label: 'Created (UTC)', width: 140, type: 'date', align: 'left', format: (o) => formatDate(o.createdAt) },
  { key: 'updatedAt', label: 'Updated (UTC)', width: 140, type: 'date', align: 'left', format: (o) => formatDate(o.updatedAt) },
  { key: 'region', label: 'Region', width: 100, type: 'enum', align: 'left', format: (o) => titleCase(o.region) },
  { key: 'channel', label: 'Channel', width: 90, type: 'enum', align: 'left', format: (o) => titleCase(o.channel) },
  { key: 'priority', label: 'Priority', width: 80, type: 'enum', align: 'left', format: (o) => formatPriority(o.priority) },
  { key: 'paymentMethod', label: 'Payment', width: 110, type: 'enum', align: 'left', format: (o) => formatPayment(o.paymentMethod) },
  { key: 'itemCount', label: 'Items', width: 70, type: 'number', align: 'right', format: (o) => String(o.itemCount) },
  { key: 'notes', label: 'Notes', width: 300, type: 'text', align: 'left', format: (o) => o.notes.replace(/\s+/g, ' ') },
];

export const MIN_COLUMN_WIDTH = 50;

export function defaultWidths(): number[] {
  return COLUMNS.map((c) => c.width);
}

export function buildTemplate(widths: number[]): string {
  return widths.map((w) => `${w}px`).join(' ');
}

export function sumWidths(widths: number[]): number {
  return widths.reduce((sum, w) => sum + w, 0);
}