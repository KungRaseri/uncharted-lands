/**
 * Playwright Global Teardown
 * 
 * Runs ONCE after all test suites complete to clean up shared test data.
 */

import { chromium, type FullConfig } from '@playwright/test';

const API_BASE_URL = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

async function globalTeardown(_config: FullConfig) {
	console.log('\n========================================');
	console.log('🧹 GLOBAL TEST TEARDOWN - Cleaning up shared test data');
	console.log('========================================\n');

	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		const adminToken = process.env.E2E_ADMIN_TOKEN;
		const generalWorldId = process.env.E2E_GENERAL_WORLD_ID;

		if (!adminToken) {
			console.log('⚠️  No admin token found, skipping cleanup');
			return;
		}

		// Delete shared world (optional - you might want to keep it for inspection)
		if (generalWorldId) {
			console.log('🗑️  Deleting shared world...');
			try {
				await page.request.delete(`${API_BASE_URL}/worlds/${generalWorldId}`, {
					headers: { Cookie: `session=${adminToken}` }
				});
				console.log('✅ Shared world deleted');
			} catch {
				console.log('⚠️  Failed to delete shared world (might not exist)');
			}
		}

		// Note: We intentionally leave the test server for reuse across test runs
		// It will be reused in the next global setup

		console.log('\n========================================');
		console.log('✅ GLOBAL TEARDOWN COMPLETE');
		console.log('========================================\n');

	} catch (error) {
		console.error('\n⚠️  GLOBAL TEARDOWN ERROR (non-fatal):', error);
	} finally {
		await page.close();
		await context.close();
		await browser.close();
	}
}

export default globalTeardown;
