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

const update: Action = async ({ request, params, fetch }) => {
    const data = await request.formData();
    const name = data.get('name');
    const hostname = data.get('hostname');
    const port = data.get('port');
    const status = data.get('status');

    if (!name || typeof name !== 'string') {
        return fail(400, { invalid: true, message: 'Server name is required' });
    }

    try {
        const updateData: any = {
            name,
            hostname: hostname && typeof hostname === 'string' ? hostname : undefined,
            status: status && typeof status === 'string' ? status : undefined
        };

        if (port && typeof port === 'string') {
            const portNum = parseInt(port);
            if (!isNaN(portNum)) {
                updateData.port = portNum;
            }
        }

        const response = await fetch(`${API_URL}/servers/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            return fail(500, { success: false, message: 'Failed to update server' });
        }

        return { success: true, message: 'Server updated successfully' };
    } catch (error) {
        console.error('Failed to update server:', error);
        return fail(500, { success: false, message: 'Failed to update server' });
    }
}

const deleteServer: Action = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/servers/${params.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            return fail(response.status, { 
                success: false, 
                message: errorData.error || 'Failed to delete server'
            });
        }

        throw redirect(303, '/admin/servers');
    } catch (error) {
        if (error instanceof Response) throw error; // Re-throw redirect
        console.error('Failed to delete server:', error);
        return fail(500, { success: false, message: 'Failed to delete server' });
    }
}

export const actions: Actions = { update, delete: deleteServer }
