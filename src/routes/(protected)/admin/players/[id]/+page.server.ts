import { fail } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

const API_URL = 'http://localhost:3001/api'

export const load: PageServerLoad = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/players/${params.id}`)
        
        if (!response.ok) {
            if (response.status === 404) {
                return fail(404, { success: false, id: params.id })
            }
            console.error('Failed to fetch player:', response.status)
            return fail(500, { success: false, id: params.id })
        }
        
        const account = await response.json()
        return { account }
    } catch (error) {
        console.error('Error loading player:', error)
        return fail(500, { success: false, id: params.id })
    }
}
