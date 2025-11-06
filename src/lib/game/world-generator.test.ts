import { generateMap } from './world-generator';
import { describe, it, expect } from 'vitest';


describe('world-generator.ts', () => {
    it("Should generate a noisemap for elevation, precipitation, and temperature", async () => {
        const mapOptions = {
            serverId: 'test-id',
            worldName: 'test-world',
            width: 100,
            height: 100,
            seed: Date.now()
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

        const elevation = await generateMap(mapOptions, elevationOptions);
        const precipitation = await generateMap(mapOptions, precipitationOptions);
        const temperature = await generateMap(mapOptions, temperatureOptions);

        expect(elevation).toHaveLength(10)
        expect(elevation[0]).toHaveLength(10)
        expect(precipitation).toHaveLength(10)
        expect(precipitation[0]).toHaveLength(10)
        expect(temperature).toHaveLength(10)
        expect(temperature[0]).toHaveLength(10)
    });

    it("generatePrecipitation() - Should generate precipitation within a specific range", async () => {
        const mapOptions = {
            serverId: 'test-id',
            worldName: 'test-world',
            width: 100,
            height: 100,
            seed: Date.now()
        }

        const precipitationOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const target = await generateMap(mapOptions, precipitationOptions);


        expect(Math.max(...target.flat(3))).toBeLessThanOrEqual(1)
        expect(Math.min(...target.flat(3))).toBeGreaterThanOrEqual(-1)
    })

    it("generateTemperature() - Should generate temperature within a specific range", async () => {
        const mapOptions = {
            serverId: 'test-id',
            worldName: 'test-world',
            width: 100,
            height: 100,
            seed: Date.now()
        }

        const temperatureOptions = {
            amplitude: 1.0,
            frequency: 0.04,
            octaves: 8,
            persistence: 0.5
        }

        const target = await generateMap(mapOptions, temperatureOptions);


        expect(Math.max(...target.flat(3))).toBeLessThanOrEqual(1)
        expect(Math.min(...target.flat(3))).toBeGreaterThanOrEqual(-1)

        console.log(Math.max(...target.flat(3)))
        console.log(Math.min(...target.flat(3)))
    })
})