import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, depends }) => {
    // Mark this data as dependent on game state changes
    depends('game:settlements');
    depends('game:data');

    const settlements = await db.settlement.findMany({
        where: {
            PlayerProfile: {
                profileId: locals.account.profile.id,
                serverId: (await db.server.findFirst())?.id //TODO: update when server swapping is available
            },
        },
        include: {
            Storage: true,
            Structures: true
        }
    })

    return {
        settlements,
        lastUpdate: new Date().toISOString()
    }
}) satisfies PageServerLoad;