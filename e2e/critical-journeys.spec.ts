import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

async function moveStoryPlayerTo(page: Page, targetIndex: number) {
  const path = await page.locator(".story-grid-cell").evaluateAll((cells, destination) => {
    const current = cells.findIndex((cell) => cell.classList.contains("is-player"));
    const blocked = new Set(cells.map((cell, index) => cell.classList.contains("is-wall") ? index : -1).filter((index) => index >= 0));
    const queue: number[] = [current];
    const previous = new Map<number, number>();
    const seen = new Set([current]);
    while (queue.length > 0) {
      const next = queue.shift()!;
      if (next === destination) break;
      const row = Math.floor(next / 8);
      const col = next % 8;
      const neighbors = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8)
        .map(([r, c]) => r * 8 + c)
        .filter((index) => !blocked.has(index) && !seen.has(index));
      for (const neighbor of neighbors) {
        seen.add(neighbor);
        previous.set(neighbor, next);
        queue.push(neighbor);
      }
    }
    if (!seen.has(destination)) return [];
    const result = [destination];
    while (result[0] !== current) result.unshift(previous.get(result[0])!);
    return result.slice(1);
  }, targetIndex);

  if (path.length === 0) throw new Error(`Story target ${targetIndex} is unreachable`);
  for (const index of path) {
    await page.locator(".story-grid-cell").nth(index).click();
    await page.waitForTimeout(45);
  }
}

async function storyCellIndex(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((node) => {
    const cell = node.closest(".story-grid-cell");
    return Array.from(document.querySelectorAll(".story-grid-cell")).indexOf(cell!);
  });
}

test("first Story chapter can be cleared and continued without leaving the campaign", async ({ page }) => {
  test.setTimeout(60_000);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.getByRole("button", { name: /Story Expeditions/ }).click();
  await page.getByRole("button", { name: /Choose route and deploy/ }).click();
  await page.getByRole("button", { name: /^Balanced route/ }).click();
  await page.getByRole("button", { name: /Launch Balanced route/ }).click();
  await expect(page.getByText("Live mission")).toBeVisible();
  const storyAccessibility = await new AxeBuilder({ page }).analyze();
  expect(storyAccessibility.violations.filter((issue) => ["landmark-one-main", "page-has-heading-one", "region"].includes(issue.id))).toEqual([]);

  for (let collected = 0; collected < 5; collected += 1) {
    await expect(page.locator('[aria-label="Signal crystal"]').first()).toBeVisible();
    await moveStoryPlayerTo(page, await storyCellIndex(page, '[aria-label="Signal crystal"]'));
  }
  await expect(page.getByText(/Mission targets complete/)).toBeVisible();
  await moveStoryPlayerTo(page, await storyCellIndex(page, 'button[aria-label="Extraction ship"]'));

  await expect(page.getByText(/Planet Complete/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue to next chapter/ })).toBeVisible();
  await page.getByRole("button", { name: /Continue to next chapter/ }).click();
  await expect(page.getByText("Kora Wilds", { exact: true })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("a completed Swarm run produces a closable, mode-correct result", async ({ page }) => {
  test.setTimeout(90_000);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.clock.install();

  await page.getByRole("button", { name: /Swarm Protocol/ }).click();
  await page.getByRole("button", { name: /Begin run/ }).click();
  const swarmAccessibility = await new AxeBuilder({ page }).analyze();
  expect(swarmAccessibility.violations.filter((issue) => ["landmark-one-main", "page-has-heading-one", "region"].includes(issue.id))).toEqual([]);
  const swarmResults = page.locator(".unified-results");
  for (let elapsed = 0; elapsed < 90_000; elapsed += 5_000) {
    await page.clock.runFor(5_000);
    if (await swarmResults.count()) break;
    const upgradeChoice = page.locator(".combat-upgrades button").first();
    if (await upgradeChoice.isVisible()) await upgradeChoice.click();
  }
  await expect(swarmResults).toBeVisible();
  await expect(swarmResults).toContainText(/Ahr defeated|Run not counted|Rewards secured/);
  await page.clock.resume();
  await swarmResults.getByRole("button", { name: /Swarm briefing/ }).click();
  await expect(page.getByRole("button", { name: /Begin run/ })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("an idle Arcade run produces a no-reward result and returns to assignments", async ({ page }) => {
  test.setTimeout(75_000);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await enterMudGame(page);
  await page.getByRole("button", { name: /Arcade Ops/ }).click();
  await page.getByRole("button", { name: /Start challenge/ }).nth(1).click();
  await page.getByRole("button", { name: /Start assignment/ }).click();
  await page.waitForTimeout(47_000);
  const arcadeResults = page.locator(".unified-results");
  await expect(arcadeResults).toBeVisible();
  await expect(arcadeResults).toContainText("Assignment incomplete");
  await arcadeResults.getByRole("button", { name: /Assignments/ }).click();
  await expect(page.getByRole("heading", { name: /Pick your shooting challenge/ })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
