import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = (async () => {
    return {
        tiles: db.tile.findMany({
            include: {
                Biome: true,
                Plots: {
                    include: {
                        resources: true,
                        settlement: true
                    }
                },
                Region: true,
                Settlement: true
            }
        })
    }
}) satisfies PageServerLoad