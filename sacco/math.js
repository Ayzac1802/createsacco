/**
 * math.js
 * Money helpers using integer smallest-unit (cents) representation.
 *
 * Conventions:
 * - All amounts stored in DB and passed between modules are integer cents (e.g., 2000000 means 20,000.00).
 * - Display formatting is handled at the UI layer using fromCents.
 */

export function toCents(amount) {
  // Accept number or string decimal like "20000" or "20000.50"
  if (amount == null) return 0;
  if (Number.isInteger(amount)) return amount;
  const n = Number(amount);
  if (Number.isNaN(n)) throw new Error('Invalid amount');
  // Multiply by 100 and round to nearest integer
  return Math.round(n * 100);
}

export function fromCents(cents, decimals = 2) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}${whole}.${frac}`;
}

export function addCents(a, b) {
  return Number(a) + Number(b);
}

export function subCents(a, b) {
  return Number(a) - Number(b);
}

export function sumCents(items = [], selector = (i) => i.amount) {
  return items.reduce((acc, it) => acc + Number(selector(it) || 0), 0);
}
