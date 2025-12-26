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

		if (!adminToken) {
			console.log('⚠️  No admin token found, skipping cleanup');
			return;
		}

		// ============================================================================
		// STEP 1: Delete ALL test worlds (by name pattern)
		// ============================================================================
		console.log('🗑️  Deleting all test worlds...');
		try {
			const worldsResponse = await page.request.get(`${API_BASE_URL}/worlds`, {
				headers: { Cookie: `session=${adminToken}` }
			});

			if (worldsResponse.ok()) {
				const worlds = await worldsResponse.json();
				const testWorldPatterns = [
					'E2E',
					'Test',
					'Shared',
					'Population',
					'Construction',
					'Disaster',
					'Settlement',
					'Building',
					'Resource',
					'Structure',
					'Error',
					'Network',
					'Multiplayer'
				];

				const testWorldsToDelete = worlds.filter((world: any) => {
					const worldName = world.name || '';
					return testWorldPatterns.some((pattern) =>
						worldName.includes(pattern)
					);
				});

				console.log(`   Found ${testWorldsToDelete.length} test worlds to delete`);

				for (const world of testWorldsToDelete) {
					try {
						await page.request.delete(`${API_BASE_URL}/worlds/${world.id}`, {
							headers: { Cookie: `session=${adminToken}` }
						});
						console.log(`   ✅ Deleted world: ${world.name} (${world.id})`);
					} catch (error) {
						console.log(`   ⚠️  Failed to delete world ${world.name}:`, error);
					}
				}
			}
		} catch (error) {
			console.log('⚠️  Failed to query/delete test worlds:', error);
		}

		// ============================================================================
		// STEP 2: Delete ALL test accounts (@test.local, @test.com)
		// ============================================================================
		console.log('🗑️  Deleting all test accounts...');
		try {
			const accountsResponse = await page.request.get(`${API_BASE_URL}/accounts`, {
				headers: { Cookie: `session=${adminToken}` }
			});

			if (accountsResponse.ok()) {
				const accounts = await accountsResponse.json();
				const testAccounts = accounts.filter((account: any) => {
					const email = account.email || '';
					return email.includes('@test.local') || email.includes('@test.com');
				});

				console.log(`   Found ${testAccounts.length} test accounts to delete`);

				for (const account of testAccounts) {
					try {
						await page.request.delete(`${API_BASE_URL}/accounts/${account.id}`, {
							headers: { Cookie: `session=${adminToken}` }
						});
						console.log(`   ✅ Deleted account: ${account.email} (${account.id})`);
					} catch (error) {
						console.log(`   ⚠️  Failed to delete account ${account.email}:`, error);
					}
				}
			}
		} catch (error) {
			console.log('⚠️  Failed to query/delete test accounts:', error);
		}

		// ============================================================================
		// STEP 3: Keep test server for reuse
		// ============================================================================
		// Note: We intentionally leave the test server (E2E Test Server) for reuse
		// across test runs. It will be reused in the next global setup.

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
