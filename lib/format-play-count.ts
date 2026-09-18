/** 999 → "999", 1000 → "1K", 1500 → "1.5K", 12000 → "12K */
export function formatPlayCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) {
    const k = n / 1000;
    const rounded = Math.round(k * 10) / 10;
    return rounded % 1 === 0 ? `${rounded}K` : `${rounded}K`;
  }
  const k = Math.round(n / 1000);
  return `${k}K`;
}
