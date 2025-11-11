import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"
import { logger } from "$lib/utils/logger"

export const load: PageServerLoad = async ({ cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        const response = await fetch(`${API_URL}/settlements`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            logger.error('[ADMIN SETTLEMENTS] Failed to fetch settlements', {
                status: response.status
            });
            throw error(500);
        }
        
        const settlements = await response.json();
        
        logger.debug('[ADMIN SETTLEMENTS] Settlements loaded', {
            count: settlements.length
        });
        
        return { settlements };
    } catch (err) {
        if (err instanceof Response) throw err;
        logger.error('[ADMIN SETTLEMENTS] Error loading settlements', err);
        throw error(500);
    }
}
