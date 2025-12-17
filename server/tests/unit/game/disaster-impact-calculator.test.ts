/**
 * Tests for Disaster Impact Calculator
 *
 * Coverage:
 * - Disaster type enum validation
 * - Severity level calculations
 * - Production modifier calculations
 * - Resistance modifiers (general and specific)
 * - Compound disasters (multiple disasters affecting same/different resources)
 * - Resource-specific impacts
 * - Edge cases (no disasters, max severity, extreme resistance)
 * - Helper functions (getAffectedResources, getSeverityLevel, etc.)
 */

import { describe, it, expect } from 'vitest';
import {
	DisasterType,
	calculateDisasterModifier,
	calculateAllDisasterModifiers,
	doesDisasterAffectResource,
	getAffectedResources,
	getSeverityLevel,
	getDisasterDescription,
	type DisasterImpact,
	type DisasterResistance,
} from '../../../src/game/disaster-impact-calculator.js';

describe('DisasterImpactCalculator', () => {
	describe('DisasterType Enum', () => {
		it('should have all 15 disaster types defined', () => {
			const expectedTypes = [
				'DROUGHT',
				'FLOOD',
				'BLIZZARD',
				'HURRICANE',
				'TORNADO',
				'SANDSTORM',
				'HEATWAVE',
				'EARTHQUAKE',
				'VOLCANO',
				'LANDSLIDE',
				'AVALANCHE',
				'WILDFIRE',
				'INSECT_PLAGUE',
				'BLIGHT',
				'LOCUST_SWARM',
			];

			expect(Object.keys(DisasterType)).toEqual(expectedTypes);
		});
	});

	describe('getSeverityLevel', () => {
		it('should return MILD for severity 0-25', () => {
			expect(getSeverityLevel(0)).toBe('MILD');
			expect(getSeverityLevel(12)).toBe('MILD');
			expect(getSeverityLevel(25)).toBe('MILD');
		});

		it('should return MODERATE for severity 26-50', () => {
			expect(getSeverityLevel(26)).toBe('MODERATE');
			expect(getSeverityLevel(38)).toBe('MODERATE');
			expect(getSeverityLevel(50)).toBe('MODERATE');
		});

		it('should return MAJOR for severity 51-75', () => {
			expect(getSeverityLevel(51)).toBe('MAJOR');
			expect(getSeverityLevel(63)).toBe('MAJOR');
			expect(getSeverityLevel(75)).toBe('MAJOR');
		});

		it('should return CATASTROPHIC for severity 76-100', () => {
			expect(getSeverityLevel(76)).toBe('CATASTROPHIC');
			expect(getSeverityLevel(88)).toBe('CATASTROPHIC');
			expect(getSeverityLevel(100)).toBe('CATASTROPHIC');
		});
	});

	describe('getAffectedResources', () => {
		it('should return correct resources for DROUGHT', () => {
			const affected = getAffectedResources(DisasterType.DROUGHT);
			expect(affected).toEqual(['water', 'food']);
		});

		it('should return correct resources for EARTHQUAKE', () => {
			const affected = getAffectedResources(DisasterType.EARTHQUAKE);
			expect(affected).toEqual(['stone', 'ore', 'wood']);
		});

		it('should return correct resources for WILDFIRE', () => {
			const affected = getAffectedResources(DisasterType.WILDFIRE);
			expect(affected).toEqual(['wood', 'food']);
		});

		it('should return correct resources for BLIZZARD', () => {
			const affected = getAffectedResources(DisasterType.BLIZZARD);
			expect(affected).toEqual(['food', 'water', 'wood', 'stone', 'ore']);
		});

		it('should return correct resources for LOCUST_SWARM', () => {
			const affected = getAffectedResources(DisasterType.LOCUST_SWARM);
			expect(affected).toEqual(['food']);
		});
	});

	describe('doesDisasterAffectResource', () => {
		it('should return true when disaster affects resource', () => {
			expect(doesDisasterAffectResource(DisasterType.DROUGHT, 'water')).toBe(true);
			expect(doesDisasterAffectResource(DisasterType.DROUGHT, 'food')).toBe(true);
			expect(doesDisasterAffectResource(DisasterType.WILDFIRE, 'wood')).toBe(true);
		});

		it('should return false when disaster does not affect resource', () => {
			expect(doesDisasterAffectResource(DisasterType.DROUGHT, 'stone')).toBe(false);
			expect(doesDisasterAffectResource(DisasterType.WILDFIRE, 'ore')).toBe(false);
			expect(doesDisasterAffectResource(DisasterType.LOCUST_SWARM, 'water')).toBe(false);
		});
	});

	describe('calculateDisasterModifier - No Disasters', () => {
		it('should return 1.0 modifier when no disasters', () => {
			const modifier = calculateDisasterModifier('food', []);
			expect(modifier).toBe(1);
		});

		it('should return 1.0 modifier when disasters do not affect resource', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR',
				},
			];

			const modifier = calculateDisasterModifier('stone', disasters);
			expect(modifier).toBe(1);
		});
	});

	describe('calculateDisasterModifier - Severity Levels', () => {
		it('should calculate correct modifier for MILD severity (20% reduction)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MILD',
				},
			];

			const modifier = calculateDisasterModifier('water', disasters);
			expect(modifier).toBeCloseTo(0.8, 2); // 1 - 0.2 = 0.8
		});

		it('should calculate correct modifier for MODERATE severity (40% reduction)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MODERATE',
				},
			];

			const modifier = calculateDisasterModifier('water', disasters);
			expect(modifier).toBeCloseTo(0.6, 2); // 1 - 0.4 = 0.6
		});

		it('should calculate correct modifier for MAJOR severity (60% reduction)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR',
				},
			];

			const modifier = calculateDisasterModifier('water', disasters);
			expect(modifier).toBeCloseTo(0.4, 2); // 1 - 0.6 = 0.4
		});

		it('should calculate correct modifier for CATASTROPHIC severity (80% reduction)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'CATASTROPHIC',
				},
			];

			const modifier = calculateDisasterModifier('water', disasters);
			expect(modifier).toBeCloseTo(0.2, 2); // 1 - 0.8 = 0.2
		});
	});

	describe('calculateDisasterModifier - General Resistance', () => {
		it('should apply 30% general resistance (Fortress bonus)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				general: 0.3, // 30% resistance
			};

			const modifier = calculateDisasterModifier('water', disasters, resistance);
			// Base impact: 60%
			// With resistance: 60% × (1 - 0.30) = 42% reduced impact
			// Modifier: 1 - 0.42 = 0.58
			expect(modifier).toBeCloseTo(0.58, 2);
		});

		it('should apply 60% general resistance', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.EARTHQUAKE,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				general: 0.6, // 60% resistance
			};

			const modifier = calculateDisasterModifier('stone', disasters, resistance);
			// Base impact: 60%
			// With resistance: 60% × (1 - 0.60) = 24% reduced impact
			// Modifier: 1 - 0.24 = 0.76
			expect(modifier).toBeCloseTo(0.76, 2);
		});
	});

	describe('calculateDisasterModifier - Specific Resistance', () => {
		it('should apply 60% earthquake-specific resistance (Seismic Foundation)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.EARTHQUAKE,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				specific: {
					EARTHQUAKE: 0.6, // 60% earthquake resistance
				},
			};

			const modifier = calculateDisasterModifier('stone', disasters, resistance);
			// Base impact: 60%
			// With resistance: 60% × (1 - 0.60) = 24% reduced impact
			// Modifier: 1 - 0.24 = 0.76
			expect(modifier).toBeCloseTo(0.76, 2);
		});

		it('should prioritize specific resistance over general resistance', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.WILDFIRE,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				general: 0.3, // 30% general resistance
				specific: {
					WILDFIRE: 0.7, // 70% fire resistance (Fire Resistant Wood)
				},
			};

			const modifier = calculateDisasterModifier('wood', disasters, resistance);
			// Should use specific (70%) not general (30%)
			// Base impact: 60%
			// With resistance: 60% × (1 - 0.70) = 18% reduced impact
			// Modifier: 1 - 0.18 = 0.82
			expect(modifier).toBeCloseTo(0.82, 2);
		});
	});

	describe('calculateDisasterModifier - Compound Disasters', () => {
		it('should multiply modifiers for multiple disasters on same resource', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR', // 60% impact → 0.4 modifier
				},
				{
					disasterType: DisasterType.HEATWAVE,
					severity: 'MODERATE', // 40% impact → 0.6 modifier
				},
			];

			const modifier = calculateDisasterModifier('water', disasters);
			// Compound: 0.4 × 0.6 = 0.24
			expect(modifier).toBeCloseTo(0.24, 2);
		});

		it('should handle three disasters on same resource', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MODERATE', // 40% → 0.6 modifier
				},
				{
					disasterType: DisasterType.HEATWAVE,
					severity: 'MODERATE', // 40% → 0.6 modifier
				},
				{
					disasterType: DisasterType.LOCUST_SWARM,
					severity: 'MILD', // 20% → 0.8 modifier
				},
			];

			const modifier = calculateDisasterModifier('food', disasters);
			// Compound: 0.6 × 0.6 × 0.8 = 0.288
			expect(modifier).toBeCloseTo(0.288, 2);
		});

		it('should apply resistance to each disaster in compound calculation', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR', // 60% base impact
				},
				{
					disasterType: DisasterType.HEATWAVE,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				general: 0.3, // 30% resistance
			};

			const modifier = calculateDisasterModifier('water', disasters, resistance);
			// Drought: 60% × (1 - 0.30) = 42% → 0.58 modifier
			// Heatwave: 60% × (1 - 0.30) = 42% → 0.58 modifier
			// Compound: 0.58 × 0.58 = 0.3364
			expect(modifier).toBeCloseTo(0.3364, 2);
		});
	});

	describe('calculateDisasterModifier - Edge Cases', () => {
		it('should enforce minimum modifier of 0.1 (10% production)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.BLIZZARD,
					severity: 'CATASTROPHIC', // 80% → 0.2 modifier
				},
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'CATASTROPHIC', // 80% → 0.2 modifier
				},
				{
					disasterType: DisasterType.HEATWAVE,
					severity: 'CATASTROPHIC', // 80% → 0.2 modifier
				},
			];

			const modifier = calculateDisasterModifier('water', disasters);
			// Compound: 0.2 × 0.2 × 0.2 = 0.008
			// Should clamp to minimum 0.1
			expect(modifier).toBe(0.1);
		});

		it('should handle 100% resistance (total immunity)', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.EARTHQUAKE,
					severity: 'CATASTROPHIC', // 80% base impact
				},
			];

			const resistance: DisasterResistance = {
				specific: {
					EARTHQUAKE: 1, // 100% resistance
				},
			};

			const modifier = calculateDisasterModifier('stone', disasters, resistance);
			// Base impact: 80%
			// With resistance: 80% × (1 - 1.0) = 0% reduced impact
			// Modifier: 1 - 0 = 1.0
			expect(modifier).toBe(1);
		});

		it('should clamp resistance above 1.0 to 1.0', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.WILDFIRE,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				specific: {
					WILDFIRE: 1.5, // Invalid 150% resistance
				},
			};

			const modifier = calculateDisasterModifier('wood', disasters, resistance);
			// Should clamp to 100% resistance
			expect(modifier).toBe(1);
		});

		it('should clamp negative resistance to 0', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR', // 60% base impact
				},
			];

			const resistance: DisasterResistance = {
				general: -0.3, // Invalid negative resistance
			};

			const modifier = calculateDisasterModifier('water', disasters, resistance);
			// Should clamp to 0% resistance (no protection)
			// Base impact: 60% → 0.4 modifier
			expect(modifier).toBeCloseTo(0.4, 2);
		});
	});

	describe('calculateDisasterModifier - Resource-Specific Impacts', () => {
		it('should only affect water and food for DROUGHT', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR',
				},
			];

			expect(calculateDisasterModifier('water', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('food', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('wood', disasters)).toBe(1);
			expect(calculateDisasterModifier('stone', disasters)).toBe(1);
			expect(calculateDisasterModifier('ore', disasters)).toBe(1);
		});

		it('should only affect wood and food for WILDFIRE', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.WILDFIRE,
					severity: 'MAJOR',
				},
			];

			expect(calculateDisasterModifier('wood', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('food', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('water', disasters)).toBe(1);
			expect(calculateDisasterModifier('stone', disasters)).toBe(1);
			expect(calculateDisasterModifier('ore', disasters)).toBe(1);
		});

		it('should affect all resources for BLIZZARD', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.BLIZZARD,
					severity: 'MAJOR',
				},
			];

			expect(calculateDisasterModifier('food', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('water', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('wood', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('stone', disasters)).toBeCloseTo(0.4, 2);
			expect(calculateDisasterModifier('ore', disasters)).toBeCloseTo(0.4, 2);
		});

		it('should only affect food for LOCUST_SWARM', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.LOCUST_SWARM,
					severity: 'CATASTROPHIC',
				},
			];

			expect(calculateDisasterModifier('food', disasters)).toBeCloseTo(0.2, 2);
			expect(calculateDisasterModifier('water', disasters)).toBe(1);
			expect(calculateDisasterModifier('wood', disasters)).toBe(1);
			expect(calculateDisasterModifier('stone', disasters)).toBe(1);
			expect(calculateDisasterModifier('ore', disasters)).toBe(1);
		});
	});

	describe('calculateAllDisasterModifiers', () => {
		it('should return all 1.0 modifiers when no disasters', () => {
			const modifiers = calculateAllDisasterModifiers([]);

			expect(modifiers).toEqual({
				food: 1,
				water: 1,
				wood: 1,
				stone: 1,
				ore: 1,
			});
		});

		it('should calculate modifiers for all resources with DROUGHT', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.DROUGHT,
					severity: 'MAJOR',
				},
			];

			const modifiers = calculateAllDisasterModifiers(disasters);

			expect(modifiers.food).toBeCloseTo(0.4, 2);
			expect(modifiers.water).toBeCloseTo(0.4, 2);
			expect(modifiers.wood).toBe(1);
			expect(modifiers.stone).toBe(1);
			expect(modifiers.ore).toBe(1);
		});

		it('should calculate modifiers with resistance for all resources', () => {
			const disasters: DisasterImpact[] = [
				{
					disasterType: DisasterType.BLIZZARD,
					severity: 'CATASTROPHIC', // 80% impact
				},
			];

			const resistance: DisasterResistance = {
				general: 0.3, // 30% resistance
			};

			const modifiers = calculateAllDisasterModifiers(disasters, resistance);

			// 80% × (1 - 0.30) = 56% reduced impact
			// Modifier: 1 - 0.56 = 0.44
			expect(modifiers.food).toBeCloseTo(0.44, 2);
			expect(modifiers.water).toBeCloseTo(0.44, 2);
			expect(modifiers.wood).toBeCloseTo(0.44, 2);
			expect(modifiers.stone).toBeCloseTo(0.44, 2);
			expect(modifiers.ore).toBeCloseTo(0.44, 2);
		});
	});

	describe('getDisasterDescription', () => {
		it('should generate correct description for DROUGHT without resistance', () => {
			const disaster: DisasterImpact = {
				disasterType: DisasterType.DROUGHT,
				severity: 'MAJOR',
			};

			const description = getDisasterDescription(disaster);
			expect(description).toBe('DROUGHT (MAJOR) reducing water, food production by 60%');
		});

		it('should generate correct description for WILDFIRE with resistance', () => {
			const disaster: DisasterImpact = {
				disasterType: DisasterType.WILDFIRE,
				severity: 'CATASTROPHIC', // 80% base
			};

			const resistance: DisasterResistance = {
				specific: {
					WILDFIRE: 0.7, // 70% resistance
				},
			};

			const description = getDisasterDescription(disaster, resistance);
			// 80% × (1 - 0.70) = 24% reduced impact
			expect(description).toBe('WILDFIRE (CATASTROPHIC) reducing wood, food production by 24%');
		});

		it('should generate correct description for BLIZZARD affecting all resources', () => {
			const disaster: DisasterImpact = {
				disasterType: DisasterType.BLIZZARD,
				severity: 'MODERATE',
			};

			const description = getDisasterDescription(disaster);
			expect(description).toBe(
				'BLIZZARD (MODERATE) reducing food, water, wood, stone, ore production by 40%'
			);
		});
	});

	describe('Custom Affected Resources', () => {
		it('should use custom affectedResources if provided', () => {
			const disaster: DisasterImpact = {
				disasterType: DisasterType.DROUGHT,
				severity: 'MAJOR',
				affectedResources: ['water'], // Only water, not food
			};

			const waterModifier = calculateDisasterModifier('water', [disaster]);
			const foodModifier = calculateDisasterModifier('food', [disaster]);

			expect(waterModifier).toBeCloseTo(0.4, 2);
			expect(foodModifier).toBe(1); // Not affected
		});
	});
});
