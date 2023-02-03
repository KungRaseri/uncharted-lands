import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle } from 'fractal-noise';

function chunks(array: number[], chunkSize: number) {
    let splitChunks: number[][] = [];

    if (chunkSize === 0)
        return;

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        splitChunks = splitChunks.concat(chunk)
    }

    return splitChunks;
}

export async function generate(width: number, height: number, eSeed: number, pSeed: number, tSeed: number, scale: number, iterations: number, xoffset: number, yoffset: number) {
    const elevationNoise = makeNoise2D(eSeed)
    const precipitationNoise = makeNoise2D(pSeed)
    const temperatureNoise = makeNoise2D(tSeed)

    const elevationMap = makeRectangle(width, height, elevationNoise, {})

    return chunks(elevationMap, width)
}
