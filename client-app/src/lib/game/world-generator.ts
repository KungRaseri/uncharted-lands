import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle, type Options } from 'fractal-noise';

function chunks(array: number[], chunkSize: number) {
    let splitChunks: number[][] = [[]];

    if (chunkSize === 0)
        return splitChunks;

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        splitChunks = splitChunks.concat(chunk)
    }

    return splitChunks;
}

export async function generate(width: number, height: number, eSeed: number, pSeed: number, tSeed: number, elevationOptions: Options, precipitationOptions: Options, temperatureOptions: Options) {
    const elevationNoise = makeNoise2D(eSeed)
    const precipitationNoise = makeNoise2D(pSeed)
    const temperatureNoise = makeNoise2D(tSeed)

    const elevationMap = makeRectangle(width, height, elevationNoise, {
        amplitude: elevationOptions.amplitude,
        persistence: elevationOptions.persistence,
        frequency: elevationOptions.frequency,
        octaves: elevationOptions.octaves,
        scale: elevationOptions.scale
    })

    const precipitationMap = makeRectangle(width, height, precipitationNoise, {
        amplitude: precipitationOptions.amplitude,
        persistence: precipitationOptions.persistence,
        frequency: precipitationOptions.frequency,
        octaves: precipitationOptions.octaves,
        scale: precipitationOptions.scale
    })

    const temperatureMap = makeRectangle(width, height, temperatureNoise, {
        amplitude: temperatureOptions.amplitude,
        persistence: temperatureOptions.persistence,
        frequency: temperatureOptions.frequency,
        octaves: temperatureOptions.octaves,
        scale: temperatureOptions.scale
    })

    return { elevationMap: elevationMap, precipitationMap: precipitationMap, temperatureMap: temperatureMap }
}
