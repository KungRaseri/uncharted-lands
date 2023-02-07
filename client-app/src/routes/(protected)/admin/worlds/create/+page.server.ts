import { db } from "$lib/db"
import { generate } from "$lib/game/world-generator"
import type { Region } from "@prisma/client"
import { fail } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
    const width = 100, height = 100,
        octaves = 8, scale = 0.75,
        amplitude = 1, persistence = 0.5,
        frequency = 0.05,
        elevationSeed = Date.now(), precipitationSeed = Date.now(), temperatureSeed = Date.now();

    const map: Region[][] = []

    const maps = await generate({ width, height, eSeed: elevationSeed, pSeed: precipitationSeed, tSeed: temperatureSeed }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency })

    for (let i = 0; i < maps.elevationMap.length; i++) {
        map[i] = []
        for (let j = 0; j < maps.elevationMap[i].length; j++) {
            map[i][j] = {
                id: '',
                biomeId: '',
                worldId: '',
                name: `${i}:${j}`,
                elevationMap: maps.elevationMap[i][j],
                precipitationMap: maps.precipitationMap[i],
                temperatureMap: maps.temperatureMap[i],
            }
        }
    }

    return {
        map: map.flat(1),
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
    const serverId = data.get("server-id")
    const worldName = data.get("world-name")
    const map = data.get("map")

    if (typeof serverId !== 'string' ||
        !serverId ||
        typeof map !== 'string' ||
        !map ||
        typeof worldName !== 'string' ||
        !worldName) {
        return fail(400, { invalid: true })
    }

    const generatedMap: Region[] = JSON.parse(map);

    // const newWorld = await db.world.create({
    //     data: {
    //         name: worldName,
    //         server: {
    //             connect: {
    //                 id: serverId
    //             }
    //         }
    //     }
    // })

    // const dbRegions: Region[] = [];

    // generatedMap.forEach(async (regions: Region[]) => {
    //     regions.forEach(async (region: Region) => {
    //         region.worldId = newWorld.id
    //         dbRegions.push(await db.region.create({
    //             data: region
    //         }));
    //     });
    // });

    // console.log(dbRegions)

    // throw redirect(302, '/admin/worlds')
}

export const actions: Actions = { saveWorld }
