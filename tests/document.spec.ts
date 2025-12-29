import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
    // Unique user for this test file
    const timestamp = Date.now();
    const username = `docuser_${timestamp}`;
    const email = `docuser_${timestamp}@example.com`;
    const password = 'Password123!';

    test.beforeEach(async ({ page }) => {
        // Signup
        await page.goto('/auth');
        await page.getByRole('button', { name: 'Sign up' }).click();
        await page.getByLabel('Username').fill(username);
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);
        await page.getByRole('button', { name: 'Sign Up' }).click();

        // Verify Email
        await page.getByLabel('Verification Code').fill('123456');
        await page.getByRole('button', { name: 'Verify Email' }).click();

        await expect(page).toHaveURL('/');
    });

    test('should create, rename, and verify document', async ({ page }) => {
        // 1. Open Template Modal (Click the "New Document" button)
        await page.getByRole('button', { name: 'New Document' }).click();

        // 2. Select "Blank Page"
        await page.getByText('Blank Page').click();

        // 3. Verify Editor Loaded
        await expect(page).toHaveURL(/\/documents\//);

        // 4. Rename Document
        const newTitle = `Doc ${timestamp}`;
        const titleInput = page.getByPlaceholder('Untitled Document');
        await titleInput.click();
        await titleInput.fill(newTitle);
        await titleInput.blur(); // Trigger save via onBlur

        // 5. Verify Save Status
        await expect(page.getByText('Saved to cloud')).toBeVisible();

        // 6. Return to Dashboard
        await page.locator('a:has(svg.lucide-arrow-left)').click();

        // 7. Verify Document in Dashboard
        await expect(page).toHaveURL('/');
        // Reload to ensure listing is fresh
        await page.reload();
        await expect(page.getByText(newTitle)).toBeVisible();
    });
});
