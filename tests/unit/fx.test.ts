import { describe, expect, it } from "vitest";
import { ilsRate } from "@/lib/fx";

const fetchWith = (status: number, body: unknown) =>
  (() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    )) as typeof fetch;

describe("ilsRate", () => {
  it("short-circuits for shekels", async () => {
    let called = false;
    const r = await ilsRate("ILS", (() => {
      called = true;
      return Promise.reject(new Error("no"));
    }) as typeof fetch);
    expect(r.rate).toBe(1);
    expect(called).toBe(false);
  });
  it("inverts the ILS-based sheet from the provider", async () => {
    const r = await ilsRate(
      "USD",
      fetchWith(200, {
        base: "ILS",
        date: "2026-09-11",
        rates: { USD: 0.32838 },
      }),
    );
    expect(r.date).toBe("2026-09-11");
    expect(r.rate).toBeCloseTo(3.0452, 3);
  });
  it("explains failures in Hebrew instead of throwing raw errors", async () => {
    await expect(ilsRate("EUR", fetchWith(500, {}))).rejects.toThrow(/שער/);
    await expect(
      ilsRate("EUR", fetchWith(200, { date: "2026-09-11", rates: {} })),
    ).rejects.toThrow(/מטבע/);
  });
});
