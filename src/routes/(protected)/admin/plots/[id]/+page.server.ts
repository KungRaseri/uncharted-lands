import { fail } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/regions/plots/${params.id}`)
        
        if (!response.ok) {
            if (response.status === 404) {
                return fail(404, { success: false, id: params.id })
            }
            console.error('Failed to fetch plot:', response.status)
            return fail(500, { success: false, id: params.id })
        }
        
        const plot = await response.json()
        return { plot }
    } catch (error) {
        console.error('Error loading plot:', error)
        return fail(500, { success: false, id: params.id })
    }
}