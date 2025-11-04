import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    console.log('[MAP LOAD] Starting map load...');
    
    // Get the authenticated account
    const account = locals.account;
    
    console.log('[MAP LOAD] Account check:', {
        hasAccount: !!account,
        hasProfile: !!account?.profile,
        accountId: account?.id,
        profileId: account?.profile?.id
    });
    
    if (!account || !account.profile) {
        console.error('[MAP LOAD] No account or profile found');
        throw new Error('You must be logged in to view the map.');
    }

    try {
        console.log('[MAP LOAD] Searching for settlement with profileId:', account.profile.id);
        
        // Find the player's settlement through ProfileServerData
        const settlement = await db.settlement.findFirst({
            where: {
                PlayerProfile: {
                    profileId: account.profile.id
                }
            },
            include: {
                Plot: {
                    include: {
                        Tile: {
                            include: {
                                Region: {
                                    include: {
                                        world: {
                                            include: {
                                                server: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('[MAP LOAD] Settlement query result:', {
            found: !!settlement,
            settlementId: settlement?.id,
            hasPlot: !!settlement?.Plot,
            hasTile: !!settlement?.Plot?.Tile,
            hasRegion: !!settlement?.Plot?.Tile?.Region,
            hasWorld: !!settlement?.Plot?.Tile?.Region?.world
        });

        // If player has a settlement, show their world
        if (settlement && settlement.Plot?.Tile?.Region?.world) {
            const worldId = settlement.Plot.Tile.Region.worldId;
            console.log('[MAP LOAD] Loading world for player settlement:', worldId);
            
            const world = await db.world.findUnique({
                where: {
                    id: worldId
                },
                include: {
                    server: true,
                    regions: {
                        include: {
                            tiles: {
                                include: {
                                    Biome: true,
                                    Plots: {
                                        include: {
                                            Settlement: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            console.log('[MAP LOAD] World loaded:', {
                found: !!world,
                worldName: world?.name,
                regionCount: world?.regions?.length,
                serverName: world?.server?.name
            });

            if (world) {
                console.log('[MAP LOAD] SUCCESS - Returning player world with settlement');
                return {
                    world,
                    playerSettlement: {
                        id: settlement.id,
                        name: settlement.name,
                        plotId: settlement.Plot.id,
                        tileId: settlement.Plot.Tile.id,
                        regionId: settlement.Plot.Tile.Region.id,
                        regionCoords: {
                            x: settlement.Plot.Tile.Region.xCoord,
                            y: settlement.Plot.Tile.Region.yCoord
                        }
                    }
                };
            }
        }

        // Fallback: If no settlement or world not found, show first available world
        console.log('[MAP LOAD] No settlement found or incomplete data, falling back to first available world');
        const server = await db.server.findFirst();
        
        console.log('[MAP LOAD] Server lookup:', { found: !!server, serverId: server?.id, serverName: server?.name });
        
        if (!server) {
            console.error('[MAP LOAD] FAILED - No server found');
            throw new Error('No server found. Please contact an administrator.');
        }

        const world = await db.world.findFirst({
            where: {
                serverId: server.id
            },
            include: {
                server: true,
                regions: {
                    include: {
                        tiles: {
                            include: {
                                Biome: true,
                                Plots: {
                                    include: {
                                        Settlement: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('[MAP LOAD] Fallback world lookup:', {
            found: !!world,
            worldId: world?.id,
            worldName: world?.name,
            regionCount: world?.regions?.length
        });

        if (!world) {
            console.error('[MAP LOAD] FAILED - No world found');
            throw new Error('No world found. Please create a world in Admin > Worlds or create your settlement in Getting Started.');
        }

        console.log('[MAP LOAD] SUCCESS - Returning fallback world without settlement');
        return {
            world,
            playerSettlement: null
        };

    } catch (error) {
        console.error('[MAP LOAD] EXCEPTION:', error);
        console.error('[MAP LOAD] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        throw new Error(`Failed to load map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

}) satisfies PageServerLoad;