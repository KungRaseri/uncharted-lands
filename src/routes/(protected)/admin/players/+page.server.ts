import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"
import { logger } from "$lib/utils/logger"
import type { PlayerWithRelations } from "$lib/types/api"

export const load: PageServerLoad = async ({ cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        const response = await fetch(`${API_URL}/players`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            logger.error('[ADMIN PLAYERS] Failed to fetch players', {
                status: response.status
            });
            return { accounts: [] };
        }
        
        const accounts: PlayerWithRelations[] = await response.json();
        
        logger.info('[ADMIN PLAYERS] Players loaded', {
            count: accounts.length
        });
        
        return { accounts };
    } catch (err) {
        logger.error('[ADMIN PLAYERS] Error loading players', err);
        return { accounts: [] };
    }
}
