import { type Biome, PrismaClient } from "@prisma/client";
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

const biomes: Biome[] = [
    {
        id: createId(),
        name: "TUNDRA",
        precipitationMin: 10,
        precipitationMax: 175,
        temperatureMin: -10,
        temperatureMax: 5,
        solarModifier: 2,
        windModifier: 2,
        foodModifier: 1,
        waterModifier: 1,
        woodModifier: 1,
        stoneModifier: 1,
        oreModifier: 1,
        plotsMin: 0,
        plotsMax: 6,
        plotAreaMin: 50,
        plotAreaMax: 70
    },
    {
        id: createId(),
        name: "FOREST_BOREAL",
        precipitationMin: 25,
        precipitationMax: 300,
        temperatureMin: -5,
        temperatureMax: 10,
        solarModifier: 2,
        windModifier: 1,
        foodModifier: 2,
        waterModifier: 2,
        woodModifier: 2,
        stoneModifier: 1,
        oreModifier: 1,
        plotsMin: 2,
        plotsMax: 8,
        plotAreaMin: 50,
        plotAreaMax: 85
    },
    {
        id: createId(),
        name: "FOREST_TEMPERATE_SEASONAL",
        precipitationMin: 50,
        precipitationMax: 350,
        temperatureMin: 4,
        temperatureMax: 22,
        solarModifier: 2,
        windModifier: 1,
        foodModifier: 2,
        waterModifier: 2,
        woodModifier: 2,
        stoneModifier: 2,
        oreModifier: 2,
        plotsMin: 3,
        plotsMax: 8,
        plotAreaMin: 55,
        plotAreaMax: 95
    },
    {
        id: createId(),
        name: "FOREST_TROPICAL_SEASONAL",
        precipitationMin: 50,
        precipitationMax: 350,
        temperatureMin: 20,
        temperatureMax: 32,
        solarModifier: 3,
        windModifier: 1,
        foodModifier: 3,
        waterModifier: 3,
        woodModifier: 3,
        stoneModifier: 2,
        oreModifier: 2,
        plotsMin: 3,
        plotsMax: 9,
        plotAreaMin: 55,
        plotAreaMax: 100
    },
    {
        id: createId(),
        name: "RAINFOREST_TEMPERATE",
        precipitationMin: 175,
        precipitationMax: 375,
        temperatureMin: 7,
        temperatureMax: 25,
        solarModifier: 2,
        windModifier: 1,
        foodModifier: 2,
        waterModifier: 3,
        woodModifier: 3,
        stoneModifier: 2,
        oreModifier: 2,
        plotsMin: 3,
        plotsMax: 9,
        plotAreaMin: 60,
        plotAreaMax: 95
    },
    {
        id: createId(),
        name: "RAINFOREST_TROPICAL",
        precipitationMin: 225,
        precipitationMax: 450,
        temperatureMin: 24,
        temperatureMax: 31,
        solarModifier: 3,
        windModifier: 1,
        foodModifier: 3,
        waterModifier: 3,
        woodModifier: 3,
        stoneModifier: 2,
        oreModifier: 2,
        plotsMin: 4,
        plotsMax: 10,
        plotAreaMin: 65,
        plotAreaMax: 100
    },
    {
        id: createId(),
        name: "WOODLAND",
        precipitationMin: 15,
        precipitationMax: 150,
        temperatureMin: -2,
        temperatureMax: 23,
        solarModifier: 2,
        windModifier: 1,
        foodModifier: 2,
        waterModifier: 1,
        woodModifier: 2,
        stoneModifier: 1,
        oreModifier: 1,
        plotsMin: 1,
        plotsMax: 7,
        plotAreaMin: 50,
        plotAreaMax: 75
    },
    {
        id: createId(),
        name: "SHRUBLAND",
        precipitationMin: 15,
        precipitationMax: 125,
        temperatureMin: -2,
        temperatureMax: 23,
        solarModifier: 2,
        windModifier: 1,
        foodModifier: 1,
        waterModifier: 1,
        woodModifier: 2,
        stoneModifier: 1,
        oreModifier: 1,
        plotsMin: 1,
        plotsMax: 7,
        plotAreaMin: 50,
        plotAreaMax: 70
    },
    {
        id: createId(),
        name: "SAVANNA",
        precipitationMin: 50,
        precipitationMax: 275,
        temperatureMin: 22,
        temperatureMax: 32,
        solarModifier: 3,
        windModifier: 2,
        foodModifier: 3,
        waterModifier: 2,
        woodModifier: 1,
        stoneModifier: 1,
        oreModifier: 1,
        plotsMin: 2,
        plotsMax: 8,
        plotAreaMin: 55,
        plotAreaMax: 95
    },
    {
        id: createId(),
        name: "GRASSLAND_TEMPERATE",
        precipitationMin: 5,
        precipitationMax: 50,
        temperatureMin: -4,
        temperatureMax: 22,
        solarModifier: 2,
        windModifier: 2,
        foodModifier: 2,
        waterModifier: 1,
        woodModifier: 1,
        stoneModifier: 1,
        oreModifier: 1,
        plotsMin: 1,
        plotsMax: 7,
        plotAreaMin: 50,
        plotAreaMax: 70
    },
    {
        id: createId(),
        name: "DESERT_COLD",
        precipitationMin: 1,
        precipitationMax: 50,
        temperatureMin: -4,
        temperatureMax: 22,
        solarModifier: 3,
        windModifier: 3,
        foodModifier: 1,
        waterModifier: 1,
        woodModifier: 1,
        stoneModifier: 2,
        oreModifier: 2,
        plotsMin: 0,
        plotsMax: 5,
        plotAreaMin: 50,
        plotAreaMax: 60
    },
    {
        id: createId(),
        name: "DESERT_SUBTROPICAL",
        precipitationMin: 1,
        precipitationMax: 100,
        temperatureMin: 18,
        temperatureMax: 32,
        solarModifier: 4,
        windModifier: 4,
        foodModifier: 1,
        waterModifier: 1,
        woodModifier: 1,
        stoneModifier: 3,
        oreModifier: 3,
        plotsMin: 0,
        plotsMax: 5,
        plotAreaMin: 50,
        plotAreaMax: 70
    }
]

