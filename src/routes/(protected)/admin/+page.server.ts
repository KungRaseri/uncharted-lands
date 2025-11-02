import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = async () => {
    const [
        totalServers,
        totalWorlds,
        totalPlayers,
        totalRegions,
        totalTiles,
        totalPlots
    ] = await Promise.all([
        db.server.count(),
        db.world.count(),
        db.account.count(),
        db.region.count(),
        db.tile.count(),
        db.plot.count()
    ]);

    return {
        stats: {
            totalServers,
            totalWorlds,
            totalPlayers,
            totalRegions,
            totalTiles,
            totalPlots
        }
    }
}