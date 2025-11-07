import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const response = await fetch(`${API_URL}/players`)
        
        if (!response.ok) {
            console.error('Failed to fetch players:', response.status)
            return { accounts: [] }
        }
        
        const accounts = await response.json()
        return { accounts }
    } catch (error) {
        console.error('Error loading players:', error)
        return { accounts: [] }
    }
}
