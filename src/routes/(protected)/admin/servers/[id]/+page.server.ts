import { error, fail, redirect } from "@sveltejs/kit"
import { logger } from "$lib/utils/logger"
import type { PageServerLoad, Actions, Action } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ params, cookies }) => {
    try {
        const sessionToken = cookies.get('session');
        
        logger.debug('[ADMIN SERVER] Loading server details', {
            serverId: params.id,
            hasSessionToken: !!sessionToken
        });

        const response = await fetch(`${API_URL}/servers/${params.id}`, {
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });
        
        if (!response.ok) {
            logger.warn('[ADMIN SERVER] Server not found', {
                serverId: params.id,
                status: response.status
            });
            throw error(404);
        }

        const server = await response.json();

        logger.info('[ADMIN SERVER] Successfully loaded server', {
            serverId: params.id,
            serverName: server.name
        });

        return { server };
    } catch (err) {
        // Re-throw SvelteKit errors
        if (err && typeof err === 'object' && 'status' in err) {
            throw err;
        }
        
        logger.error('[ADMIN SERVER] Failed to load server', err, {
            serverId: params.id
        });
        throw error(500);
    }
}

const update: Action = async ({ request, params, cookies }) => {
    const data = await request.formData();
    const name = data.get('name');
    const hostname = data.get('hostname');
    const port = data.get('port');
    const status = data.get('status');

    if (!name || typeof name !== 'string') {
        return fail(400, { invalid: true, message: 'Server name is required' });
    }

    const sessionToken = cookies.get('session');

    logger.debug('[ADMIN SERVER] Updating server', {
        serverId: params.id,
        name,
        hasSessionToken: !!sessionToken
    });

    try {
        const updateData: any = {
            name,
            hostname: hostname && typeof hostname === 'string' ? hostname : undefined,
            status: status && typeof status === 'string' ? status : undefined
        };

        if (port && typeof port === 'string') {
            const portNum = Number.parseInt(port);
            if (!Number.isNaN(portNum)) {
                updateData.port = portNum;
            }
        }

        const response = await fetch(`${API_URL}/servers/${params.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': `session=${sessionToken}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            logger.error('[ADMIN SERVER] Failed to update server', {
                serverId: params.id,
                status: response.status
            });
            return fail(500, { success: false, message: 'Failed to update server' });
        }

        logger.info('[ADMIN SERVER] Successfully updated server', {
            serverId: params.id,
            name
        });

        return { success: true, message: 'Server updated successfully' };
    } catch (err) {
        logger.error('[ADMIN SERVER] Error updating server', err, {
            serverId: params.id
        });
        return fail(500, { success: false, message: 'Failed to update server' });
    }
}

const deleteServer: Action = async ({ params, cookies }) => {
    const sessionToken = cookies.get('session');

    logger.debug('[ADMIN SERVER] Deleting server', {
        serverId: params.id,
        hasSessionToken: !!sessionToken
    });

    try {
        const response = await fetch(`${API_URL}/servers/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Cookie': `session=${sessionToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            logger.error('[ADMIN SERVER] Failed to delete server', {
                serverId: params.id,
                status: response.status,
                error: errorData.error
            });
            return fail(response.status, { 
                success: false, 
                message: errorData.error || 'Failed to delete server'
            });
        }

        logger.info('[ADMIN SERVER] Successfully deleted server', {
            serverId: params.id
        });

        throw redirect(303, '/admin/servers');
    } catch (err) {
        if (err instanceof Response) throw err; // Re-throw redirect
        logger.error('[ADMIN SERVER] Error deleting server', err, {
            serverId: params.id
        });
        return fail(500, { success: false, message: 'Failed to delete server' });
    }
}

export const actions: Actions = { update, delete: deleteServer }
