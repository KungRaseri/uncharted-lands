import { db } from '$lib/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, depends }) => {
    // Mark this data as dependent on game state changes
    depends('game:settlement');
    depends('game:data');

    const settlement = await db.settlement.findUnique({
        where: {
            id: params.id
        },
        include: {
            Plot: {
                include: {
                    Settlement: true,
                    Tile: true
                }
            },
            Storage: true,
            Structures: {
                include: {
                    modifiers: true,
                    buildRequirements: true
                }
            }
        }
    })

    if (!settlement)
        throw fail(404, { invalid: true, params: params.id })

    return {
        settlement,
        lastUpdate: new Date().toISOString()
    }
}) satisfies PageServerLoad;

// NOTE: Structure building is handled via Socket.IO events, not form actions.
// See: client/src/lib/stores/game/socket.ts - 'build-structure' event
// This ensures real-time updates to all players in the world.