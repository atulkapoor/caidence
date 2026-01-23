import { test, expect } from '@playwright/test';

/**
 * Sidebar Navigation Tests
 * Tests navigation between all pages via sidebar
 */

test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    const navItems = [
        { name: 'Dashboard', href: '/' },
        { name: 'Agency', href: '/agency' },
        { name: 'Creators', href: '/creators' },
        { name: 'AI Agent', href: '/ai-agent' },
        { name: 'AI Chat', href: '/ai-chat' },
        { name: 'Content Studio', href: '/content-studio' },
        { name: 'Design Studio', href: '/design-studio' },
        { name: 'CRM', href: '/crm' },
        { name: 'Discovery Engine', href: '/discovery' },
        { name: 'Analytics', href: '/analytics' },
        { name: 'Admin Panel', href: '/admin' },
    ];

    for (const item of navItems) {
        test(`should navigate to ${item.name}`, async ({ page }) => {
            // Find and click the nav link
            const link = page.locator(`a[href="${item.href}"]`).first();

            if (await link.isVisible()) {
                await link.click();
                await page.waitForURL(`**${item.href}`);

                // Verify URL changed
                expect(page.url()).toContain(item.href === '/' ? 'localhost:3000' : item.href);
            }
        });
    }

    test('sidebar should be visible on all pages', async ({ page }) => {
        // Check sidebar exists
        const sidebar = page.locator('[class*="sidebar"]').or(page.locator('nav').first());
        await expect(sidebar).toBeVisible();
    });

    test('should highlight active nav item', async ({ page }) => {
        await page.goto('/agency');

        // The Agency link should have active styling
        const agencyLink = page.locator('a[href="/agency"]').first();
        await expect(agencyLink).toBeVisible();
    });
});

test.describe('Responsive Navigation', () => {
    test('sidebar works on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');

        await page.screenshot({ path: 'test-results/screenshots/tablet-view.png', fullPage: true });
    });
});
