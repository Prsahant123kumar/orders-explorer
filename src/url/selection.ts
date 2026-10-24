const ID_PATTERN = /^ORD-(\d{1,15})$/;
const PART_PATTERN = /^(\d{1,9})(?:-(\d{1,9}))?$/;
const ID_WIDTH = 7;
const MAX_IDS = 100_000;

function formatId(n: number): string {
  return `ORD-${String(n).padStart(ID_WIDTH, '0')}`;
}

export function encodeSelection(ids: Set<string>): string {
  const numbers: number[] = [];
  for (const id of ids) {
    const match = ID_PATTERN.exec(id);
    if (match) numbers.push(Number(match[1]));
  }
  numbers.sort((a, b) => a - b);

  const parts: string[] = [];
  let i = 0;
  while (i < numbers.length) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;
    parts.push(j > i ? `${numbers[i]}-${numbers[j]}` : String(numbers[i]));
    i = j + 1;
  }
  return parts.join(',');
}

export function decodeSelection(text: string): Set<string> | null {
  const result = new Set<string>();
  if (text === '') return result;

  const parts = text.split(',');
  if (parts.length > MAX_IDS) return null;

  for (const part of parts) {
    const match = PART_PATTERN.exec(part);
    if (!match) return null;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    if (to < from || to - from >= MAX_IDS) return null;
    for (let n = from; n <= to; n++) {
      result.add(formatId(n));
      if (result.size > MAX_IDS) return null;
    }
  }
  return result;
}