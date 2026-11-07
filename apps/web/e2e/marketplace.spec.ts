import { test, expect } from '@playwright/test';

test.describe('DevForge Marketplace End-to-End Suite', () => {
  test('Route integrity: Homepage, Jobs directory, and Bounties Hub load cleanly', async ({
    page,
  }) => {
    // 1. Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/DevForge/i);
    await expect(page.locator('header nav')).toBeVisible();

    // 2. Jobs marketplace
    await page.goto('/jobs');
    await expect(page.locator('h1')).toContainText(/Technical Engagements|Marketplace/i);
    await expect(page.getByText('Substrate FRAME Pallet for Cross-Chain Governance')).toBeVisible();

    // 3. Bounties page
    await page.goto('/bounties');
    await expect(page.getByText('Pre-funded Deliverable Bounties')).toBeVisible();
    await expect(page.getByText('Substrate FRAME Pallet for Cross-Chain Governance')).toBeVisible();
  });

  test('Auth gating: Anonymous user clicking Submit Work is gated by accessible dialog', async ({
    page,
  }) => {
    await page.goto('/bounties');

    // Find and click the first Submit Work button
    const submitBtn = page.getByRole('button', { name: /Submit Work/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify Auth Gate Dialog appears with accessible dialog semantics
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 3 })).toHaveText('Authentication Required');
    await expect(dialog.getByRole('link', { name: /Sign In to DevForge/i })).toBeVisible();
  });

  test('Mobile responsiveness: 375px viewport produces zero horizontal document overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(isOverflowing).toBe(false);
  });

  test('Recruiter Demo Access: Sign-in presets pre-fill credentials for 1-click evaluation', async ({
    page,
  }) => {
    await page.goto('/auth/sign-in');

    await expect(page.getByText(/Recruiter & Evaluator Demo Access/i)).toBeVisible();

    // Test Specialist Preset
    const specialistPreset = page.getByRole('button', {
      name: /Specialist \(satoshi_core\)/i,
    });
    await specialistPreset.click();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toHaveValue('specialist@devforge.network');
    await expect(passwordInput).toHaveValue('Password123!');

    // Test Client Protocol Lead Preset
    const clientPreset = page.getByRole('button', {
      name: /Protocol Lead \(DevForge Labs\)/i,
    });
    await clientPreset.click();

    await expect(emailInput).toHaveValue('client@devforge.network');
    await expect(passwordInput).toHaveValue('Password123!');
  });
});
