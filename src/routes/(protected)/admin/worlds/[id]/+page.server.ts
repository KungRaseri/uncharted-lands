import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions, Action } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/worlds/${params.id}`)
        
        if (!response.ok) {
            return fail(404, { success: false, id: params.id })
        }

        const world = await response.json()

        // Load all servers for reassignment dropdown
        const serversResponse = await fetch(`${API_URL}/servers`)
        const servers = serversResponse.ok ? await serversResponse.json() : []

        // Calculate stats from loaded data
        const landTiles = world.regions?.flatMap((r: any) => r.tiles || [])
            .filter((t: any) => t.type === 'LAND').length || 0
        const oceanTiles = world.regions?.flatMap((r: any) => r.tiles || [])
            .filter((t: any) => t.type === 'OCEAN').length || 0
        const settlements = 0 // TODO: Get from API

        return {
            world,
            servers,
            worldInfo: {
                landTiles,
                oceanTiles,
                settlements
            }
        }
    } catch (error) {
        console.error('Failed to load world:', error)
        return fail(404, { success: false, id: params.id })
    }
}

const update: Action = async ({ request, params, fetch }) => {
    const data = await request.formData();
    const name = data.get('name');
    const serverId = data.get('serverId');

    if (!name || typeof name !== 'string') {
        return fail(400, { invalid: true, message: 'World name is required' });
    }

    if (!serverId || typeof serverId !== 'string') {
        return fail(400, { invalid: true, message: 'Server is required' });
    }

    try {
        const response = await fetch(`${API_URL}/worlds/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, serverId })
        });

        if (!response.ok) {
            return fail(500, { success: false, message: 'Failed to update world' });
        }

        return { success: true, message: 'World updated successfully' };
    } catch (error) {
        console.error('Failed to update world:', error);
        return fail(500, { success: false, message: 'Failed to update world' });
    }
}

const deleteWorld: Action = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/worlds/${params.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            return fail(500, { success: false, message: 'Failed to delete world' });
        }

        throw redirect(303, '/admin/worlds');
    } catch (error) {
        if (error instanceof Response) throw error; // Re-throw redirect
        console.error('Failed to delete world:', error);
        return fail(500, { success: false, message: 'Failed to delete world' });
    }
}

export const actions: Actions = { update, delete: deleteWorld }
