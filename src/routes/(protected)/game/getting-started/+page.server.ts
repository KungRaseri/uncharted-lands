// TODO: Complete migration to REST API
// This file needs significant server-side work:
// 1. POST /api/settlements endpoint to create settlements
// 2. POST /api/profiles endpoint to create profiles
// 3. GET /api/servers/:id/suitable-plots endpoint to find good starting locations
// 4. Transaction support on server for atomic operations
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ locals, fetch }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.profile) {
        throw redirect(302, '/game')
    }

    try {
        // Fetch servers
        const serversResponse = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${locals.account.userAuthToken}`
            }
        });

        if (!serversResponse.ok) {
            console.error('[GETTING STARTED] Failed to fetch servers:', serversResponse.status);
            return fail(500, { error: 'Failed to load servers' });
        }

        const servers = await serversResponse.json();

        // Fetch worlds
        const worldsResponse = await fetch(`${API_URL}/worlds`, {
            headers: {
                'Cookie': `session=${locals.account.userAuthToken}`
            }
        });

        if (!worldsResponse.ok) {
            console.error('[GETTING STARTED] Failed to fetch worlds:', worldsResponse.status);
            return fail(500, { error: 'Failed to load worlds' });
        }

        const worlds = await worldsResponse.json();

        return {
            servers,
            worlds
        };
    } catch (error) {
        console.error('[GETTING STARTED] Error:', error);
        return fail(500, { error: 'Failed to load game data' });
    }
}

export const actions: Actions = {
    settle: async ({ request, locals, fetch }) => {
        if (!locals.account) {
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
            return fail(400, { invalid: true, message: 'Please fill in all fields' });
        }

        try {
            // Call server API to create settlement
            const response = await fetch(`${API_URL}/settlements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `session=${locals.account.userAuthToken}`
                },
                body: JSON.stringify({
                    username,
                    serverId,
                    worldId,
                    accountId: locals.account.id
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('[GETTING STARTED] Settlement creation failed:', error);
                
                if (response.status === 409) {
                    return fail(409, { 
                        message: 'Username already taken or you already have a settlement' 
                    });
                }
                
                if (response.status === 404) {
                    return fail(404, { 
                        message: error.error || 'No suitable locations found in this world' 
                    });
                }
                
                return fail(500, { 
                    message: error.error || 'Failed to create settlement. Please try again.' 
                });
            }

            const settlement = await response.json();
            console.log('[GETTING STARTED] Settlement created:', settlement.id);

            // Redirect to game
            throw redirect(302, '/game');
        } catch (error) {
            // If it's a redirect, let it through
            if (error instanceof Response && error.status === 302) {
                throw error;
            }
            
            console.error('[GETTING STARTED] Error:', error);
            return fail(500, { 
                message: 'An unexpected error occurred. Please try again.' 
            });
        }
    }
}