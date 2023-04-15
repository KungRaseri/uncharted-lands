import { type Biome, type Resource, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const biomes: Biome[] = [
    {
        id: "",
        name: "TUNDRA",
        precipitationMin: 10,
        precipitationMax: 175,
        temperatureMin: -10,
        temperatureMax: 5
    },
    {
        id: "",
        name: "FOREST_BOREAL",
        precipitationMin: 25,
        precipitationMax: 300,
        temperatureMin: -5,
        temperatureMax: 10
    },
    {
        id: "",
        name: "FOREST_TEMPERATE_SEASONAL",
        precipitationMin: 50,
        precipitationMax: 350,
        temperatureMin: 4,
        temperatureMax: 22
    },
    {
        id: "",
        name: "FOREST_TROPICAL_SEASONAL",
        precipitationMin: 50,
        precipitationMax: 350,
        temperatureMin: 20,
        temperatureMax: 32
    },
    {
        id: "",
        name: "RAINFOREST_TEMPERATE",
        precipitationMin: 175,
        precipitationMax: 375,
        temperatureMin: 7,
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
        precipitationMax: 150,
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
        precipitationMin: 1,
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

const resources: Resource[] = [
    {
        id: "",
        name: "Food",
        description: "",
        icon: ""
    },
    {
        id: "",
        name: "Water",
        description: "",
        icon: ""
    },
    {
        id: "",
        name: "Wood",
        description: "",
        icon: ""
    },
    {
        id: "",
        name: "Stone",
        description: "",
        icon: ""
    }
]

async function main() {
    console.log('Start seeding ...')

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

        // other seed data

        console.log(`Biome ${resultBiome.name} with ID[${resultBiome.id}] created`)
    })

    // resources, etc.
    console.log(`Seeding [${resources.length}] Resources`)
    resources.forEach(async (resource) => {
        const resultResource = await prisma.resource.upsert({
            where: {
                name: resource.name
            },
            create: {
                name: resource.name,
                description: resource.description,
                icon: resource.icon
            },
            update: {
                name: resource.name,
            }
        })

        // other seed data

        console.log(`Resource ${resultResource.name} with ID[${resultResource.id}] created`)
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