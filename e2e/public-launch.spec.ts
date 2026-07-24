import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("public website loads without runtime or network failures", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await expect(page).toHaveTitle(/Guardians of Galia/);
  await expect(page.locator("body")).toContainText(/Guardians of Galia/i);
  await expect(page.getByRole("button", { name: /EN|ไทย/ }).first()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("language choice persists after a website reload", async ({ page }) => {
  const thaiButton = page.getByRole("button", { name: "ไทย" }).first();
  await thaiButton.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.locator("body")).toContainText("วันนี้อยากเล่นฝ่ายไหน");
});

test("404 route offers a safe return to the game", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("link", { name: /Return to game|กลับเข้าเกม/ })).toHaveAttribute("href", "/");
});

test("new player can choose a faction and reach every game category", async ({ page }) => {
  await page.getByRole("button", { name: /MUD/ }).click();
  await page.getByRole("button", { name: /Continue with MUD/ }).click();
  await page.getByRole("button", { name: /Skip guided flight/ }).click();

  const modes = page.getByRole("region", { name: "Game modes" });
  await expect(modes).toBeVisible();
  await expect(modes).toContainText("Story Expeditions");
  await expect(modes).toContainText("Swarm Protocol");
  await expect(modes).toContainText("Arcade Ops");
  await expect(modes).toContainText("Discovery Runs");
  await expect(modes).toContainText("Frontier Control");
});

test("public entry and mode hub have no serious accessibility violations", async ({ page }) => {
  const entry = await new AxeBuilder({ page }).analyze();
  expect(entry.violations.filter((issue) => issue.impact === "critical" || issue.impact === "serious")).toEqual([]);

  await page.getByRole("button", { name: /MUD/ }).click();
  await page.getByRole("button", { name: /Continue with MUD/ }).click();
  await page.getByRole("button", { name: /Skip guided flight/ }).click();
  const hub = await new AxeBuilder({ page }).analyze();
  expect(hub.violations.filter((issue) => issue.impact === "critical" || issue.impact === "serious")).toEqual([]);
});

test("Arcade pointer tracking stays responsive without runtime failures", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.getByRole("button", { name: /MUD/ }).click();
  await page.getByRole("button", { name: /Continue with MUD/ }).click();
  await page.getByRole("button", { name: /Skip guided flight/ }).click();
  await page.getByRole("button", { name: /Arcade Ops/ }).click();
  await page.getByRole("button", { name: /Start challenge/ }).first().click();

  const range = page.locator(".arcade-range");
  await expect(range).toBeVisible();
  const bounds = await range.boundingBox();
  if (!bounds) throw new Error("Arcade range has no layout box");
  await page.mouse.move(bounds.x + 40, bounds.y + 40);
  await page.mouse.move(bounds.x + bounds.width - 40, bounds.y + bounds.height - 40, { steps: 120 });

  await expect(page.locator(".arcade-reticle")).toHaveCSS("will-change", "transform");
  expect(await page.locator(".arcade-reticle").evaluate((node) => (node as HTMLElement).style.transform)).toContain("translate3d");
  expect(runtimeErrors).toEqual([]);
});
