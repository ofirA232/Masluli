import { describe, expect, it } from "vitest";
import {
  bookingLink,
  bookingSearchUrl,
  gygSearchUrl,
} from "@/lib/booking-links";

const meta = {
  destination: "פריז, צרפת",
  startDate: "2026-10-04",
  endDate: "2026-10-06",
  travelers: 2,
};
const ids = { bookingAid: "123", gygPartnerId: "ABC" };

describe("bookingSearchUrl", () => {
  it("builds a dated search with the affiliate id", () => {
    expect(bookingSearchUrl(meta, "123")).toBe(
      "https://www.booking.com/searchresults.html?ss=%D7%A4%D7%A8%D7%99%D7%96%2C+%D7%A6%D7%A8%D7%A4%D7%AA&checkin=2026-10-04&checkout=2026-10-06&group_adults=2&no_rooms=1&aid=123",
    );
  });
  it("omits dates and the id when they are missing, and bumps a same-day checkout", () => {
    expect(bookingSearchUrl({ ...meta, startDate: null, endDate: null })).toBe(
      "https://www.booking.com/searchresults.html?ss=%D7%A4%D7%A8%D7%99%D7%96%2C+%D7%A6%D7%A8%D7%A4%D7%AA&group_adults=2&no_rooms=1",
    );
    expect(bookingSearchUrl({ ...meta, endDate: "2026-10-04" })).toContain(
      "checkout=2026-10-05",
    );
    expect(bookingSearchUrl({ ...meta, destination: "  " })).toBeUndefined();
  });
});

describe("gygSearchUrl", () => {
  it("joins the place and destination and encodes them", () => {
    expect(gygSearchUrl("Louvre Museum", "פריז", "ABC")).toBe(
      "https://www.getyourguide.com/s/?q=Louvre+Museum+%D7%A4%D7%A8%D7%99%D7%96&partner_id=ABC",
    );
    expect(gygSearchUrl("Louvre", "פריז")).not.toContain("partner_id");
  });
});

describe("bookingLink", () => {
  it("routes by stop kind", () => {
    expect(
      bookingLink(
        { name: "מלון", category: "accommodation" },
        meta,
        undefined,
        ids,
      )?.provider,
    ).toBe("booking");
    expect(
      bookingLink(
        { name: "לובר", category: "attraction" },
        meta,
        undefined,
        ids,
      )?.provider,
    ).toBe("gyg");
    expect(
      bookingLink(
        { name: "מופע", category: "entertainment" },
        meta,
        undefined,
        ids,
      )?.provider,
    ).toBe("gyg");
    expect(
      bookingLink(
        { name: "מסעדה", category: "restaurant" },
        meta,
        "https://bistro.example",
        ids,
      ),
    ).toEqual({
      href: "https://bistro.example",
      provider: "website",
      label: "אתר המקום",
    });
    expect(
      bookingLink(
        { name: "מסעדה", category: "restaurant" },
        meta,
        undefined,
        ids,
      ),
    ).toBeUndefined();
  });
  it("never offers a link for transport legs", () => {
    expect(
      bookingLink(
        {
          name: "טיסה",
          category: "transport",
          transport: {
            mode: "flight",
            from: "",
            to: "",
            depart_time: "",
            arrive_time: "",
            arrive_day_offset: 0,
            carrier: "",
            booking_ref: "",
          },
        },
        meta,
        undefined,
        ids,
      ),
    ).toBeUndefined();
  });
});
