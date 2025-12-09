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

	// Enable verbose logging
	page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
	page.on('pageerror', (error) => console.error('BROWSER ERROR:', error.message));
	page.on('request', (request) => console.log('>>>', request.method(), request.url()));
	page.on('response', (response) => console.log('<<<', response.status(), response.url()));

	await page.goto('/register');
	await page.waitForLoadState('networkidle');

	console.log('Filling email:', uniqueEmail);
	await page.fill('input[name="email"]', uniqueEmail);

	console.log('Filling password: (24 characters)');
	await page.fill('input[name="password"]', password);

	console.log('Clicking submit button...');

	// Try to click and listen for navigation or errors
	await Promise.race([
		page.click('button[type="submit"]').then(() => console.log('Button clicked')),
		page.waitForTimeout(5000).then(() => console.log('5 seconds elapsed, no submission'))
	]);

	// Wait a bit to see what happens
	await page.waitForTimeout(2000);

	console.log('Current URL:', page.url());
});
