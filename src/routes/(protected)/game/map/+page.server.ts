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
            
            const startTime = performance.now();
            const world = await db.world.findUnique({
                where: {
                    id: worldId
                },
                select: {
                    id: true,
                    name: true,
                    server: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    regions: {
                        select: {
                            id: true,
                            name: true,
                            xCoord: true,
                            yCoord: true,
                            tiles: {
                                select: {
                                    id: true,
                                    elevation: true,
                                    precipitation: true,
                                    temperature: true,
                                    type: true,
                                    Biome: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    },
                                    Plots: {
                                        select: {
                                            id: true,
                                            Settlement: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    playerProfileId: true
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
            const loadTimeMs = Math.round(performance.now() - startTime);

            console.log('[MAP LOAD] World loaded:', {
                found: !!world,
                worldName: world?.name,
                regionCount: world?.regions?.length,
                serverName: world?.server?.name
            });
            console.log('[MAP LOAD] ⏱️  Query time: ' + loadTimeMs + 'ms (Phase 1 optimized)');

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
                    },
                    playerProfileId: settlement.playerProfileId
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

        const startTime = performance.now();
        const world = await db.world.findFirst({
            where: {
                serverId: server.id
            },
            select: {
                id: true,
                name: true,
                server: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                regions: {
                    select: {
                        id: true,
                        name: true,
                        xCoord: true,
                        yCoord: true,
                        tiles: {
                            select: {
                                id: true,
                                elevation: true,
                                precipitation: true,
                                temperature: true,
                                type: true,
                                Biome: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                Plots: {
                                    select: {
                                        id: true,
                                        Settlement: {
                                            select: {
                                                id: true,
                                                name: true,
                                                playerProfileId: true
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
        const loadTimeMs = Math.round(performance.now() - startTime);

        console.log('[MAP LOAD] Fallback world lookup:', {
            found: !!world,
            worldId: world?.id,
            worldName: world?.name,
            regionCount: world?.regions?.length
        });
        console.log('[MAP LOAD] ⏱️  Query time: ' + loadTimeMs + 'ms (Phase 1 optimized)');

        if (!world) {
            console.error('[MAP LOAD] FAILED - No world found');
            throw new Error('No world found. Please create a world in Admin > Worlds or create your settlement in Getting Started.');
        }

        console.log('[MAP LOAD] SUCCESS - Returning fallback world without settlement');
        return {
            world,
            playerSettlement: null,
            playerProfileId: undefined
        };

    } catch (error) {
        console.error('\n========================================');
        console.error('🚨 MAP LOAD ERROR');
        console.error('========================================');
        console.error('[MAP LOAD] Exception caught:', error);
        
        if (error instanceof Error) {
            console.error('[MAP LOAD] Error name:', error.name);
            console.error('[MAP LOAD] Error message:', error.message);
            console.error('[MAP LOAD] Stack trace:', error.stack);
        } else {
            console.error('[MAP LOAD] Non-Error object thrown:', typeof error, error);
        }
        
        console.error('[MAP LOAD] Account details:', {
            hasAccount: !!account,
            accountId: account?.id,
            hasProfile: !!account?.profile,
            profileId: account?.profile?.id
        });
        console.error('========================================\n');
        
        // Re-throw with more context
        throw new Error(`Failed to load map: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }

}) satisfies PageServerLoad;