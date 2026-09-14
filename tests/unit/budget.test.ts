import { describe, expect, it } from "vitest";
import {
  addTraveler,
  balances,
  expenseShares,
  participants,
  pruneTravelerRefs,
  settleUp,
  totalsByCategory,
  totalsByDay,
  totalsByTraveler,
} from "@/lib/budget";
import { createPlan, normalizePlan } from "@/lib/trips";
import type { Expense, TripPlan } from "@/types/itinerary";

const travelers = [
  { id: "t1", name: "דנה" },
  { id: "t2", name: "יובל" },
  { id: "t3", name: "נועה" },
];
const expense = (over: Partial<Expense>): Expense => ({
  id: over.id || Math.random().toString(36).slice(2),
  label: "x",
  amount: 100,
  currency: "ILS",
  rate: 1,
  amountIls: 100,
  category: "restaurant",
  date: null,
  paidBy: null,
  split: { type: "equal", shares: {} },
  ...over,
});
const plan = (expenses: Expense[]): TripPlan => {
  const p = createPlan({
    destination: "רומא",
    startDate: "2026-10-04",
    endDate: "2026-10-06",
    travelers: 3,
  });
  return {
    ...p,
    metadata: { ...p.metadata, travelersList: travelers },
    expenses,
  };
};

describe("shares", () => {
  it("splits equally in whole agorot without losing a cent", () => {
    const s = expenseShares(expense({ amountIls: 100 }), travelers);
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBe(100);
    expect(s.t1).toBe(33.34);
    expect(s.t3).toBe(33.33);
  });
  it("respects listed participants and custom amounts", () => {
    expect(
      participants(
        expense({ split: { type: "equal", shares: { t2: 1 } } }),
        travelers,
      ),
    ).toEqual(["t2"]);
    const custom = expenseShares(
      expense({
        amount: 90,
        amountIls: 90,
        split: { type: "custom", shares: { t1: 60, t2: 30 } },
      }),
      travelers,
    );
    expect(custom).toEqual({ t1: 60, t2: 30 });
  });
  it("converts custom shares with the frozen rate", () => {
    const usd = expenseShares(
      expense({
        amount: 10,
        currency: "USD",
        rate: 3.3333,
        amountIls: 33.33,
        split: { type: "custom", shares: { t1: 5, t2: 5 } },
      }),
      travelers,
    );
    expect(usd.t1 + usd.t2).toBeCloseTo(33.33, 2);
  });
});

describe("balances and settle-up", () => {
  it("skips expenses nobody paid and nets the rest", () => {
    const p = plan([
      expense({ amountIls: 90, paidBy: "t1" }),
      expense({ amountIls: 30, paidBy: null }),
    ]);
    expect(balances(p)).toEqual({ t1: 60, t2: -30, t3: -30 });
    expect(settleUp(balances(p))).toEqual([
      { from: "t2", to: "t1", amount: 30 },
      { from: "t3", to: "t1", amount: 30 },
    ]);
  });
  it("produces at most n-1 transfers that cancel every balance", () => {
    const p = plan([
      expense({ amountIls: 120, paidBy: "t1" }),
      expense({
        amountIls: 45,
        paidBy: "t2",
        split: { type: "equal", shares: { t2: 1, t3: 1 } },
      }),
      expense({ amountIls: 10, paidBy: "t3" }),
    ]);
    const b = balances(p);
    const t = settleUp(b);
    expect(t.length).toBeLessThanOrEqual(2);
    const net: Record<string, number> = { t1: 0, t2: 0, t3: 0 };
    for (const x of t) {
      net[x.from] -= x.amount;
      net[x.to] += x.amount;
    }
    // Money that flows through the transfers equals each balance exactly.
    for (const id of Object.keys(b)) expect(net[id]).toBeCloseTo(b[id], 2);
  });
  it("is empty when everyone is even", () => {
    expect(settleUp({ t1: 0, t2: 0 })).toEqual([]);
  });
  it("summarises per traveler, category and day", () => {
    const p = plan([
      expense({ amountIls: 90, paidBy: "t1", date: "2026-10-04" }),
      expense({ amountIls: 30, paidBy: "t2", category: "transport" }),
    ]);
    const rows = totalsByTraveler(p);
    expect(rows[0]).toMatchObject({
      id: "t1",
      paid: 90,
      share: 40,
      balance: 50,
    });
    expect(totalsByCategory(p)).toEqual([
      { category: "restaurant", total: 90 },
      { category: "transport", total: 30 },
    ]);
    expect(totalsByDay(p)).toEqual([
      { date: "2026-10-04", total: 90 },
      { date: null, total: 30 },
    ]);
  });
});

describe("travelers", () => {
  it("adds with a fresh id and prunes references when someone leaves", () => {
    const more = addTraveler(travelers);
    expect(more[3].id).toBe("t4");
    const pruned = pruneTravelerRefs(
      [
        expense({
          paidBy: "t3",
          split: { type: "custom", shares: { t1: 50, t3: 50 } },
        }),
        expense({
          paidBy: "t1",
          split: { type: "equal", shares: { t1: 1, t3: 1 } },
        }),
      ],
      travelers.slice(0, 2),
    );
    expect(pruned[0].paidBy).toBeNull();
    expect(pruned[0].split).toEqual({ type: "equal", shares: {} });
    expect(pruned[1].split).toEqual({ type: "equal", shares: { t1: 1 } });
  });
  it("normalizes legacy trips idempotently", () => {
    const legacy = normalizePlan({
      version: 2,
      metadata: { destination: "x", travelers: 2 },
      days: [],
      expenses: [
        { id: "e1", label: "old", amount: 12.5, category: "restaurant" },
      ],
    });
    expect(legacy.metadata.travelersList).toEqual([
      { id: "t1", name: "מטייל 1" },
      { id: "t2", name: "מטייל 2" },
    ]);
    expect(legacy.expenses[0]).toMatchObject({
      currency: "ILS",
      rate: 1,
      amountIls: 12.5,
      paidBy: null,
      split: { type: "equal", shares: {} },
    });
    expect(normalizePlan(legacy)).toEqual(legacy);
    const renamed = normalizePlan({
      ...legacy,
      metadata: {
        ...legacy.metadata,
        travelers: 9,
        travelersList: [{ id: "t1", name: "דנה" }],
      },
      expenses: [
        {
          ...legacy.expenses[0],
          paidBy: "ghost",
          split: { type: "custom", shares: { t1: 5, t9: 7.5 } },
        },
      ],
    });
    expect(renamed.metadata.travelers).toBe(1);
    expect(renamed.expenses[0].paidBy).toBeNull();
    expect(renamed.expenses[0].split.type).toBe("equal");
  });
});
