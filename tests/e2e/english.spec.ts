import { expect, test } from "@playwright/test";
import { setDates, setup, tripId } from "./fixtures";
// A browser that is not Hebrew gets the English site, left to right.
test.use({ locale: "en-US" });

test("an English browser gets the English site, and the switch is remembered", async ({
  page,
}) => {
  await setup(page, false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: /Your next trip/ }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Your whole trip/);
  await page
    .locator(".hero-photo")
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: "artifacts/home-desktop-en.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/home-mobile-en.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.getByRole("button", { name: "לעברית" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: /הטיול הבא שלכם/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await page.getByRole("button", { name: "Switch to English" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: /Your next trip/ }),
  ).toBeVisible();
});

test("a trip made on the English site is written in English", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/trip/new");
  await page.locator("[name=destination]").fill("Paris");
  await setDates(page, "2027-10-04", "2027-10-04");
  await page.getByRole("button", { name: "Create my trip" }).click();
  await page.locator("article.activity-card").first().waitFor();
  const generate = state.calls.find((c) => c.name === "generate-itinerary");
  expect(generate?.body).toMatchObject({ lang: "en", tripLang: "en" });
  await expect
    .poll(() => state.row.trip_data.metadata.language)
    .toBe("en");
  await page.screenshot({ path: "artifacts/trip-en.png", fullPage: true });
});

test("a Hebrew trip opened on the English site keeps its language", async ({
  page,
}) => {
  const state = await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/trip/" + tripId);
  await page.locator("article.activity-card").first().waitFor();
  // The site around the trip is English; the trip's own words stay Hebrew.
  await expect(page.getByLabel("What to change in the trip")).toBeVisible();
  await expect(page.locator(".activity-title").first()).toHaveText(
    "טיול בוקר לאורך הנהר",
  );
  await page.screenshot({ path: "artifacts/workspace-en.png" });
  await page.getByLabel("What to change in the trip").fill("Add a museum");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".refine-message.assistant")).toBeVisible();
  const refine = state.calls.find((c) => c.name === "refine-itinerary");
  // Errors come back in the site's language, new stops in the trip's.
  expect(refine?.body).toMatchObject({ lang: "en", tripLang: "he" });
  expect(state.row.trip_data.metadata.language).toBe("he");
});
