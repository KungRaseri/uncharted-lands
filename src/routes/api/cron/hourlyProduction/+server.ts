import { db } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
    // const settlements = await db.settlement.findMany({
    //     include: {
    //         Plot: {
    //             include: {
    //                 resources: true
    //             }
    //         },
    //         SettlementResources: true
    //     }
    // })
    // for (const settlement of settlements) {
    //     for (const resource of settlement.Plot.resources) {
    //         // update settlementResource with incremented value for resource
    //         await db.settlementResource.update({
    //             where: {
    //                 settlementId_resourceId: {
    //                     resourceId: resource.id,
    //                     settlementId: settlement.id
    //                 }
    //             },
    //             data: {
    //                 amount: {
    //                     increment: resource.amount
    //                 }
    //             }
    //         })
    //     }
    // }

    return new Response("ok");
};