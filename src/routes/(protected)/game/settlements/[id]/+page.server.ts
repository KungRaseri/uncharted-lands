import { API_URL } from '$lib/config';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, depends, fetch }) => {
    // Mark this data as dependent on game state changes
    depends('game:settlement');
    depends('game:data');

    const response = await fetch(`${API_URL}/settlements/${params.id}`);
    
    if (!response.ok) {
        return {
            settlement: null,
            lastUpdate: new Date().toISOString(),
            error: 'Settlement not found'
        };
    }

    const settlement = await response.json();

    return {
        settlement,
        lastUpdate: new Date().toISOString()
    }
}) satisfies PageServerLoad;

// NOTE: Structure building is handled via Socket.IO events, not form actions.
// See: client/src/lib/stores/game/socket.ts - 'build-structure' event
// This ensures real-time updates to all players in the world.