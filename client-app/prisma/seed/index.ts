import { type Biome, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const biomes: Biome[] = [
    {
        id: "",
        name: "TUNDRA",
        precipitationMin: 10,
        precipitationMax: 100,
        temperatureMin: -10,
        temperatureMax: 5
    },
    {
        id: "",
        name: "FOREST_BOREAL",
        precipitationMin: 25,
        precipitationMax: 200,
        temperatureMin: 0,
        temperatureMax: 10
    },
    {
        id: "",
        name: "FOREST_TEMPERATE_SEASONAL",
        precipitationMin: 50,
        precipitationMax: 225,
        temperatureMin: 5,
        temperatureMax: 22
    },
    {
        id: "",
        name: "FOREST_TROPICAL_SEASONAL",
        precipitationMin: 50,
        precipitationMax: 275,
        temperatureMin: 22,
        temperatureMax: 32
    },
    {
        id: "",
        name: "RAINFOREST_TEMPERATE",
        precipitationMin: 175,
        precipitationMax: 325,
        temperatureMin: 8,
        temperatureMax: 25
    },
    {
        id: "",
        name: "RAINFOREST_TROPICAL",
        precipitationMin: 225,
        precipitationMax: 450,
        temperatureMin: 24,
        temperatureMax: 31
    },
    {
        id: "",
        name: "WOODLAND",
        precipitationMin: 15,
        precipitationMax: 125,
        temperatureMin: -2,
        temperatureMax: 23
    },
    {
        id: "",
        name: "SHRUBLAND",
        precipitationMin: 15,
        precipitationMax: 125,
        temperatureMin: -2,
        temperatureMax: 23
    },
    {
        id: "",
        name: "SAVANNA",
        precipitationMin: 50,
        precipitationMax: 275,
        temperatureMin: 22,
        temperatureMax: 32
    },
    {
        id: "",
        name: "GRASSLAND_TEMPERATE",
        precipitationMin: 5,
        precipitationMax: 50,
        temperatureMin: -4,
        temperatureMax: 22
    },
    {
        id: "",
        name: "DESERT_COLD",
        precipitationMin: 5,
        precipitationMax: 50,
        temperatureMin: -4,
        temperatureMax: 22
    },
    {
        id: "",
        name: "DESERT_SUBTROPICAL",
        precipitationMin: 1,
        precipitationMax: 100,
        temperatureMin: 18,
        temperatureMax: 32
    }
]

async function main() {
    console.log('Start seeding ...')
    // seed data here

    // biomes, etc.
    console.log(`Seeding [${biomes.length}] Biomes`)
    biomes.forEach(async (biome) => {
        const resultBiome = await prisma.biome.upsert({
            where: {
                name: biome.name
            },
            create: {
                name: biome.name,
                precipitationMin: biome.precipitationMin,
                precipitationMax: biome.precipitationMax,
                temperatureMin: biome.temperatureMin,
                temperatureMax: biome.temperatureMax
            },
            update: {
                name: biome.name,
                precipitationMin: biome.precipitationMin,
                precipitationMax: biome.precipitationMax,
                temperatureMin: biome.temperatureMin,
                temperatureMax: biome.temperatureMax
            }
        })

        console.log(`Biome ${resultBiome.name} with ID[${resultBiome.id}] created`)
    })

    console.log(`Seeding finished.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });