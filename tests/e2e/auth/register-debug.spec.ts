/**
 * Debug Test: Registration Form Submission
 *
 * This test is designed to debug why the registration form isn't submitting.
 */

import { test } from '@playwright/test';
import { generateUniqueEmail, TEST_USERS } from './auth.helpers';

test('debug: registration form submission with network logging', async ({ page }) => {
	const uniqueEmail = generateUniqueEmail('debug');
	const password = TEST_USERS.VALID.password;

	// Enable verbose logging with redirect tracking
	page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
	page.on('pageerror', (error) => console.error('BROWSER ERROR:', error.message));

	// Track HTTP responses, especially redirects
	page.on('response', (response) => {
		const status = response.status();
		const url = response.url();
		const isRedirect = status >= 300 && status < 400;

		if (isRedirect) {
			console.log(`<<< REDIRECT ${status} ${url} →`, response.headers()['location']);
		} else {
			console.log(`<<< ${status} ${url}`);
		}
	});

	// Track frame navigation
	page.on('framenavigated', (frame) => {
		if (frame === page.mainFrame()) {
			console.log(`NAVIGATED TO: ${frame.url()}`);
		}
	});

	await page.goto('/register');
	await page.waitForLoadState('networkidle');

	console.log('\n=== STARTING REGISTRATION ===');
	console.log('Filling email:', uniqueEmail);
	await page.fill('input[name="email"]', uniqueEmail);

	console.log('Filling password: (24 characters)');
	await page.fill('input[name="password"]', password);

	console.log('\n=== SUBMITTING FORM ===');
	await page.click('button[type="submit"]');

	// Wait for navigation to complete
	await page.waitForTimeout(3000);

	console.log('\n=== FINAL STATE ===');
	console.log('Current URL:', page.url());
	console.log('Page title:', await page.title());

	// Check what's on the page
	const hasServerSelect = (await page.locator('select[name="server"]').count()) > 0;
	const hasWorldSelect = (await page.locator('select[name="world"]').count()) > 0;
	console.log('Has server select?', hasServerSelect);
	console.log('Has world select?', hasWorldSelect);
});
