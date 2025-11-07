import { API_URL } from '$lib/config';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, depends, fetch }) => {
    // Mark this data as dependent on game state changes
    depends('game:settlements');
    depends('game:data');

    const profileId = locals.account?.profile?.id;
    if (!profileId) {
        return { settlements: [], lastUpdate: new Date().toISOString() };
    }

    const response = await fetch(`${API_URL}/settlements?playerProfileId=${profileId}`);
    
    if (!response.ok) {
        console.error('Failed to fetch settlements:', await response.text());
        return {
            settlements: [],
            lastUpdate: new Date().toISOString()
        };
    }

    const settlements = await response.json();

    return {
        settlements,
        lastUpdate: new Date().toISOString()
    }
}) satisfies PageServerLoad;