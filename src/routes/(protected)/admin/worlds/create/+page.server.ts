// TODO: Complete migration to REST API
// World generation needs to be moved to server-side with proper API endpoints:
// 1. POST /api/worlds/generate endpoint for world creation
// 2. World generation logic should run on server (not client)
// 3. Proper transaction handling for large bulk inserts
// 4. Biomes, tiles, plots should all be created server-side

import { fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ fetch, locals }) => {
    if (!locals.account || locals.account.role !== 'ADMINISTRATOR') {
        throw redirect(302, '/')
    }

    try {
        const response = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${locals.account.userAuthToken}`
            }
        });

        if (!response.ok) {
            console.error('[WORLD CREATE] Failed to fetch servers');
            return { servers: [] };
        }

        const servers = await response.json();
        return { servers };
    } catch (error) {
        console.error('[WORLD CREATE] Error:', error);
        return { servers: [] };
    }
}

export const actions: Actions = {
    create: async ({ request, locals }) => {
        // STUB: World generation not yet migrated to server
        // This is a complex operation that needs to be done server-side
        return fail(501, { 
            invalid: true,
            message: 'World generation is being migrated to server-side processing. Please wait for this feature to be completed.' 
        })
    }
}
