import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"
import { logger } from "$lib/utils/logger"

export const load: PageServerLoad = async ({ params, cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        const response = await fetch(`${API_URL}/regions/plots/${params.id}`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                logger.warn('[ADMIN PLOT] Plot not found', { plotId: params.id });
                throw error(404);
            }
            logger.error('[ADMIN PLOT] Failed to fetch plot', {
                plotId: params.id,
                status: response.status
            });
            throw error(500);
        }
        
        const plot = await response.json();
        
        logger.debug('[ADMIN PLOT] Plot loaded', {
            plotId: plot.id
        });
        
        return { plot };
    } catch (err) {
        if (err instanceof Response) throw err;
        logger.error('[ADMIN PLOT] Error loading plot', err);
        throw error(500);
    }
}