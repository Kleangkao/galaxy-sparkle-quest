import { expect, test } from "@playwright/test";

test("core bilingual journey works across supported desktop engines", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: /EN \/ ไทย/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await page.getByRole("button", { name: /MUD/ }).click();
  await page.getByRole("button", { name: /เล่นฝ่าย MUD/ }).click();
  await page.getByRole("button", { name: /ข้ามคำแนะนำ/ }).click();
  await expect(page.getByRole("region", { name: /Game modes|โหมดเกม/ })).toBeVisible();

  await page.getByRole("button", { name: /ยิงเป้า/ }).first().click();
  await expect(page.getByRole("heading", { name: /เลือกภารกิจยิงเป้า/ })).toBeVisible();
  await page.getByRole("button", { name: /โหมด/ }).first().click();
  await page.getByRole("heading", { name: "ออกสำรวจ" }).click();
  await expect(page.getByText(/ไม่มีเวลาและไม่มีแพ้/).first()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
