import { Biome } from "@prisma/client";

const tilesToCss = [
    {
        biome: Biome.WATER,
        bg: "bg-blue-900",
        text: "text-blue-100",
        gradientColor: "blue"
    },
    {
        biome: Biome.BEACH,
        bg: "bg-amber-200",
        text: "text-amber-900",
        gradientColor: "amber"
    },
    {
        biome: Biome.DESERT,
        bg: "bg-yellow-500",
        text: "text-yellow-900",
        gradientColor: "yellow"
    },
    {
        biome: Biome.PLAINS,
        bg: "bg-green-700",
        text: "text-green-100",
        gradientColor: "green"
    },
    {
        biome: Biome.FOREST,
        bg: "bg-lime-900",
        text: "text-lime-100",
        gradientColor: "lime"
    },
    {
        biome: Biome.JUNGLE,
        bg: "bg-emerald-900",
        text: "text-emerald-100",
        gradientColor: "emerald"
    },
    {
        biome: Biome.SAVANNAH,
        bg: "bg-yellow-700",
        text: "text-yellow-50",
        gradientColor: "yellow"
    },
    {
        biome: Biome.SNOW,
        bg: "bg-sky-300",
        text: "text-sky-900",
        gradientColor: "sky"
    }
]

export function getCSSFromTile(tile: string) {
    return tilesToCss.find(t => t.biome === tile);
}