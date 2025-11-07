// TODO: Migrate to REST API - create /api/servers, /api/worlds, /api/regions, /api/tiles endpoints
import { db } from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { getStructureDefinition } from '$lib/game/structures';
import type { TileWithRelations, Plot } from '$lib/types/game';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.profile) {
        throw redirect(302, '/game')
    }

    return {
        servers: await db.server.findMany(),
        worlds: await db.world.findMany(),
        regions: await db.region.findMany(),
        tiles: await db.region.findMany()
    }
}

/**
 * Find a suitable starting plot for a new settlement
 * 
 * Ensures the plot has minimum viable resources:
 * - At least 3 food (for initial survival)
 * - At least 3 water (for hydration)
 * - At least 3 wood (for basic construction)
 * - Land tile (elevation > 0)
 * - Moderate climate conditions
 */
async function getSuitableStartingPlot(worldId: string) {
    // Query tiles with good starting conditions
    const potentialTiles = await db.tile.findMany({
        where: {
            elevation: {
                gt: 0,      // Must be land
                lt: 25      // Not too mountainous (better for beginners)
            },
            precipitation: {
                gte: 150,   // Adequate rainfall for food and water
                lte: 350    // Not too much (flooding)
            },
            temperature: {
                gte: 10,    // Warm enough for crops
                lte: 28     // Not too hot
            },
            Region: {
                worldId: worldId
            }
        },
        include: {
            Plots: true
        }
    });

    // Filter plots by resource availability
    const viablePlots = potentialTiles.flatMap((tile: TileWithRelations) =>
        tile.Plots.filter((plot: Plot) =>
            plot.food >= 3 &&
            plot.water >= 3 &&
            plot.wood >= 3
        )
    );

    if (viablePlots.length === 0) {
        // Fallback: relax requirements if no perfect plots found
        console.warn('[SETTLEMENT] No ideal starting plots found, using relaxed criteria');
        const fallbackPlots = potentialTiles.flatMap((tile: TileWithRelations) =>
            tile.Plots.filter((plot: Plot) =>
                plot.food >= 2 &&
                plot.water >= 2 &&
                plot.wood >= 2
            )
        );

        if (fallbackPlots.length === 0) {
            // Last resort: any land plot
            console.warn('[SETTLEMENT] No viable plots found, using any available land plot');
            const anyPlots = potentialTiles.flatMap((tile: TileWithRelations) => tile.Plots);
            if (anyPlots.length === 0) {
                throw new Error('No available plots found in world for settlement');
            }
            return anyPlots[Math.floor(Math.random() * anyPlots.length)];
        }

        return fallbackPlots[Math.floor(Math.random() * fallbackPlots.length)];
    }

    // Return a random viable plot
    const randomIndex = Math.floor(Math.random() * viablePlots.length);
    const chosenPlot = viablePlots[randomIndex];

    console.log('[SETTLEMENT] Chosen starting plot:', {
        plotId: chosenPlot.id,
        food: chosenPlot.food,
        water: chosenPlot.water,
        wood: chosenPlot.wood,
        stone: chosenPlot.stone,
        area: chosenPlot.area
    });

    return chosenPlot;
}

const settle: Action = async ({ request, locals }) => {
    if (!locals.account) {
        return fail(401, { unauthorized: true });
    }

    const accountId = locals.account.id;

    const data = await request.formData();
    const username = data.get('username');
    const server = data.get('server');
    const world = data.get('world');

    if (typeof server !== 'string' ||
        !server ||
        typeof world !== 'string' ||
        !world ||
        typeof username !== 'string' ||
        !username) {
        return fail(400, { invalid: true })
    }

    // Find a suitable starting plot with good resources
    const chosenPlot = await getSuitableStartingPlot(world);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
        const profile = await tx.profile.create({
            data: {
                username,
                account: {
                    connect: {
                        id: accountId
                    }
                },
                picture: `https://via.placeholder.com/128x128?text=${username.charAt(0).toUpperCase()}`,
            }
        })

        const serverProfile = await tx.profileServerData.create({
            data: {
                profile: {
                    connect: {
                        id: profile.id
                    }
                },
                server: {
                    connect: {
                        id: server
                    }
                }
            },
            include: {
                settlements: true
            }
        })

        const settlement = await tx.settlement.create({
            data: {
                name: "Home Settlement",
                Storage: {
                    create: {
                        food: 5,
                        water: 5,
                        wood: 10,
                        stone: 5,
                        ore: 0
                    }
                },
                PlayerProfile: {
                    connect: {
                        profileId: serverProfile.profileId
                    }
                },
                Plot: {
                    connect: {
                        id: chosenPlot.id
                    }
                }
            }
        })

        // Create initial tent structure for new settlement
        const tentDefinition = getStructureDefinition('tent');
        if (tentDefinition) {
            // Create structure requirements
            const requirements = await tx.structureRequirements.create({
                data: {
                    area: tentDefinition.requirements.area,
                    solar: tentDefinition.requirements.solar,
                    wind: tentDefinition.requirements.wind,
                    food: tentDefinition.requirements.food,
                    water: tentDefinition.requirements.water,
                    wood: tentDefinition.requirements.wood,
                    stone: tentDefinition.requirements.stone,
                    ore: tentDefinition.requirements.ore
                }
            });

            // Create the structure instance
            const structure = await tx.settlementStructure.create({
                data: {
                    name: tentDefinition.name,
                    description: tentDefinition.description,
                    buildRequirements: {
                        connect: { id: requirements.id }
                    },
                    settlement: {
                        connect: { id: settlement.id }
                    }
                }
            });

            // Create structure modifiers
            for (const modifier of tentDefinition.modifiers) {
                await tx.structureModifier.create({
                    data: {
                        name: modifier.name,
                        description: modifier.description,
                        value: modifier.value,
                        settlementStructure: {
                            connect: { id: structure.id }
                        }
                    }
                });
            }
        }
    })

    // update the player profile and connect it to the server

    throw redirect(302, '/game')
}

export const actions: Actions = { settle }