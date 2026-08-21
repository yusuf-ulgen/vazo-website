import { test, expect } from '@playwright/test';

const viewports = [
  { width: 320, height: 568, name: '320px (iPhone SE Narrow)' },
  { width: 375, height: 667, name: '375px (iPhone Standard)' },
  { width: 390, height: 844, name: '390px (iPhone 14)' },
  { width: 430, height: 932, name: '430px (iPhone Pro Max)' },
  { width: 768, height: 1024, name: '768px (Tablet Portrait)' },
  { width: 1024, height: 768, name: '1024px (Tablet Landscape / Laptop)' },
  { width: 1280, height: 800, name: '1280px (Standard Desktop)' },
  { width: 1440, height: 900, name: '1440px (Wide Desktop)' },
  { width: 1920, height: 1080, name: '1920px (Full HD Display)' },
];

test.describe('Responsive Matrix & No Horizontal Scroll Tests', () => {
  for (const vp of viewports) {
    test(`renders cleanly without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Check for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  }
});
