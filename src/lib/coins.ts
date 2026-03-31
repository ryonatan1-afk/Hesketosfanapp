const KEY = "hesketos_coins";
export const COINS_EVENT = "hesketos_coins_changed";

export function getCoins(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) ?? "0", 10) || 0;
}

export function addCoins(n: number): number {
  const next = getCoins() + n;
  localStorage.setItem(KEY, String(next));
  window.dispatchEvent(new CustomEvent(COINS_EVENT, { detail: next }));
  return next;
}
