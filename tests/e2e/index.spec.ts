import { expect, test, } from '@playwright/test';

test.describe('Landing Page - suite', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState("networkidle");
    });

    test('title -> exists', async ({ page }) => {
        await expect(page).toHaveTitle('Portal | Uncharted Lands');
    })

    test('main feature content -> exists', async ({ page }) => {
        const h1Text = await page.textContent('h1');
        expect(h1Text).toContain('Uncharted Lands');
    });

    test('main feature description -> exists', async ({ page }) => {
        const descriptionText = await page.textContent('p');
        expect(descriptionText).toContain('Utilize the resources around you');
    });

    test('main feature actions -> Get Settled', async ({ page }) => {
        await page.getByRole('link', { name: /Get Settled/i }).waitFor();
        const link = page.getByRole('link', { name: /Get Settled/i });
        await expect(link).toHaveAttribute('href', '/game/getting-started');
    });

    test('main feature actions -> Learn More', async ({ page }) => {
        await page.getByRole('link', { name: /Learn More/i }).waitFor();
        const link = page.getByRole('link', { name: /Learn More/i });
        await expect(link).toHaveAttribute('href', '/introduction');
        
        await link.click();
        await page.waitForLoadState("networkidle");
        
        await expect(page).toHaveURL(/\/introduction$/);
    });
});
