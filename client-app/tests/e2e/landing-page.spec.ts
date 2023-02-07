import { expect, test, } from '@playwright/test';

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

		await page.getByTestId('main-feature-introduction').waitFor();
		await page.getByTestId('main-feature-introduction').click();
		await page.waitForLoadState("networkidle");

		expect(await page.textContent('.alert-message')).toContain(expected);
	});

	test('main feature actions -> Register', async ({ page }) => {
		const expected = "Register your account";

		await page.getByTestId('main-feature-register').waitFor();
		await page.getByTestId('main-feature-register').click();
		await page.waitForLoadState("networkidle");

		await page.getByText(expected).waitFor();
		expect(await page.textContent('h1')).toContain(expected);
	});

	test('main feature actions -> Sign In', async ({ page }) => {
		const expected = "Sign into your account";

		await page.getByTestId('main-feature-signin').waitFor();
		await page.getByTestId('main-feature-signin').click();
		await page.waitForLoadState("networkidle");

		await page.getByText(expected).waitFor();
		expect(await page.textContent('h1')).toContain(expected);
	});
});
