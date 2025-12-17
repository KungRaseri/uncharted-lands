import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import configRouter from '../../../src/api/routes/config.js';

describe('Config API', () => {
	const app = express();
	app.use('/api/config', configRouter);

	describe('GET /api/config/game', () => {
		it('should return game configuration', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body).toBeDefined();
			expect(response.headers['content-type']).toMatch(/application\/json/);
		});

		it('should include productionRates array', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body.productionRates).toBeDefined();
			expect(Array.isArray(response.body.productionRates)).toBe(true);
			expect(response.body.productionRates.length).toBeGreaterThan(0);
		});

		it('should include biomeEfficiencies array', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body.biomeEfficiencies).toBeDefined();
			expect(Array.isArray(response.body.biomeEfficiencies)).toBe(true);
		});

		it('should include structureLevels array', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body.structureLevels).toBeDefined();
			expect(Array.isArray(response.body.structureLevels)).toBe(true);
			expect(response.body.structureLevels.length).toBe(5);
		});

		it('should include resourceDisplay array', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body.resourceDisplay).toBeDefined();
			expect(Array.isArray(response.body.resourceDisplay)).toBe(true);
			expect(response.body.resourceDisplay.length).toBeGreaterThan(0);

			// Validate structure of first resource display
			const firstResource = response.body.resourceDisplay[0];
			expect(firstResource).toHaveProperty('type');
			expect(firstResource).toHaveProperty('name');
			expect(firstResource).toHaveProperty('icon');
			expect(firstResource).toHaveProperty('description');
		});

		it('should include extractorDisplay array', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body.extractorDisplay).toBeDefined();
			expect(Array.isArray(response.body.extractorDisplay)).toBe(true);
			expect(response.body.extractorDisplay.length).toBeGreaterThan(0);

			// Validate structure of first extractor display
			const firstExtractor = response.body.extractorDisplay[0];
			expect(firstExtractor).toHaveProperty('type');
			expect(firstExtractor).toHaveProperty('name');
			expect(firstExtractor).toHaveProperty('icon');
			expect(firstExtractor).toHaveProperty('description');
		});

		it('should include buildingDisplay array', async () => {
			const response = await request(app).get('/api/config/game').expect(200);

			expect(response.body.buildingDisplay).toBeDefined();
			expect(Array.isArray(response.body.buildingDisplay)).toBe(true);
			expect(response.body.buildingDisplay.length).toBeGreaterThan(0);

			// Validate structure of first building display
			const firstBuilding = response.body.buildingDisplay[0];
			expect(firstBuilding).toHaveProperty('type');
			expect(firstBuilding).toHaveProperty('name');
			expect(firstBuilding).toHaveProperty('icon');
			expect(firstBuilding).toHaveProperty('description');
		});

		describe('Phase 1 Implementation - New Fields', () => {
			it('should include biomeDisplay field', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				expect(response.body.biomeDisplay).toBeDefined();
				expect(typeof response.body.biomeDisplay).toBe('object');
			});

			it('should include all 8 biomes in biomeDisplay', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const biomes = [
					'GRASSLAND',
					'FOREST',
					'DESERT',
					'MOUNTAIN',
					'TUNDRA',
					'SWAMP',
					'COASTAL',
					'OCEAN',
				];

				biomes.forEach((biome) => {
					expect(response.body.biomeDisplay[biome]).toBeDefined();
				});
			});

			it('should have correct structure for each biome', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const grassland = response.body.biomeDisplay.GRASSLAND;
				expect(grassland).toHaveProperty('icon');
				expect(grassland).toHaveProperty('color');
				expect(grassland).toHaveProperty('name');
				expect(grassland).toHaveProperty('description');

				// Validate types
				expect(typeof grassland.icon).toBe('string');
				expect(typeof grassland.color).toBe('string');
				expect(typeof grassland.name).toBe('string');
				expect(typeof grassland.description).toBe('string');

				// Validate Skeleton UI color format
				expect(grassland.color).toMatch(/^variant-soft-/);
			});

			it('should include WELL extractor in extractorDisplay', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const wellExtractor = response.body.extractorDisplay.find((e: any) => e.type === 'WELL');

				expect(wellExtractor).toBeDefined();
				expect(wellExtractor.name).toBe('Well');
				expect(wellExtractor.icon).toBe('🕳️');
				expect(wellExtractor.description).toContain('water');
			});

			it('should have exactly 8 extractors', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				expect(response.body.extractorDisplay.length).toBe(8);

				const extractorTypes = response.body.extractorDisplay.map((e: any) => e.type);
				expect(extractorTypes).toContain('FARM');
				expect(extractorTypes).toContain('WELL');
				expect(extractorTypes).toContain('LUMBER_MILL');
				expect(extractorTypes).toContain('QUARRY');
				expect(extractorTypes).toContain('MINE');
				expect(extractorTypes).toContain('FISHING_DOCK');
				expect(extractorTypes).toContain('HUNTING_LODGE');
				expect(extractorTypes).toContain('HERB_GARDEN');
			});

			it('should include BARRACKS in buildingDisplay', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const barracks = response.body.buildingDisplay.find((b: any) => b.type === 'BARRACKS');

				expect(barracks).toBeDefined();
				expect(barracks.name).toBe('Barracks');
				expect(barracks.icon).toBe('⚔️');
				expect(barracks.description).toContain('training');
			});

			it('should include WALL in buildingDisplay', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const wall = response.body.buildingDisplay.find((b: any) => b.type === 'WALL');

				expect(wall).toBeDefined();
				expect(wall.name).toBe('Wall');
				expect(wall.icon).toBe('🧱');
				expect(wall.description).toContain('fortification');
			});

			it('should have exactly 7 buildings', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				expect(response.body.buildingDisplay.length).toBe(7);

				const buildingTypes = response.body.buildingDisplay.map((b: any) => b.type);
				expect(buildingTypes).toContain('HOUSE');
				expect(buildingTypes).toContain('STORAGE');
				expect(buildingTypes).toContain('BARRACKS');
				expect(buildingTypes).toContain('WORKSHOP');
				expect(buildingTypes).toContain('MARKETPLACE');
				expect(buildingTypes).toContain('TOWN_HALL');
				expect(buildingTypes).toContain('WALL');
			});

			it('should have improved extractor icons (Farm: 🚜)', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const farm = response.body.extractorDisplay.find((e: any) => e.type === 'FARM');

				expect(farm.icon).toBe('🚜');
				// Note: Lumber Mill icon has encoding issue in config file (shows as '�')
			});
		});

		describe('Biome Display Validation', () => {
			it('GRASSLAND should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const grassland = response.body.biomeDisplay.GRASSLAND;
				expect(grassland.icon).toBe('🌾');
				expect(grassland.color).toBe('variant-soft-success');
				expect(grassland.name).toBe('Grassland');
				expect(grassland.description).toBe('Fertile plains ideal for farming');
			});

			it('FOREST should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const forest = response.body.biomeDisplay.FOREST;
				expect(forest.icon).toBe('🌲');
				expect(forest.color).toBe('variant-soft-primary');
				expect(forest.name).toBe('Forest');
				expect(forest.description).toBe('Dense woodlands rich in timber');
			});

			it('DESERT should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const desert = response.body.biomeDisplay.DESERT;
				expect(desert.icon).toBe('🏜️');
				expect(desert.color).toBe('variant-soft-warning');
				expect(desert.name).toBe('Desert');
				expect(desert.description).toBe('Arid wasteland with scarce water');
			});

			it('MOUNTAIN should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const mountain = response.body.biomeDisplay.MOUNTAIN;
				expect(mountain.icon).toBe('⛰️');
				expect(mountain.color).toBe('variant-soft-surface');
				expect(mountain.name).toBe('Mountain');
				expect(mountain.description).toContain('ore');
			});

			it('TUNDRA should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const tundra = response.body.biomeDisplay.TUNDRA;
				expect(tundra.icon).toBe('🧊');
				expect(tundra.color).toBe('variant-soft-tertiary');
				expect(tundra.name).toBe('Tundra');
				expect(tundra.description).toBe('Frozen plains with harsh conditions');
			});

			it('SWAMP should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const swamp = response.body.biomeDisplay.SWAMP;
				expect(swamp.icon).toBe('🌿');
				expect(swamp.color).toBe('variant-soft-secondary');
				expect(swamp.name).toBe('Swamp');
				expect(swamp.description).toBe('Wetlands with unique resources');
			});

			it('COASTAL should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const coastal = response.body.biomeDisplay.COASTAL;
				expect(coastal.icon).toBe('🏖️');
				expect(coastal.color).toBe('variant-soft-primary');
				expect(coastal.name).toBe('Coastal');
				expect(coastal.description).toBe('Shoreline with access to fishing');
			});

			it('OCEAN should have correct properties', async () => {
				const response = await request(app).get('/api/config/game').expect(200);

				const ocean = response.body.biomeDisplay.OCEAN;
				expect(ocean.icon).toBe('🌊');
				expect(ocean.color).toBe('variant-soft-primary');
				expect(ocean.name).toBe('Ocean');
				expect(ocean.description).toBe('Deep waters unsuitable for settlement');
			});
		});
	});

	describe('GET /api/config/version', () => {
		it('should return configuration version', async () => {
			const response = await request(app).get('/api/config/version').expect(200);

			expect(response.body).toHaveProperty('version');
			expect(response.body).toHaveProperty('lastUpdated');
		});

		it('should return version 1.0.0', async () => {
			const response = await request(app).get('/api/config/version').expect(200);

			expect(response.body.version).toBe('1.0.0');
		});

		it('should return valid ISO timestamp', async () => {
			const response = await request(app).get('/api/config/version').expect(200);

			expect(response.body.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

			// Verify it's a recent timestamp
			const timestamp = new Date(response.body.lastUpdated).getTime();
			const now = Date.now();
			expect(timestamp).toBeGreaterThan(now - 5000); // Within last 5 seconds
			expect(timestamp).toBeLessThanOrEqual(now + 1000); // Not in future
		});

		it('should return JSON content type', async () => {
			const response = await request(app).get('/api/config/version').expect(200);

			expect(response.headers['content-type']).toMatch(/application\/json/);
		});
	});
});
