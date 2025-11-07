import type { PageServerLoad, Actions, Action } from "./$types"
import { fail } from "@sveltejs/kit"
import { API_URL } from "$lib/config"
import type { GameServer } from "../../../../../../shared/types/api"

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const response = await fetch(`${API_URL}/servers`)
        
        if (!response.ok) {
            console.error('Servers API error:', response.status)
            return { servers: [] }
        }

        const servers: GameServer[] = await response.json()

        return { servers }
    } catch (err) {
        console.error('Failed to load servers:', err)
        return { servers: [] }
    }
}

const deleteServer: Action = async ({ request, fetch }) => {
    const data = await request.formData();
    const serverId = data.get('serverId');

    if (!serverId || typeof serverId !== 'string') {
        return fail(400, { success: false, message: 'Server ID is required' });
    }

    try {
        const response = await fetch(`${API_URL}/servers/${serverId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            return fail(response.status, { 
                success: false, 
                message: errorData.error || 'Failed to delete server',
                serverId
            });
        }

        return { success: true, message: 'Server deleted successfully', serverId };
    } catch (error) {
        console.error('Failed to delete server:', error);
        return fail(500, { success: false, message: 'Failed to delete server', serverId });
    }
}

export const actions: Actions = { delete: deleteServer }