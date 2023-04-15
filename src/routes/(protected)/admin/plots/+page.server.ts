import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = (async () => {
    return {
        plots: db.plot.findMany({
            include: {
                Settlement: true,
                Tile: true
            }
        })
    }
}) satisfies PageServerLoad