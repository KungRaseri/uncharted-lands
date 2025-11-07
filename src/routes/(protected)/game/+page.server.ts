import { API_URL } from "$lib/config";
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals, depends, fetch }) => {
    // Mark this data as dependent on game state changes
    // When tick occurs, calling invalidate('game:settlements') will refresh this
    depends('game:settlements');
    depends('game:data');

    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }

    // Fetch settlements from REST API
    const response = await fetch(`${API_URL}/settlements?playerProfileId=${locals.account.profile.id}`);
    
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
}