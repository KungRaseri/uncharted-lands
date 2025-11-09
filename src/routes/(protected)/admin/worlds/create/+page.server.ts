// TODO: Complete migration to REST API
// World generation needs to be moved to server-side with proper API endpoints:
// 1. POST /api/worlds/generate endpoint for world creation
// 2. World generation logic should run on server (not client)
// 3. Proper transaction handling for large bulk inserts
// 4. Biomes, tiles, plots should all be created server-side

import { fail, redirect } from "@sveltejs/kit"
import { logger } from "$lib/utils/logger"
import type { Actions, PageServerLoad } from "./$types"

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    if (!locals.account || locals.account.role !== 'ADMINISTRATOR') {
        throw redirect(302, '/')
    }

    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[WORLD CREATE] Loading servers', {
            hasSessionToken: !!sessionToken
        });

        const response = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });

        if (!response.ok) {
            logger.error('[WORLD CREATE] Failed to fetch servers', {
                status: response.status
            });
            return { servers: [] };
        }

        const servers = await response.json();
        
        logger.info('[WORLD CREATE] Servers loaded', {
            count: servers.length
        });
        
        return { servers };
    } catch (error) {
        logger.error('[WORLD CREATE] Error loading servers', error);
        return { servers: [] };
    }
}

export const actions: Actions = {
    create: async ({ request, locals }) => {
        logger.warn('[WORLD CREATE] World creation not yet implemented');
        // STUB: World generation not yet migrated to server
        // This is a complex operation that needs to be done server-side
        return fail(501, { 
            invalid: true,
            message: 'World generation is being migrated to server-side processing. Please wait for this feature to be completed.' 
        })
    }
}
