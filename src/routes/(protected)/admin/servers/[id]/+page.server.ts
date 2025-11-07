import { fail, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions, Action } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/servers/${params.id}`)
        
        if (!response.ok) {
            return fail(404, { success: false, id: params.id })
        }

        const server = await response.json()

        return { server }
    } catch (error) {
        console.error('Failed to load server:', error)
        return fail(404, { success: false, id: params.id })
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
