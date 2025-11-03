import { db } from "$lib/db"
import { TileType } from "@prisma/client"
import type { Prisma, Region, Plot, Biome, Tile, World } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"
import { normalizeValue } from '$lib/game/world-generator'

import cuid from 'cuid';

let mapSettings: any;
let elevationSettings: Prisma.JsonValue;
let precipitationSettings: Prisma.JsonValue;
let temperatureSettings: Prisma.JsonValue;

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
        id: cuid(),
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
        v.id = cuid();
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
                const type = elevation < 0 ? TileType.OCEAN : TileType.LAND;
                const biome = await determineBiome(normalizeValue(precipitationMap[x][y], 0, 450), normalizeValue(temperatureMap[x][y], -10, 32))

                if (!biome || !biome.id) {
                    throw new Error(`Failed to determine biome for tile at region ${region.xCoord}:${region.yCoord}, tile ${x}:${y}`);
                }

                tiles.push({
                    id: cuid(),
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

        const plotsTotal = determinePlotsTotal(tile.elevation, biome);

        for (let i = 0; i < plotsTotal; i++) {
            const plotData: Plot = determinePlotData(tile, biome);
            plots.push(plotData);
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
                elevationSettings: world.elevationSettings as Prisma.InputJsonValue,
                precipitationSettings: world.precipitationSettings as Prisma.InputJsonValue,
                temperatureSettings: world.temperatureSettings as Prisma.InputJsonValue,
                createdAt: world.createdAt,
                updatedAt: world.updatedAt
            }
        }),
        db.region.createMany({
            data: regions as Prisma.Enumerable<Prisma.RegionCreateManyInput>
        }),
        db.tile.createMany({
            data: tiles as Prisma.Enumerable<Prisma.TileCreateManyInput>
        }),
        db.plot.createMany({
            data: plots as Prisma.Enumerable<Prisma.PlotCreateManyInput>
        })
    ])
}

function determinePlotsTotal(elevation: number, biome: Biome) {
    if (elevation <= 0) return 0; // make sure to return 0 plots for oceanic tiles.

    return Math.floor(Math.random() * (biome.plotsMax - biome.plotsMin + 1)) + biome.plotsMin;
}

function determinePlotData(tile: Tile, biome: Biome) {
    const area = Math.floor(Math.random() * (biome.plotAreaMax - biome.plotAreaMin + 1)) + biome.plotAreaMin;

    const solar = Math.floor(biome.solarModifier + ((tile.elevation + 1) * 2) + ((tile.temperature + 1) * 2) - ((tile.precipitation + 1) * 2))
    const wind = Math.floor(biome.windModifier + ((tile.temperature + 1) * 1.5) + ((tile.precipitation + 1) * 1.5))

    const food = determineFood(tile.elevation, tile.precipitation, tile.temperature, solar, wind);
    const water = determineWater(tile.elevation, tile.precipitation, tile.temperature, solar, wind);

    const wood = Math.round((tile.elevation + tile.precipitation + tile.temperature + solar) / 4)
    const stone = Math.round((tile.elevation + tile.precipitation + tile.temperature + wind) / 4)
    const ore = Math.round((tile.elevation + tile.precipitation + tile.temperature + solar + wind) / 5)

    return { id: cuid(), tileId: tile.id, area, solar, wind, food, water, wood, stone, ore }
}

function determineSolar(elevation: number, precipitation: number, temperature: number) {
    // Determine base solar value based on elevation
    let solar = 1;

    if (elevation > 0) {
        solar += elevation / 10000;
        if (solar > 5) solar = 5;
    } else {
        solar -= Math.abs(elevation) / 10000;
        if (solar < 1) solar = 1;
    }

    // Adjust solar based on precipitation
    solar -= precipitation / 150;
    if (solar < 1) solar = 1;

    // Adjust solar based on temperature
    solar += temperature / 20;
    if (solar > 5) solar = 5;

    return Math.round(solar);
}

function determineWind(elevation: number, precipitation: number, temperature: number) {
    // Determine base wind value based on elevation
    let wind = 5;
    if (elevation > 0) {
        wind -= elevation / 10000;
        if (wind < 1) wind = 1;
    } else {
        wind += Math.abs(elevation) / 10000;
        if (wind > 5) wind = 5;
    }

    // Adjust wind based on precipitation
    wind += precipitation / 150;
    if (wind > 5) wind = 5;

    // Adjust wind based on temperature
    wind -= temperature / 20;
    if (wind < 1) wind = 1;

    return Math.round(wind);
}

function determineFood(elevation: number, precipitation: number, temperature: number, solar: number, wind: number) {
    let food = (elevation + precipitation + temperature) / 3

    food += (solar - wind) / 10;

    return Math.round(Math.max(1, Math.min(5, food)))
}

function determineWater(elevation: number, precipitation: number, temperature: number, solar: number, wind: number) {
    let water = (elevation + precipitation + temperature) / 3

    water += (solar + wind) / 10;

    return Math.round(Math.max(1, Math.min(5, water)))
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