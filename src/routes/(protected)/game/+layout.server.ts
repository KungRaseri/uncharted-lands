import { API_URL } from "$lib/config";
import { logger } from "$lib/utils/logger";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[GAME LAYOUT] Loading servers', {
            hasSessionToken: !!sessionToken
        });

        const response = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            logger.error('[GAME LAYOUT] Failed to fetch servers', {
                status: response.status,
                statusText: response.statusText
            });
            return { 
                server: null,
                sessionToken: sessionToken || null
            };
        }
        
        const servers = await response.json();
        
        logger.info('[GAME LAYOUT] Successfully loaded servers', {
            count: servers?.length || 0,
            hasServer: servers && servers.length > 0
        });
        
        // Return first server and session token
        return {
            server: servers && servers.length > 0 ? servers[0] : null,
            sessionToken: sessionToken || null
        };
    } catch (error) {
        logger.error('[GAME LAYOUT] Error fetching servers', error);
        return { 
            server: null,
            sessionToken: null
        };
    }
}