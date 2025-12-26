/**
 * Shared Test Data Helper
 * 
 * Provides access to shared test data created by global-setup.ts.
 * This allows tests to reuse servers and worlds instead of creating new ones.
 */

export interface SharedTestData {
	testServerId: string;
	adminEmail: string;
	adminSessionToken: string;
	generalWorldId?: string;
	disasterWorldId?: string;
	multiplayerWorldId?: string;
}

/**
 * Get shared test data created during global setup.
 * This data is available to all tests and is created only once.
 * 
 * @returns Shared test data including server ID, admin credentials, and world IDs
 * @throws Error if required data is not available
 */
export function getSharedTestData(): SharedTestData {
	const testServerId = process.env.E2E_TEST_SERVER_ID;
	const adminEmail = process.env.E2E_ADMIN_EMAIL;
	const adminSessionToken = process.env.E2E_ADMIN_TOKEN;
	const generalWorldId = process.env.E2E_GENERAL_WORLD_ID;

	if (!testServerId || !adminEmail || !adminSessionToken) {
		throw new Error(
			'Shared test data not available. Make sure global-setup.ts ran successfully.'
		);
	}

	return {
		testServerId,
		adminEmail,
		adminSessionToken,
		generalWorldId,
		disasterWorldId: process.env.E2E_DISASTER_WORLD_ID,
		multiplayerWorldId: process.env.E2E_MULTIPLAYER_WORLD_ID
	};
}

/**
 * Check if shared test data is available.
 * Useful for optional features or graceful degradation.
 */
export function hasSharedTestData(): boolean {
	return !!(
		process.env.E2E_TEST_SERVER_ID &&
		process.env.E2E_ADMIN_EMAIL &&
		process.env.E2E_ADMIN_TOKEN
	);
}
