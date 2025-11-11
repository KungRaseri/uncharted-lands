// TODO: Complete migration to REST API
// This file needs significant server-side work:
// 1. POST /api/settlements endpoint to create settlements
// 2. POST /api/profiles endpoint to create profiles
// 3. GET /api/servers/:id/suitable-plots endpoint to find good starting locations
// 4. Transaction support on server for atomic operations
import { error, fail, redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import type { Actions, PageServerLoad } from './$types';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ locals, cookies }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.profile) {
        throw redirect(302, '/game')
    }

    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[GETTING STARTED] Loading servers and worlds', {
            accountId: locals.account.id,
            hasSessionToken: !!sessionToken
        });

        // Fetch servers
        const serversResponse = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });

        if (!serversResponse.ok) {
            logger.error('[GETTING STARTED] Failed to fetch servers', {
                status: serversResponse.status,
                statusText: serversResponse.statusText
            });
            throw error(500);
        }

        const servers = await serversResponse.json();

        // Fetch worlds
        const worldsResponse = await fetch(`${API_URL}/worlds`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });

        if (!worldsResponse.ok) {
            logger.error('[GETTING STARTED] Failed to fetch worlds', {
                status: worldsResponse.status,
                statusText: worldsResponse.statusText
            });
            throw error(500);
        }

        const worlds = await worldsResponse.json();

        logger.info('[GETTING STARTED] Successfully loaded game data', {
            serverCount: servers.length,
            worldCount: worlds.length
        });

        return {
            servers,
            worlds
        };
    } catch (err) {
        // Re-throw SvelteKit errors (redirects, errors)
        if (err && typeof err === 'object' && ('status' in err || 'location' in err)) {
            throw err;
        }
        
        logger.error('[GETTING STARTED] Unexpected error loading game data', err);
        throw error(500);
    }
}

export const actions: Actions = {
    settle: async ({ request, locals, cookies }) => {
        if (!locals.account) {
            logger.warn('[GETTING STARTED] Unauthorized settlement attempt');
            return fail(401, { unauthorized: true });
        }

        const data = await request.formData();
        const username = data.get('username');
        const serverId = data.get('server');
        const worldId = data.get('world');

        // Validate inputs
        if (typeof serverId !== 'string' || !serverId ||
            typeof worldId !== 'string' || !worldId ||
            typeof username !== 'string' || !username) {
            logger.warn('[GETTING STARTED] Invalid settlement form data', {
                hasUsername: !!username,
                hasServerId: !!serverId,
                hasWorldId: !!worldId
            });
            return fail(400, { invalid: true, message: 'Please fill in all fields' });
        }

        try {
            const sessionToken = cookies.get('session');
            
            logger.debug('[GETTING STARTED] Creating settlement', {
                username,
                serverId,
                worldId,
                accountId: locals.account.id
            });

            // Call server API to create settlement
            const response = await fetch(`${API_URL}/settlements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `session=${sessionToken}`
                },
                body: JSON.stringify({
                    username,
                    serverId,
                    worldId,
                    accountId: locals.account.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                
                logger.error('[GETTING STARTED] Settlement creation failed', {
                    status: response.status,
                    error: errorData
                });
                
                if (response.status === 409) {
                    return fail(409, { 
                        message: 'Username already taken or you already have a settlement' 
                    });
                }
                
                if (response.status === 404) {
                    return fail(404, { 
                        message: errorData.error || 'No suitable locations found in this world' 
                    });
                }
                
                return fail(500, { 
                    message: errorData.error || 'Failed to create settlement. Please try again.' 
                });
            }

            const settlement = await response.json();
            logger.info('[GETTING STARTED] Settlement created successfully', {
                settlementId: settlement.id,
                username,
                worldId
            });

            // Redirect to game
            throw redirect(302, '/game');
        } catch (err) {
            // If it's a redirect or SvelteKit error, let it through
            if (err && typeof err === 'object' && ('status' in err || 'location' in err)) {
                throw err;
            }
            
            logger.error('[GETTING STARTED] Unexpected error creating settlement', err);
            return fail(500, { 
                message: 'An unexpected error occurred. Please try again.' 
            });
        }
    }
}