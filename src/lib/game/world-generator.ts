import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle, type Options } from 'fractal-noise';

function chunks(heightMap: number[][], chunkSize: number) {
    const splitChunks: number[][][] = [];

    if (chunkSize === 0)
        return splitChunks;

    for (let i = 0; i < chunkSize; i++) {
        splitChunks[i] = []
        for (let j = 0; j < chunkSize; j++) {
            const iIndex = i * chunkSize;
            const jIndex = j * chunkSize;

            // console.log(`i${iIndex}-${iIndex + chunkSize}`, `j${jIndex}-${jIndex + chunkSize}`)
            const chunk = heightMap.slice(iIndex, iIndex + chunkSize).map(r => r.slice(jIndex, jIndex + chunkSize));
            // console.log(chunk)
            splitChunks[i][j] = chunk;
        }
    }

    return splitChunks;
}

type MapOptions = {
    serverId: string | null, worldName: string | null, width: number, height: number, eSeed: number, pSeed: number, tSeed: number
}

export async function generate(mapOptions: MapOptions, elevationOptions: Options, precipitationOptions: Options, temperatureOptions: Options) {
    const elevationNoise = makeNoise2D(mapOptions.eSeed)
    const precipitationNoise = makeNoise2D(mapOptions.pSeed)
    const temperatureNoise = makeNoise2D(mapOptions.tSeed)

    const elevationMap = makeRectangle(mapOptions.width, mapOptions.height, elevationNoise, {
        amplitude: elevationOptions.amplitude,
        persistence: elevationOptions.persistence,
        frequency: elevationOptions.frequency,
        octaves: elevationOptions.octaves,
        scale: elevationOptions.scale
    })

    const precipitationMap = makeRectangle(mapOptions.width, mapOptions.height, precipitationNoise, {
        amplitude: precipitationOptions.amplitude,
        persistence: precipitationOptions.persistence,
        frequency: precipitationOptions.frequency,
        octaves: precipitationOptions.octaves,
        scale: precipitationOptions.scale
    })

    const temperatureMap = makeRectangle(mapOptions.width, mapOptions.height, temperatureNoise, {
        amplitude: temperatureOptions.amplitude,
        persistence: temperatureOptions.persistence,
        frequency: temperatureOptions.frequency,
        octaves: temperatureOptions.octaves,
        scale: temperatureOptions.scale
    })

    return { elevationMap: chunks(elevationMap, 10), precipitationMap: chunks(precipitationMap, 10), temperatureMap: chunks(temperatureMap, 10) }
}

export async function generateElevation(mapOptions: MapOptions, elevationOptions: Options) {
    const elevationNoise = makeNoise2D(mapOptions.eSeed)

    const elevationMap = makeRectangle(mapOptions.width, mapOptions.height, elevationNoise, {
        amplitude: elevationOptions.amplitude,
        persistence: elevationOptions.persistence,
        frequency: elevationOptions.frequency,
        octaves: elevationOptions.octaves,
        scale: elevationOptions.scale
    })

    return chunks(elevationMap, 10)
}

export async function generatePrecipitation(mapOptions: MapOptions, precipitationOptions: Options) {
    const precipitationNoise = makeNoise2D(mapOptions.pSeed)
    const precipitationMin = 1, precipitationMax = 450;

    const precipitationMap = makeRectangle(mapOptions.width, mapOptions.height, precipitationNoise, {
        amplitude: precipitationOptions.amplitude,
        persistence: precipitationOptions.persistence,
        frequency: precipitationOptions.frequency,
        octaves: precipitationOptions.octaves,
        scale: (x: number) => {
            return normalizeValue(x, precipitationMin, precipitationMax);
        }
    })

    return chunks(precipitationMap, 10)
}

export async function generateTemperature(mapOptions: MapOptions, temperatureOptions: Options) {
    const temperatureNoise = makeNoise2D(mapOptions.tSeed)
    const temperatureMin = -10, temperatureMax = 32;

    const temperatureMap = makeRectangle(mapOptions.width, mapOptions.height, temperatureNoise, {
        amplitude: temperatureOptions.amplitude,
        persistence: temperatureOptions.persistence,
        frequency: temperatureOptions.frequency,
        octaves: temperatureOptions.octaves,
        scale: (x: number) => {
            return normalizeValue(x, temperatureMin, temperatureMax);
        }
    })

    return chunks(temperatureMap, 10)
}

function normalizeValue(value: number, min: number, max: number) {
    return value * (max - min) / 2 + (max + min) / 2;
}


