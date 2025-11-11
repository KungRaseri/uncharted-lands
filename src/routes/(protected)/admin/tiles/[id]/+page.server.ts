import { error } from "@sveltejs/kit"
import { logger } from "$lib/utils/logger"
import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ params, cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[ADMIN TILE] Loading tile details', {
            tileId: params.id,
            hasSessionToken: !!sessionToken
        });

        const response = await fetch(`${API_URL}/regions/tiles/${params.id}`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                logger.warn('[ADMIN TILE] Tile not found', { tileId: params.id });
                throw error(404);
            }
            
            logger.error('[ADMIN TILE] Failed to fetch tile', {
                tileId: params.id,
                status: response.status
            });
            throw error(500);
        }
        
        const tile = await response.json();
        
        // Calculate tile position within region (10x10 grid)
        const tileIndex = tile.Region.tiles.findIndex((t: any) => t.id === tile.id);
        const tileX = tileIndex % 10;
        const tileY = Math.floor(tileIndex / 10);
        
        logger.info('[ADMIN TILE] Successfully loaded tile', {
            tileId: params.id,
            position: `(${tileX}, ${tileY})`,
            regionId: tile.Region.id
        });
        
        return {
            tile,
            regionTiles: tile.Region.tiles,
            tileX,
            tileY
        }
    } catch (err) {
        // Re-throw SvelteKit errors
        if (err && typeof err === 'object' && 'status' in err) {
            throw err;
        }
        
        logger.error('[ADMIN TILE] Error loading tile', err, {
            tileId: params.id
        });
        throw error(500);
    }
}