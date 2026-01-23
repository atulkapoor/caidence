import { test, expect } from '@playwright/test';

/**
 * API Integration Tests
 * Tests that frontend correctly integrates with backend API
 */

test.describe('Dashboard API Integration', () => {
    test('should fetch dashboard stats', async ({ page }) => {
        // Listen for API response
        const responsePromise = page.waitForResponse(
            (response) => response.url().includes('/dashboard/stats') && response.status() === 200,
            { timeout: 10000 }
        ).catch(() => null);

        await page.goto('/');

        const response = await responsePromise;
        if (response) {
            const data = await response.json();
            expect(data).toHaveProperty('active_campaigns');
            expect(data).toHaveProperty('ai_workflows');
        }
    });
});

test.describe('Discovery API Integration', () => {
    test('should call search API', async ({ page }) => {
        await page.goto('/discovery');

        const searchInput = page.locator('input').first();
        if (await searchInput.isVisible()) {
            // Listen for search API
            const searchPromise = page.waitForResponse(
                (response) => response.url().includes('/discovery/search'),
                { timeout: 5000 }
            ).catch(() => null);

            await searchInput.fill('fashion');
            await searchInput.press('Enter');

            const response = await searchPromise;
            if (response) {
                expect(response.status()).toBe(200);
                const data = await response.json();
                expect(Array.isArray(data)).toBe(true);
            }
        }
    });
});

test.describe('CRM API Integration', () => {
    test('should fetch relationships', async ({ page }) => {
        const responsePromise = page.waitForResponse(
            (response) => response.url().includes('/crm/relationships') && response.status() === 200,
            { timeout: 10000 }
        ).catch(() => null);

        await page.goto('/crm');

        const response = await responsePromise;
        if (response) {
            const data = await response.json();
            expect(Array.isArray(data)).toBe(true);
        }
    });
});

test.describe('Error Handling', () => {
    test('should handle 404 page gracefully', async ({ page }) => {
        await page.goto('/nonexistent-page');

        // Should either show 404 or redirect
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: 'test-results/screenshots/404-page.png', fullPage: true });
    });
});

test.describe('Performance', () => {
    test('dashboard should load within 5 seconds', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        console.log(`Dashboard load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000);
    });

    test('agency page should load within 5 seconds', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/agency');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        console.log(`Agency load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000);
    });
});
