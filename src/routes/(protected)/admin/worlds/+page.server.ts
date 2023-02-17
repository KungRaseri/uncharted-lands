import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = async () => {
    return {
        worlds: await db.world.findMany({
            include: {
                server: true,
                regions: true
            }
        })
    }
}
