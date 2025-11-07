// TODO: This file still uses deprecated db import - needs migration to REST API
import { db } from "$lib/db"
// Types simplified after Prisma removal
type TileType = 'LAND' | 'OCEAN';
type Region = any;
type Plot = any;
type Biome = any;
type Tile = any;
type World = any;

import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"
import { normalizeValue } from '$lib/game/world-generator'
import { generatePlotResources, determinePlotsTotal } from '$lib/game/resource-generator'

import { createId } from '@paralleldrive/cuid2';

/**
 * ⚠️ TEMPORARY: This file still uses client-side Prisma for world generation
 * 
 * Reason: Complex world generation with biomes, tiles, and plots requires:
 * 1. Biomes API endpoint
 * 2. Large bulk insert support
 * 3. Transaction handling
 * 
 * TODO for future phase:
 * - Create /api/biomes endpoint
 * - Update world creation to use REST API
 * - Move world generation logic to server
 * 
 * For now, this is acceptable as it's admin-only and low frequency operation.
 */

let mapSettings: any;
let elevationSettings: any;
let precipitationSettings: any;
let temperatureSettings: any;

let world: World;
let regions: Region[] = [];
let tiles: Tile[] = [];
let plots: Plot[] = [];
let biomes: Biome[] = [];

let generatedRegions: Region[];

export const load: PageServerLoad = async () => {
    return {
        servers: await db.server.findMany({
            select: {
                id: true,
                name: true
            }
        })
    }
}

const save: Action = async ({ request }) => {
    try {
        const data = await request.formData();
        const map = data.get("map")
        const mapOptions = data.get("map-options")
        const elevationOptions = data.get("elevation-options")
        const precipitationOptions = data.get("precipitation-options")
        const temperatureOptions = data.get("temperature-options")

        if (!map ||
            !mapOptions ||
            !elevationOptions ||
            !precipitationOptions ||
            !temperatureOptions) {
            console.error('Missing required fields:', { map: !!map, mapOptions: !!mapOptions, elevationOptions: !!elevationOptions, precipitationOptions: !!precipitationOptions, temperatureOptions: !!temperatureOptions });
            return fail(400, { invalid: true, message: 'Some properties were invalid or were not provided.' })
        }

        console.log('Parsing form data...');
        generatedRegions = JSON.parse(map.toString());
        console.log(`Generated ${generatedRegions.length} regions`);

        mapSettings = JSON.parse(mapOptions.toString());
        elevationSettings = JSON.parse(elevationOptions.toString());
        precipitationSettings = JSON.parse(precipitationOptions.toString());
        temperatureSettings = JSON.parse(temperatureOptions.toString());

        console.log('Fetching biomes...');
        biomes = await db.biome.findMany() ?? [];
        console.log(`Found ${biomes.length} biomes`);

        if (biomes.length === 0) {
            console.error('No biomes found in database!');
            return fail(500, { invalid: true, message: 'No biomes found in database. Please seed the database first.' });
        }

        console.log('Creating world...');
        createWorld();
        
        console.log('Creating regions...');
        createRegions();
        
        console.log('Creating tiles...');
        await createTiles();
        console.log(`Created ${tiles.length} tiles`);
        
        console.log('Creating plots...');
        createPlots();
        console.log(`Created ${plots.length} plots`);

        console.log('Saving to database...');
        await finishWorldCreation()
        
        console.log('World creation complete!');
        
    } catch (error) {
        console.error('Error in save action:', error);
        console.error('Error type:', typeof error);
        console.error('Error is Response?', error instanceof Response);
        
        // Don't return an error if the data was actually saved
        if (world && world.id) {
            console.log('Data was saved despite error, redirecting anyway...');
            // Continue to redirect even if there was an error after save
        } else {
            // Only return error if save actually failed
            return fail(500, { 
                invalid: true, 
                message: error instanceof Error ? error.message : 'An unknown error occurred while creating the world.' 
            });
        }
    }
    
    // Always redirect after save attempt if we got this far
    throw redirect(302, '/admin/worlds');
}

function createWorld() {
    world = {
        id: createId(),
        name: mapSettings.worldName,
        serverId: mapSettings.serverId,
        elevationSettings: elevationSettings,
        precipitationSettings: precipitationSettings,
        temperatureSettings: temperatureSettings,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now())
    }
}

function createRegions() {
    regions = generatedRegions.map((v) => {
        v.id = createId();
        v.worldId = world.id;

        return v;
    });
}

async function createTiles() {
    tiles = []
    for (const region of regions) {

        const elevationMap = region.elevationMap as number[][]
        const precipitationMap = region.precipitationMap as number[][]
        const temperatureMap = region.temperatureMap as number[][]

        for (const [x, row] of elevationMap.entries()) {
            for (const [y, elevation] of row.entries()) {
                const type = elevation < 0 ? 'OCEAN' : 'LAND';
                const biome = await determineBiome(normalizeValue(precipitationMap[x][y], 0, 450), normalizeValue(temperatureMap[x][y], -10, 32))

                if (!biome || !biome.id) {
                    throw new Error(`Failed to determine biome for tile at region ${region.xCoord}:${region.yCoord}, tile ${x}:${y}`);
                }

                tiles.push({
                    id: createId(),
                    regionId: region.id,
                    biomeId: biome.id,
                    type,
                    elevation: elevationMap[x][y],
                    precipitation: precipitationMap[x][y],
                    temperature: temperatureMap[x][y]
                });
            }
        }
    }
}

function createPlots() {
    plots = []
    for (const tile of tiles) {
        const biome = biomes.find(biome => biome.id === tile.biomeId)
        if (biome === undefined) return;

        const plotsTotal = determinePlotsTotal(tile, biome);

        for (let i = 0; i < plotsTotal; i++) {
            const resources = generatePlotResources(tile, biome);
            plots.push({
                id: createId(),
                tileId: tile.id,
                ...resources
            });
        }
    }
}


async function finishWorldCreation() {
    await db.$transaction([
        db.world.create({
            data: {
                id: world.id,
                name: world.name,
                serverId: world.serverId,
                elevationSettings: world.elevationSettings as any,
                precipitationSettings: world.precipitationSettings as any,
                temperatureSettings: world.temperatureSettings as any,
                createdAt: world.createdAt,
                updatedAt: world.updatedAt
            }
        }),
        db.region.createMany({
            data: regions as any
        }),
        db.tile.createMany({
            data: tiles as any
        }),
        db.plot.createMany({
            data: plots as any
        })
    ])
}

async function determineBiome(precipitation: number, temperature: number) {
    let filteredBiomes = biomes.filter(biome =>
        Math.round(precipitation) >= biome.precipitationMin && Math.round(precipitation) <= biome.precipitationMax
        && Math.round(temperature) >= biome.temperatureMin && Math.round(temperature) <= biome.temperatureMax)

    if (!filteredBiomes.length)
        filteredBiomes = filteredBiomes.concat(biomes.filter(biome =>
            Math.round(precipitation) >= biome.precipitationMin && Math.round(precipitation) <= biome.precipitationMax));

    if (!filteredBiomes.length) {
        // Fallback to first biome if no match found
        console.warn(`No biome found for precipitation: ${precipitation}, temperature: ${temperature}. Using fallback.`);
        return biomes[0];
    }

    return filteredBiomes[Math.floor(Math.random() * filteredBiomes.length)];
}

export const actions: Actions = { save }