import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Unique user for this test run
const timestamp = Date.now();
const email = `e2e_user_${timestamp}@example.com`;
const password = 'TestPassword123!';
const fullName = 'Auto Test User';

test.describe('C(AI)DENCE Comprehensive E2E Flow', () => {

    test('Full User Journey', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout for full journey

        // 1. Register
        console.log(`Registering user: ${email}`);
        await page.goto('http://localhost:3000/register');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.fill('input[placeholder*="Full Name"]', fullName);
        await page.click('button[type="submit"]');

        // Wait for redirect to login
        await expect(page).toHaveURL(/.*login/);

        // 2. Approve User (Backend Hack)
        console.log('Approving user via script...');
        try {
            const scriptPath = '/Users/atulkapoor/Documents/C(AI)DENCE/approve_test_user.py';
            await execAsync(`python3 "${scriptPath}" ${email}`);
        } catch (error) {
            console.error("Failed to approve user:", error);
        }

        // 3. Login
        console.log('Logging in...');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // 4. Verify Dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // 5. Content Studio History & Filters
        console.log('Testing Content Studio...');
        await page.goto('http://localhost:3000/content-studio/history');
        await expect(page).toHaveURL(/.*history/);
        await expect(page.getByText('All Types')).toBeVisible();

        // 6. Design Studio History & Filters
        console.log('Testing Design Studio...');
        await page.goto('http://localhost:3000/design-studio/history');
        await expect(page).toHaveURL(/.*history/);
        await expect(page.getByText('All Styles')).toBeVisible();

        // 7. Campaigns
        console.log('Testing Campaigns...');
        await page.goto('http://localhost:3000/campaigns');
        await expect(page).toHaveURL(/.*campaigns/);
        await expect(page.getByRole('button', { name: /new campaign/i })).toBeVisible();
    });
});
