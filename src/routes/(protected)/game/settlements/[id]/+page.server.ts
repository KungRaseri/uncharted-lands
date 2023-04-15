import { db } from '$lib/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
    const settlement = await db.settlement.findUnique({
        where: {
            id: params.id
        },
        include: {
            Plot: {
                include: {
                    resources: {
                        include: {
                            Resource: true
                        }
                    }
                }
            },
            structures: {
                include: {
                    modifiers: true
                }
            }
        }
    })

    if (!settlement)
        throw fail(404, { invalid: true, params: params.id })

    return {
        settlement
    }
}) satisfies PageServerLoad;