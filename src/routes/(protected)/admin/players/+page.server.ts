import type { PageServerLoad } from "./$types"
import { db } from "$lib/db"

export const load: PageServerLoad = async () => {
    return {
        accounts: await db.account.findMany({
            include: {
                profile: {
                    include: {
                        servers: {
                            include: {
                                profile: true,
                                server: true,
                                settlements: true
                            }
                        }
                    }
                }
            }
        })
    }
}
