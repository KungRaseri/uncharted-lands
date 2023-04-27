import { db } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    const settlements = await db.settlement.findMany({
        include: {
            Plot: true,
            Storage: true,
            Structures: true
        }
    })
    for (const settlement of settlements) {
        await db.settlementStorage.update({
            where: {
                id: settlement.settlementStorageId
            },
            data: {
                food: {
                    increment: settlement.Plot.food
                },
                water: {
                    increment: settlement.Plot.water
                },
                wood: {
                    increment: settlement.Plot.wood
                },
                stone: {
                    increment: settlement.Plot.stone
                },
                ore: {
                    increment: settlement.Plot.ore
                }
            }
        })
    }

    return new Response("ok");
};