// const resources: Resource[] = [
//     {
//         id: createId(),
//         name: "Solar",
//         description: "A measure of the amount of sunlight that reaches the plot. A higher value indicates that the plot is located in an area with more hours of sunlight, which can be useful for certain types of structures or activities.",
//         icon: ""
//     },
//     {
//         id: createId(),
//         name: "Wind",
//         description: "A measure of the strength of the winds that pass over the plot. A higher value indicates that the plot is located in an area with stronger winds, which can be harnessed for energy or used for other purposes such as ventilation or transportation.",
//         icon: ""
//     },
//     {
//         id: createId(),
//         name: "Food",
//         description: "Refers to any type of edible plant or animal resources that can be gathered, hunted, or grown within a settlement. Food is essential for keeping settlers alive and healthy.",
//         icon: ""
//     },
//     {
//         id: createId(),
//         name: "Water",
//         description: "Refers to any source of fresh water within a settlement. Water is essential for the survival of settlers, as well as for farming and other activities.",
//         icon: ""
//     },
//     {
//         id: createId(),
//         name: "Wood",
//         description: "Refers to any type of trees or woody plants that can be harvested within a settlement. Wood is a valuable resource for building structures, making tools, and fueling fires.",
//         icon: ""
//     },
//     {
//         id: createId(),
//         name: "Stone",
//         description: "Refers to any type of rocks or minerals that can be mined within a settlement. Stone is a valuable resource for building structures and making tools.",
//         icon: ""
//     },
//     {
//         id: createId(),
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
            create: biome,
            update: biome
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