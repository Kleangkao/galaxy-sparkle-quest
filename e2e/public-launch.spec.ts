import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function enterMudGame(page: import("@playwright/test").Page) {
  await page.evaluate(() => localStorage.setItem("galia-guided-flight-v1:mud", "done"));
  await page.getByRole("button", { name: /MUD/ }).click();
  await page.getByRole("button", { name: /Continue with MUD/ }).click();
  await expect(page.getByRole("region", { name: "Game modes" })).toBeVisible();
}

test("public website loads without runtime or network failures", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await expect(page).toHaveTitle(/Guardians of Galia/);
  await expect(page.locator("body")).toContainText(/Guardians of Galia/i);
  await expect(page.getByRole("button", { name: /EN|ไทย/ }).first()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("cold desktop load stays within the public release budget", async ({ page, context }) => {
  const failedRequests: string[] = [];
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));
  const session = await context.newCDPSession(page);
  await session.send("Network.clearBrowserCache");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.goto("/", { waitUntil: "networkidle" });

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return {
      loadMs: navigation.loadEventEnd - navigation.startTime,
      totalTransfer: resources.reduce((sum, item) => sum + item.transferSize, 0),
      largestTransfer: Math.max(0, ...resources.map((item) => item.transferSize)),
    };
  });

  expect(metrics.loadMs).toBeLessThan(5_000);
  expect(metrics.totalTransfer).toBeLessThan(6 * 1024 * 1024);
  expect(metrics.largestTransfer).toBeLessThan(1024 * 1024);
  expect(failedRequests).toEqual([]);
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
  await page.setViewportSize({ width: 1366, height: 768 });
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.getByRole("button", { name: /Arcade Ops/ }).click();
  await page.getByRole("button", { name: /Start challenge/ }).first().click();
  await page.getByRole("button", { name: /Start assignment/ }).click();

  const range = page.locator(".arcade-range");
  await expect(range).toBeVisible();
  const bounds = await range.boundingBox();
  if (!bounds) throw new Error("Arcade range has no layout box");
  await page.mouse.move(bounds.x + 40, bounds.y + 40);
  await page.mouse.move(bounds.x + bounds.width - 40, bounds.y + bounds.height - 40, { steps: 120 });

  await expect(page.locator(".arcade-reticle")).toHaveCSS("will-change", "transform");
  expect(await page.locator(".arcade-reticle").evaluate((node) => (node as HTMLElement).style.transform)).toContain("translate3d");
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(730);
  expect(runtimeErrors).toEqual([]);
});

test("all 30 Story chapter-route combinations launch with solvable route content", async ({ page }) => {
  test.setTimeout(120_000);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.evaluate(() => {
    const key = "cosmic-explorer-save-v2:mud";
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    state.visitedPlanets = [
      "sparkle-moon", "candy-planet", "frosty-star", "jungle-world", "rainbow-nebula",
      "bubbly-bay", "cookie-crater", "starlight-shore", "crystal-cave",
    ];
    state.level = 10;
    state.xp = 999;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole("button", { name: /Story Expeditions/ }).click();

  for (let chapter = 1; chapter <= 10; chapter += 1) {
    for (const route of ["Scout", "Balanced", "Salvage"]) {
      const chapterLabel = chapter.toString().padStart(2, "0");
      await page.getByRole("button", { name: new RegExp(`^${chapterLabel}\\s`) }).click();
      await page.getByRole("button", { name: /Choose route and deploy|Replay survey/ }).click();
      await page.getByRole("button", { name: new RegExp(`^${route} route`) }).click();
      await page.getByRole("button", { name: new RegExp(`Launch ${route} route`) }).click();
      await expect(page.getByText(/Live mission/)).toBeVisible();
      await expect(page.locator(".story-grid-cell")).toHaveCount(64);
      if (route === "Salvage") {
        await expect(page.getByText("CARGO", { exact: true })).toHaveCount(1);
        await expect(page.getByText(/Optional: recover the cargo crate/)).toBeVisible();
      }
      await page.getByRole("button", { name: /Galaxy Map|Chapter map/ }).click();
      await expect(page.getByRole("alertdialog", { name: /Leave the active run/ })).toBeVisible();
      await page.getByRole("button", { name: "Leave run" }).click();
      await expect(page.getByRole("heading", { name: /Story Expeditions/ })).toBeVisible();
    }
  }

  expect(runtimeErrors).toEqual([]);
});

test("Settings pause Swarm and leaving a live run requires confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await enterMudGame(page);
  await page.getByRole("button", { name: /Swarm Protocol/ }).click();
  await page.getByRole("button", { name: /Begin run/ }).click();
  const arenaBounds = await page.locator(".combat-arena").boundingBox();
  const controlsBounds = await page.locator(".combat-controls").boundingBox();
  expect(arenaBounds && arenaBounds.y + arenaBounds.height).toBeLessThanOrEqual(690);
  expect(controlsBounds && controlsBounds.y + controlsBounds.height).toBeLessThanOrEqual(720);
  const timeValue = page.locator(".combat-hud > div").last().locator("strong");
  const beforeSettings = await timeValue.textContent();
  await page.getByRole("button", { name: /Game settings/ }).click();
  await page.waitForTimeout(1_500);
  await expect(timeValue).toHaveText(beforeSettings ?? "");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1_100);
  await expect(timeValue).not.toHaveText(beforeSettings ?? "");

  await page.getByRole("button", { name: "Discover" }).click();
  await expect(page.getByRole("alertdialog", { name: /Leave the active run/ })).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByText(/Swarm Protocol · Survival/)).toBeVisible();
  await page.getByRole("button", { name: "Crew" }).click();
  await page.getByRole("button", { name: "Leave run" }).click();
  const navBounds = await page.locator(".command-dock").boundingBox();
  const backBounds = await page.locator(".hangar-back").boundingBox();
  expect(navBounds && backBounds && backBounds.y).toBeGreaterThanOrEqual((navBounds?.y ?? 0) + (navBounds?.height ?? 0));
});

test("Discovery uses a clue trail and awards only after all six signals", async ({ page }) => {
  await enterMudGame(page);
  await page.getByRole("button", { name: /Discovery Runs/ }).click();
  await page.getByRole("button", { name: /Explore this area/ }).first().click();

  for (let found = 0; found < 6; found += 1) {
    await page.locator(".discovery-point:not([disabled]):not(.is-found)").first().click();
  }
  await expect(page.getByText(/Trail complete/).first()).toBeVisible();
  await page.getByRole("button", { name: /Claim journal rewards/ }).click();
  await expect(page.getByRole("dialog", { name: /Field journal complete/ })).toBeVisible();
});

test("Frontier Control requires a readable two-risk route and resolves visibly", async ({ page }) => {
  await enterMudGame(page);
  await page.getByRole("button", { name: /Frontier Control/ }).click();
  await page.getByRole("button", { name: /Launch relay ship/ }).click();
  await page.getByRole("button", { name: /Risk route/ }).click();
  await page.getByRole("button", { name: /Risk route/ }).click();
  await page.getByRole("button", { name: /Safe route/ }).click();
  await page.getByRole("button", { name: /Safe route/ }).click();
  await expect(page.getByRole("heading", { name: /Signal delivered/ })).toBeVisible();
  await page.getByRole("button", { name: /Bank flight rewards/ }).click();
  await expect(page.getByRole("dialog", { name: /Command objective complete/ })).toBeVisible();
});
