import { db } from '$lib/db'
import type { RequestHandler } from '../$types';

export const POST: RequestHandler = async () => {
    const settlements = await db.settlement.findMany({
        include: {
            Plot: true
        }
    })
    const resources = await db.resource.findMany()

    for (const settlement of settlements) {
        for (const resource of resources) {
            // update settlementResource with incremented value for resource
        }
    }

    return new Response();
};