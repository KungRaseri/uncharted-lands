import type { PageServerLoad } from "./$types"

const API_URL = 'http://localhost:3001/api'

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
