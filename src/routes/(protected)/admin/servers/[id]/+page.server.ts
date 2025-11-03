import { fail, redirect } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
    const server = await db.server.findUnique({
        where: {
            id: params.id
        },
        include: {
            worlds: true,
            players: {
                include: {
                    profile: true,
                    settlements: true
                }
            }
        }
    });

    if (!server) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        server
    }
}

const update: Action = async ({ request, params }) => {
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

        await db.server.update({
            where: { id: params.id },
            data: updateData
        });

        return { success: true, message: 'Server updated successfully' };
    } catch (error) {
        console.error('Failed to update server:', error);
        return fail(500, { success: false, message: 'Failed to update server' });
    }
}

const deleteServer: Action = async ({ params }) => {
    try {
        // Check if server has any worlds
        const worldCount = await db.world.count({
            where: { serverId: params.id }
        });

        if (worldCount > 0) {
            return fail(400, { 
                success: false, 
                message: `Cannot delete server with ${worldCount} world(s). Delete worlds first.` 
            });
        }

        await db.server.delete({
            where: { id: params.id }
        });

        throw redirect(303, '/admin/servers');
    } catch (error) {
        if (error instanceof Response) throw error; // Re-throw redirect
        console.error('Failed to delete server:', error);
        return fail(500, { success: false, message: 'Failed to delete server' });
    }
}

export const actions: Actions = { update, delete: deleteServer }
