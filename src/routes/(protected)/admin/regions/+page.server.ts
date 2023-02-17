import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = async () => {
    return {
        regions: db.region.findMany({
            include: {
                world: {
                    include: {
                        server: true
                    }
                },
                tiles: true
            }
        })
    }
}
