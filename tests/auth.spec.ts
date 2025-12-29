import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    // Generate unique user for each test run to avoid conflicts
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const email = `testuser_${timestamp}@example.com`;
    const password = 'Password123!';

    test('should allow a new user to sign up', async ({ page }) => {
        await page.goto('/auth');

        // Switch to Sign Up mode (toggle button)
        await page.getByRole('button', { name: 'Sign up' }).click();

        // Fill the form
        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);

        // Submit the form
        await page.getByRole('button', { name: 'Sign Up' }).click();

        // Verify transition to verification steps
        await expect(page.getByLabel('Verification Code')).toBeVisible();
        await expect(page.getByText('Code sent to your email!')).toBeVisible();

        // Complete Verification
        await page.getByLabel('Verification Code').fill('123456');
        await page.getByRole('button', { name: 'Verify Email' }).click();

        // Verify redirection to dashboard
        await expect(page).toHaveURL('/');
    });
});
