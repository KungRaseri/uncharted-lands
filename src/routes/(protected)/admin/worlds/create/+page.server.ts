import { db } from "$lib/db"
import { TileType } from "@prisma/client"
import type { Prisma, Region, Plot, Biome, Tile, World } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"
import { determineBiome, determinePlotData, determinePlotsTotal, normalizeValue, } from '$lib/game/world-generator'

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
    biomes = await db.biome.findMany() ?? [];

    return {
        servers: await db.server.findMany({
            select: {
                id: true,
                name: true
            }
        }),
        biomes
    }
}

const preview: Action = async({request}) => {
    const data = await request.formData();

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

    mapSettings = JSON.parse(mapOptions.toString());
    elevationSettings = JSON.parse(elevationOptions.toString());
    precipitationSettings = JSON.parse(precipitationOptions.toString());
    temperatureSettings = JSON.parse(temperatureOptions.toString());

    createWorld();
    createRegions();
    await createTiles();
    createPlots();

    await finishWorldCreation()

    throw redirect(302, '/admin/worlds')
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
                const biome = await determineBiome(biomes, normalizeValue(precipitationMap[x][y], 0, 450), normalizeValue(temperatureMap[x][y], -10, 32))

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

export const actions: Actions = { preview, save }