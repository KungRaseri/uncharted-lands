import { expect, test, type Page } from '@playwright/test';

test.describe('Landing Page suite', async () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState("networkidle");
	});

	test('title -> exists', async ({ page }) => {
		await expect(page).toHaveTitle('Portal | Uncharted Lands');
	})

	test('main feature content -> exists', async ({ page }) => {
		expect(await page.textContent('h1')).toContain('Settle in uncharted lands');
	});

	test('main feature actions -> Introduction', async ({ page }) => {
		const expected = "Area Under Construction";

		await page.getByText("Introduction").waitFor();
		await page.getByText("Introduction").click();
		await page.waitForLoadState("networkidle");

		expect(await page.textContent('.alert-message')).toContain(expected);
	});

	test('main feature actions -> Register', async ({ page }) => {
		const expected = "Register your account";

		await page.getByText("Register").waitFor();
		await page.getByText("Register").click();
		await page.waitForLoadState("networkidle");

		await page.getByText(expected).waitFor();
		expect(await page.textContent('h1')).toContain(expected);
	});

	test('main feature actions -> Login', async ({ page }) => {
		const expected = "Sign into your account";

		await page.getByText("Login").waitFor();
		await page.getByText("Login").click();
		await page.waitForLoadState("networkidle");

		await page.getByText(expected).waitFor();
		expect(await page.textContent('h1')).toContain(expected);
	});
});
