import type { PageServerLoad, Actions, Action } from "./$types"
import { db } from "$lib/db"
import { fail } from "@sveltejs/kit"

export const load: PageServerLoad = async () => {
    return {
        worlds: await db.world.findMany({
            include: {
                server: true,
                regions: true
            }
        })
    }
}

const deleteWorld: Action = async ({ request }) => {
    const data = await request.formData();
    const worldId = data.get('worldId');

    if (!worldId || typeof worldId !== 'string') {
        return fail(400, { success: false, message: 'World ID is required' });
    }

    try {
        // Delete world (cascades to regions, tiles, plots)
        await db.world.delete({
            where: { id: worldId }
        });

        return { success: true, message: 'World deleted successfully', worldId };
    } catch (error) {
        console.error('Failed to delete world:', error);
        return fail(500, { success: false, message: 'Failed to delete world', worldId });
    }
}

export const actions: Actions = { delete: deleteWorld }
