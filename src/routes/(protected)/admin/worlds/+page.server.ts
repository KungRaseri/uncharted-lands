import type { PageServerLoad, Actions, Action } from "./$types"
import { fail } from "@sveltejs/kit"
import { logger } from "$lib/utils/logger"
import { API_URL } from "$lib/config"
import type { World } from "$lib/types/api"

export const load: PageServerLoad = async ({ cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[ADMIN WORLDS] Loading worlds list', {
            hasSessionToken: !!sessionToken
        });

        const response = await fetch(`${API_URL}/worlds`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            logger.error('[ADMIN WORLDS] Failed to fetch worlds', {
                status: response.status,
                statusText: response.statusText
            });
            return { worlds: [] };
        }

        const worlds: World[] = await response.json();

        logger.info('[ADMIN WORLDS] Successfully loaded worlds', {
            count: worlds.length
        });

        return { worlds };
    } catch (err) {
        logger.error('[ADMIN WORLDS] Error loading worlds', err);
        return { worlds: [] };
    }
}

const deleteWorld: Action = async ({ request, cookies }) => {
    const data = await request.formData();
    const worldId = data.get('worldId');

    if (!worldId || typeof worldId !== 'string') {
        logger.warn('[ADMIN WORLDS] Delete attempt without world ID');
        return fail(400, { success: false, message: 'World ID is required' });
    }

    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[ADMIN WORLDS] Deleting world', { worldId });

        const response = await fetch(`${API_URL}/worlds/${worldId}`, {
            method: 'DELETE',
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            logger.error('[ADMIN WORLDS] Failed to delete world', {
                worldId,
                status: response.status,
                error: errorData
            });
            return fail(response.status, { 
                success: false, 
                message: errorData.error || 'Failed to delete world', 
                worldId 
            });
        }

        logger.info('[ADMIN WORLDS] World deleted successfully', { worldId });
        return { success: true, message: 'World deleted successfully', worldId };
    } catch (err) {
        logger.error('[ADMIN WORLDS] Error deleting world', err, { worldId });
        return fail(500, { success: false, message: 'Failed to delete world', worldId });
    }
}

export const actions: Actions = { delete: deleteWorld }
