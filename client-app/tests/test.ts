import { expect, test } from '@playwright/test';

test('index page has expected Dashboard header', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toContain('Dashboard');
});
