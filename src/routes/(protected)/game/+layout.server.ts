import { API_URL } from "$lib/config";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch }) => {
    try {
        const response = await fetch(`${API_URL}/servers`);
        
        if (!response.ok) {
            console.error('[GAME LAYOUT] Failed to fetch servers:', response.status);
            return { server: null };
        }
        
        const servers = await response.json();
        
        // Return first server or null
        return {
            server: servers && servers.length > 0 ? servers[0] : null
        };
    } catch (error) {
        console.error('[GAME LAYOUT] Error fetching servers:', error);
        return { server: null };
    }
}