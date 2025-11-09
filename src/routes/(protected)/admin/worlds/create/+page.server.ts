import { fail, redirect } from "@sveltejs/kit"
import { logger } from "$lib/utils/logger"
import type { Actions, PageServerLoad } from "./$types"

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    if (!locals.account || locals.account.role !== 'ADMINISTRATOR') {
        throw redirect(302, '/')
    }

    try {
        const sessionToken = cookies.get('session');

        logger.debug('[WORLD CREATE] Loading servers', {
            hasSessionToken: !!sessionToken
        });

        const response = await fetch(`${API_URL}/servers`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });

        if (!response.ok) {
            logger.error('[WORLD CREATE] Failed to fetch servers', {
                status: response.status
            });
            return { servers: [] };
        }

        const servers = await response.json();

        logger.info('[WORLD CREATE] Servers loaded', {
            count: servers.length
        });

        return { servers };
    } catch (error) {
        logger.error('[WORLD CREATE] Error loading servers', error);
        return { servers: [] };
    }
}

export const actions: Actions = {
    save: async ({ request, cookies }) => {
        const data = await request.formData();
        const mapOptionsString = data.get('map-options');
        const elevationOptionsString = data.get('elevation-options');
        const precipitationOptionsString = data.get('precipitation-options');
        const temperatureOptionsString = data.get('temperature-options');

        // Parse the JSON strings
        let mapOptions: any;
        let elevationOptions: any;
        let precipitationOptions: any;
        let temperatureOptions: any;

        try {
            mapOptions = mapOptionsString ? JSON.parse(mapOptionsString.toString()) : {};
            elevationOptions = elevationOptionsString ? JSON.parse(elevationOptionsString.toString()) : {};
            precipitationOptions = precipitationOptionsString ? JSON.parse(precipitationOptionsString.toString()) : {};
            temperatureOptions = temperatureOptionsString ? JSON.parse(temperatureOptionsString.toString()) : {};
        } catch (err) {
            logger.error('[WORLD CREATE] Failed to parse form data', err);
            return fail(400, {
                invalid: true,
                message: 'Invalid world data format'
            });
        }

        // Validate required fields
        if (!mapOptions.worldName || !mapOptions.serverId) {
            logger.warn('[WORLD CREATE] Missing required fields', {
                hasName: !!mapOptions.worldName,
                hasServerId: !!mapOptions.serverId
            });
            return fail(400, {
                invalid: true,
                message: 'World name and server are required'
            });
        }

        // Validate dimensions for server-side generation
        if (!mapOptions.width || !mapOptions.height) {
            logger.warn('[WORLD CREATE] Missing dimensions');
            return fail(400, {
                invalid: true,
                message: 'World dimensions are required'
            });
        }

        logger.info('[WORLD CREATE] Creating world', {
            name: mapOptions.worldName,
            serverId: mapOptions.serverId,
            mode: 'server-side-generation'
        });

        try {
            const sessionToken = cookies.get('session');

            // Send generation settings to API for server-side generation
            const response = await fetch(`${API_URL}/worlds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `session=${sessionToken}`
                },
                body: JSON.stringify({
                    name: mapOptions.worldName,
                    serverId: mapOptions.serverId,
                    generate: true, // Enable server-side generation
                    width: mapOptions.width,
                    height: mapOptions.height,
                    elevationSeed: mapOptions.elevationSeed,
                    precipitationSeed: mapOptions.precipitationSeed,
                    temperatureSeed: mapOptions.temperatureSeed,
                    elevationSettings: elevationOptions,
                    precipitationSettings: precipitationOptions,
                    temperatureSettings: temperatureOptions,
                })
            });

            if (!response.ok) {
                const error = await response.json();
                logger.error('[WORLD CREATE] Failed to create world', {
                    status: response.status,
                    error: error.error
                });
                return fail(response.status, {
                    invalid: true,
                    message: error.error || 'Failed to create world'
                });
            }

            const world = await response.json();
            logger.info('[WORLD CREATE] Successfully created world', {
                worldId: world.id,
                name: world.name
            });

            // Small delay to ensure database transaction is fully committed
            // This prevents race condition when redirecting to world detail page
            await new Promise(resolve => setTimeout(resolve, 100));

            throw redirect(303, `/admin/worlds/${world.id}`);
        } catch (err) {
            // Re-throw redirects immediately (don't log them as errors)
            // SvelteKit redirects are Response objects
            if (err instanceof Response || (err && typeof err === 'object' && 'status' in err && 'location' in err)) {
                throw err;
            }

            logger.error('[WORLD CREATE] Error creating world', err);
            return fail(500, {
                invalid: true,
                message: 'Failed to create world. Please try again.'
            });
        }
    }
}
