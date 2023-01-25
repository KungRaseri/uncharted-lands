import { Biome, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const biomes: Biome[] = [
    {
        name: "OCEAN",
        id: crypto.randomUUID()
    },
    {
        name: "BEACH",
        id: crypto.randomUUID()
    },
]

async function main() {
    // seed data here

    // biomes, etc.
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