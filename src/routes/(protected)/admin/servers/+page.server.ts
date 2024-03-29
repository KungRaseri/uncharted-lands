import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = async () => {
    return {
        servers: db.server.findMany({
            include: {
                worlds: {
                    include: {
                        regions: true
                    }
                },
                players: {
                    include: {
                        settlements: true
                    }
                }
            }
        })
    }
}