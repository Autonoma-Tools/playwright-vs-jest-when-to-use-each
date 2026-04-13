/**
 * Playwright E2E test — full checkout flow.
 *
 * Prerequisites:
 *   1. Start the cart app:  npm run dev
 *   2. Install browsers:    npx playwright install
 *   3. Run:                 npx playwright test
 *
 * The test opens a real Chromium browser, navigates to the shop, adds two
 * items to the cart, proceeds to checkout, fills the shipping form, and
 * asserts the order confirmation page renders the correct summary.
 */

const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Checkout flow", () => {
  test("adds two items, fills shipping, and confirms the order", async ({ page }) => {
    /* ----- Step 1: Visit the shop ---------------------------------- */
    await page.goto(BASE_URL);
    await expect(page.locator("h1")).toHaveText("Shop");

    /* ----- Step 2: Add Widget Alpha to the cart -------------------- */
    const alphaRow = page.locator('tr[data-product-id="widget-a"]');
    await alphaRow.locator("button.add-to-cart").click();

    /* ----- Step 3: Add Widget Beta to the cart --------------------- */
    const betaRow = page.locator('tr[data-product-id="widget-b"]');
    await betaRow.locator("button.add-to-cart").click();

    /* ----- Step 4: Verify the cart summary is visible -------------- */
    const cartSummary = page.locator("#cart-summary");
    await expect(cartSummary).toBeVisible();
    await expect(page.locator("#cart-total")).toHaveText("65.00"); // 25 + 40

    /* ----- Step 5: Proceed to checkout ----------------------------- */
    await page.locator("#checkout-btn").click();
    await expect(page.locator("h1")).toHaveText("Checkout");

    /* ----- Step 6: Fill the shipping form -------------------------- */
    await page.fill("#shipping-name", "Ada Lovelace");
    await page.fill("#shipping-address", "42 Analytical Engine Ln");
    await page.fill("#shipping-city", "London");
    await page.fill("#shipping-zip", "SW1A 1AA");

    /* ----- Step 7: Place the order --------------------------------- */
    await page.locator("#place-order-btn").click();

    /* ----- Step 8: Assert the confirmation page -------------------- */
    await expect(page.locator("h1")).toHaveText("Order Confirmed!");
    await expect(page.locator("#order-id")).toContainText("ORD-");
    await expect(page.locator("body")).toContainText("Ada Lovelace");
    await expect(page.locator("body")).toContainText("Widget Alpha");
    await expect(page.locator("body")).toContainText("Widget Beta");
    await expect(page.locator("body")).toContainText("$65.00");
  });

  test("shows the correct item count after adding the same item twice", async ({ page }) => {
    await page.goto(BASE_URL);

    const gammaRow = page.locator('tr[data-product-id="widget-c"]');
    await gammaRow.locator("button.add-to-cart").click();
    await gammaRow.locator("button.add-to-cart").click();

    await expect(page.locator("#cart-summary")).toBeVisible();
    await expect(page.locator("#cart-items")).toContainText("x2");
    await expect(page.locator("#cart-total")).toHaveText("30.00"); // 15 * 2
  });
});
