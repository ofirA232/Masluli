import { expect, test } from "@playwright/test";
import { setup, tripId } from "./fixtures";
test("homepage and mobile layout remain usable", async ({ page }) => {
  await setup(page, false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /הטיול הבא שלכם/ }),
  ).toBeVisible();
  await page
    .locator(".hero-photo")
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "פתיחת תפריט" }).click();
  await expect(
    page.getByRole("navigation", { name: "ניווט ראשי" }),
  ).toBeVisible();
});
test("manual creation, autosave, movement, budget and reload", async ({
  page,
}) => {
  const state = await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/trip/new");
  await page.locator("[name=destination]").fill("פריז");
  await page.locator("[name=startDate]").fill("2026-10-04");
  await page.locator("[name=endDate]").fill("2026-10-06");
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "יוצרים את הטיול שלי" }).click();
  await expect(page).toHaveURL(new RegExp("/trip/" + tripId));
  await page.getByRole("button", { name: "הוספת תחנה", exact: true }).click();
  await page.getByLabel("שם הפעילות").fill("בית קפה ליד הנהר");
  await page.getByLabel("עלות מינימלית").fill("50");
  await page.getByLabel("עלות מקסימלית").fill("70");
  await page.getByRole("button", { name: "הוספה למסלול", exact: true }).click();
  await expect
    .poll(() => state.row.trip_data.days[0].activities.length)
    .toBe(1);
  await page.getByLabel("העברת בית קפה ליד הנהר ליום אחר").selectOption("2");
  await expect
    .poll(() => state.row.trip_data.days[1].activities.length)
    .toBe(1);
  await page
    .locator(".day-chips")
    .getByRole("button", { name: "יום 2", exact: true })
    .click();
  await expect(page.locator(".activity-title")).toHaveText("בית קפה ליד הנהר");
  await page.screenshot({
    path: "artifacts/editor-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".trip-sidebar")
    .getByRole("button", { name: "תקציב והוצאות" })
    .click();
  await expect(page.locator(".budget-stats")).toContainText("100");
  await page.getByLabel("על מה הוצאתם?").fill("קפה ועוגה");
  await page.getByLabel("סכום הוצאה").fill("65");
  await page.getByRole("button", { name: "הוספת הוצאה", exact: true }).click();
  await expect.poll(() => state.row.trip_data.expenses.length).toBe(1);
  await page.reload();
  await page
    .locator(".trip-sidebar")
    .getByRole("button", { name: "תקציב והוצאות" })
    .click();
  await expect(page.locator(".expense-row")).toContainText("קפה ועוגה");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("תצוגת טיול").selectOption("itinerary");
  await page
    .locator(".day-chips")
    .getByRole("button", { name: "יום 2", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/editor-mobile.png",
    fullPage: true,
  });
  const shareBounds = await page
    .getByRole("button", { name: "שיתוף", exact: true })
    .boundingBox();
  expect(shareBounds?.x).toBeGreaterThanOrEqual(0);
  expect((shareBounds?.x || 0) + (shareBounds?.width || 0)).toBeLessThanOrEqual(
    390,
  );
  await page
    .locator(".mobile-trip-tabs")
    .getByRole("button", { name: "מפה", exact: true })
    .click();
  await expect(page.locator(".map-message")).toBeVisible();
});
test("AI generation renders before optional provider enrichment", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/trip/new");
  await page.locator("[name=destination]").fill("פריז");
  await page.locator("[name=startDate]").fill("2026-10-04");
  await page.locator("[name=endDate]").fill("2026-10-04");
  await page.getByRole("button", { name: "יוצרים את הטיול שלי" }).click();
  await expect(page.locator(".activity-title")).toHaveText("הצעת AI ליום 1");
  await expect(page.locator(".verification-note")).toContainText(
    "עדיין לא אומת",
  );
  await expect
    .poll(() => state.row.trip_data.days[0].activities[0]?.source)
    .toBe("ai");
});
test("failed saves preserve the draft and retry successfully", async ({
  page,
}) => {
  const state = await setup(page);
  state.failSave = true;
  await page.goto("/trip/" + tripId);
  await page
    .locator(".trip-sidebar")
    .getByRole("button", { name: "הערות לדרך" })
    .click();
  await page.getByLabel("הערות לטיול").fill("לא לשכוח דרכון");
  await expect(page.locator(".save-error")).toContainText("השמירה לא הצליחה");
  expect(state.row.trip_data.notes).toBe("");
  state.failSave = false;
  await page.getByRole("button", { name: "ניסיון שמירה נוסף" }).click();
  await expect.poll(() => state.row.trip_data.notes).toBe("לא לשכוח דרכון");
  await expect(page.locator(".save-status")).toContainText("כל השינויים נשמרו");
});
test("conflicting updates are never silently overwritten", async ({ page }) => {
  const state = await setup(page);
  state.conflict = true;
  await page.goto("/trip/" + tripId);
  await page
    .locator(".trip-sidebar")
    .getByRole("button", { name: "הערות לדרך" })
    .click();
  await page.getByLabel("הערות לטיול").fill("הטיוטה שלי");
  await expect(page.locator(".save-error")).toContainText("לשונית אחרת");
  expect(state.row.trip_data.notes).toBe("");
  await page.reload();
  await expect(page.locator(".save-error")).toBeVisible();
});
test("shared trips expose no editor and reject invalid links", async ({
  page,
}) => {
  await setup(page, false);
  await page.goto("/trip/" + tripId + "?share_token=test-share-token");
  await expect(page.locator(".activity-title").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "הוספת תחנה", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "הצעת AI", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".trip-sidebar")
    .getByRole("button", { name: "הערות לדרך" })
    .click();
  await expect(page.getByLabel("הערות לטיול")).toHaveAttribute("readonly", "");
  await page.goto("/trip/" + tripId + "?share_token=wrong");
  await expect(
    page.getByRole("heading", { name: "לא הצלחנו לפתוח את הטיול" }),
  ).toBeVisible();
});
test("trip details survive the login handoff", async ({ page }) => {
  await setup(page, false);
  await page.goto("/");
  await page.locator("[name=destination]").fill("רומא");
  await page.locator("[name=startDate]").fill("2026-11-02");
  await page.locator("[name=endDate]").fill("2026-11-05");
  await page.getByRole("button", { name: "בואו נתכנן" }).click();
  await expect(page).toHaveURL(/\/auth/);
  await page.getByLabel("כתובת אימייל").fill("traveler@example.test");
  await page.getByLabel("סיסמה", { exact: true }).fill("Test-password1!");
  await page.getByRole("button", { name: "נכנסים וממשיכים לתכנן" }).click();
  await expect(page).toHaveURL(/\/trip\/new/);
  await expect(page.locator("[name=destination]")).toHaveValue("רומא");
  await expect(page.locator("[name=startDate]")).toHaveValue("2026-11-02");
});

