import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle } from 'fractal-noise';

function chunks(array: number[], chunkSize: number) {
    if (chunkSize === 0)
        return;

    const splitChunks: number[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        splitChunks.push(chunk)
    }

    return splitChunks;
}
export async function generate(width: number, height: number, eSeed: number, pSeed: number, tSeed: number, scale: number, iterations: number, xoffset: number, yoffset: number) {
    const elevationNoise = makeNoise2D(eSeed)
    const precipitationNoise = makeNoise2D(pSeed)
    const temperatureNoise = makeNoise2D(tSeed)

    const elevationMap = makeRectangle(width, height, elevationNoise, {
    })
    return chunks(elevationMap, 10)
}

export async function save(map) {
    console.log(map)
}
