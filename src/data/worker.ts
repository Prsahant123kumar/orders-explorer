import { dedupeById } from './dedupe';
import { normalizeOrder } from './normalize';
import type { RawOrder } from './types';

self.onmessage = async (event: MessageEvent<{ url: string }>) => {
  try {
    const response = await fetch(event.data.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = (await response.json()) as RawOrder[];
    const orders = dedupeById(raw.map(normalizeOrder));
    self.postMessage({ type: 'done', orders, rawCount: raw.length });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
};