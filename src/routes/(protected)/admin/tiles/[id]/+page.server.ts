import { fail } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"

export const load: PageServerLoad = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/regions/tiles/${params.id}`)
        
        if (!response.ok) {
            if (response.status === 404) {
                return fail(404, { success: false, id: params.id })
            }
            console.error('Failed to fetch tile:', response.status)
            return fail(500, { success: false, id: params.id })
        }
        
        const tile = await response.json()
        
        // Calculate tile position within region (10x10 grid)
        const tileIndex = tile.Region.tiles.findIndex((t: any) => t.id === tile.id)
        const tileX = tileIndex % 10
        const tileY = Math.floor(tileIndex / 10)
        
        return {
            tile,
            regionTiles: tile.Region.tiles,
            tileX,
            tileY
        }
    } catch (error) {
        console.error('Error loading tile:', error)
        return fail(500, { success: false, id: params.id })
    }
}