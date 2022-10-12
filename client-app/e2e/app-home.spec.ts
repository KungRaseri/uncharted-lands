import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5173/');
});

test.describe('Home Page content', async () => {
	test('verify portal page content', async ({ page }) => {
		expect(await page.textContent('h1')).toContain('Settle in uncharted lands');
		expect(await page.title()).toContain('Portal | Browser-game');
	});
});
