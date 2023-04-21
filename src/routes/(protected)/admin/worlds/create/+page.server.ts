import { db } from "$lib/db"
import { TileType } from "@prisma/client"
import type { Prisma, Region, Plot, Biome, Tile, World } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"
import { normalizeValue } from '$lib/game/world-generator'

import cuid from 'cuid';

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
        return fail(400, { invalid: true, message: 'Some properties were invalid or were not provided.' })
    }

    generatedRegions = JSON.parse(map.toString());

    const mapSettings = JSON.parse(mapOptions.toString());
    const elevationSettings = JSON.parse(elevationOptions.toString());
    const precipitationSettings = JSON.parse(precipitationOptions.toString());
    const temperatureSettings = JSON.parse(temperatureOptions.toString());

    biomes = await db.biome.findMany() ?? [];

    createWorld(mapSettings, elevationSettings, precipitationSettings, temperatureSettings);
    createRegions();
    await createTiles();
    createPlots();

    await finishWorldCreation()

    throw redirect(302, '/admin/worlds')
}

function createWorld(mapSettings: any, elevationSettings: Prisma.JsonValue, precipitationSettings: Prisma.JsonValue, temperatureSettings: Prisma.JsonValue) {
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
    for (const region of regions) {

        const elevationMap = region.elevationMap as number[][]
        const precipitationMap = region.precipitationMap as number[][]
        const temperatureMap = region.temperatureMap as number[][]

        for (const [x, row] of elevationMap.entries()) {
            for (const [y, elevation] of row.entries()) {
                const type = elevation < 0 ? TileType.OCEAN : TileType.LAND;
                const biome = await determineBiome(normalizeValue(precipitationMap[x][y], 0, 450), normalizeValue(temperatureMap[x][y], -10, 32))

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
    await db.world.create({
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
    })

    // const region = await db.region.create({
    //     data: {
    //         name: generatedRegion.name,
    //         elevationMap: generatedRegion.elevationMap as Prisma.JsonArray,
    //         precipitationMap: generatedRegion.precipitationMap as Prisma.JsonArray,
    //         temperatureMap: generatedRegion.temperatureMap as Prisma.JsonArray,
    //         worldId: world.id,
    //         xCoord: generatedRegion.xCoord,
    //         yCoord: generatedRegion.yCoord
    //     },
    //     include: {
    //         world: true
    //     }
    // });
    await db.region.createMany({
        data: regions as Prisma.Enumerable<Prisma.RegionCreateManyInput>
    })

    // const tile = await db.tile.create({
    //     data: {
    //         elevation: elevation,
    //         type: type,
    //         precipitation: precipitation,
    //         temperature: temperature,
    //         regionId: region.id,
    //         biomeId: biome.id
    //     }
    // });
    await db.tile.createMany({
        data: tiles as Prisma.Enumerable<Prisma.TileCreateManyInput>
    })

    // const plot = await db.plot.create({
    //     data: {
    //         id: cuid(),
    //         area: plotData.area,
    //         solar: plotData.solar,
    //         wind: plotData.wind,
    //         food: plotData.food,
    //         water: plotData.water,
    //         wood: plotData.wood,
    //         stone: plotData.stone,
    //         ore: plotData.ore,
    //         Tile: {
    //             connect: {
    //                 id: tile.id
    //             }
    //         }
    //     }
    // })
    await db.plot.createMany({
        data: plots as Prisma.Enumerable<Prisma.PlotCreateManyInput>
    })
}

function determinePlotsTotal(elevation: number, biome: Biome) {
    if (elevation <= 0) return 0; // make sure to return 0 plots for oceanic tiles.

    return Math.floor(Math.random() * (biome.plotsMax - biome.plotsMin + 1)) + biome.plotsMin;
}

function determinePlotData(tile: Tile, biome: Biome) {
    const area = Math.floor(Math.random() * (biome.plotAreaMax - biome.plotAreaMin + 1)) + biome.plotAreaMin;

    const solar = 1 + ((tile.elevation + 1) / 2) * biome.solarModifier
    const wind = 1 + ((tile.elevation + 1) / 2) * biome.solarModifier

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

    return filteredBiomes[Math.floor(Math.random() * filteredBiomes.length)];
}

export const actions: Actions = { save }