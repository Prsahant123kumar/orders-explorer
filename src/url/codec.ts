import type { Order } from '../data/types';
import { parseDay, parseNumber } from '../filters/engine';
import { DATE_OPS, FIELD_BY_KEY, NUMBER_OPS, TEXT_OPS, newId } from '../filters/fields';
import type {
  Condition,
  DateField,
  DateOp,
  EnumField,
  FilterField,
  FilterState,
  Group,
  NumberField,
  NumberOp,
  TextField,
  TextOp,
} from '../filters/types';
import { COLUMNS } from '../grid/columns';
import type { SortState } from '../grid/sort';
import { decodeSelection, encodeSelection } from './selection';
export interface UrlState {
  groups: FilterState;
  sort: SortState | null;
  pinned: keyof Order | null;
  selected: Set<string>;
}

export interface ParseResult {
  state: UrlState;
  errors: string[];
}

const MAX_GROUPS = 20;
const MAX_CONDITIONS = 50;
const MAX_TEXT = 500;
const COLUMN_KEYS = new Set<string>(COLUMNS.map((c) => c.key));

function encodeCondition(condition: Condition): Record<string, unknown> {
  switch (condition.kind) {
    case 'text':
      return { f: condition.field, o: condition.op, v: condition.value };
    case 'number':
    case 'date':
      return condition.op === 'between'
        ? { f: condition.field, o: condition.op, v: condition.value, w: condition.value2 }
        : { f: condition.field, o: condition.op, v: condition.value };
    case 'enum':
      return { f: condition.field, in: condition.values };
  }
}

export function buildSearch(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.groups.length > 0) {
    params.set('f', JSON.stringify(state.groups.map((g) => g.conditions.map(encodeCondition))));
  }
  if (state.sort) params.set('sort', `${state.sort.key}:${state.sort.dir}`);
  if (state.pinned) params.set('pin', state.pinned);
  if (state.selected.size > 0) params.set('sel', encodeSelection(state.selected));
  const text = params.toString().replace(/%2C/gi, ',');
  return text ? `?${text}` : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shortString(value: unknown): string | null {
  return typeof value === 'string' && value.length <= MAX_TEXT ? value : null;
}

function decodeCondition(raw: unknown): Condition | null {
  if (!isRecord(raw) || typeof raw.f !== 'string') return null;
  const def = FIELD_BY_KEY.get(raw.f as FilterField);
  if (!def) return null;

  if (def.kind === 'enum') {
    const list = raw.in;
    if (!Array.isArray(list) || list.length > def.options.length) return null;
    const allowed = new Set(def.options.map((o) => o.value));
    const values: string[] = [];
    for (const item of list) {
      if (typeof item !== 'string' || !allowed.has(item)) return null;
      if (!values.includes(item)) values.push(item);
    }
    return { id: newId(), kind: 'enum', field: def.key as EnumField, values };
  }

  const op = raw.o;
  const value = shortString(raw.v);
  if (value === null) return null;

  if (def.kind === 'text') {
    if (!TEXT_OPS.some((o) => o.value === op)) return null;
    return { id: newId(), kind: 'text', field: def.key as TextField, op: op as TextOp, value };
  }

  const value2 = op === 'between' ? shortString(raw.w) : '';
  if (value2 === null) return null;

  if (def.kind === 'number') {
    if (!NUMBER_OPS.some((o) => o.value === op)) return null;
    if (value !== '' && parseNumber(value) === null) return null;
    if (value2 !== '' && parseNumber(value2) === null) return null;
    return {
      id: newId(),
      kind: 'number',
      field: def.key as NumberField,
      op: op as NumberOp,
      value,
      value2,
    };
  }

  if (!DATE_OPS.some((o) => o.value === op)) return null;
  if (value !== '' && parseDay(value) === null) return null;
  if (value2 !== '' && parseDay(value2) === null) return null;
  return {
    id: newId(),
    kind: 'date',
    field: def.key as DateField,
    op: op as DateOp,
    value,
    value2,
  };
}

function decodeFilter(text: string): Group[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length > MAX_GROUPS) return null;

  const groups: Group[] = [];
  for (const rawGroup of data) {
    if (!Array.isArray(rawGroup) || rawGroup.length === 0 || rawGroup.length > MAX_CONDITIONS) {
      return null;
    }
    const conditions: Condition[] = [];
    for (const rawCondition of rawGroup) {
      const condition = decodeCondition(rawCondition);
      if (!condition) return null;
      conditions.push(condition);
    }
    groups.push({ id: newId(), conditions });
  }
  return groups;
}

function decodeSort(text: string): SortState | null {
  const parts = text.split(':');
  if (parts.length !== 2) return null;
  const [key, dir] = parts;
  if (!COLUMN_KEYS.has(key)) return null;
  if (dir === 'asc' || dir === 'desc') return { key: key as keyof Order, dir };
  return null;
}

export function parseSearch(search: string): ParseResult {
  const errors: string[] = [];
  let groups: FilterState = [];
  let sort: SortState | null = null;
  let pinned: keyof Order | null = null;
  let selected = new Set<string>();

  try {
    const params = new URLSearchParams(search);

    const f = params.get('f');
    if (f !== null) {
      const decoded = decodeFilter(f);
      if (decoded) groups = decoded;
      else errors.push('The filter in the link could not be read, so no filter was applied.');
    }

    const s = params.get('sort');
    if (s !== null) {
      const decoded = decodeSort(s);
      if (decoded) sort = decoded;
      else errors.push('The sort in the link is not valid, so the default order is used.');
    }

    const p = params.get('pin');
    if (p !== null) {
      if (COLUMN_KEYS.has(p)) pinned = p as keyof Order;
    else errors.push('The pinned column in the link is not valid, so no column is pinned.');
    }

    const sel = params.get('sel');
    if (sel !== null) {
      const decoded = decodeSelection(sel);
      if (decoded) selected = decoded;
      else errors.push('The selected rows in the link could not be read, so nothing is selected.');
    }
  } catch {
    errors.push('The link could not be read, so the default view is shown.');
    groups = [];
    sort = null;
    pinned = null;
    selected = new Set();
  }

   return { state: { groups, sort, pinned, selected }, errors };
}