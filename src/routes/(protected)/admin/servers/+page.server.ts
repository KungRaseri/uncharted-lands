import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = async () => {
    return {
        servers: await db.server.findMany({
            include: {
                _count: {
                    select: {
                        worlds: true,
                        players: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }
}