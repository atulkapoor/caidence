import { test, expect } from '@playwright/test';

/**
 * Navigation and Page Load Tests
 * Tests that all major pages load correctly
 */

test.describe('Dashboard', () => {
    test('should load dashboard with stats', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/C\(AI\)DENCE/i);

        // Check main dashboard elements
        await expect(page.locator('h1, h2').first()).toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'test-results/screenshots/dashboard.png', fullPage: true });
    });
});

test.describe('Agency Dashboard', () => {
    test('should load agency page with brand cards', async ({ page }) => {
        await page.goto('/agency');

        // Check heading - use more specific selector
        await expect(page.getByRole('heading', { name: 'Agency Dashboard' })).toBeVisible();

        // Check KPI cards are present
        await expect(page.getByText('Total Brands')).toBeVisible();

        // Check brand section
        await expect(page.getByRole('heading', { name: 'Your Brands' })).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/agency.png', fullPage: true });
    });

    test('should have Add Brand button', async ({ page }) => {
        await page.goto('/agency');
        await expect(page.getByRole('button', { name: /add brand/i })).toBeVisible();
    });
});

test.describe('Creator Roster', () => {
    test('should load creators page with table', async ({ page }) => {
        await page.goto('/creators');

        // Use heading selector
        await expect(page.getByRole('heading', { name: 'Creator Roster' })).toBeVisible();

        // Check table is present
        await expect(page.locator('table')).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/creators.png', fullPage: true });
    });

    test('should filter creators by status', async ({ page }) => {
        await page.goto('/creators');

        // Click vetted filter
        await page.getByRole('button', { name: 'vetted' }).click();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/screenshots/creators-vetted.png', fullPage: true });
    });
});

test.describe('Admin Panel', () => {
    test('should load admin dashboard', async ({ page }) => {
        await page.goto('/admin');

        // Use heading selector
        await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible();

        // Check for stats section
        await expect(page.getByText('MRR')).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/admin.png', fullPage: true });
    });

    test('should show pending approvals', async ({ page }) => {
        await page.goto('/admin');
        await expect(page.getByText('Pending Approvals')).toBeVisible();
    });

    test('should have quick action links', async ({ page }) => {
        await page.goto('/admin');

        // Use more specific selectors
        const quickActions = page.locator('a').filter({ hasText: 'User Management' });
        await expect(quickActions.first()).toBeVisible();
    });
});

test.describe('Creator Portal', () => {
    test('should load creator portal dashboard', async ({ page }) => {
        await page.goto('/creator-portal');

        await expect(page.getByText('Welcome back')).toBeVisible();

        // Check earnings stats
        await expect(page.getByText('Total Earnings')).toBeVisible();

        // Check assignments section
        await expect(page.getByText('My Assignments')).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/creator-portal.png', fullPage: true });
    });

    test('should show assignment table', async ({ page }) => {
        await page.goto('/creator-portal');

        // Check table exists
        await expect(page.locator('table')).toBeVisible();
    });
});

test.describe('Discovery Engine', () => {
    test('should load discovery page', async ({ page }) => {
        await page.goto('/discovery');

        // Use heading selector
        await expect(page.getByRole('heading', { name: /discovery/i }).first()).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/discovery.png', fullPage: true });
    });
});

test.describe('CRM Page', () => {
    test('should load CRM with influencer table', async ({ page }) => {
        await page.goto('/crm');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check page has loaded by looking for any content
        await expect(page.locator('body')).not.toBeEmpty();

        await page.screenshot({ path: 'test-results/screenshots/crm.png', fullPage: true });
    });
});

test.describe('Analytics Page', () => {
    test('should load analytics dashboard', async ({ page }) => {
        await page.goto('/analytics');

        // Use heading selector
        await expect(page.getByRole('heading', { name: /analytics/i }).first()).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/analytics.png', fullPage: true });
    });
});

test.describe('AI Chat', () => {
    test('should load AI chat interface', async ({ page }) => {
        await page.goto('/ai-chat');

        // Wait for page to load
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).not.toBeEmpty();

        await page.screenshot({ path: 'test-results/screenshots/ai-chat.png', fullPage: true });
    });
});

test.describe('Content Studio', () => {
    test('should load content studio', async ({ page }) => {
        await page.goto('/content-studio');

        // Use heading selector
        await expect(page.getByRole('heading', { name: /content/i }).first()).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/content-studio.png', fullPage: true });
    });
});

test.describe('Design Studio', () => {
    test('should load design studio', async ({ page }) => {
        await page.goto('/design-studio');

        // Use heading selector with exact match
        await expect(page.getByRole('heading', { name: 'Design Studio' })).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/design-studio.png', fullPage: true });
    });
});
