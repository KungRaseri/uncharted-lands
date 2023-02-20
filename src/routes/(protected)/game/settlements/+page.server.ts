import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {

    const settlements = await db.settlement.findMany({
        where: {
            PlayerProfile: {
                profileId: locals.account.profile.id,
                serverId: "06fc223b-412d-4bbd-97db-7e43744e046d" //TODO: update when server swapping is available
            },
        }
    })

    return {
        settlements
    }
}) satisfies PageServerLoad;