test("all days print from any tab and layouts fit tablet screens", async ({
  page,
}) => {
  const state = await setup(page);
  state.row.trip_data.days[2].activities = [
    {
      ...state.row.trip_data.days[0].activities[0],
      id: "a3",
      name: "היום האחרון בעיר",
    },
  ];
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/trip/" + tripId);
  await expect(page.locator(".activity-title").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/editor-tablet.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("heading", { name: "היום האחרון בעיר" }),
  ).toBeVisible();
  await expect(page.locator(".print-day")).toHaveCount(3);
  await expect(page.locator(".workspace-body")).toBeHidden();
  await page.pdf({
    path: "artifacts/planatrip-trip.pdf",
    format: "A4",
    printBackground: true,
  });
});

test("trip gallery, auth, registration and keyboard navigation", async ({
  page,
}) => {
  await setup(page, false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/auth");
  await expect(
    page.getByRole("heading", { name: "כיף שחזרתם." }),
  ).toBeVisible();
  await page
    .locator(".auth-image img")
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: "artifacts/auth-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "הרשמה", exact: true }).click();
  await page.getByLabel("כתובת אימייל").fill("new@example.test");
  await page.getByLabel("סיסמה", { exact: true }).fill("Password123!");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    "BUTTON",
  );
  await page.getByLabel("אימות סיסמה").fill("Different123!");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText("הסיסמאות אינן תואמות");
  await page.getByLabel("אימות סיסמה").fill("Password123!");
  await page.route("**/auth/v1/signup**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "new", email: "new@example.test" },
        session: null,
      }),
    }),
  );
  await page.locator('button[type="submit"]').click();
  await expect(
    page.getByText("שלחנו קישור אימות", { exact: false }),
  ).toBeVisible();
});

test("gallery opens saved trips and confirms deletion", async ({ page }) => {
  await setup(page);
  await page.goto("/my-trips");
  await expect(
    page.getByRole("heading", { name: "שלושה ימים בפריז" }),
  ).toBeVisible();
  await page
    .locator(".saved-trip-card img")
    .evaluateAll((imgs) =>
      Promise.all(imgs.map((img) => (img as HTMLImageElement).decode())),
    );
  await page.screenshot({
    path: "artifacts/my-trips-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("חיפוש בטיולים").fill("רומא");
  await expect(
    page.getByRole("heading", { name: "שלושה ימים בפריז" }),
  ).toHaveCount(0);
  await page.getByLabel("חיפוש בטיולים").fill("");
  await page.getByRole("link", { name: /שלושה ימים בפריז/ }).click();
  await expect(page.locator(".activity-title").first()).toBeVisible();
  await page.goto("/my-trips");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /מחיקת/ }).click();
  await expect(
    page.getByRole("heading", { name: "שלושה ימים בפריז" }),
  ).toHaveCount(0);
});
