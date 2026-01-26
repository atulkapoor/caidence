import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Unique user for this test run
const timestamp = Date.now();
const email = `deep_verify_${timestamp}@example.com`;
const password = 'TestPassword123!';
const fullName = 'Deep Verify User';

test.describe('C(AI)DENCE Deep Feature Verification', () => {

    test.beforeAll(async ({ browser }) => {
        // We could maximize window or set context here if needed
    });

    test('Extended Module verification', async ({ page }) => {
        test.setTimeout(90000); // 1.5 mins for deep dive

        // --- 1. Setup & Login ---
        console.log(`[Setup] Registering: ${email}`);
        await page.goto('http://localhost:3000/register');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.fill('input[placeholder*="Full Name"]', fullName);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*login/);

        // Approve
        console.log('[Setup] Approving user...');
        try {
            const scriptPath = '/Users/atulkapoor/Documents/C(AI)DENCE/approve_test_user.py';
            await execAsync(`python3 "${scriptPath}" ${email}`);
        } catch (error) {
            console.error("Failed to approve user:", error);
        }

        // Login
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);

        // --- 2. CRM Verification ---
        console.log('[Test] Verifying CRM...');
        await page.goto('http://localhost:3000/crm');
        await expect(page.getByText('Relationship Manager')).toBeVisible();
        await expect(page.getByPlaceholder('Search relationships...')).toBeVisible();
        // Check if table headers exist
        await expect(page.getByText('Contact', { exact: true })).toBeVisible(); // Approximate match in table header

        // --- 3. Marcom Hub Verification ---
        console.log('[Test] Verifying Marcom Hub...');
        await page.goto('http://localhost:3000/marcom');
        await expect(page.getByText('Communications Hub')).toBeVisible();
        // Check for specific tools
        await expect(page.getByText('Email Campaigns')).toBeVisible();
        await expect(page.getByText('Social Media')).toBeVisible();

        // --- 4. AI Agent Verification ---
        console.log('[Test] Verifying AI Agent...');
        await page.goto('http://localhost:3000/ai-agent');
        await expect(page.getByText('Autonomous Marketing Agent')).toBeVisible();
        await expect(page.getByText('Agent Status')).toBeVisible();

        // --- 5. Discovery Verification ---
        console.log('[Test] Verifying Discovery Engine...');
        await page.goto('http://localhost:3000/discovery');
        await expect(page.getByText('Influencer Discovery')).toBeVisible();
        const searchInput = page.getByPlaceholder('Search for influencers...');
        await expect(searchInput).toBeVisible();
        // Perform a search interaction
        await searchInput.fill('Tech');
        await page.keyboard.press('Enter');
        // Check for "Tech" related results or empty state if no mock data
        // Assuming mock data returns something, or at least no crash

        // --- 6. Settings Verification ---
        console.log('[Test] Verifying Settings...');
        await page.goto('http://localhost:3000/settings');
        await expect(page.getByText('Platform Settings')).toBeVisible();
        // Check tabs
        await expect(page.getByText('General')).toBeVisible();
        await expect(page.getByText('API Keys')).setVisible();

        // --- 7. Profile Verification ---
        console.log('[Test] Verifying Profile...');
        await page.goto('http://localhost:3000/profile');
        await expect(page.getByText('Personal Information')).toBeVisible();
        await expect(page.getByDisplayValue(fullName)).toBeVisible(); // Should see our name
        await expect(page.getByDisplayValue(email)).toBeVisible();    // Should see our email

        console.log('Deep verification complete!');
    });
});
