import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, depends, cookies }) => {
    // Mark this data as dependent on game state changes
    depends('game:settlement');
    depends('game:data');

    const sessionToken = cookies.get('session');

    const response = await fetch(`${API_URL}/settlements/${params.id}`, {
        headers: {
            'Cookie': `session=${sessionToken}`
        }
    });
    
    if (!response.ok) {
        logger.error('[SETTLEMENT DETAIL] Failed to fetch settlement', {
            settlementId: params.id,
            status: response.status
        });
        return {
            settlement: null,
            lastUpdate: new Date().toISOString(),
            error: 'Settlement not found'
        };
    }

    const settlement = await response.json();

    logger.debug('[SETTLEMENT DETAIL] Settlement loaded', {
        settlementId: settlement.id,
        name: settlement.name
    });

    return {
        settlement,
        lastUpdate: new Date().toISOString()
    }
}) satisfies PageServerLoad;

// NOTE: Structure building is handled via Socket.IO events, not form actions.
// See: client/src/lib/stores/game/socket.ts - 'build-structure' event
// This ensures real-time updates to all players in the world.