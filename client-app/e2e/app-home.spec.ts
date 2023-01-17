import { expect, test, type Page } from '@playwright/test';

test.describe('Home page', async () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState("networkidle");
	});
	test('main feature content exists', async ({ page }) => {
		expect(await page.textContent('h1')).toContain('Settle in uncharted lands');
		expect(await page.title()).toContain('Portal | Uncharted Lands');
	});

	test('main feature actions -> Introduction', async ({ page }) => {
		const expected = "Area Under Construction";

		await page.getByText("Introduction").waitFor();
		await page.getByText("Introduction").click();
		await page.waitForLoadState("networkidle");

		await page.getByText(expected).waitFor();

		expect(await page.textContent('.title > .label')).toContain(expected);
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
		const expected = "Sign in to your account";

		await page.getByText("Login").waitFor();
		await page.getByText("Login").click();
		await page.waitForLoadState("networkidle");

		await page.getByText(expected).waitFor();
		expect(await page.textContent('h1')).toContain(expected);
	});
});
