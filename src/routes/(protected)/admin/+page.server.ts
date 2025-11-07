import type { PageServerLoad } from "./$types"
import { API_URL } from "$lib/config"
import type { DashboardStats } from "../../../../../shared/types/api"

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`)
        
        if (!response.ok) {
            console.error('Dashboard API error:', response.status)
            // Return default stats on error
            return {
                stats: {
                    totalServers: 0,
                    totalWorlds: 0,
                    totalPlayers: 0,
                    totalRegions: 0,
                    totalTiles: 0,
                    totalPlots: 0
                }
            }
        }

        const data: DashboardStats = await response.json()

        return {
            stats: {
                totalServers: data.counts.servers,
                totalWorlds: data.counts.worlds,
                totalPlayers: data.counts.players,
                totalRegions: 0, // API doesn't return these yet
                totalTiles: 0,
                totalPlots: 0
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard:', err)
        // Return default stats on error
        return {
            stats: {
                totalServers: 0,
                totalWorlds: 0,
                totalPlayers: 0,
                totalRegions: 0,
                totalTiles: 0,
                totalPlots: 0
            }
        }
    }
}