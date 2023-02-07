import { expect, test, } from '@playwright/test';

test.describe('Introduction - suite', async () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/introduction');
		await page.waitForLoadState("networkidle");
	});

	test('title -> exists', async ({ page }) => {
		const expectedTitle = "Introduction - Coming Soon™ | Uncharted Lands";

		await expect(page).toHaveTitle(expectedTitle);
	})
});
