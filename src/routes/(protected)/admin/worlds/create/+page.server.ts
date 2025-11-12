import { redirect } from "@sveltejs/kit"
import { logger } from "$lib/utils/logger"
import type { PageServerLoad } from "./$types"
import { env } from '$env/dynamic/public'

// Use PUBLIC_API_URL which works in both client and server contexts
const API_URL = env.PUBLIC_API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ cookies, locals, setHeaders }) => {
    if (!locals.account || locals.account.role !== 'ADMINISTRATOR') {
        throw redirect(302, '/')
    }

    // Disable caching to ensure fresh server data
    setHeaders({
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0'
    });

    try {
        const sessionToken = cookies.get('session');

        logger.debug('[WORLD CREATE] Loading servers', {
            hasSessionToken: !!sessionToken,
            apiUrl: API_URL
        });

        const response = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            },
            cache: 'no-store'
        });

        logger.debug('[WORLD CREATE] Server API response', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error response');
            logger.error('[WORLD CREATE] Failed to fetch servers', {
                status: response.status,
                statusText: response.statusText,
                errorBody: errorText
            });
            return { servers: [], error: 'Failed to load servers' };
        }

        const servers = await response.json();

        logger.info('[WORLD CREATE] Servers loaded successfully', {
            count: servers.length,
            serverIds: servers.map((s: any) => s.id),
            serverNames: servers.map((s: any) => s.name)
        });

        return { servers };
    } catch (error) {
        logger.error('[WORLD CREATE] Exception loading servers', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            apiUrl: API_URL
        });
        return { servers: [], error: 'An error occurred loading servers' };
    }
}

/**
 * Note: World creation now happens via client-side API call (see +page.svelte)
 * This bypasses Vercel's 10-second serverless function timeout and allows
 * the browser to wait directly for the Render server to complete generation.
 */
