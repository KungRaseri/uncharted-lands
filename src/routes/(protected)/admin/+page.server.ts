import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
    const servers = db.server.findMany();

    return {
        servers
    }
}