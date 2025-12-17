import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fetchStructureMetadata, type StructureMetadata } from '$lib/api/structures';

export const load = (async ({ params, depends, cookies, fetch: eventFetch }) => {
	// Mark this data as dependent on game state changes
	depends('game:settlement');
	depends('game:data');

	const sessionToken = cookies.get('session');

	logger.debug('[SETTLEMENT DETAIL] Session token', {
		hasToken: !!sessionToken,
		tokenLength: sessionToken?.length
	});

	// ✅ Use native fetch for external Express API calls
	// Fetch settlement data (external Express API - requires explicit Cookie header)
	const settlementResponse = await globalThis.fetch(
		`${SERVER_API_URL}/settlements/${params.id}`,
		{
			headers: {
				Cookie: `session=${sessionToken}`
			}
		}
	);

	if (!settlementResponse.ok) {
		logger.error('[SETTLEMENT DETAIL] Failed to fetch settlement', {
			settlementId: params.id,
			status: settlementResponse.status
		});
		return {
			settlement: null,
			structures: [] as StructureMetadata[],
			lastUpdate: new Date().toISOString(),
			error: 'Settlement not found'
		};
	}

	const settlement = await settlementResponse.json();

	// ✅ Fetch structure metadata from INTERNAL SvelteKit API (use event.fetch)
	// Phase 5C: Removed forceRefresh parameter (caching removed from API wrapper)
	let structures: StructureMetadata[] = [];
	try {
		structures = await fetchStructureMetadata(eventFetch);
		logger.debug('[SETTLEMENT DETAIL] Structure metadata loaded', {
			count: structures.length
		});
	} catch (error) {
		logger.error('[SETTLEMENT DETAIL] Failed to fetch structure metadata', {
			error
		});
		// Continue without structure metadata - component can show error
	}

	// ✅ Fetch settlement structures from EXTERNAL Express API (use native fetch)
	logger.debug('[SETTLEMENT DETAIL] Fetching structures with auth', {
		url: `${SERVER_API_URL}/structures/by-settlement/${params.id}`,
		hasSessionToken: !!sessionToken,
		tokenLength: sessionToken?.length,
		cookieHeader: `session=${sessionToken?.substring(0, 8)}...`
	});

	const structuresResponse = await globalThis.fetch(
		`${SERVER_API_URL}/structures/by-settlement/${params.id}`,
		{
			headers: {
				Cookie: `session=${sessionToken}`
			}
		}
	);

	let settlementStructures = [];
	if (structuresResponse.ok) {
		settlementStructures = await structuresResponse.json();
		logger.debug('[SETTLEMENT DETAIL] Structures loaded via API', {
			count: settlementStructures.length
		});
	} else {
		logger.error('[SETTLEMENT DETAIL] Failed to fetch structures via API', {
			status: structuresResponse.status
		});
		// ✅ FALLBACK: Use structures from settlement if API fails
		if (settlement?.structures) {
			settlementStructures = settlement.structures;
			logger.debug('[SETTLEMENT DETAIL] Using structures from settlement object', {
				count: settlementStructures.length
			});
		}
	}

	// ✅ Fetch tile data from EXTERNAL Express API (use native fetch)
	let tile = null;
	if (settlement?.tileId) {
		logger.debug('[SETTLEMENT DETAIL] Fetching tile with auth', {
			url: `${SERVER_API_URL}/regions/tiles/${settlement.tileId}`,
			hasSessionToken: !!sessionToken,
			tokenLength: sessionToken?.length,
			cookieHeader: `session=${sessionToken?.substring(0, 8)}...`
		});

		// ✅ FIXED: Correct URL is /regions/tiles/:id (geography router is mounted at /regions)
		const tileResponse = await globalThis.fetch(
			`${SERVER_API_URL}/regions/tiles/${settlement.tileId}`,
			{
				headers: {
					Cookie: `session=${sessionToken}`
				}
			}
		);

		if (tileResponse.ok) {
			tile = await tileResponse.json();
			logger.debug('[SETTLEMENT DETAIL] Tile data loaded', {
				tileId: tile.id,
				plotSlots: tile.plotSlots
			});
		} else {
			logger.error('[SETTLEMENT DETAIL] Failed to fetch tile data', {
				tileId: settlement.tileId,
				status: tileResponse.status
			});
		}
	}

	logger.debug('[SETTLEMENT DETAIL] Settlement loaded', {
		settlementId: settlement.id,
		name: settlement.name,
		structuresCount: settlementStructures.length,
		tileLoaded: !!tile
	});

	return {
		settlement,
		structures,
		settlementStructures, // ✅ NEW: Add to return object
		tile, // ✅ NEW: Add tile data
		lastUpdate: new Date().toISOString()
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	buildStructure: async ({ request, params, cookies }) => {
		const formData = await request.formData();
		const sessionToken = cookies.get('session');
		const structureId = formData.get('structureId');
		const tileId = formData.get('tileId');
		const slotPosition = formData.get('slotPosition');

		if (!structureId || typeof structureId !== 'string') {
			logger.error('[BUILD STRUCTURE] Invalid structure ID', { structureId });
			return fail(400, {
				success: false,
				message: 'Invalid structure ID'
			});
		}

		try {
			// Build request body with required fields
			// ✅ FIXED: Send structureId (database CUID), not structureName
			const requestBody: {
				settlementId: string;
				structureId: string;
				tileId?: string;
				slotPosition?: number;
			} = {
				settlementId: params.id,
				structureId: structureId // Database CUID from metadata API
			};

			// Add tileId and slotPosition if building an extractor
			if (tileId && typeof tileId === 'string') {
				requestBody.tileId = tileId;
			}
			if (slotPosition && typeof slotPosition === 'string') {
				requestBody.slotPosition = Number.parseInt(slotPosition, 10);
			}

			// ✅ Call the REST API endpoint - EXTERNAL Express API (use native fetch)
			// External API - need explicit Cookie header for authentication
			const response = await globalThis.fetch(`${SERVER_API_URL}/structures/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionToken}`
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const result = await response.json();
				logger.error('[BUILD STRUCTURE] Failed to build structure', {
					settlementId: params.id,
					structureId,
					tileId,
					slotPosition,
					status: response.status,
					error: result
				});

				return fail(response.status, {
					success: false,
					message: result.message || 'Failed to build structure',
					reasons: [result.code || 'UNKNOWN_ERROR']
				});
			}

			const result = await response.json();

			logger.info('[BUILD STRUCTURE] Structure built successfully', {
				settlementId: params.id,
				structureId,
				tileId,
				slotPosition,
				structureName: result.name
			});

			return {
				success: true,
				message: `${result.name || 'Structure'} built successfully!`
			};
		} catch (error) {
			logger.error('[BUILD STRUCTURE] Error building structure', {
				settlementId: params.id,
				structureId,
				tileId,
				slotPosition,
				error
			});

			return fail(500, {
				success: false,
				message: 'An error occurred while building the structure'
			});
		}
	},

	upgradeStructure: async ({ request, cookies }) => {
		const formData = await request.formData();
		const sessionToken = cookies.get('session');
		const structureId = formData.get('structureId');

		if (!structureId || typeof structureId !== 'string') {
			logger.error('[UPGRADE STRUCTURE] Invalid structure ID', { structureId });
			return fail(400, {
				success: false,
				message: 'Invalid structure ID'
			});
		}

		try {
			// ✅ EXTERNAL Express API (use native fetch)
			const response = await globalThis.fetch(
				`${SERVER_API_URL}/structures/${structureId}/upgrade`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: `session=${sessionToken}`
					}
				}
			);

			if (!response.ok) {
				const result = await response.json();
				logger.error('[UPGRADE STRUCTURE] Failed to upgrade structure', {
					structureId,
					status: response.status,
					error: result
				});

				return fail(response.status, {
					success: false,
					message: result.message || 'Failed to upgrade structure',
					reasons: [result.code || 'UNKNOWN_ERROR']
				});
			}

			const result = await response.json();

			logger.info('[UPGRADE STRUCTURE] Structure upgraded successfully', {
				structureId,
				structureName: result.name
			});

			return {
				success: true,
				message: `${result.name || 'Structure'} upgraded successfully!`
			};
		} catch (error) {
			logger.error('[UPGRADE STRUCTURE] Error upgrading structure', {
				structureId,
				error
			});

			return fail(500, {
				success: false,
				message: 'An error occurred while upgrading the structure'
			});
		}
	},

	repairStructure: async ({ request, cookies }) => {
		const formData = await request.formData();
		const sessionToken = cookies.get('session');
		const structureId = formData.get('structureId');

		if (!structureId || typeof structureId !== 'string') {
			logger.error('[REPAIR STRUCTURE] Invalid structure ID', { structureId });
			return fail(400, {
				success: false,
				message: 'Invalid structure ID'
			});
		}

		try {
			// ✅ EXTERNAL Express API (use native fetch)
			const response = await globalThis.fetch(
				`${SERVER_API_URL}/structures/${structureId}/repair`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Cookie: `session=${sessionToken}`
					}
				}
			);

			if (!response.ok) {
				const result = await response.json();
				logger.error('[REPAIR STRUCTURE] Failed to repair structure', {
					structureId,
					status: response.status,
					error: result
				});

				return fail(response.status, {
					success: false,
					message: result.message || 'Failed to repair structure',
					reasons: [result.code || 'UNKNOWN_ERROR']
				});
			}

			const result = await response.json();

			logger.info('[REPAIR STRUCTURE] Structure repaired successfully', {
				structureId,
				structureName: result.name
			});

			return {
				success: true,
				message: `${result.name || 'Structure'} repaired successfully!`
			};
		} catch (error) {
			logger.error('[REPAIR STRUCTURE] Error repairing structure', {
				structureId,
				error
			});

			return fail(500, {
				success: false,
				message: 'An error occurred while repairing the structure'
			});
		}
	},

	demolishStructure: async ({ request, cookies }) => {
		const formData = await request.formData();
		const sessionToken = cookies.get('session');
		const structureId = formData.get('structureId');

		if (!structureId || typeof structureId !== 'string') {
			logger.error('[DEMOLISH STRUCTURE] Invalid structure ID', { structureId });
			return fail(400, {
				success: false,
				message: 'Invalid structure ID'
			});
		}

		try {
			// ✅ EXTERNAL Express API (use native fetch)
			const response = await globalThis.fetch(`${SERVER_API_URL}/structures/${structureId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionToken}`
				}
			});

			if (!response.ok) {
				const result = await response.json();
				logger.error('[DEMOLISH STRUCTURE] Failed to demolish structure', {
					structureId,
					status: response.status,
					error: result
				});

				return fail(response.status, {
					success: false,
					message: result.message || 'Failed to demolish structure',
					reasons: [result.code || 'UNKNOWN_ERROR']
				});
			}

			await response.json();

			logger.info('[DEMOLISH STRUCTURE] Structure demolished successfully', {
				structureId
			});

			return {
				success: true,
				message: `Structure demolished successfully!`
			};
		} catch (error) {
			logger.error('[DEMOLISH STRUCTURE] Error demolishing structure', {
				structureId,
				error
			});

			return fail(500, {
				success: false,
				message: 'An error occurred while demolishing the structure'
			});
		}
	}
};
