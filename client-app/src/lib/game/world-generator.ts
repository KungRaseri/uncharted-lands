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
