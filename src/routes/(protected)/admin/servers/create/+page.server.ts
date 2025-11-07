import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async () => {
    return {}
}

const createServer: Action = async ({ request, fetch }) => {
    const data = await request.formData();
    const name = data.get("name")
    const hostname = data.get("hostname")
    const port = data.get("port")

    if (typeof name !== 'string' ||
        !name ||
        typeof hostname !== 'string' ||
        !hostname ||
        typeof port !== 'string' ||
        !port) {
        return fail(400, { invalid: true, message: "Invalid form data. Check form and try again" })
    }

    try {
        const response = await fetch(`${API_URL}/servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                hostname,
                port: Number.parseInt(port)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return fail(response.status, { 
                invalid: true, 
                message: errorData.error || 'Failed to create server' 
            });
        }
    }
    catch (e) {
        return fail(500, { invalid: true, message: `Unknown error occurred: ${e}` })
    }

    throw redirect(302, '/admin/servers')

}

export const actions: Actions = { createServer }
