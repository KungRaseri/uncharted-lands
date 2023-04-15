import { generate, generatePrecipitation, generateTemperature } from './world-generator';
import { describe, it, expect } from 'vitest';


describe('world-generator.ts', () => {
    it("Should generate a noisemap for elevation, precipitation, and temperature", async () => {
        const mapOptions = {
            serverId: 'test-id',
            worldName: 'test-world',
            width: 100,
            height: 100,
            eSeed: Date.now(),
            pSeed: Date.now(),
            tSeed: Date.now()
        }

        const elevationOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const precipitationOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const temperatureOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const target = await generate(mapOptions, elevationOptions, precipitationOptions, temperatureOptions);
        const elevation = target.elevationMap[0][0]
        const precipitation = target.precipitationMap[0][0]
        const temperature = target.temperatureMap[0][0]

        expect(elevation).toHaveLength(10)
        expect(elevation[0]).toHaveLength(10)
        expect(precipitation).toHaveLength(10)
        expect(precipitation[0]).toHaveLength(10)
        expect(temperature).toHaveLength(10)
        expect(temperature[0]).toHaveLength(10)
    });

    it("generatePrecipitation() - Should generate precipitation within a specific range", async () => {
        const precipitationMin = 1, precipitationMax = 450;

        const mapOptions = {
            serverId: 'test-id',
            worldName: 'test-world',
            width: 100,
            height: 100,
            eSeed: Date.now(),
            pSeed: Date.now(),
            tSeed: Date.now()
        }

        const precipitationOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const target = await generatePrecipitation(mapOptions, precipitationOptions);


        expect(Math.max(...target.flat(3))).toBeLessThanOrEqual(precipitationMax)
        expect(Math.min(...target.flat(3))).toBeGreaterThanOrEqual(precipitationMin)
    })

    it("generateTemperature() - Should generate temperature within a specific range", async () => {
        const temperatureMin = -10, temperatureMax = 32;

        const mapOptions = {
            serverId: 'test-id',
            worldName: 'test-world',
            width: 100,
            height: 100,
            eSeed: Date.now(),
            pSeed: Date.now(),
            tSeed: Date.now()
        }

        const temperatureOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const target = await generateTemperature(mapOptions, temperatureOptions);


        expect(Math.max(...target.flat(3))).toBeLessThanOrEqual(temperatureMax)
        expect(Math.min(...target.flat(3))).toBeGreaterThanOrEqual(temperatureMin)

        console.log(Math.max(...target.flat(3)))
        console.log(Math.min(...target.flat(3)))
    })
})