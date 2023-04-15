import { db } from "$lib/db"
import { TileType, type Biome, type Tile, type World } from "@prisma/client"
import type { Prisma, Region } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"
import cuid from 'cuid';

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

const saveWorld: Action = async ({ request }) => {
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

    const generatedMap: Region[] = JSON.parse(map.toString());
    const mapSettings = JSON.parse(mapOptions.toString());
    const elevationSettings = JSON.parse(elevationOptions.toString());
    const precipitationSettings = JSON.parse(precipitationOptions.toString());
    const temperatureSettings = JSON.parse(temperatureOptions.toString());

    const world = await handleWorldCreation(mapSettings, elevationSettings, precipitationSettings, temperatureSettings);

    await finalizeWorldCreation(world, generatedMap)

    throw redirect(302, '/admin/worlds')
}

async function finalizeWorldCreation(world: World, generatedMap: Region[]) {

    for (const generatedRegion of generatedMap) {
        const region = await handleRegionCreation(world, generatedRegion)

        const elevationMap: number[][] = JSON.parse(JSON.stringify(generatedRegion?.elevationMap))
        const precipitationMap: number[][] = JSON.parse(JSON.stringify(generatedRegion?.precipitationMap))
        const temperatureMap: number[][] = JSON.parse(JSON.stringify(generatedRegion?.temperatureMap))

        for (const row of elevationMap) {
            const x = elevationMap.indexOf(row);
            for (const elevation of row) {
                const y = row.indexOf(elevation);

                const type = elevation < 0 ? TileType.OCEAN : TileType.LAND;
                const biome = await determineBiome(precipitationMap[x][y], temperatureMap[x][y])

                const tile = await handleTileCreation(region, type, biome, elevation, precipitationMap[x][y], temperatureMap[x][y]);

                const plotsTotal = await determinePlotsTotal(tile.elevation, tile.precipitation, tile.temperature);

                for (let i = 0; i < plotsTotal; i++) {
                    await handlePlotCreation(tile);
                }
            }
        }
    }
}

async function handleWorldCreation(mapSettings: any, elevationSettings: any, precipitationSettings: any, temperatureSettings: any) {
    const world = await db.world.create({
        data: {
            name: mapSettings.worldName,
            serverId: mapSettings.serverId,
            elevationSettings,
            precipitationSettings,
            temperatureSettings
        },
        include: {
            server: true
        }
    })

    return world
}

async function handleRegionCreation(world: World, generatedRegion: Region) {
    const region = await db.region.create({
        data: {
            name: generatedRegion.name,
            elevationMap: generatedRegion.elevationMap as Prisma.JsonArray,
            precipitationMap: generatedRegion.precipitationMap as Prisma.JsonArray,
            temperatureMap: generatedRegion.temperatureMap as Prisma.JsonArray,
            worldId: world.id,
            xCoord: generatedRegion.xCoord,
            yCoord: generatedRegion.yCoord
        },
        include: {
            world: true
        }
    });

    return region;
}

async function handleTileCreation(region: Region, type: TileType, biome: Biome, elevation: number, precipitation: number, temperature: number) {
    const tile = await db.tile.create({
        data: {
            elevation: elevation,
            type: type,
            precipitation: precipitation,
            temperature: temperature,
            regionId: region.id,
            biomeId: biome.id
        }
    });

    return tile;
}

async function handlePlotCreation(tile: Tile) {
    const plotData = await determinePlotData(tile.elevation, tile.precipitation, tile.temperature);

    const plot = await db.plot.create({
        data: {
            id: cuid(),
            area: plotData.area,
            solar: plotData.solar,
            wind: plotData.wind,
            fertility: plotData.fertility,
            wildlife: plotData.wildlife,
            forest: plotData.forest,
            rocks: plotData.rocks,
            minerals: plotData.minerals,
            Tile: {
                connect: {
                    id: tile.id
                }
            },
        }
    })

    return plot;
}

async function determinePlotsTotal(elevation: number, precipitation: number, temperature: number) {
    let plots = Math.floor(Math.random() * (6 + 1));

    if (elevation < 0) {
        plots = 0;
    } else if (elevation > 1000) {
        plots = Math.min(plots + 1, 6);
    }

    if (precipitation < 200) {
        plots = Math.max(plots - 1, 0);
    } else if (precipitation > 800) {
        plots = Math.min(plots + 1, 6);
    }

    if (temperature < 10) {
        plots = Math.max(plots - 1, 0);
    } else if (temperature > 30) {
        plots = Math.min(plots + 1, 6);
    }

    return plots;
}

async function determinePlotData(elevation: number, precipitation: number, temperature: number) {
    const fertility = Math.round(Math.max(1, Math.min(5, elevation * 0.2 + precipitation * 0.2 + temperature * 0.6 + Math.random() * 0.6)))
    const wildlife = Math.round(Math.max(1, Math.min(5, elevation * 0.1 + precipitation * 0.4 + temperature * 0.4 + Math.random() * 0.4)))
    const solar = Math.round(Math.max(1, Math.min(5, elevation * 0.1 + precipitation * 0.2 + temperature * 0.5 + Math.random() * 0.5)));
    const wind = Math.round(Math.max(1, Math.min(5, elevation * 0.3 + precipitation * 0.3 + temperature * 0.3 + Math.random() * 0.3)));
    const forest = Math.round(Math.max(1, (1 + (elevation * 2) + (temperature / 10) + (precipitation / 150))));
    const rocks = Math.round(Math.max(1, (1 - (elevation * -1) + (temperature / 20))));
    const minerals = Math.round(Math.max(1, (1 + (elevation * 2) + (temperature / 20) + (precipitation / 300))));

    const minArea = 30;
    const maxArea = 80;
    const elevationWeight = 0.2;
    const precipitationWeight = 0.3;
    const temperatureWeight = 0.1;

    const elevationModifier = (elevation + 1) / 2;
    const precipitationModifier = precipitation / 450;
    const temperatureModifier = (temperature + 10) / 42;

    const area = minArea + ((maxArea - minArea) * (elevationWeight * elevationModifier + precipitationWeight * precipitationModifier + temperatureWeight * temperatureModifier));

    return { area: Math.round(area), solar, wind, fertility, wildlife, forest, rocks, minerals }
}

async function determineBiome(precipitation: number, temperature: number) {
    const biomes = await db.biome.findMany();

    let filteredBiomes = biomes.filter(biome =>
        Math.round(precipitation) >= biome.precipitationMin && Math.round(precipitation) <= biome.precipitationMax
        && Math.round(temperature) >= biome.temperatureMin && Math.round(temperature) <= biome.temperatureMax)

    if (!filteredBiomes.length)
        filteredBiomes = filteredBiomes.concat(biomes.filter(biome =>
            Math.round(precipitation) >= biome.precipitationMin && Math.round(precipitation) <= biome.precipitationMax));

    return filteredBiomes[Math.floor(Math.random() * filteredBiomes.length)];
}

export const actions: Actions = { saveWorld }