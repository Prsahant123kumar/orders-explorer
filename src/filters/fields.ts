import { CHANNELS, PAYMENT_METHODS, REGIONS, STATUSES } from '../data/types';
import { formatPayment, titleCase } from '../utils/format';
import type {
  Condition,
  DateField,
  DateOp,
  EnumField,
  FilterField,
  Group,
  NumberField,
  NumberOp,
  TextField,
  TextOp,
} from './types';

export type FieldKind = 'text' | 'number' | 'date' | 'enum';

export interface EnumOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: FilterField;
  label: string;
  kind: FieldKind;
  options: EnumOption[];
}

const NO_OPTIONS: EnumOption[] = [];

export const FIELDS: FieldDef[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'enum',
    options: STATUSES.map((v) => ({ value: v, label: titleCase(v) })),
  },
  { key: 'amount', label: 'Amount', kind: 'number', options: NO_OPTIONS },
  { key: 'createdAt', label: 'Created', kind: 'date', options: NO_OPTIONS },
  {
    key: 'region',
    label: 'Region',
    kind: 'enum',
    options: REGIONS.map((v) => ({ value: v, label: titleCase(v) })),
  },
  {
    key: 'channel',
    label: 'Channel',
    kind: 'enum',
    options: CHANNELS.map((v) => ({ value: v, label: titleCase(v) })),
  },
  {
    key: 'paymentMethod',
    label: 'Payment',
    kind: 'enum',
    options: PAYMENT_METHODS.map((v) => ({ value: v, label: formatPayment(v) })),
  },
  {
    key: 'priority',
    label: 'Priority',
    kind: 'enum',
    options: [
      { value: '1', label: '1 (highest)' },
      { value: '2', label: '2' },
      { value: '3', label: '3 (lowest)' },
      { value: 'none', label: 'None' },
    ],
  },
  { key: 'customer', label: 'Customer', kind: 'text', options: NO_OPTIONS },
  { key: 'email', label: 'Email', kind: 'text', options: NO_OPTIONS },
  { key: 'id', label: 'Order ID', kind: 'text', options: NO_OPTIONS },
  { key: 'notes', label: 'Notes', kind: 'text', options: NO_OPTIONS },
  { key: 'itemCount', label: 'Items', kind: 'number', options: NO_OPTIONS },
  { key: 'updatedAt', label: 'Updated', kind: 'date', options: NO_OPTIONS },
];

export const FIELD_BY_KEY = new Map<FilterField, FieldDef>(FIELDS.map((f) => [f.key, f]));

export const TEXT_OPS: { value: TextOp; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'does not contain' },
  { value: 'equals', label: 'equals' },
];

export const NUMBER_OPS: { value: NumberOp; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'between', label: 'between' },
];

export const DATE_OPS: { value: DateOp; label: string }[] = [
  { value: 'before', label: 'before' },
  { value: 'after', label: 'after' },
  { value: 'between', label: 'between' },
];

let counter = 0;

export function newId(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}`;
}

export function createCondition(field: FilterField): Condition {
  const def = FIELD_BY_KEY.get(field);
  const kind = def ? def.kind : 'text';
  switch (kind) {
    case 'text':
      return { id: newId(), kind, field: field as TextField, op: 'contains', value: '' };
    case 'number':
      return { id: newId(), kind, field: field as NumberField, op: 'eq', value: '', value2: '' };
    case 'date':
      return { id: newId(), kind, field: field as DateField, op: 'before', value: '', value2: '' };
    case 'enum':
      return { id: newId(), kind, field: field as EnumField, values: [] };
  }
}

export function createGroup(): Group {
  return { id: newId(), conditions: [createCondition('status')] };
}