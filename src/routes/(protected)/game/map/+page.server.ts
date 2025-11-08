import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load = (async ({ locals, fetch, url }) => {
    // Check authentication
    if (!locals.account) {
        throw redirect(302, '/login');
    }

    // Check if user has a profile
    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started');
    }

    try {
        // Get optional center coordinates from query params (for lazy loading)
        const centerX = url.searchParams.get('centerX');
        const centerY = url.searchParams.get('centerY');
        const radius = url.searchParams.get('radius');

        // Build query params
        const queryParams = new URLSearchParams({
            profileId: locals.account.profile.id
        });

        if (centerX && centerY) {
            queryParams.set('centerX', centerX);
            queryParams.set('centerY', centerY);
            if (radius) queryParams.set('radius', radius);
        }

        // Fetch map data from server API
        const response = await fetch(`${API_URL}/map?${queryParams.toString()}`, {
            headers: {
                'Cookie': `session=${locals.account.userAuthToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[MAP LOAD] Failed to load map:', error);
            
            if (response.status === 404) {
                throw new Error('No world found. Please ask an administrator to create a world.');
            }
            
            throw new Error(`Failed to load map: ${error.error || 'Unknown error'}`);
        }

        const data = await response.json();

        console.log('[MAP LOAD] Map loaded:', {
            worldId: data.world?.id,
            worldName: data.world?.name,
            regionCount: data.world?.regions?.length,
            hasPlayerSettlement: !!data.playerSettlement
        });

        return data;
    } catch (error) {
        console.error('[MAP LOAD] Error:', error);
        
        // If it's a redirect, let it through
        if (error instanceof Response) {
            throw error;
        }
        
        // Re-throw as error for display
        throw error;
    }
}) satisfies PageServerLoad;