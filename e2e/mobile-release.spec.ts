import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function enterMudGame(page: Page) {
  await page.evaluate(() => localStorage.setItem("galia-guided-flight-v1:mud", "done"));
  await page.getByRole("button", { name: /MUD/ }).click();
  await page.getByRole("button", { name: /Continue with MUD/ }).click();
  await expect(page.getByRole("region", { name: "Game modes" })).toBeVisible();
}

test("phone navigation, Thai layout, and Settings stay device-aware", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);

  await expect(page.locator(".command-dock")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );

  await page.getByRole("button", { name: /Game settings/ }).click();
  await expect(page.getByText("Touch controls")).toBeVisible();
  await expect(page.getByText("On-screen controls for phones and tablets.")).toBeVisible();
  const fullscreenButton = page.getByRole("button", { name: "Toggle fullscreen" });
  if (await fullscreenButton.isVisible().catch(() => false)) {
    await fullscreenButton.click();
    await page.waitForTimeout(150);
  } else {
    await expect(page.getByText("Browser controlled")).toBeVisible();
  }
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /EN \/ ไทย/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.getByRole("region", { name: "โหมดเกม" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  expect(runtimeErrors).toEqual([]);
});

test("Story touch movement works without shifting or overflowing the page", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.getByRole("button", { name: /Story Expeditions/ }).click();
  await page.getByRole("button", { name: /Choose route and deploy/ }).click();
  await page.getByRole("button", { name: /^Balanced route/ }).click();
  await page.getByRole("button", { name: /Launch Balanced route/ }).click();
  await expect(page.getByText("Live mission")).toBeVisible();
  const dpad = page.getByRole("group", { name: "Movement controls" });
  await expect(dpad).toBeVisible();

  const player = page.locator(".story-grid-cell.is-player");
  const before = await player.evaluate((node) => Array.from(document.querySelectorAll(".story-grid-cell")).indexOf(node));
  await page.getByRole("button", { name: "Move up" }).click();
  await expect.poll(() => player.evaluate((node) => Array.from(document.querySelectorAll(".story-grid-cell")).indexOf(node))).not.toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  expect(runtimeErrors).toEqual([]);
});

test("Swarm and Arcade expose working touch combat controls", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.getByRole("button", { name: /Swarm Protocol/ }).click();
  await expect(page.getByText(/Arc Pistol: \+8% fire rate/)).toBeVisible();
  await expect(page.getByText(/Arcade rounds/)).toHaveCount(0);
  await page.getByRole("button", { name: /Begin run/ }).click();

  const swarmPlayer = page.locator(".combat-player");
  const beforeLeft = await swarmPlayer.evaluate((node) => (node as HTMLElement).style.left);
  const moveRight = page.getByRole("button", { name: "Move right" });
  await moveRight.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(350);
  await moveRight.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true });
  await expect.poll(() => swarmPlayer.evaluate((node) => (node as HTMLElement).style.left)).not.toBe(beforeLeft);
  await page.getByRole("button", { name: /Shock Pulse/ }).click();
  await expect(page.getByRole("button", { name: /Shock Pulse/ })).toContainText(/Ready in|พร้อมอีกครั้ง/);

  await page.getByRole("main").getByRole("button", { name: "Modes" }).click();
  await page.getByRole("button", { name: "Leave run" }).click();
  await page.getByRole("button", { name: /Arcade Ops/ }).click();
  await page.getByRole("button", { name: /Start challenge/ }).first().click();
  await page.getByRole("button", { name: /Start assignment/ }).click();
  const range = page.locator(".arcade-range");
  const bounds = await range.boundingBox();
  if (!bounds) throw new Error("Arcade range has no layout box");
  await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.getByRole("button", { name: /Reload/ }).click();
  await expect(page.getByRole("status")).toContainText(/RELOADING|กำลังเติมกระสุน/);
  expect(runtimeErrors).toEqual([]);
});
