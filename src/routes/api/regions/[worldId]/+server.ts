import { json } from '@sveltejs/kit';
// TODO: Migrate to server REST API - this internal API should call server endpoints instead of using db directly
import { db } from '$lib/db';
import type { RequestHandler } from './$types';

/**
 * API endpoint to fetch specific regions by coordinates for lazy loading
 * 
 * Query Parameters:
 * - xMin, xMax, yMin, yMax: Coordinate bounds for region grid
 * - centerX, centerY: Center coordinates (alternative to bounds)
 * - radius: Number of regions in each direction (default: 1 for 3x3 grid)
 * 
 * Example: /api/regions/[worldId]?centerX=5&centerY=5&radius=1
 * This fetches a 3x3 grid centered at (5,5): regions from (4,4) to (6,6)
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
    const startTime = performance.now();
    
    // Check authentication
    if (!locals.account) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { worldId } = params;

    // Parse query parameters
    const centerX = url.searchParams.get('centerX');
    const centerY = url.searchParams.get('centerY');
    const radius = Number.parseInt(url.searchParams.get('radius') || '1');
    const xMin = url.searchParams.get('xMin');
    const xMax = url.searchParams.get('xMax');
    const yMin = url.searchParams.get('yMin');
    const yMax = url.searchParams.get('yMax');

    let xMinBound: number, xMaxBound: number, yMinBound: number, yMaxBound: number;

    // Calculate bounds from center + radius OR use explicit bounds
    if (centerX && centerY) {
        const centerXNum = Number.parseInt(centerX);
        const centerYNum = Number.parseInt(centerY);
        xMinBound = centerXNum - radius;
        xMaxBound = centerXNum + radius;
        yMinBound = centerYNum - radius;
        yMaxBound = centerYNum + radius;
    } else if (xMin && xMax && yMin && yMax) {
        xMinBound = Number.parseInt(xMin);
        xMaxBound = Number.parseInt(xMax);
        yMinBound = Number.parseInt(yMin);
        yMaxBound = Number.parseInt(yMax);
    } else {
        return json({ error: 'Must provide either (centerX, centerY, radius) or (xMin, xMax, yMin, yMax)' }, { status: 400 });
    }

    console.log('[REGIONS API] Fetching regions:', {
        worldId,
        bounds: { xMin: xMinBound, xMax: xMaxBound, yMin: yMinBound, yMax: yMaxBound },
        accountId: locals.account.id
    });

    try {
        // Fetch regions within the specified coordinate bounds
        const regions = await db.region.findMany({
            where: {
                worldId: worldId,
                xCoord: {
                    gte: xMinBound,
                    lte: xMaxBound
                },
                yCoord: {
                    gte: yMinBound,
                    lte: yMaxBound
                }
            },
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
        });

        const loadTimeMs = Math.round(performance.now() - startTime);
        
        console.log('[REGIONS API] ⏱️  Query time: ' + loadTimeMs + 'ms');
        console.log('[REGIONS API] Fetched ' + regions.length + ' regions');

        return json({
            regions,
            bounds: {
                xMin: xMinBound,
                xMax: xMaxBound,
                yMin: yMinBound,
                yMax: yMaxBound
            },
            count: regions.length,
            queryTimeMs: loadTimeMs
        });

    } catch (err) {
        console.error('[REGIONS API] Error fetching regions:', err);
        return json({ 
            error: `Failed to fetch regions: ${err instanceof Error ? err.message : 'Unknown error'}` 
        }, { status: 500 });
    }
};
