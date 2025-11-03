import type { PageServerLoad, Actions, Action } from "./$types"
import { db } from "$lib/db"
import { fail } from "@sveltejs/kit"

export const load: PageServerLoad = async () => {
    return {
        servers: await db.server.findMany({
            include: {
                _count: {
                    select: {
                        worlds: true,
                        players: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }
}

const deleteServer: Action = async ({ request }) => {
    const data = await request.formData();
    const serverId = data.get('serverId');

    if (!serverId || typeof serverId !== 'string') {
        return fail(400, { success: false, message: 'Server ID is required' });
    }

    try {
        // Check if server has any worlds
        const worldCount = await db.world.count({
            where: { serverId }
        });

        if (worldCount > 0) {
            return fail(400, { 
                success: false, 
                message: `Cannot delete server with ${worldCount} world(s). Delete worlds first.`,
                serverId
            });
        }

        await db.server.delete({
            where: { id: serverId }
        });

        return { success: true, message: 'Server deleted successfully', serverId };
    } catch (error) {
        console.error('Failed to delete server:', error);
        return fail(500, { success: false, message: 'Failed to delete server', serverId });
    }
}

export const actions: Actions = { delete: deleteServer }