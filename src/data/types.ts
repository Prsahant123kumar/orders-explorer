export type Status = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type Region = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL' | 'NORTHEAST';
export type Channel = 'web' | 'app' | 'phone' | 'store';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';
export type Priority = 1 | 2 | 3 | null; // null is shown as "None"

export const STATUSES: Status[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export const REGIONS: Region[] = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST'];
export const CHANNELS: Channel[] = ['web', 'app', 'phone', 'store'];
export const PAYMENT_METHODS: PaymentMethod[] = ['upi', 'card', 'netbanking', 'cod', 'wallet'];

/** Shape in the file. Loose on purpose, because the data is messy. */
export interface RawOrder {
  id: string;
  schemaVersion: 1 | 2;
  customerName?: string;
  customer_name?: string;
  customerEmail?: string;
  status?: string;
  amount?: number | string;
  currency?: string;
  createdAt?: string | number;
  updatedAt?: string | number | null;
  region?: string;
  channel?: string;
  priority?: number | null;
  paymentMethod?: string;
  itemCount?: number;
  notes?: string | null;
}

/** Clean shape used everywhere in the app. */
export interface Order {
  id: string;
  customer: string;
  email: string;
  status: Status;
  amount: number; // rupees
  currency: string;
  createdAt: number; // epoch ms
  updatedAt: number | null; // epoch ms, null = none
  region: Region;
  channel: Channel;
  priority: Priority;
  paymentMethod: PaymentMethod;
  itemCount: number;
  notes: string;
}