import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5173/');
});

test.describe('Home page', async () => {
	test('main feature content exists', async ({ page }) => {
		expect(await page.textContent('h1')).toContain('Settle in uncharted lands');
		expect(await page.title()).toContain('Portal | Browser-game');
	});

	test('main feature actions -> Introduction', async ({ page }) => {
		await page.locator('a', { hasText: 'Introduction' }).click();
		expect(await page.textContent('.title > .label')).toContain("Area Under Construction");
	});

	test('main feature actions -> Register', async ({ page }) => {
		await page.locator('a', { hasText: 'Register' }).click();
		expect(await page.textContent('h1')).toContain("Register your account");
	});

	test('main feature actions -> Login', async ({ page }) => {
		await page.locator('a', { hasText: 'Login' }).click();
		expect(await page.textContent('h1')).toContain("Sign in to your account");
	});
});
