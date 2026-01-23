import { test, expect } from '@playwright/test';

/**
 * Form and Action Tests
 * Tests interactive elements, forms, and user actions
 */

test.describe('Discovery Search', () => {
    test('should search for influencers', async ({ page }) => {
        await page.goto('/discovery');

        // Find search input
        const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="text"]')).first();

        if (await searchInput.isVisible()) {
            // Type search query
            await searchInput.fill('fitness');
            await searchInput.press('Enter');

            // Wait for results
            await page.waitForTimeout(1000);

            await page.screenshot({ path: 'test-results/screenshots/search-results.png', fullPage: true });
        }
    });

    test('should show filter options', async ({ page }) => {
        await page.goto('/discovery');

        // Check for filter buttons
        const filterButton = page.locator('button').filter({ hasText: /filter|platform|category/i });
        if (await filterButton.first().isVisible()) {
            await filterButton.first().click();
            await page.waitForTimeout(300);
            await page.screenshot({ path: 'test-results/screenshots/filters-open.png', fullPage: true });
        }
    });
});

test.describe('Creator Roster Actions', () => {
    test('should open Add Creator modal on button click', async ({ page }) => {
        await page.goto('/creators');

        const addButton = page.getByRole('button', { name: /add creator/i });
        await expect(addButton).toBeVisible();

        // Click would trigger modal (if implemented)
        await addButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/screenshots/add-creator-action.png', fullPage: true });
    });

    test('should filter creators by tab', async ({ page }) => {
        await page.goto('/creators');

        // Click different tabs
        const tabs = ['all', 'active', 'vetted', 'past'];

        for (const tab of tabs) {
            const tabButton = page.getByRole('button', { name: tab });
            if (await tabButton.isVisible()) {
                await tabButton.click();
                await page.waitForTimeout(300);
            }
        }

        await page.screenshot({ path: 'test-results/screenshots/creator-tabs.png', fullPage: true });
    });

    test('should search creators', async ({ page }) => {
        await page.goto('/creators');

        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('emma');
            await page.waitForTimeout(500);

            await page.screenshot({ path: 'test-results/screenshots/creator-search.png', fullPage: true });
        }
    });
});

test.describe('Agency Brand Actions', () => {
    test('should click Add Brand button', async ({ page }) => {
        await page.goto('/agency');

        const addButton = page.getByRole('button', { name: /add brand/i });
        await expect(addButton).toBeVisible();
        await addButton.click();

        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/screenshots/add-brand-action.png', fullPage: true });
    });

    test('should hover over brand cards', async ({ page }) => {
        await page.goto('/agency');

        // Find a brand card and hover
        const brandCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: 'TechFlow' }).first();
        if (await brandCard.isVisible()) {
            await brandCard.hover();
            await page.waitForTimeout(300);

            await page.screenshot({ path: 'test-results/screenshots/brand-hover.png', fullPage: true });
        }
    });

    test('should show industry filter', async ({ page }) => {
        await page.goto('/agency');

        const industrySelect = page.locator('select').filter({ hasText: /industry/i });
        if (await industrySelect.isVisible()) {
            await industrySelect.selectOption({ index: 1 });
            await page.waitForTimeout(300);

            await page.screenshot({ path: 'test-results/screenshots/industry-filter.png', fullPage: true });
        }
    });
});

test.describe('Admin Panel Actions', () => {
    test('should show approval actions', async ({ page }) => {
        await page.goto('/admin');

        // Look for approve/reject buttons
        const approveButtons = page.locator('button').filter({ has: page.locator('svg') });
        const count = await approveButtons.count();

        expect(count).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/screenshots/admin-actions.png', fullPage: true });
    });

    test('should click quick action cards', async ({ page }) => {
        await page.goto('/admin');

        // Click on User Management card
        const userMgmtCard = page.locator('a').filter({ hasText: 'User Management' });
        if (await userMgmtCard.isVisible()) {
            await userMgmtCard.click();
            await page.waitForTimeout(500);

            await page.screenshot({ path: 'test-results/screenshots/user-management.png', fullPage: true });
        }
    });
});

test.describe('Creator Portal Actions', () => {
    test('should click Download Media Kit', async ({ page }) => {
        await page.goto('/creator-portal');

        const downloadButton = page.getByRole('button', { name: /download media kit/i });
        if (await downloadButton.isVisible()) {
            await downloadButton.click();
            await page.waitForTimeout(500);
        }

        await page.screenshot({ path: 'test-results/screenshots/media-kit-download.png', fullPage: true });
    });

    test('should switch assignment tabs', async ({ page }) => {
        await page.goto('/creator-portal');

        const activeTab = page.getByRole('button', { name: 'Active' });
        if (await activeTab.isVisible()) {
            await activeTab.click();
            await page.waitForTimeout(300);
        }

        await page.screenshot({ path: 'test-results/screenshots/portal-active-tab.png', fullPage: true });
    });

    test('should click quick action cards', async ({ page }) => {
        await page.goto('/creator-portal');

        const editProfileCard = page.locator('a').filter({ hasText: 'Edit Profile' });
        if (await editProfileCard.isVisible()) {
            await editProfileCard.click();
            await page.waitForURL(/profile/);

            await page.screenshot({ path: 'test-results/screenshots/creator-profile-page.png', fullPage: true });
        }
    });
});

test.describe('AI Chat Interactions', () => {
    test('should have message input', async ({ page }) => {
        await page.goto('/ai-chat');

        const messageInput = page.locator('input, textarea').filter({ hasText: '' }).first();
        await expect(messageInput).toBeVisible();

        await page.screenshot({ path: 'test-results/screenshots/chat-input.png', fullPage: true });
    });

    test('should type and send message', async ({ page }) => {
        await page.goto('/ai-chat');

        const messageInput = page.locator('input[placeholder*="message"], textarea').first();
        if (await messageInput.isVisible()) {
            await messageInput.fill('Hello, can you help me with marketing?');

            // Find send button
            const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
            if (await sendButton.isVisible()) {
                await sendButton.click();
                await page.waitForTimeout(1000);
            }

            await page.screenshot({ path: 'test-results/screenshots/chat-message-sent.png', fullPage: true });
        }
    });
});

test.describe('Content Studio Forms', () => {
    test('should have content generation form', async ({ page }) => {
        await page.goto('/content-studio');

        // Look for form elements
        const selectOrInput = page.locator('select, input[type="text"], textarea');
        const count = await selectOrInput.count();

        expect(count).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/screenshots/content-form.png', fullPage: true });
    });
});

test.describe('Design Studio Forms', () => {
    test('should have design generation form', async ({ page }) => {
        await page.goto('/design-studio');

        // Look for form elements
        const formElements = page.locator('select, input, textarea');
        const count = await formElements.count();

        expect(count).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/screenshots/design-form.png', fullPage: true });
    });
});
