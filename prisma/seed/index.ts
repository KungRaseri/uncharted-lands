import { type Biome, PrismaClient } from "@prisma/client";

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

// const resources: Resource[] = [
//     {
//         id: "",
//         name: "Solar",
//         description: "A measure of the amount of sunlight that reaches the plot. A higher value indicates that the plot is located in an area with more hours of sunlight, which can be useful for certain types of structures or activities.",
//         icon: ""
//     },
//     {
//         id: "",
//         name: "Wind",
//         description: "A measure of the strength of the winds that pass over the plot. A higher value indicates that the plot is located in an area with stronger winds, which can be harnessed for energy or used for other purposes such as ventilation or transportation.",
//         icon: ""
//     },
//     {
//         id: "",
//         name: "Food",
//         description: "Refers to any type of edible plant or animal resources that can be gathered, hunted, or grown within a settlement. Food is essential for keeping settlers alive and healthy.",
//         icon: ""
//     },
//     {
//         id: "",
//         name: "Water",
//         description: "Refers to any source of fresh water within a settlement. Water is essential for the survival of settlers, as well as for farming and other activities.",
//         icon: ""
//     },
//     {
//         id: "",
//         name: "Wood",
//         description: "Refers to any type of trees or woody plants that can be harvested within a settlement. Wood is a valuable resource for building structures, making tools, and fueling fires.",
//         icon: ""
//     },
//     {
//         id: "",
//         name: "Stone",
//         description: "Refers to any type of rocks or minerals that can be mined within a settlement. Stone is a valuable resource for building structures and making tools.",
//         icon: ""
//     },
//     {
//         id: "",
//         name: "Ore",
//         description: "Refers to any type of metallic or mineral resources that can be mined within a settlement. Ores are valuable resources for creating weapons, armor, and other advanced structures.",
//         icon: ""
//     }
// ]

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