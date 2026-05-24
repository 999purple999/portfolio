// W7 e2e Playwright. Run: npx playwright test
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:8765';

test('homepage loads, hero renders, dashboard counters animate', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('h1.hero-title')).toBeVisible();
  await expect(page.locator('#hero-canvas')).toHaveCount(1);
  // dashboard render
  await page.locator('#dashboard').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('.dash-counter').length >= 4, null, { timeout: 5000 });
  const counters = await page.locator('.dc-num').allTextContents();
  expect(counters.length).toBeGreaterThanOrEqual(4);
});

test('language switcher EN/IT/ZH works', async ({ page }) => {
  await page.goto(BASE);
  await page.click('[data-lang="it"]');
  await page.waitForTimeout(150);
  expect(await page.title()).toContain('Tecnico');
  await page.click('[data-lang="zh"]');
  await page.waitForTimeout(150);
  expect(await page.title()).toMatch(/比耶拉|信息技术员/);
  await page.click('[data-lang="en"]');
});

test('theme toggle persists in localStorage', async ({ page }) => {
  await page.goto(BASE);
  await page.click('#theme-toggle');
  const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
  expect(isLight).toBe(true);
  const stored = await page.evaluate(() => localStorage.getItem('portfolio:theme'));
  expect(stored).toBe('light');
});

test('phone reveal anti-bot (placeholder still safe)', async ({ page }) => {
  await page.goto(BASE);
  await page.click('#phone-btn');
  const txt = await page.locator('#phone-text').textContent();
  expect(txt).toBeTruthy();
});

test('konami code triggers easter egg', async ({ page }) => {
  await page.goto(BASE);
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  for (const k of seq) await page.keyboard.press(k);
  // Toast appare per 4s
  await expect(page.locator('text=Konami unlocked')).toBeVisible({ timeout: 2000 });
});
