import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"
import { logger } from "$lib/utils/logger"

export const load: PageServerLoad = async ({ params, cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        const response = await fetch(`${API_URL}/players/${params.id}`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                logger.warn('[ADMIN PLAYER] Player not found', { playerId: params.id });
                throw error(404);
            }
            logger.error('[ADMIN PLAYER] Failed to fetch player', {
                playerId: params.id,
                status: response.status
            });
            throw error(500);
        }
        
        const account = await response.json();
        
        logger.debug('[ADMIN PLAYER] Player loaded', {
            playerId: account.id,
            email: logger.maskEmail(account.email)
        });
        
        return { account };
    } catch (err) {
        if (err instanceof Response) throw err;
        logger.error('[ADMIN PLAYER] Error loading player', err);
        throw error(500);
    }
}
