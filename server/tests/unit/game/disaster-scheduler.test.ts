/**
 * Unit tests for disaster-scheduler.ts
 *
 * Tests the probability-based disaster triggering system including:
 * - World template disaster configurations
 * - Disaster severity calculation
 * - Severity level enum conversion
 * - Disaster type selection by biome
 * - Warning time calculation
 * - Impact duration calculation
 * - Regional disaster triggering
 */

import { describe, it, expect } from 'vitest';
import {
	getWorldDisasterConfig,
	calculateDisasterSeverity,
	getSeverityLevel,
	selectDisasterType,
	calculateWarningTime,
	calculateImpactDuration,
} from '../../../src/game/disaster-scheduler.js';
import { disasterTypeEnum, BIOME_DISASTER_MAP, type DisasterType } from '../../../src/db/schema.js';

// Get all disaster types from schema (single source of truth)
const ALL_DISASTER_TYPES = disasterTypeEnum.enumValues as readonly DisasterType[];

describe('Disaster Scheduler', () => {
	describe('World Template Configurations', () => {
		it('should return FREQUENT config for SURVIVAL mode', () => {
			const config = getWorldDisasterConfig('SURVIVAL');
			expect(config.frequency).toBe('FREQUENT'); // Per GDD: SURVIVAL = FREQUENT (4%)
			expect(config.probabilityPerHour).toBe(0.04); // Per GDD: SURVIVAL = 4% per hour
			expect(config.severityMultiplier).toBe(1.2); // Per GDD: SURVIVAL = 1.2x
			expect(config.warningTimeMultiplier).toBe(0.75); // Per GDD: SURVIVAL = -25%
		});

		it('should return NORMAL config for STANDARD mode', () => {
			const config = getWorldDisasterConfig('STANDARD');
			expect(config.frequency).toBe('NORMAL');
			expect(config.probabilityPerHour).toBe(0.015);
			expect(config.severityMultiplier).toBe(1);
			expect(config.warningTimeMultiplier).toBe(1);
		});

		it('should return NORMAL config for RELAXED mode', () => {
			const config = getWorldDisasterConfig('RELAXED');
			expect(config.frequency).toBe('RARE');
			expect(config.probabilityPerHour).toBe(0.005);
			expect(config.severityMultiplier).toBe(0.7);
			expect(config.warningTimeMultiplier).toBe(1.5);
		});

		it('should return NORMAL config for FANTASY mode', () => {
			const config = getWorldDisasterConfig('FANTASY');
			expect(config.frequency).toBe('NORMAL');
			expect(config.probabilityPerHour).toBe(0.015);
			expect(config.severityMultiplier).toBe(1);
			expect(config.warningTimeMultiplier).toBe(1);
		});

		it('should return FREQUENT config for APOCALYPSE mode', () => {
			const config = getWorldDisasterConfig('APOCALYPSE');
			expect(config.frequency).toBe('FREQUENT');
			expect(config.probabilityPerHour).toBe(0.08); // 8% per hour (constant disasters)
			expect(config.severityMultiplier).toBe(1.5); // 1.5x severity
			expect(config.warningTimeMultiplier).toBe(0.5);
		});

		it('should default to STANDARD config for unknown template', () => {
			const config = getWorldDisasterConfig('UNKNOWN');
			expect(config.frequency).toBe('NORMAL');
			expect(config.probabilityPerHour).toBe(0.015);
		});
	});

	describe('Disaster Severity Calculation', () => {
		it('should calculate severity in 0-100 range with default biome vulnerability', () => {
			// Test multiple times to check randomness stays in range
			for (let i = 0; i < 100; i++) {
				const severity = calculateDisasterSeverity(1);
				expect(severity).toBeGreaterThanOrEqual(0);
				expect(severity).toBeLessThanOrEqual(100);
			}
		});

		it('should apply template multiplier correctly', () => {
			// High multiplier should trend higher severities
			const highMultiplier = 2;
			const severities = Array.from({ length: 100 }, () =>
				calculateDisasterSeverity(highMultiplier)
			);
			const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;

			// With 2x multiplier, average should be higher than base (around 60+)
			expect(avgSeverity).toBeGreaterThan(50);
		});

		it('should apply biome vulnerability correctly', () => {
			// High vulnerability should increase severity
			const vulnerability = 1.5;
			const severities = Array.from({ length: 100 }, () =>
				calculateDisasterSeverity(1, vulnerability)
			);
			const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;

			// With 1.5x vulnerability, average should be higher
			expect(avgSeverity).toBeGreaterThan(40);
		});

		it('should clamp severity to 0-100 range even with high multipliers', () => {
			const extremeMultiplier = 10;
			const severity = calculateDisasterSeverity(extremeMultiplier, 10);
			expect(severity).toBeLessThanOrEqual(100);
		});

		it('should return integer values', () => {
			for (let i = 0; i < 100; i++) {
				const severity = calculateDisasterSeverity(1);
				expect(Number.isInteger(severity)).toBe(true);
			}
		});
	});

	describe('Severity Level Conversion', () => {
		it('should convert 0-24 to MILD', () => {
			expect(getSeverityLevel(0)).toBe('MILD');
			expect(getSeverityLevel(10)).toBe('MILD');
			expect(getSeverityLevel(24)).toBe('MILD');
		});

		it('should convert 25-49 to MODERATE', () => {
			expect(getSeverityLevel(25)).toBe('MODERATE');
			expect(getSeverityLevel(35)).toBe('MODERATE');
			expect(getSeverityLevel(49)).toBe('MODERATE');
		});

		it('should convert 50-74 to MAJOR', () => {
			expect(getSeverityLevel(50)).toBe('MAJOR');
			expect(getSeverityLevel(60)).toBe('MAJOR');
			expect(getSeverityLevel(74)).toBe('MAJOR');
		});

		it('should convert 75-100 to CATASTROPHIC', () => {
			expect(getSeverityLevel(75)).toBe('CATASTROPHIC');
			expect(getSeverityLevel(85)).toBe('CATASTROPHIC');
			expect(getSeverityLevel(100)).toBe('CATASTROPHIC');
		});

		it('should match GDD production reduction percentages', () => {
			// MILD: 20% reduction (0-24)
			expect(getSeverityLevel(20)).toBe('MILD');

			// MODERATE: 40% reduction (25-49)
			expect(getSeverityLevel(40)).toBe('MODERATE');

			// MAJOR: 60% reduction (50-74)
			expect(getSeverityLevel(60)).toBe('MAJOR');

			// CATASTROPHIC: 80% reduction (75-100)
			expect(getSeverityLevel(80)).toBe('CATASTROPHIC');
		});
	});

	describe('Disaster Type Selection by Biome', () => {
		it('should select from valid disaster types for GRASSLAND', () => {
			const validTypes = [
				...BIOME_DISASTER_MAP.GRASSLAND.highRisk,
				...BIOME_DISASTER_MAP.GRASSLAND.moderateRisk,
				...BIOME_DISASTER_MAP.GRASSLAND.lowRisk,
			];

			// Test multiple times to check all possibilities
			for (let i = 0; i < 100; i++) {
				const disasterType = selectDisasterType('GRASSLAND');
				expect(validTypes).toContain(disasterType);
			}
		});

		it('should select from valid disaster types for DESERT', () => {
			const validTypes = [
				...BIOME_DISASTER_MAP.DESERT.highRisk,
				...BIOME_DISASTER_MAP.DESERT.moderateRisk,
				...BIOME_DISASTER_MAP.DESERT.lowRisk,
			];

			for (let i = 0; i < 100; i++) {
				const disasterType = selectDisasterType('DESERT');
				expect(validTypes).toContain(disasterType);
			}
		});

		it('should select from valid disaster types for MOUNTAIN', () => {
			const validTypes = [
				...BIOME_DISASTER_MAP.MOUNTAIN.highRisk,
				...BIOME_DISASTER_MAP.MOUNTAIN.moderateRisk,
				...BIOME_DISASTER_MAP.MOUNTAIN.lowRisk,
			];

			for (let i = 0; i < 100; i++) {
				const disasterType = selectDisasterType('MOUNTAIN');
				expect(validTypes).toContain(disasterType);
			}
		});

		it('should favor high-risk disasters over moderate and low', () => {
			// Count selections over many iterations
			const selections: Record<string, number> = {};
			for (let i = 0; i < 1000; i++) {
				const type = selectDisasterType('GRASSLAND');
				selections[type] = (selections[type] || 0) + 1;
			}

			// High risk types should appear more frequently
			const highRiskCount = BIOME_DISASTER_MAP.GRASSLAND.highRisk.reduce(
				(sum, type) => sum + (selections[type] || 0),
				0
			);
			const moderateRiskCount = BIOME_DISASTER_MAP.GRASSLAND.moderateRisk.reduce(
				(sum, type) => sum + (selections[type] || 0),
				0
			);
			const lowRiskCount = BIOME_DISASTER_MAP.GRASSLAND.lowRisk.reduce(
				(sum, type) => sum + (selections[type] || 0),
				0
			);

			expect(highRiskCount).toBeGreaterThan(moderateRiskCount);
			expect(moderateRiskCount).toBeGreaterThan(lowRiskCount);
		});

		it('should only return disaster types from schema', () => {
			const allBiomes: Array<keyof typeof BIOME_DISASTER_MAP> = [
				'GRASSLAND',
				'FOREST',
				'DESERT',
				'MOUNTAIN',
				'TUNDRA',
				'SWAMP',
				'COASTAL',
				'OCEAN',
			];

			for (const biome of allBiomes) {
				for (let i = 0; i < 10; i++) {
					const disasterType = selectDisasterType(biome);
					expect(ALL_DISASTER_TYPES).toContain(disasterType);
				}
			}
		});
	});

	describe('Warning Time Calculation', () => {
		it('should return base warning times for different disaster types', () => {
			// Weather disasters: 4 hours (14400 seconds)
			expect(calculateWarningTime('HURRICANE', 1)).toBe(14400);
			// Tornado: 30 minutes (1800 seconds)
			expect(calculateWarningTime('TORNADO', 1)).toBe(1800);
			// Blizzard: 3 hours (10800 seconds)
			expect(calculateWarningTime('BLIZZARD', 1)).toBe(10800);

			// Geological disasters: 1 hour (3600 seconds)
			expect(calculateWarningTime('EARTHQUAKE', 1)).toBe(3600);
			expect(calculateWarningTime('VOLCANO', 1)).toBe(7200); // 2 hours for volcano
			expect(calculateWarningTime('LANDSLIDE', 1)).toBe(3600);
		});

		it('should apply world template multiplier correctly', () => {
			const baseTime = calculateWarningTime('HURRICANE', 1);
			const increasedTime = calculateWarningTime('HURRICANE', 1.5);
			const decreasedTime = calculateWarningTime('HURRICANE', 0.5);

			expect(increasedTime).toBe(baseTime * 1.5);
			expect(decreasedTime).toBe(baseTime * 0.5);
		});

		it('should return integer seconds', () => {
			const warningTime = calculateWarningTime('HURRICANE', 1);
			expect(Number.isInteger(warningTime)).toBe(true);
		});

		it('should handle all disaster types without errors', () => {
			for (const disasterType of ALL_DISASTER_TYPES) {
				expect(() => calculateWarningTime(disasterType, 1)).not.toThrow();
				const time = calculateWarningTime(disasterType, 1);
				expect(time).toBeGreaterThan(0);
			}
		});
	});

	describe('Impact Duration Calculation', () => {
		it('should return correct durations for different disaster types', () => {
			// Quick disasters: 5-10 minutes
			expect(calculateImpactDuration('TORNADO')).toBe(300); // 5 minutes
			expect(calculateImpactDuration('EARTHQUAKE')).toBe(600); // 10 minutes

			// Medium disasters: 1-2 hours
			expect(calculateImpactDuration('HURRICANE')).toBe(5400); // 1.5 hours
			expect(calculateImpactDuration('FLOOD')).toBe(3600); // 1 hour

			// Long disasters: 6-24 hours
			expect(calculateImpactDuration('DROUGHT')).toBe(86400); // 24 hours
			expect(calculateImpactDuration('BLIZZARD')).toBe(10800); // 3 hours
		});

		it('should return integer seconds', () => {
			const duration = calculateImpactDuration('HURRICANE');
			expect(Number.isInteger(duration)).toBe(true);
		});

		it('should handle all disaster types without errors', () => {
			for (const disasterType of ALL_DISASTER_TYPES) {
				expect(() => calculateImpactDuration(disasterType)).not.toThrow();
				const duration = calculateImpactDuration(disasterType);
				expect(duration).toBeGreaterThan(0);
			}
		});
	});

	describe('Biome Disaster Mapping', () => {
		it('should have valid disaster types for all biomes', () => {
			const biomes: Array<keyof typeof BIOME_DISASTER_MAP> = [
				'GRASSLAND',
				'FOREST',
				'DESERT',
				'MOUNTAIN',
				'TUNDRA',
				'SWAMP',
				'COASTAL',
				'OCEAN',
			];

			for (const biome of biomes) {
				const map = BIOME_DISASTER_MAP[biome];

				// Check all disasters are from schema
				const allDisasters = [...map.highRisk, ...map.moderateRisk, ...map.lowRisk];

				for (const disaster of allDisasters) {
					expect(ALL_DISASTER_TYPES).toContain(disaster);
				}
			}
		});

		it('should have at least one disaster type per biome (except OCEAN)', () => {
			const biomes: Array<keyof typeof BIOME_DISASTER_MAP> = [
				'GRASSLAND',
				'FOREST',
				'DESERT',
				'MOUNTAIN',
				'TUNDRA',
				'SWAMP',
				'COASTAL',
			];

			for (const biome of biomes) {
				const map = BIOME_DISASTER_MAP[biome];
				const totalDisasters = map.highRisk.length + map.moderateRisk.length + map.lowRisk.length;
				expect(totalDisasters).toBeGreaterThan(0);
			}
		});

		it('should have OCEAN biome with minimal disasters', () => {
			const oceanMap = BIOME_DISASTER_MAP.OCEAN;

			// OCEAN should have very few disaster types
			expect(oceanMap.highRisk.length).toBe(0);
		});
	});

	describe('Constants and Type Safety', () => {
		it('should export all disaster types', () => {
			expect(ALL_DISASTER_TYPES.length).toBe(15); // Schema has 15 types
		});

		it('should have all disaster types be strings', () => {
			for (const type of ALL_DISASTER_TYPES) {
				expect(typeof type).toBe('string');
			}
		});

		it('should have unique disaster types', () => {
			const uniqueTypes = new Set(ALL_DISASTER_TYPES);
			expect(uniqueTypes.size).toBe(ALL_DISASTER_TYPES.length);
		});
	});
});
