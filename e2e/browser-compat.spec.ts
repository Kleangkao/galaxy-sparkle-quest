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
  await expect(page.getByRole("heading", { name: /เลือกภารกิจที่อยากเล่น/ })).toBeVisible();
  await page.getByRole("button", { name: /โหมด/ }).first().click();
  const modes = page.getByRole("region", { name: /Game modes|โหมดเกม/ });
  await expect(modes.getByRole("heading", { name: "ผจญภัยตามเนื้อเรื่อง" })).toBeVisible();
  await expect(modes.getByRole("heading", { name: "ฝ่าฝูงศัตรู" })).toBeVisible();
  await expect(modes.getByRole("heading", { name: "ภารกิจยิงเป้า" })).toBeVisible();
  await expect(modes.getByText("ออกสำรวจ", { exact: true })).toHaveCount(0);
  await expect(modes.getByText("วางแผนเส้นทาง", { exact: true })).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});
