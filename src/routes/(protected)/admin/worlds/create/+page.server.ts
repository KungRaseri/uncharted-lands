import { db } from "$lib/db"
import { TileType } from "@prisma/client"
import type { Prisma, Region, Plot, Biome, Tile, World } from "@prisma/client"
import { redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"

let biomes: Biome[] = [];

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

const preview: Action = async ({ request }) => {
    const data = await request.formData();

    return {
        data
    }
}

const save: Action = async ({ request }) => {
    const data = await request.formData();
    const world = data.get("world")

    await finishWorldCreation(world)

    throw redirect(302, '/admin/worlds')
}

async function finishWorldCreation(world) {
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