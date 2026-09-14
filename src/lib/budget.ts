import { categories, dateOnly, round2 } from "./trips";
import type { Category, Expense, Traveler, TripPlan } from "@/types/itinerary";
export const CURRENCIES = [
  "ILS",
  "USD",
  "EUR",
  "GBP",
  "THB",
  "JPY",
  "TRY",
  "CHF",
  "CZK",
  "PLN",
  "HUF",
  "INR",
] as const;
export const currencyLabels: Record<string, string> = {
  ILS: "₪ שקל",
  USD: "$ דולר",
  EUR: "€ אירו",
  GBP: "£ לירה שטרלינג",
  THB: "฿ באט תאילנדי",
  JPY: "¥ ין יפני",
  TRY: "₺ לירה טורקית",
  CHF: "פרנק שוויצרי",
  CZK: "כתר צ'כי",
  PLN: "זלוטי",
  HUF: "פורינט",
  INR: "₹ רופי",
};
export const toIls = (amount: number, rate: number) => round2(amount * rate);
/** Who shares an expense: the listed participants, or everyone. */
export function participants(e: Expense, travelers: Traveler[]): string[] {
  const ids = travelers.map((t) => t.id);
  const listed = Object.keys(e.split.shares).filter((id) => ids.includes(id));
  return listed.length ? listed : ids;
}
/** ILS owed per traveler, in whole agorot so the parts always add up. */
export function expenseShares(
  e: Expense,
  travelers: Traveler[],
): Record<string, number> {
  const who = participants(e, travelers);
  if (!who.length) return {};
  const total = Math.round(e.amountIls * 100);
  if (e.split.type === "custom") {
    const raw = who.map((id) =>
      Math.round((e.split.shares[id] || 0) * e.rate * 100),
    );
    const drift = total - raw.reduce((n, v) => n + v, 0);
    const largest = raw.indexOf(Math.max(...raw));
    raw[largest] += drift;
    return Object.fromEntries(who.map((id, i) => [id, raw[i] / 100]));
  }
  const base = Math.floor(total / who.length),
    remainder = total - base * who.length;
  return Object.fromEntries(
    who.map((id, i) => [id, (base + (i < remainder ? 1 : 0)) / 100]),
  );
}
/** Positive = is owed money, negative = owes. Unpaid-by expenses are skipped. */
export function balances(plan: TripPlan): Record<string, number> {
  const travelers = plan.metadata.travelersList;
  const out: Record<string, number> = Object.fromEntries(
    travelers.map((t) => [t.id, 0]),
  );
  for (const e of plan.expenses) {
    if (!e.paidBy || !(e.paidBy in out)) continue;
    out[e.paidBy] += e.amountIls;
    for (const [id, share] of Object.entries(expenseShares(e, travelers)))
      out[id] -= share;
  }
  for (const id of Object.keys(out)) out[id] = round2(out[id]);
  return out;
}
export interface Transfer {
  from: string;
  to: string;
  amount: number;
}
/**
 * Greedy creditor/debtor matching: at most n-1 transfers. The true minimum
 * number of transfers is NP-hard and not worth it for a travel group.
 */
export function settleUp(balance: Record<string, number>): Transfer[] {
  const creditors = Object.entries(balance)
    .map(([id, v]) => [id, Math.round(v * 100)] as [string, number])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const debtors = Object.entries(balance)
    .map(([id, v]) => [id, -Math.round(v * 100)] as [string, number])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const transfers: Transfer[] = [];
  let i = 0,
    j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i][1], debtors[j][1]);
    if (amount >= 1)
      transfers.push({
        from: debtors[j][0],
        to: creditors[i][0],
        amount: amount / 100,
      });
    creditors[i][1] -= amount;
    debtors[j][1] -= amount;
    if (creditors[i][1] < 1) i++;
    if (debtors[j][1] < 1) j++;
  }
  return transfers;
}
export function totalsByTraveler(plan: TripPlan) {
  const travelers = plan.metadata.travelersList;
  const paid: Record<string, number> = {},
    share: Record<string, number> = {};
  for (const t of travelers) {
    paid[t.id] = 0;
    share[t.id] = 0;
  }
  for (const e of plan.expenses) {
    if (e.paidBy && e.paidBy in paid) paid[e.paidBy] += e.amountIls;
    for (const [id, v] of Object.entries(expenseShares(e, travelers)))
      if (id in share) share[id] += v;
  }
  const balance = balances(plan);
  return travelers.map((t) => ({
    id: t.id,
    name: t.name,
    paid: round2(paid[t.id]),
    share: round2(share[t.id]),
    balance: balance[t.id],
  }));
}
export function totalsByCategory(plan: TripPlan) {
  const out: Partial<Record<Category, number>> = {};
  for (const e of plan.expenses)
    out[e.category] = round2((out[e.category] || 0) + e.amountIls);
  return (Object.keys(categories) as Category[])
    .filter((c) => out[c])
    .map((c) => ({ category: c, total: out[c]! }));
}
export function totalsByDay(plan: TripPlan) {
  const out = new Map<string | null, number>();
  for (const e of plan.expenses)
    out.set(e.date, round2((out.get(e.date) || 0) + e.amountIls));
  return Array.from(out, ([date, total]) => ({ date, total })).sort((a, b) =>
    a.date === null ? 1 : b.date === null ? -1 : a.date.localeCompare(b.date),
  );
}
export function addTraveler(list: Traveler[]): Traveler[] {
  if (list.length >= 20) return list;
  let n = list.length + 1;
  while (list.some((t) => t.id === `t${n}`)) n++;
  return [...list, { id: `t${n}`, name: `מטייל ${list.length + 1}` }];
}
/** Forget references to travelers who left; their expenses become "unpaid by". */
export function pruneTravelerRefs(
  expenses: Expense[],
  list: Traveler[],
): Expense[] {
  const ids = new Set(list.map((t) => t.id));
  return expenses.map((e) => {
    const paidBy = e.paidBy && ids.has(e.paidBy) ? e.paidBy : null;
    const shares = Object.fromEntries(
      Object.entries(e.split.shares).filter(([k]) => ids.has(k)),
    );
    const split =
      e.split.type === "custom" &&
      Object.keys(shares).length !== Object.keys(e.split.shares).length
        ? { type: "equal" as const, shares: {} }
        : { type: e.split.type, shares };
    return paidBy === e.paidBy &&
      split.type === e.split.type &&
      Object.keys(split.shares).length === Object.keys(e.split.shares).length
      ? e
      : { ...e, paidBy, split };
  });
}
/** Suggested date for a new expense: the linked stop's day, else the trip start. */
export function suggestedExpenseDate(
  plan: TripPlan,
  activityId: string,
  dayDate: (start: string | null, index: number) => string | null,
) {
  const day = plan.days.find((d) =>
    d.activities.some((a) => a.id === activityId),
  );
  return (
    (day && dayDate(plan.metadata.startDate, day.day_number - 1)) ||
    dateOnly(plan.metadata.startDate) ||
    new Date().toISOString().slice(0, 10)
  );
}
