import { db } from "$lib/db"
import { generate } from "$lib/game/world-generator"
import type { Region } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
    const width = 100, height = 100,
        octaves = 8, scale = 0.75,
        amplitude = 1, persistence = 0.5,
        frequency = 0.05,
        elevationSeed = Date.now(), precipitationSeed = Date.now(), temperatureSeed = Date.now();

    const map: Region[][] = []

    const maps = await generate(width, height, elevationSeed, precipitationSeed, temperatureSeed, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency })

    // console.log(maps.elevationMap[0])
    // console.log(maps.elevationMap[0].splice(9 * 10, 9 + 10))



    for (let i = 0; i < 10; i++) {
        map[i] = []

        for (let j = 0; j < 10; j++) {
            map[i][j] = {
                id: '',
                biomeId: '',
                worldId: '',
                name: `${i}:${j}`,
                elevationMap: maps.elevationMap[i],
                precipitationMap: maps.precipitationMap[i],
                temperatureMap: maps.temperatureMap[i],
            }
        };
    }

    console.log(map)

    // const map = await generate(width, height, elevationSeed, precipitationSeed, temperatureSeed, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency }, { scale: (x) => { return x * scale }, octaves, amplitude, persistence, frequency })

    return {
        map: map,
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
    const map = data.get("map")

    if (typeof serverId !== 'string' ||
        !serverId ||
        typeof map !== 'string' ||
        !map) {
        return fail(400, { invalid: true })
    }

    const generatedMap = JSON.parse(map);

    console.log(generatedMap)

    // const newWorld = await db.world.create({
    //     data: {
    //         server: {
    //             connect: {
    //                 id: serverId
    //             }
    //         },
    //         regions: {
    //             createMany: {
    //                 data: {

    //                 }
    //             },

    //         }
    //     }
    // })


    // throw redirect(302, '/admin/worlds')
}

export const actions: Actions = { saveWorld }
