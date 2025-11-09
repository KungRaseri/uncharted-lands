import { describe, it, expect } from 'vitest';
import {
	STRUCTURE_DEFINITIONS,
	getStructureDefinition,
	getStructuresByCategory,
	getStructureCategories,
	canBuildStructure,
	type StructureDefinition
} from '../../../src/lib/game/structures';

describe('structures', () => {
	describe('STRUCTURE_DEFINITIONS', () => {
		it('should contain structure definitions', () => {
			expect(STRUCTURE_DEFINITIONS).toBeDefined();
			expect(Object.keys(STRUCTURE_DEFINITIONS).length).toBeGreaterThan(0);
		});

		it('should have valid structure objects', () => {
			for (const structure of Object.values(STRUCTURE_DEFINITIONS)) {
				expect(structure).toHaveProperty('id');
				expect(structure).toHaveProperty('name');
				expect(structure).toHaveProperty('description');
				expect(structure).toHaveProperty('category');
				expect(structure).toHaveProperty('requirements');
				expect(structure).toHaveProperty('modifiers');
			}
		});

		it('should have tent structure', () => {
			expect(STRUCTURE_DEFINITIONS.tent).toBeDefined();
			expect(STRUCTURE_DEFINITIONS.tent.name).toBe('Tent');
			expect(STRUCTURE_DEFINITIONS.tent.category).toBe('housing');
		});

		it('should have cottage structure', () => {
			expect(STRUCTURE_DEFINITIONS.cottage).toBeDefined();
			expect(STRUCTURE_DEFINITIONS.cottage.name).toBe('Cottage');
			expect(STRUCTURE_DEFINITIONS.cottage.category).toBe('housing');
		});

		it('should have valid requirements for all structures', () => {
			for (const structure of Object.values(STRUCTURE_DEFINITIONS)) {
				expect(structure.requirements).toHaveProperty('area');
				expect(structure.requirements).toHaveProperty('solar');
				expect(structure.requirements).toHaveProperty('wind');
				expect(structure.requirements).toHaveProperty('food');
				expect(structure.requirements).toHaveProperty('water');
				expect(structure.requirements).toHaveProperty('wood');
				expect(structure.requirements).toHaveProperty('stone');
				expect(structure.requirements).toHaveProperty('ore');
				
				// All requirements should be non-negative numbers
				expect(structure.requirements.area).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.solar).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.wind).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.food).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.water).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.wood).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.stone).toBeGreaterThanOrEqual(0);
				expect(structure.requirements.ore).toBeGreaterThanOrEqual(0);
			}
		});

		it('should have valid modifiers for all structures', () => {
			for (const structure of Object.values(STRUCTURE_DEFINITIONS)) {
				expect(Array.isArray(structure.modifiers)).toBe(true);
				for (const modifier of structure.modifiers) {
					expect(modifier).toHaveProperty('name');
					expect(modifier).toHaveProperty('description');
					expect(modifier).toHaveProperty('value');
					expect(typeof modifier.name).toBe('string');
					expect(typeof modifier.description).toBe('string');
					expect(typeof modifier.value).toBe('number');
				}
			}
		});

		it('should have valid categories for all structures', () => {
			const validCategories = ['housing', 'production', 'storage', 'defense', 'utility'];
			for (const structure of Object.values(STRUCTURE_DEFINITIONS)) {
				expect(validCategories).toContain(structure.category);
			}
		});
	});

	describe('getStructureDefinition', () => {
		it('should return tent structure by id', () => {
			const tent = getStructureDefinition('tent');
			
			expect(tent).toBeDefined();
			expect(tent?.id).toBe('tent');
			expect(tent?.name).toBe('Tent');
		});

		it('should return cottage structure by id', () => {
			const cottage = getStructureDefinition('cottage');
			
			expect(cottage).toBeDefined();
			expect(cottage?.id).toBe('cottage');
			expect(cottage?.name).toBe('Cottage');
		});

		it('should return undefined for non-existent structure', () => {
			const result = getStructureDefinition('nonexistent');
			
			expect(result).toBeUndefined();
		});

		it('should return undefined for empty string', () => {
			const result = getStructureDefinition('');
			
			expect(result).toBeUndefined();
		});

		it('should return the complete structure object', () => {
			const structure = getStructureDefinition('tent');
			
			expect(structure).toHaveProperty('requirements');
			expect(structure).toHaveProperty('modifiers');
			expect(structure).toHaveProperty('category');
		});
	});

	describe('getStructuresByCategory', () => {
		it('should return housing structures', () => {
			const housing = getStructuresByCategory('housing');
			
			expect(Array.isArray(housing)).toBe(true);
			expect(housing.length).toBeGreaterThan(0);
			for (const structure of housing) {
				expect(structure.category).toBe('housing');
			}
		});

		it('should return production structures', () => {
			const production = getStructuresByCategory('production');
			
			expect(Array.isArray(production)).toBe(true);
			for (const structure of production) {
				expect(structure.category).toBe('production');
			}
		});

		it('should return storage structures', () => {
			const storage = getStructuresByCategory('storage');
			
			expect(Array.isArray(storage)).toBe(true);
			for (const structure of storage) {
				expect(structure.category).toBe('storage');
			}
		});

		it('should return defense structures', () => {
			const defense = getStructuresByCategory('defense');
			
			expect(Array.isArray(defense)).toBe(true);
			for (const structure of defense) {
				expect(structure.category).toBe('defense');
			}
		});

		it('should return utility structures', () => {
			const utility = getStructuresByCategory('utility');
			
			expect(Array.isArray(utility)).toBe(true);
			for (const structure of utility) {
				expect(structure.category).toBe('utility');
			}
		});

		it('should return empty array for non-existent category', () => {
			// TypeScript won't allow invalid category, but test runtime behavior
			const result = getStructuresByCategory('invalid' as any);
			
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});

		it('should return tent in housing category', () => {
			const housing = getStructuresByCategory('housing');
			
			const hasTent = housing.some((s) => s.id === 'tent');
			expect(hasTent).toBe(true);
		});
	});

	describe('getStructureCategories', () => {
		it('should return all valid categories', () => {
			const categories = getStructureCategories();
			
			expect(Array.isArray(categories)).toBe(true);
			expect(categories).toContain('housing');
			expect(categories).toContain('production');
			expect(categories).toContain('storage');
			expect(categories).toContain('defense');
			expect(categories).toContain('utility');
		});

		it('should return exactly 5 categories', () => {
			const categories = getStructureCategories();
			
			expect(categories.length).toBe(5);
		});

		it('should return the same array each time', () => {
			const categories1 = getStructureCategories();
			const categories2 = getStructureCategories();
			
			expect(categories1).toEqual(categories2);
		});
	});

	describe('canBuildStructure', () => {
		const mockStructure: StructureDefinition = {
			id: 'test',
			name: 'Test Structure',
			description: 'Test',
			category: 'housing',
			requirements: {
				area: 2,
				solar: 3,
				wind: 2,
				food: 10,
				water: 5,
				wood: 20,
				stone: 10,
				ore: 5
			},
			modifiers: []
		};

		it('should allow building when all requirements are met', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(true);
			expect(result.reasons).toHaveLength(0);
		});

		it('should allow building when resources exceed requirements', () => {
			const storage = { food: 20, water: 10, wood: 40, stone: 20, ore: 10 };
			const plot = { area: 5, solar: 5, wind: 5 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(true);
			expect(result.reasons).toHaveLength(0);
		});

		it('should prevent building when area is insufficient', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 1, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 2 plot area (have 1)');
		});

		it('should prevent building when solar is insufficient', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 2, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 3 solar (have 2)');
		});

		it('should prevent building when wind is insufficient', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 1 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 2 wind (have 1)');
		});

		it('should prevent building when food is insufficient', () => {
			const storage = { food: 5, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 10 food (have 5)');
		});

		it('should prevent building when water is insufficient', () => {
			const storage = { food: 10, water: 2, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 5 water (have 2)');
		});

		it('should prevent building when wood is insufficient', () => {
			const storage = { food: 10, water: 5, wood: 10, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 20 wood (have 10)');
		});

		it('should prevent building when stone is insufficient', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 5, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 10 stone (have 5)');
		});

		it('should prevent building when ore is insufficient', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 10, ore: 2 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toContain('Need 5 ore (have 2)');
		});

		it('should list multiple reasons when multiple requirements are unmet', () => {
			const storage = { food: 5, water: 2, wood: 10, stone: 5, ore: 2 };
			const plot = { area: 1, solar: 2, wind: 1 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons.length).toBeGreaterThan(1);
			expect(result.reasons).toContain('Need 2 plot area (have 1)');
			expect(result.reasons).toContain('Need 3 solar (have 2)');
			expect(result.reasons).toContain('Need 10 food (have 5)');
		});

		it('should handle structure with zero requirements', () => {
			const freeStructure: StructureDefinition = {
				...mockStructure,
				requirements: {
					area: 0,
					solar: 0,
					wind: 0,
					food: 0,
					water: 0,
					wood: 0,
					stone: 0,
					ore: 0
				}
			};
			const storage = { food: 0, water: 0, wood: 0, stone: 0, ore: 0 };
			const plot = { area: 0, solar: 0, wind: 0 };

			const result = canBuildStructure(freeStructure, storage, plot);

			expect(result.canBuild).toBe(true);
			expect(result.reasons).toHaveLength(0);
		});

		it('should work with actual tent structure', () => {
			const tent = getStructureDefinition('tent')!;
			const storage = { food: 5, water: 2, wood: 10, stone: 0, ore: 0 };
			const plot = { area: 1, solar: 0, wind: 0 };

			const result = canBuildStructure(tent, storage, plot);

			expect(result.canBuild).toBe(true);
		});

		it('should work with actual cottage structure when insufficient resources', () => {
			const cottage = getStructureDefinition('cottage')!;
			const storage = { food: 5, water: 2, wood: 10, stone: 5, ore: 0 };
			const plot = { area: 2, solar: 0, wind: 0 };

			const result = canBuildStructure(cottage, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons.length).toBeGreaterThan(0);
		});

		it('should handle exact requirement matches', () => {
			const storage = { food: 10, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(true);
			expect(result.reasons).toHaveLength(0);
		});

		it('should handle off-by-one insufficient resources', () => {
			const storage = { food: 9, water: 5, wood: 20, stone: 10, ore: 5 };
			const plot = { area: 2, solar: 3, wind: 2 };

			const result = canBuildStructure(mockStructure, storage, plot);

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toHaveLength(1);
			expect(result.reasons[0]).toContain('Need 10 food (have 9)');
		});
	});
});
