import { expect, test } from "@playwright/test";
import { setup } from "./fixtures";
type MediaReport = {
  className: string;
  revealed: boolean;
  clipPath: string;
  width: number;
  height: number;
  square: boolean;
  imageLoaded: boolean;
  wipeIsWired: boolean;
};
// Every framed image on the page: was it revealed, is it clipped away, did it
// keep its ratio, and did the file actually load.
const mediaReport = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () =>
      [
        ...document.querySelectorAll(
          ".media-frame, .destination-media, .feature-media, .trip-card-photo",
        ),
      ].map((el) => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const image = el.querySelector("img");
        return {
          className: el.className.toString(),
          // A frame that never waits to be revealed counts as revealed.
          revealed: el.hasAttribute("data-reveal")
            ? el.hasAttribute("data-revealed")
            : true,
          clipPath: style.clipPath,
          width: Math.round(box.width),
          height: Math.round(box.height),
          square: style.aspectRatio === "1 / 1",
          imageLoaded: !!image && image.naturalWidth > 0,
          // A wipe only plays for an element the reveal observer watches.
          wipeIsWired:
            !el.classList.contains("wipe") || el.hasAttribute("data-reveal"),
        } satisfies MediaReport;
      }),
  );
const scrollThrough = async (page: import("@playwright/test").Page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
};
const expectUsableMedia = (media: MediaReport[]) => {
  expect(media.length).toBeGreaterThan(0);
  for (const item of media) {
    expect(item, `${item.className} was never revealed`).toMatchObject({
      revealed: true,
      imageLoaded: true,
      wipeIsWired: true,
    });
    // The reveal wipe clips from the side; left behind, it hides the photo.
    expect(item.clipPath, `${item.className} stayed clipped`).not.toContain(
      "100%",
    );
    if (item.square)
      expect(
        Math.abs(item.width - item.height),
        `${item.className} lost its square ratio`,
      ).toBeLessThanOrEqual(1);
  }
};
test("home page photos reveal, load and keep their ratio", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push("page error: " + e.message));
  page.on("requestfailed", (r) =>
    failures.push(`request failed: ${r.url()} (${r.failure()?.errorText})`),
  );
  await setup(page, false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".hero-photo")).toBeVisible();
  await scrollThrough(page);
  expectUsableMedia(await mediaReport(page));
  await page.setViewportSize({ width: 390, height: 844 });
  await scrollThrough(page);
  expectUsableMedia(await mediaReport(page));
  expect(failures).toEqual([]);
});
test("saved trip covers reveal and stay square", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/my-trips");
  await expect(page.locator(".saved-trip-card img")).toHaveCount(1);
  await scrollThrough(page);
  expectUsableMedia(await mediaReport(page));
});
test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("leaves no revealed content hidden", async ({ page }) => {
    await setup(page, false);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await scrollThrough(page);
    expectUsableMedia(await mediaReport(page));
    // Reduced motion keeps the fade, so everything must end fully opaque.
    const faded = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-reveal]")].filter(
          (el) => getComputedStyle(el).opacity !== "1",
        ).length,
    );
    expect(faded).toBe(0);
  });
});
