import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	try {
		const sessionToken = cookies.get('session');

		logger.debug('[GAME LAYOUT] Loading servers', {
			hasSessionToken: !!sessionToken
		});

		// Fetch all servers
		const response = await fetch(`${SERVER_API_URL}/servers`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			logger.error('[GAME LAYOUT] Failed to fetch servers', {
				status: response.status,
				statusText: response.statusText
			});
			return {
				server: null,
				worldId: null,
				profileId: locals.account?.profile?.id || null,
				sessionToken: sessionToken || null
			};
		}

		const servers = await response.json();

		logger.info('[GAME LAYOUT] Successfully loaded servers', {
			count: servers?.length || 0,
			hasServer: servers && servers.length > 0
		});

		// Get player's profile ID to find their settlement's world
		const profileId = locals.account?.profile?.id;

		if (!profileId) {
			logger.debug('[GAME LAYOUT] No profile ID - using first server');
			return {
				server: servers && servers.length > 0 ? servers[0] : null,
				worldId: null,
				profileId: null,
				sessionToken: sessionToken || null
			};
		}

		// Fetch player's settlements with full nested data (tile → region → world → server)
		try {
			logger.debug('[GAME LAYOUT] Fetching player settlements', { profileId });

			const settlementsResponse = await fetch(
				`${SERVER_API_URL}/settlements?playerProfileId=${profileId}`,
				{
					headers: {
						Cookie: `session=${sessionToken}`
					}
				}
			);

			if (settlementsResponse.ok) {
				const playerSettlements = await settlementsResponse.json();

				logger.debug('[GAME LAYOUT] Settlements response', {
					count: playerSettlements?.length || 0,
					hasSettlements: playerSettlements && playerSettlements.length > 0
				});

				if (playerSettlements && playerSettlements.length > 0) {
					// Get the world and server from the first settlement
					const settlement = playerSettlements[0];
					const worldId = settlement.tile?.region?.worldId;
					const serverId = settlement.tile?.region?.world?.serverId;

					logger.debug('[GAME LAYOUT] First settlement data', {
						settlementId: settlement.id,
						settlementName: settlement.name,
						worldId,
						serverId,
						worldName: settlement.tile?.region?.world?.name,
						serverName: settlement.tile?.region?.world?.server?.name
					});

					// Find the matching server in our servers list
					if (serverId && servers) {
						const matchingServer = servers.find((s: { id: string }) => s.id === serverId);

						if (matchingServer) {
							logger.info('[GAME LAYOUT] Found matching server for player settlement', {
								serverName: matchingServer.name,
								serverId,
								worldId,
								settlementName: settlement.name
							});
							return {
								server: matchingServer,
								worldId,
								profileId,
								sessionToken: sessionToken || null
							};
						} else {
							logger.warn('[GAME LAYOUT] Server from settlement not found in servers list', {
								serverId,
								worldId,
								availableServerIds: servers.map((s: { id: string; name: string }) => ({
									id: s.id,
									name: s.name
								}))
							});
						}
					} else {
						logger.warn('[GAME LAYOUT] Settlement missing world/server data', {
							hasTile: !!settlement.tile,
							hasRegion: !!settlement.tile?.region,
							hasWorld: !!settlement.tile?.region?.world,
							hasServer: !!settlement.tile?.region?.world?.server
						});
					}
				} else {
					logger.debug('[GAME LAYOUT] Player has no settlements');
				}
			} else {
				logger.warn('[GAME LAYOUT] Settlements API returned non-OK status', {
					status: settlementsResponse.status,
					statusText: settlementsResponse.statusText
				});
			}
		} catch (error) {
			logger.warn('[GAME LAYOUT] Error fetching player settlement, falling back to first server', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}

		// Fallback to first server if no settlement found or error occurred
		logger.debug('[GAME LAYOUT] Using fallback (first server)');
		return {
			server: servers && servers.length > 0 ? servers[0] : null,
			worldId: null,
			profileId,
			sessionToken: sessionToken || null
		};
	} catch (error) {
		logger.error('[GAME LAYOUT] Error fetching servers', error);
		return {
			server: null,
			worldId: null,
			profileId: null,
			sessionToken: null
		};
	}
};
