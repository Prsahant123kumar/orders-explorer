export type TextField = 'id' | 'customer' | 'email' | 'notes';
export type NumberField = 'amount' | 'itemCount';
export type DateField = 'createdAt' | 'updatedAt';
export type EnumField = 'status' | 'region' | 'channel' | 'paymentMethod' | 'priority';
export type FilterField = TextField | NumberField | DateField | EnumField;

export type TextOp = 'contains' | 'notContains' | 'equals';
export type NumberOp = 'eq' | 'gt' | 'lt' | 'between';
export type DateOp = 'before' | 'after' | 'between';

export interface TextCondition {
  id: string;
  kind: 'text';
  field: TextField;
  op: TextOp;
  value: string;
}

export interface NumberCondition {
  id: string;
  kind: 'number';
  field: NumberField;
  op: NumberOp;
  value: string;
  value2: string;
}

export interface DateCondition {
  id: string;
  kind: 'date';
  field: DateField;
  op: DateOp;
  value: string;
  value2: string;
}

export interface EnumCondition {
  id: string;
  kind: 'enum';
  field: EnumField;
  values: string[];
}

export type Condition = TextCondition | NumberCondition | DateCondition | EnumCondition;

export interface Group {
  id: string;
  conditions: Condition[];
}

export type FilterState = Group[];