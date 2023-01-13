import { TileType } from "@prisma/client";

const tilesToCss = [
    {
        type: TileType.STONE,
        bg: "bg-stone-500",
        text: "text-stone-100"
    },
    {
        type: TileType.ICE,
        bg: "bg-sky-300",
        text: "text-sky-900"
    },
    {
        type: TileType.WATER,
        bg: "bg-blue-500",
        text: "text-blue-100"
    },
    {
        type: TileType.SAND,
        bg: "bg-yellow-200",
        text: "text-yellow-900"
    },
    {
        type: TileType.SOIL,
        bg: "bg-yellow-900",
        text: "text-"
    }
]

export function getCSSFromTile(tile: string) {
    return tilesToCss.find(t => t.type === tile);
}