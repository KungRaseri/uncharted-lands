import { fail } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
    const tile = await db.tile.findUnique({
        where: {
            id: params.id
        },
        include: {
            Biome: true,
            Plots: {
                include: {
                    Settlement: true
                }
            },
            Region: {
                include: {
                    world: true,
                    tiles: {
                        include: {
                            Biome: true
                        }
                    }
                }
            }
        }
    });

    if (!tile) {
        throw fail(404, { success: false, id: params.id })
    }

    // Calculate tile position within region (10x10 grid)
    const tileIndex = tile.Region.tiles.findIndex(t => t.id === tile.id);
    const tileX = tileIndex % 10;
    const tileY = Math.floor(tileIndex / 10);

    return {
        tile,
        regionTiles: tile.Region.tiles,
        tileX,
        tileY
    }
}