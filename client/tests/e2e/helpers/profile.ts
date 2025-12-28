/**
 * Profile Test Helpers
 *
 * Utilities for creating and managing player profiles in E2E tests
 */

import type { APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

export interface ProfileData {
	id: string;
	username: string;
	picture?: string;
	accountId: string;
}

/**
 * Get profile for an account (if it exists)
 * @param request - Playwright API request context
 * @param sessionToken - Session token for authentication
 * @returns Profile data if exists, null otherwise
 */
export async function getProfileForAccount(
	request: APIRequestContext,
	sessionToken: string
): Promise<ProfileData | null> {
	try {
		const response = await request.get(`${API_BASE_URL}/account/me`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok()) {
			console.warn(`[PROFILE HELPER] Failed to get account: ${response.status()}`);
			return null;
		}

		const account = await response.json();

		if (!account.profile) {
			console.log('[PROFILE HELPER] Account has no profile yet');
			return null;
		}

		console.log('[PROFILE HELPER] Found existing profile:', account.profile.id);
		return account.profile;
	} catch (error) {
		console.error('[PROFILE HELPER] Error getting profile:', error);
		return null;
	}
}

/**
 * Create a profile by creating a settlement (which auto-creates profile)
 * This is the standard way to create a profile in the application flow
 *
 * @param request - Playwright API request context
 * @param sessionToken - Session token for authentication
 * @param accountId - Account ID for the profile
 * @param worldId - World ID for the settlement
 * @param serverId - Server ID for the settlement
 * @param username - Username for the profile
 * @returns Object with both profile and settlement data
 */
export async function ensureProfileExists(
	request: APIRequestContext,
	sessionToken: string,
	accountId: string,
	worldId: string,
	serverId: string,
	username: string
): Promise<{ profile: ProfileData; settlementId: string }> {
	// First check if profile already exists
	const existingProfile = await getProfileForAccount(request, sessionToken);
	if (existingProfile) {
		console.log('[PROFILE HELPER] Using existing profile:', existingProfile.id);

		// Get the settlement for this profile in this world
		const settlementsResponse = await request.get(
			`${API_BASE_URL}/settlements?worldId=${worldId}`,
			{
				headers: {
					Cookie: `session=${sessionToken}`
				}
			}
		);

		if (!settlementsResponse.ok()) {
			throw new Error(`Failed to get settlements: ${settlementsResponse.status()}`);
		}

		const settlements = await settlementsResponse.json();
		if (!settlements || settlements.length === 0) {
			throw new Error('Profile exists but no settlement found in this world');
		}

		const settlement = settlements[0];
		console.log('[PROFILE HELPER] Using existing settlement:', settlement.id);
		return { profile: existingProfile, settlementId: settlement.id };
	}

	console.log('[PROFILE HELPER] No profile exists, creating via settlement...');

	// Create a settlement, which will auto-create the profile
	const settlementResponse = await request.post(`${API_BASE_URL}/settlements`, {
		headers: {
			Cookie: `session=${sessionToken}`
		},
		data: {
			worldId,
			serverId,
			accountId,
			username,
			name: `${username}'s Settlement`
		}
	});

	if (!settlementResponse.ok()) {
		const errorText = await settlementResponse.text();
		throw new Error(
			`Failed to create settlement/profile: ${settlementResponse.status()} ${errorText}`
		);
	}

	const settlement = await settlementResponse.json();
	console.log('[PROFILE HELPER] Settlement created:', settlement.id);

	// Now get the profile that was created
	const profile = await getProfileForAccount(request, sessionToken);
	if (!profile) {
		throw new Error('Profile was not created even after settlement creation');
	}

	console.log('[PROFILE HELPER] Profile created successfully:', profile.id);
	return { profile, settlementId: settlement.id };
}

/**
 * Ensure a profile exists for the account without creating a settlement
 * Uses a direct API endpoint (if available) or creates a temporary settlement
 *
 * @param request - Playwright API request context
 * @param sessionToken - Session token for authentication
 * @param accountId - Account ID for the profile
 * @param username - Username for the profile
 * @returns Profile data
 */
export async function createProfileOnly(
	request: APIRequestContext,
	sessionToken: string,
	accountId: string,
	username: string
): Promise<ProfileData> {
	// Check if profile already exists
	const existingProfile = await getProfileForAccount(request, sessionToken);
	if (existingProfile) {
		return existingProfile;
	}

	// Try direct profile creation endpoint (if it exists)
	try {
		const response = await request.post(`${API_BASE_URL}/profiles`, {
			headers: {
				Cookie: `session=${sessionToken}`
			},
			data: {
				username,
				accountId
			}
		});

		if (response.ok()) {
			const profile = await response.json();
			console.log('[PROFILE HELPER] Profile created via API:', profile.id);
			return profile;
		}
	} catch (error: unknown) {
		// Direct profile endpoint doesn't exist, will use settlement method instead
		console.log('[PROFILE HELPER] Direct profile creation not available:', error);
	}

	// If no direct endpoint, we need more context (worldId, serverId)
	// This method should only be used when those are available
	throw new Error(
		'Cannot create profile without settlement - use ensureProfileExists with world/server IDs'
	);
}
