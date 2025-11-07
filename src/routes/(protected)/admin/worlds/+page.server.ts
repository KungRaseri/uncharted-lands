import type { PageServerLoad, Actions, Action } from "./$types"
import { fail } from "@sveltejs/kit"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const response = await fetch(`${API_URL}/worlds`)
        
        if (!response.ok) {
            console.error('Worlds API error:', response.status)
            return { worlds: [] }
        }

        const worlds = await response.json()

        return { worlds }
    } catch (err) {
        console.error('Failed to load worlds:', err)
        return { worlds: [] }
    }
}

const deleteWorld: Action = async ({ request, fetch }) => {
    const data = await request.formData();
    const worldId = data.get('worldId');

    if (!worldId || typeof worldId !== 'string') {
        return fail(400, { success: false, message: 'World ID is required' });
    }

    try {
        const response = await fetch(`${API_URL}/worlds/${worldId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            return fail(response.status, { 
                success: false, 
                message: errorData.error || 'Failed to delete world', 
                worldId 
            });
        }

        return { success: true, message: 'World deleted successfully', worldId };
    } catch (error) {
        console.error('Failed to delete world:', error);
        return fail(500, { success: false, message: 'Failed to delete world', worldId });
    }
}

export const actions: Actions = { delete: deleteWorld }
