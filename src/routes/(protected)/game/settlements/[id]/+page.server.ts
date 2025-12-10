import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fetchStructureMetadata, type StructureMetadata } from '$lib/api/structures';

export const load = (async ({ params, depends, cookies }) => {
	// Mark this data as dependent on game state changes
	depends('game:settlement');
	depends('game:data');

	const sessionToken = cookies.get('session');

	// Fetch settlement data (use native fetch, not SvelteKit fetch)
	const settlementResponse = await fetch(`${API_URL}/settlements/${params.id}`, {
		headers: {
			Cookie: `session=${sessionToken}`
		}
	});

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

	// Fetch structure metadata from API (use default native fetch)
	let structures: StructureMetadata[] = [];
	try {
		structures = await fetchStructureMetadata(false);
		logger.debug('[SETTLEMENT DETAIL] Structure metadata loaded', {
			count: structures.length
		});
	} catch (error) {
		logger.error('[SETTLEMENT DETAIL] Failed to fetch structure metadata', {
			error
		});
		// Continue without structure metadata - component can show error
	}

	// ✅ NEW: Fetch settlement structures
	const structuresResponse = await fetch(`${API_URL}/structures/by-settlement/${params.id}`, {
		headers: {
			Cookie: `session=${sessionToken}`
		}
	});

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

	// ✅ NEW: Fetch tile data for the settlement
	let tile = null;
	if (settlement?.tileId) {
		// ✅ FIXED: Correct URL is /regions/tiles/:id (geography router is mounted at /regions)
		const tileResponse = await fetch(`${API_URL}/regions/tiles/${settlement.tileId}`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

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
		const structureId = formData.get('structureId');

		if (!structureId || typeof structureId !== 'string') {
			logger.error('[BUILD STRUCTURE] Invalid structure ID', { structureId });
			return fail(400, {
				success: false,
				message: 'Invalid structure ID'
			});
		}

		const sessionToken = cookies.get('session');

		try {
			// Call the REST API endpoint for building structures
			const response = await fetch(`${API_URL}/structures/create`, {
				method: 'POST',
				headers: {
					Cookie: `session=${sessionToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					settlementId: params.id,
					buildingType: structureId,
					name: undefined,
					description: undefined
				})
			});

			if (!response.ok) {
				const result = await response.json();
				logger.error('[BUILD STRUCTURE] Failed to build structure', {
					settlementId: params.id,
					structureId,
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
				error
			});

			return fail(500, {
				success: false,
				message: 'An error occurred while building the structure'
			});
		}
	}
};
